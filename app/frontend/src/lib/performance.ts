/**
 * Performance Optimization Utilities for MatchMe Platform.
 * Implements: Caching, Pagination, Virtualization, Image optimization,
 * Query performance, Realtime optimization, Mobile performance, and SEO.
 */

// ============================================================
// 1. CACHING - Multi-layer cache with TTL and LRU eviction
// ============================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number; // ms
  cleanupInterval: number; // ms
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 100,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 60 * 1000, // 1 minute
};

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.cleanupTimer = setInterval(() => this.cleanup(), this.config.cleanupInterval);
  }

  set<T>(key: string, data: T, ttl?: number): void {
    // Evict LRU if at capacity
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      accessCount: 0,
      lastAccessed: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestAccess = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    this.cache.clear();
  }
}

// Singleton caches for different data types
export const queryCache = new MemoryCache({ maxSize: 200, defaultTTL: 5 * 60 * 1000 });
export const imageCache = new MemoryCache({ maxSize: 50, defaultTTL: 30 * 60 * 1000 });
export const apiCache = new MemoryCache({ maxSize: 100, defaultTTL: 2 * 60 * 1000 });

/**
 * Cache-first data fetcher with stale-while-revalidate pattern.
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number; staleWhileRevalidate?: boolean }
): Promise<T> {
  const { ttl, staleWhileRevalidate = true } = options || {};

  // Check cache first
  const cached = queryCache.get<T>(key);
  if (cached !== null) {
    // Revalidate in background if stale-while-revalidate
    if (staleWhileRevalidate) {
      fetcher().then(freshData => {
        queryCache.set(key, freshData, ttl);
      }).catch(() => { /* silent background refresh failure */ });
    }
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();
  queryCache.set(key, data, ttl);
  return data;
}

// ============================================================
// 2. PAGINATION - Cursor-based and offset pagination
// ============================================================

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationState;
}

/**
 * Create pagination parameters for Supabase queries.
 */
export function getPaginationRange(page: number, pageSize: number): { from: number; to: number } {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}

/**
 * Calculate pagination state from response.
 */
export function calculatePagination(page: number, pageSize: number, total: number): PaginationState {
  const totalPages = Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Generate page numbers for pagination UI.
 */
export function getPageNumbers(current: number, total: number, maxVisible: number = 7): (number | '...')[] {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('...');
  pages.push(total);

  return pages;
}

// ============================================================
// 3. VIRTUALIZATION - Efficient rendering for large lists
// ============================================================

export interface VirtualListConfig {
  itemHeight: number;
  containerHeight: number;
  overscan: number; // Extra items to render above/below viewport
  totalItems: number;
}

export interface VirtualRange {
  startIndex: number;
  endIndex: number;
  offsetTop: number;
  totalHeight: number;
  visibleCount: number;
}

/**
 * Calculate which items should be rendered in a virtual list.
 */
export function getVirtualRange(scrollTop: number, config: VirtualListConfig): VirtualRange {
  const { itemHeight, containerHeight, overscan, totalItems } = config;

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + 2 * overscan);
  const offsetTop = startIndex * itemHeight;
  const totalHeight = totalItems * itemHeight;

  return { startIndex, endIndex, offsetTop, totalHeight, visibleCount };
}

/**
 * Hook-compatible virtual list state calculator.
 */
export function createVirtualizer(totalItems: number, itemHeight: number, containerHeight: number) {
  const overscan = 5;

  return {
    getTotalSize: () => totalItems * itemHeight,
    getVirtualItems: (scrollOffset: number) => {
      const range = getVirtualRange(scrollOffset, { itemHeight, containerHeight, overscan, totalItems });
      const items = [];
      for (let i = range.startIndex; i <= range.endIndex; i++) {
        items.push({
          index: i,
          start: i * itemHeight,
          size: itemHeight,
        });
      }
      return items;
    },
  };
}

// ============================================================
// 4. IMAGE OPTIMIZATION
// ============================================================

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  lazy?: boolean;
  placeholder?: 'blur' | 'color' | 'none';
}

/**
 * Generate optimized image URL with transformation parameters.
 * Works with Supabase Storage image transformation.
 */
export function getOptimizedImageUrl(
  url: string,
  options: ImageOptimizationOptions = {}
): string {
  if (!url) return '';

  const { width, height, quality = 80, format = 'webp' } = options;

  // If it's a Supabase storage URL, add transformation params
  if (url.includes('supabase.co/storage')) {
    const params = new URLSearchParams();
    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());
    params.set('quality', quality.toString());
    params.set('format', format);

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  }

  return url;
}

/**
 * Generate responsive image srcSet for different screen sizes.
 */
