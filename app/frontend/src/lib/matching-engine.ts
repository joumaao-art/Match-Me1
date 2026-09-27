/**
 * MatchMe Matching Engine
 * 
 * Implements:
 * - Bidirectional swipe matching (both sides must express interest)
 * - Duplicate swipe prevention
 * - Swipe history storage
 * - Match expiration (configurable TTL)
 * - Undo last swipe
 * - Smart ranking with weighted scoring
 * - Recommended jobs/candidates
 * - Real-time matching notifications
 */

// ============================================================
// Types
// ============================================================

export type SwipeDirection = 'left' | 'right';
export type SwipeEntityType = 'job_seeker' | 'company';
export type MatchStatus = 'pending' | 'matched' | 'expired' | 'unmatched';

export interface SwipeRecord {
  id: string;
  swiperId: string;
  swiperType: SwipeEntityType;
  targetId: string;
  targetType: SwipeEntityType;
  direction: SwipeDirection;
  timestamp: number;
  undone: boolean;
}

export interface MatchRecord {
  id: string;
  jobSeekerId: string;
  companyId: string;
  vacancyId: string;
  seekerSwipeId: string;
  companySwipeId: string;
  status: MatchStatus;
  matchedAt: number;
  expiresAt: number;
  compatibilityScore: number;
}

export interface WeightConfig {
  skills: number;
  experience: number;
  location: number;
  salary: number;
  industry: number;
  language: number;
  availability: number;
}

export interface SeekerProfile {
  id: string;
  skills: string[];
  experienceYears: number;
  location: { country: string; city: string };
  expectedSalaryMin: number;
  expectedSalaryMax: number;
  preferredIndustries: string[];
  languages: { name: string; level: string }[];
  availability: 'immediate' | 'two_weeks' | 'one_month' | 'negotiable';
  preferredLocations: string[];
  willingToRelocate: boolean;
  openToRemote: boolean;
}

export interface VacancyProfile {
  id: string;
  companyId: string;
  requiredSkills: string[];
  minExperience: number;
  maxExperience: number;
  location: { country: string; city: string };
  salaryMin: number;
  salaryMax: number;
  industry: string;
  requiredLanguages: string[];
  employmentType: string;
  isRemote: boolean;
}

export interface MatchNotification {
  id: string;
  type: 'new_match' | 'match_expired' | 'new_interest';
  matchId: string;
  recipientId: string;
  recipientType: SwipeEntityType;
  message: string;
  timestamp: number;
  read: boolean;
}

// ============================================================
// Default Weights
// ============================================================

export const DEFAULT_WEIGHTS: WeightConfig = {
  skills: 0.30,
  experience: 0.15,
  location: 0.15,
  salary: 0.15,
  industry: 0.10,
  language: 0.08,
  availability: 0.07,
};

// ============================================================
// Matching Engine
// ============================================================

export class MatchingEngine {
  private swipeHistory: SwipeRecord[] = [];
  private matches: MatchRecord[] = [];
  private notifications: MatchNotification[] = [];
  private weights: WeightConfig;
  private matchExpirationMs: number;
  private listeners: Map<string, ((notification: MatchNotification) => void)[]> = new Map();

  constructor(weights: WeightConfig = DEFAULT_WEIGHTS, matchExpirationDays: number = 7) {
    this.weights = weights;
    this.matchExpirationMs = matchExpirationDays * 24 * 60 * 60 * 1000;
    this.loadFromStorage();
  }

  // ============================================================
  // Swipe Operations
  // ============================================================

  /**
   * Record a swipe action. Prevents duplicates.
   * Returns a match if both sides have expressed interest.
   */
  swipe(
    swiperId: string,
    swiperType: SwipeEntityType,
    targetId: string,
    targetType: SwipeEntityType,
    direction: SwipeDirection,
    vacancyId?: string
  ): { swipe: SwipeRecord; match: MatchRecord | null } {
    // Check for duplicate swipe
    const existingSwipe = this.swipeHistory.find(
      s => s.swiperId === swiperId && s.targetId === targetId && !s.undone
    );
    if (existingSwipe) {
      throw new Error('DUPLICATE_SWIPE');
    }

    // Create swipe record
    const swipeRecord: SwipeRecord = {
      id: this.generateId(),
      swiperId,
      swiperType,
      targetId,
      targetType,
      direction,
      timestamp: Date.now(),
      undone: false,
    };

    this.swipeHistory.push(swipeRecord);

    // If swiped right, check for mutual interest
    let match: MatchRecord | null = null;
    if (direction === 'right') {
      match = this.checkForMatch(swipeRecord, vacancyId);
    }

    this.saveToStorage();
    return { swipe: swipeRecord, match };
  }

  /**
   * Undo the last swipe for a given user
   */
  /**
   * Reverses the most recent decision only when it was a pass (left swipe).
   * An apply is never reversed here, so an application cannot be withdrawn by
   * accident; the undone record is kept (flagged) for analytics history.
   */
  undoLastPass(userId: string): SwipeRecord | null {
    const last = [...this.swipeHistory].reverse().find(s => s.swiperId === userId && !s.undone);
    if (!last || last.direction !== 'left') return null;
    last.undone = true;
    this.saveToStorage();
    return last;
  }

  canUndoPass(userId: string): boolean {
    const last = [...this.swipeHistory].reverse().find(s => s.swiperId === userId && !s.undone);
    return !!last && last.direction === 'left';
  }

  undoLastSwipe(userId: string): SwipeRecord | null {
    const lastSwipe = [...this.swipeHistory]
      .reverse()
      .find(s => s.swiperId === userId && !s.undone);

    if (!lastSwipe) return null;

    lastSwipe.undone = true;

    // If there was a match from this swipe, remove it
    const relatedMatch = this.matches.find(
      m => m.seekerSwipeId === lastSwipe.id || m.companySwipeId === lastSwipe.id
    );
    if (relatedMatch) {
      relatedMatch.status = 'unmatched';
    }

    this.saveToStorage();
    return lastSwipe;
  }

  /**
   * Check if a swipe already exists (duplicate prevention)
   */
  hasSwipedOn(swiperId: string, targetId: string): boolean {
    return this.swipeHistory.some(
      s => s.swiperId === swiperId && s.targetId === targetId && !s.undone
    );
  }

  /**
   * Get swipe history for a user
   */
  getSwipeHistory(userId: string): SwipeRecord[] {
    return this.swipeHistory.filter(s => s.swiperId === userId && !s.undone);
  }

  // ============================================================
  // Match Operations
  // ============================================================

  private checkForMatch(swipe: SwipeRecord, vacancyId?: string): MatchRecord | null {
    // Find reciprocal right swipe from the other side
    const reciprocalSwipe = this.swipeHistory.find(
      s => s.swiperId === swipe.targetId &&
           s.targetId === swipe.swiperId &&
           s.direction === 'right' &&
           !s.undone
    );

    if (!reciprocalSwipe) return null;

    // Both sides expressed interest - create match!
    const match: MatchRecord = {
      id: this.generateId(),
      jobSeekerId: swipe.swiperType === 'job_seeker' ? swipe.swiperId : swipe.targetId,
      companyId: swipe.swiperType === 'company' ? swipe.swiperId : swipe.targetId,
      vacancyId: vacancyId || '',
      seekerSwipeId: swipe.swiperType === 'job_seeker' ? swipe.id : reciprocalSwipe.id,
      companySwipeId: swipe.swiperType === 'company' ? swipe.id : reciprocalSwipe.id,
      status: 'matched',
      matchedAt: Date.now(),
      expiresAt: Date.now() + this.matchExpirationMs,
      compatibilityScore: 0, // Will be calculated separately
    };

    this.matches.push(match);

    // Send notifications to both parties
    this.sendMatchNotification(match);

    return match;
  }

  /**
   * Get all active matches for a user
   */
  getMatches(userId: string, type: SwipeEntityType): MatchRecord[] {
    const now = Date.now();
    return this.matches.filter(m => {
      const isParty = type === 'job_seeker' ? m.jobSeekerId === userId : m.companyId === userId;
      const isActive = m.status === 'matched' && m.expiresAt > now;
      return isParty && isActive;
    });
  }

  /**
   * Check and expire old matches
   */
  expireMatches(): MatchRecord[] {
    const now = Date.now();
    const expired: MatchRecord[] = [];
    this.matches.forEach(m => {
      if (m.status === 'matched' && m.expiresAt <= now) {
        m.status = 'expired';
        expired.push(m);
        // Notify both parties
        this.emitNotification({
          id: this.generateId(),
          type: 'match_expired',
          matchId: m.id,
          recipientId: m.jobSeekerId,
          recipientType: 'job_seeker',
          message: 'A match has expired. Keep swiping to find new opportunities!',
          timestamp: now,
          read: false,
        });
      }
    });
    if (expired.length > 0) this.saveToStorage();
    return expired;
  }

  // ============================================================
  // Compatibility Scoring (Smart Ranking)
  // ============================================================