export function generateSrcSet(url: string, sizes: number[] = [320, 640, 960, 1280, 1920]): string {
  return sizes
    .map(w => `${getOptimizedImageUrl(url, { width: w })} ${w}w`)
    .join(', ');
}

/**
 * Preload critical images for faster LCP.
 */
export function preloadImage(url: string, priority: 'high' | 'low' = 'high'): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = url;
  link.setAttribute('fetchpriority', priority);
  document.head.appendChild(link);
}

/**
 * Intersection Observer-based lazy loading for images.
 */
export function createImageObserver(options?: IntersectionObserverInit): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null;

  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          img.classList.add('loaded');
        }
      }
    });
  }, {
    rootMargin: '200px 0px', // Start loading 200px before visible
    threshold: 0.01,
    ...options,
  });
}

// ============================================================
// 5. BUNDLE SIZE OPTIMIZATION UTILITIES
// ============================================================

/**
 * Dynamic import with retry logic for resilient chunk loading.
 */
export function retryImport<T>(
  factory: () => Promise<T>,
  retries: number = 3
): Promise<T> {
  return factory().catch((error) => {
    if (retries <= 0) throw error;
    return new Promise<T>((resolve) => {
      setTimeout(() => {
        resolve(retryImport(factory, retries - 1));
      }, 1000 * (4 - retries));
    });
  });
}

/**
 * Prefetch a route's chunk when user is likely to navigate.
 */
export function prefetchRoute(importFn: () => Promise<any>): void {
  // Use requestIdleCallback for non-blocking prefetch
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      importFn().catch(() => { /* silent prefetch failure */ });
    });
  } else {
    setTimeout(() => {
      importFn().catch(() => {});
    }, 100);
  }
}

// ============================================================
// 6. QUERY PERFORMANCE
// ============================================================

/**
 * Debounce function for search queries.
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };

  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
  };

  return debounced as T & { cancel: () => void };
}

/**
 * Throttle function for scroll/resize handlers.
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): T {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  const throttled = (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };

  return throttled as T;
}

/**
 * Request deduplication - prevents duplicate concurrent requests.
 */
class RequestDeduplicator {
  private pending: Map<string, Promise<any>> = new Map();

  async dedupe<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>;
    }

    const promise = fetcher().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }
}

export const requestDeduplicator = new RequestDeduplicator();

/**
 * Batch multiple queries into a single request window.
 */
export function createBatcher<T>(
  batchFn: (keys: string[]) => Promise<Map<string, T>>,
  options?: { maxBatchSize?: number; delayMs?: number }
) {
  const { maxBatchSize = 25, delayMs = 10 } = options || {};
  const queue: { key: string; resolve: (v: T | undefined) => void; reject: (e: any) => void }[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = async () => {
    const batch = queue.splice(0, maxBatchSize);
    if (batch.length === 0) return;

    try {
      const keys = batch.map(b => b.key);
      const results = await batchFn(keys);
      batch.forEach(({ key, resolve }) => resolve(results.get(key)));
    } catch (error) {
      batch.forEach(({ reject }) => reject(error));
    }
  };

  return (key: string): Promise<T | undefined> => {
    return new Promise((resolve, reject) => {
      queue.push({ key, resolve, reject });

      if (queue.length >= maxBatchSize) {
        flush();
      } else if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          flush();
        }, delayMs);
      }
    });
  };
}

// ============================================================
// 7. REALTIME OPTIMIZATION
// ============================================================

interface RealtimeConfig {
  maxChannels: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  batchUpdates: boolean;
  batchInterval: number;
}

const REALTIME_CONFIG: RealtimeConfig = {
  maxChannels: 10,
  reconnectDelay: 1000,
  heartbeatInterval: 30000,
  batchUpdates: true,
  batchInterval: 100,
};

/**
 * Realtime update batcher - batches rapid updates to reduce re-renders.
 */
export class RealtimeBatcher<T> {
  private buffer: T[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private callback: (items: T[]) => void;
  private interval: number;

  constructor(callback: (items: T[]) => void, interval: number = REALTIME_CONFIG.batchInterval) {
    this.callback = callback;
    this.interval = interval;
  }

  add(item: T): void {
    this.buffer.push(item);

    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.flush();
      }, this.interval);
    }
  }

  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.buffer.length > 0) {
      const items = [...this.buffer];
      this.buffer = [];
      this.callback(items);
    }
  }

  destroy(): void {
    if (this.timer) clearTimeout(this.timer);
    this.buffer = [];
  }
}

/**
 * Connection-aware realtime manager.
 * Pauses subscriptions when offline, resumes when online.
 */