  /**
   * Calculate compatibility score between a job seeker and a vacancy
   */
  calculateCompatibility(seeker: SeekerProfile, vacancy: VacancyProfile): number {
    const scores = {
      skills: this.scoreSkills(seeker.skills, vacancy.requiredSkills),
      experience: this.scoreExperience(seeker.experienceYears, vacancy.minExperience, vacancy.maxExperience),
      location: this.scoreLocation(seeker, vacancy),
      salary: this.scoreSalary(seeker.expectedSalaryMin, seeker.expectedSalaryMax, vacancy.salaryMin, vacancy.salaryMax),
      industry: this.scoreIndustry(seeker.preferredIndustries, vacancy.industry),
      language: this.scoreLanguages(seeker.languages.map(l => l.name), vacancy.requiredLanguages),
      availability: this.scoreAvailability(seeker.availability),
    };

    // Weighted sum
    let totalScore = 0;
    (Object.keys(scores) as (keyof WeightConfig)[]).forEach(key => {
      totalScore += scores[key] * this.weights[key];
    });

    return Math.round(Math.min(100, Math.max(0, totalScore * 100)));
  }

  private scoreSkills(seekerSkills: string[], requiredSkills: string[]): number {
    if (requiredSkills.length === 0) return 1;
    const normalizedSeeker = seekerSkills.map(s => s.toLowerCase().trim());
    const normalizedRequired = requiredSkills.map(s => s.toLowerCase().trim());
    const matchCount = normalizedRequired.filter(r => normalizedSeeker.includes(r)).length;
    return matchCount / normalizedRequired.length;
  }

  private scoreExperience(years: number, min: number, max: number): number {
    if (years >= min && years <= max) return 1;
    if (years < min) return Math.max(0, 1 - (min - years) * 0.2);
    // Over-qualified penalty (lighter)
    return Math.max(0.5, 1 - (years - max) * 0.1);
  }

  private scoreLocation(seeker: SeekerProfile, vacancy: VacancyProfile): number {
    // Remote jobs get full score if seeker is open to remote
    if (vacancy.isRemote && seeker.openToRemote) return 1;
    // Same city
    if (seeker.location.city.toLowerCase() === vacancy.location.city.toLowerCase()) return 1;
    // Same country
    if (seeker.location.country.toLowerCase() === vacancy.location.country.toLowerCase()) return 0.8;
    // Preferred location match
    const prefMatch = seeker.preferredLocations.some(
      loc => loc.toLowerCase().includes(vacancy.location.city.toLowerCase()) ||
             loc.toLowerCase().includes(vacancy.location.country.toLowerCase())
    );
    if (prefMatch) return 0.7;
    // Willing to relocate
    if (seeker.willingToRelocate) return 0.5;
    return 0.2;
  }

  private scoreSalary(seekerMin: number, seekerMax: number, vacMin: number, vacMax: number): number {
    if (vacMax >= seekerMin && vacMin <= seekerMax) return 1;
    if (vacMax < seekerMin) {
      const gap = (seekerMin - vacMax) / seekerMin;
      return Math.max(0, 1 - gap * 2);
    }
    // Company offers more than expected - great!
    return 1;
  }

  private scoreIndustry(preferred: string[], vacancyIndustry: string): number {
    if (preferred.length === 0) return 0.7;
    const normalizedPref = preferred.map(p => p.toLowerCase().trim());
    const normalizedVac = vacancyIndustry.toLowerCase().trim();
    if (normalizedPref.includes(normalizedVac)) return 1;
    // Partial match (substring)
    if (normalizedPref.some(p => normalizedVac.includes(p) || p.includes(normalizedVac))) return 0.6;
    return 0.3;
  }

  private scoreLanguages(seekerLangs: string[], required: string[]): number {
    if (required.length === 0) return 1;
    const normalizedSeeker = seekerLangs.map(l => l.toLowerCase().trim());
    const normalizedRequired = required.map(l => l.toLowerCase().trim());
    const matchCount = normalizedRequired.filter(r => normalizedSeeker.includes(r)).length;
    return matchCount / normalizedRequired.length;
  }

  private scoreAvailability(availability: string): number {
    switch (availability) {
      case 'immediate': return 1;
      case 'two_weeks': return 0.9;
      case 'one_month': return 0.7;
      case 'negotiable': return 0.6;
      default: return 0.5;
    }
  }

  // ============================================================
  // Recommendations
  // ============================================================