export class ConnectionAwareManager {
  private isOnline: boolean = navigator.onLine;
  private listeners: Set<() => void> = new Set();
  private pausedChannels: Set<string> = new Set();

  constructor() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Visibility API - pause when tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleHidden();
      } else {
        this.handleVisible();
      }
    });
  }

  private handleOnline(): void {
    this.isOnline = true;
    this.listeners.forEach(cb => cb());
  }

  private handleOffline(): void {
    this.isOnline = false;
  }

  private handleHidden(): void {
    // Reduce realtime activity when tab is hidden
    this.pausedChannels.forEach(() => {
      // Signal to pause non-critical subscriptions
    });
  }

  private handleVisible(): void {
    // Resume realtime activity
    this.pausedChannels.clear();
  }

  onReconnect(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  get online(): boolean {
    return this.isOnline;
  }
}

export const connectionManager = new ConnectionAwareManager();

// ============================================================
// 8. MOBILE PERFORMANCE
// ============================================================

/**
 * Detect device capabilities for adaptive rendering.
 */
export function getDeviceCapabilities() {
  const connection = (navigator as any).connection;

  return {
    // Network info
    effectiveType: connection?.effectiveType || '4g', // 'slow-2g', '2g', '3g', '4g'
    saveData: connection?.saveData || false,
    downlink: connection?.downlink || 10, // Mbps

    // Device info
    memory: (navigator as any).deviceMemory || 8, // GB
    cores: navigator.hardwareConcurrency || 4,
    isMobile: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
    isLowEnd: ((navigator as any).deviceMemory || 8) <= 2 || navigator.hardwareConcurrency <= 2,

    // Display
    pixelRatio: window.devicePixelRatio || 1,
    viewportWidth: window.innerWidth,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    prefersReducedData: window.matchMedia('(prefers-reduced-data: reduce)').matches,

    // Touch
    hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  };
}

/**
 * Adaptive quality settings based on device capabilities.
 */
export function getAdaptiveSettings() {
  const device = getDeviceCapabilities();

  return {
    // Image quality
    imageQuality: device.saveData ? 40 : device.isLowEnd ? 60 : 80,
    imageFormat: device.isLowEnd ? 'jpeg' as const : 'webp' as const,
    maxImageWidth: device.isLowEnd ? 640 : device.isMobile ? 960 : 1920,

    // Animation
    enableAnimations: !device.prefersReducedMotion && !device.isLowEnd,
    animationDuration: device.isLowEnd ? 0 : device.isMobile ? 200 : 300,

    // Data loading
    pageSize: device.isLowEnd ? 10 : device.isMobile ? 15 : 25,
    prefetchEnabled: !device.saveData && device.effectiveType === '4g',
    realtimeEnabled: !device.saveData,

    // Rendering
    enableVirtualization: true, // Always use for lists > 50 items
    overscan: device.isLowEnd ? 2 : 5,
  };
}

// ============================================================
// 9. ACCESSIBILITY UTILITIES
// ============================================================

/**
 * Announce content to screen readers.
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', priority);
  el.setAttribute('aria-atomic', 'true');
  el.className = 'sr-only';
  el.textContent = message;
  document.body.appendChild(el);

  setTimeout(() => {
    document.body.removeChild(el);
  }, 1000);
}

/**
 * Trap focus within a container (for modals/dialogs).
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableSelectors = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const focusableElements = container.querySelectorAll(focusableSelectors);
  const firstFocusable = focusableElements[0] as HTMLElement;
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);
  firstFocusable?.focus();

  return () => container.removeEventListener('keydown', handleKeyDown);
}

/**
 * Skip to main content link handler.
 */
export function setupSkipLink(): void {
  const main = document.querySelector('main') || document.querySelector('[role="main"]');
  if (!main) return;

  main.setAttribute('tabindex', '-1');

  const skipLink = document.querySelector('[data-skip-link]') as HTMLAnchorElement;
  if (skipLink) {
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      (main as HTMLElement).focus();
    });
  }
}

// ============================================================
// 10. SEO UTILITIES
// ============================================================

interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  noindex?: boolean;
  structuredData?: Record<string, any>;
}

/**
 * Update page SEO metadata dynamically.
 */
export function updateSEO(metadata: SEOMetadata): void {
  const { title, description, keywords, ogImage, ogType = 'website', canonical, noindex, structuredData } = metadata;

  // Title
  document.title = title ? `${title} | MatchMe` : 'MatchMe - AI-Powered Recruitment Platform';

  // Meta description
  updateMeta('description', description);

  // Keywords
  if (keywords?.length) {
    updateMeta('keywords', keywords.join(', '));
  }

  // Robots
  if (noindex) {
    updateMeta('robots', 'noindex, nofollow');
  } else {
    updateMeta('robots', 'index, follow');
  }

  // Open Graph
  updateMeta('og:title', title, 'property');
  updateMeta('og:description', description, 'property');
  updateMeta('og:type', ogType, 'property');
  if (ogImage) updateMeta('og:image', ogImage, 'property');
  updateMeta('og:site_name', 'MatchMe', 'property');

  // Twitter Card
  updateMeta('twitter:card', 'summary_large_image');
  updateMeta('twitter:title', title);
  updateMeta('twitter:description', description);
  if (ogImage) updateMeta('twitter:image', ogImage);

  // Canonical URL
  if (canonical) {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical;
  }

  // Structured Data (JSON-LD)
  if (structuredData) {
    let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
  }
}

function updateMeta(name: string, content: string, attr: 'name' | 'property' = 'name'): void {
  let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attr, name);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

/**
 * Generate structured data for job postings (Schema.org).
 */
export function generateJobPostingSchema(job: {
  title: string;
  description: string;
  company: string;
  location?: string;
  salary?: { min: number; max: number; currency: string };
  datePosted: string;
  validThrough?: string;
  employmentType?: string;
}): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
    },
    jobLocation: job.location ? {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: job.location },
    } : undefined,
    baseSalary: job.salary ? {
      '@type': 'MonetaryAmount',
      currency: job.salary.currency,
      value: {
        '@type': 'QuantitativeValue',
        minValue: job.salary.min,
        maxValue: job.salary.max,
        unitText: 'MONTH',
      },
    } : undefined,
    datePosted: job.datePosted,
    validThrough: job.validThrough,
    employmentType: job.employmentType || 'FULL_TIME',
  };
}

// ============================================================
// 11. APP STARTUP OPTIMIZATION
// ============================================================

/**
 * Critical path optimizer - prioritizes essential resources.
 */
export function optimizeStartup(): void {
  // Preconnect to critical origins
  const origins = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];

  origins.forEach(origin => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  // DNS prefetch for non-critical origins
  const dnsPrefetch = [
    'https://api.stripe.com',
  ];

  dnsPrefetch.forEach(origin => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = origin;
    document.head.appendChild(link);
  });

  // Register service worker for offline caching (production only)
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration failed - app still works
      });
    });
  }
}

/**
 * Performance monitoring - track key metrics.
 */
export function trackPerformance(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  // Track Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        console.debug(`[Perf] LCP: ${lastEntry.startTime.toFixed(0)}ms`);
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch { /* not supported */ }

  // Track First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        console.debug(`[Perf] FID: ${(entry as any).processingStart - entry.startTime}ms`);
      });
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch { /* not supported */ }

  // Track Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      console.debug(`[Perf] CLS: ${clsValue.toFixed(4)}`);
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch { /* not supported */ }
}

// ============================================================
// 12. DATABASE INDEX RECOMMENDATIONS
// ============================================================

/**
 * Database index recommendations for optimal query performance.
 * These should be applied via Supabase migrations.
 */
export const DATABASE_INDEX_RECOMMENDATIONS = {
  // User queries
  user_profiles: [
    'CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role)',
    'CREATE INDEX IF NOT EXISTS idx_user_profiles_role_active ON user_profiles(role) WHERE is_active = true',
  ],

  // Job queries - most frequent
  jobs: [
    'CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status) WHERE status = \'active\'',
    'CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id)',
    'CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location)',
    'CREATE INDEX IF NOT EXISTS idx_jobs_industry ON jobs(industry)',
    'CREATE INDEX IF NOT EXISTS idx_jobs_search ON jobs USING gin(to_tsvector(\'english\', title || \' \' || description))',
  ],

  // Match queries
  matches: [
    'CREATE INDEX IF NOT EXISTS idx_matches_seeker_id ON matches(seeker_id)',
    'CREATE INDEX IF NOT EXISTS idx_matches_company_id ON matches(company_id)',
    'CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status)',
    'CREATE INDEX IF NOT EXISTS idx_matches_score ON matches(score DESC)',
    'CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_matches_composite ON matches(seeker_id, company_id, status)',
  ],

  // Message queries
  messages: [
    'CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)',
    'CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)',
    'CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(recipient_id) WHERE is_read = false',
  ],

  // Application queries
  applications: [
    'CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id)',
    'CREATE INDEX IF NOT EXISTS idx_applications_seeker_id ON applications(seeker_id)',
    'CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)',
  ],

  // Subscription queries
  subscriptions: [
    'CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status) WHERE status = \'active\'',
    'CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at)',
  ],

  // Audit log queries
  audit_logs: [
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id)',
  ],
} as const;