  /**
   * Get recommended jobs for a seeker, ranked by compatibility
   */
  getRecommendedJobs(seeker: SeekerProfile, vacancies: VacancyProfile[]): { vacancy: VacancyProfile; score: number }[] {
    // Filter out already-swiped vacancies
    const swipedIds = new Set(
      this.swipeHistory
        .filter(s => s.swiperId === seeker.id && !s.undone)
        .map(s => s.targetId)
    );

    return vacancies
      .filter(v => !swipedIds.has(v.id))
      .map(v => ({ vacancy: v, score: this.calculateCompatibility(seeker, v) }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get recommended candidates for a vacancy, ranked by compatibility
   */
  getRecommendedCandidates(vacancy: VacancyProfile, seekers: SeekerProfile[]): { seeker: SeekerProfile; score: number }[] {
    // Filter out already-swiped seekers
    const swipedIds = new Set(
      this.swipeHistory
        .filter(s => s.swiperId === vacancy.companyId && !s.undone)
        .map(s => s.targetId)
    );

    return seekers
      .filter(s => !swipedIds.has(s.id))
      .map(s => ({ seeker: s, score: this.calculateCompatibility(s, vacancy) }))
      .sort((a, b) => b.score - a.score);
  }

  // ============================================================
  // Notifications (Real-time)
  // ============================================================

  private sendMatchNotification(match: MatchRecord) {
    const seekerNotif: MatchNotification = {
      id: this.generateId(),
      type: 'new_match',
      matchId: match.id,
      recipientId: match.jobSeekerId,
      recipientType: 'job_seeker',
      message: "It's a match! A company is interested in your profile.",
      timestamp: Date.now(),
      read: false,
    };
    const companyNotif: MatchNotification = {
      id: this.generateId(),
      type: 'new_match',
      matchId: match.id,
      recipientId: match.companyId,
      recipientType: 'company',
      message: "It's a match! A candidate is interested in your vacancy.",
      timestamp: Date.now(),
      read: false,
    };

    this.notifications.push(seekerNotif, companyNotif);
    this.emitNotification(seekerNotif);
    this.emitNotification(companyNotif);
  }

  /**
   * Subscribe to real-time notifications
   */
  subscribe(userId: string, callback: (notification: MatchNotification) => void): () => void {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, []);
    }
    this.listeners.get(userId)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(userId);
      if (callbacks) {
        const idx = callbacks.indexOf(callback);
        if (idx > -1) callbacks.splice(idx, 1);
      }
    };
  }

  private emitNotification(notification: MatchNotification) {
    const callbacks = this.listeners.get(notification.recipientId);
    if (callbacks) {
      callbacks.forEach(cb => cb(notification));
    }
  }

  /**
   * Get unread notifications for a user
   */
  getNotifications(userId: string): MatchNotification[] {
    return this.notifications.filter(n => n.recipientId === userId);
  }

  /**
   * Mark notification as read
   */
  markNotificationRead(notificationId: string) {
    const notif = this.notifications.find(n => n.id === notificationId);
    if (notif) notif.read = true;
    this.saveToStorage();
  }

  // ============================================================
  // Persistence
  // ============================================================

  private saveToStorage() {
    try {
      localStorage.setItem('matchme_swipes', JSON.stringify(this.swipeHistory));
      localStorage.setItem('matchme_matches', JSON.stringify(this.matches));
      localStorage.setItem('matchme_notifications', JSON.stringify(this.notifications));
    } catch {
      // Storage full or unavailable
    }
  }

  private loadFromStorage() {
    try {
      const swipes = localStorage.getItem('matchme_swipes');
      const matches = localStorage.getItem('matchme_matches');
      const notifs = localStorage.getItem('matchme_notifications');
      if (swipes) this.swipeHistory = JSON.parse(swipes);
      if (matches) this.matches = JSON.parse(matches);
      if (notifs) this.notifications = JSON.parse(notifs);
    } catch {
      // Corrupted storage
    }
  }

  /**
   * Update weight configuration
   */
  updateWeights(newWeights: Partial<WeightConfig>) {
    this.weights = { ...this.weights, ...newWeights };
  }

  /**
   * Get current weight configuration
   */
  getWeights(): WeightConfig {
    return { ...this.weights };
  }

  // ============================================================
  // Utilities
  // ============================================================

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get engine statistics
   */
  getStats(userId: string, type: SwipeEntityType) {
    const swipes = this.swipeHistory.filter(s => s.swiperId === userId && !s.undone);
    const rightSwipes = swipes.filter(s => s.direction === 'right');
    const leftSwipes = swipes.filter(s => s.direction === 'left');
    const matches = this.getMatches(userId, type);
    const expiredMatches = this.matches.filter(m => {
      const isParty = type === 'job_seeker' ? m.jobSeekerId === userId : m.companyId === userId;
      return isParty && m.status === 'expired';
    });

    return {
      totalSwipes: swipes.length,
      rightSwipes: rightSwipes.length,
      leftSwipes: leftSwipes.length,
      activeMatches: matches.length,
      expiredMatches: expiredMatches.length,
      matchRate: rightSwipes.length > 0 ? (matches.length / rightSwipes.length * 100).toFixed(1) : '0',
    };
  }
}

// ============================================================
// Singleton Instance
// ============================================================

export const matchingEngine = new MatchingEngine();