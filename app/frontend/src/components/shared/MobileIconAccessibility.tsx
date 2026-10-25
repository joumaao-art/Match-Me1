import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuthStore } from '@/stores';
import { fallbackIconLabel, iconTone, mobileIconScope } from '@/lib/mobile-icon-accessibility';
import './mobile-icon-accessibility.css';

/** Enhances existing native controls, including portal content, without layout wrappers. */
export function MobileIconAccessibility() {
 const { pathname } = useLocation();
 const mobile = useIsMobile();
 const role = useAuthStore(s => s.userRole);
 const { i18n } = useTranslation();
 const arabic = i18n.language.startsWith('ar');
 const enabled = mobileIconScope(pathname, role, mobile);
 const [tip, setTip] = useState<{ label: string; left: number; top: number; below: boolean } | null>(null);
 const input = useRef<'mouse' | 'touch' | 'keyboard'>('keyboard');
 useEffect(() => {
  if (!enabled) { setTip(null); return; }
  document.documentElement.dataset.mobileIconScope = 'true';
  const originals = new Map<Element, Map<string, string | null>>();
  const set = (element: Element, key: string, value: string) => {
   if (element.getAttribute(key) === value) return;
   if (!originals.has(element)) originals.set(element, new Map());
   const attrs = originals.get(element)!;
   if (!attrs.has(key)) attrs.set(key, element.getAttribute(key));
   element.setAttribute(key, value);
  };
  const controls = 'button, [role="button"], [role="radio"], [role="option"]';
  const inspect = () => document.querySelectorAll<HTMLElement>(controls).forEach(control => {
   const icons = control.querySelectorAll('svg');
   if (control.closest('[data-mobile-icon-exclude="true"]')) return;
   if (!icons.length) return;
   set(control, 'data-mobile-icon', iconTone(control.dataset.buttonVariant || null, control.className));
   // Only unlabeled icon-only controls get a localized fallback; visible text remains the name.
   if (!control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby') && !control.textContent?.trim()) {
    const label = control.getAttribute('title') || fallbackIconLabel([...icons].map(icon => icon.getAttribute('class') || '').join(' '), arabic);
    if (label) set(control, 'aria-label', label);
   }
   const title = control.getAttribute('title');
   if (title && control.getAttribute('aria-label') === title) set(control, 'title', '');
   // Existing modal Close text is localized, without changing its primitive or hit box.
   if (control.querySelector('.lucide-x') && control.textContent?.trim() === 'Close' && control.querySelector('.sr-only')) set(control, 'aria-label', arabic ? 'إغلاق' : 'Close');
   icons.forEach(icon => set(icon, 'aria-hidden', 'true'));
  });
  inspect();
  const observer = new MutationObserver(inspect);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class','aria-label','title','data-button-variant','data-mobile-icon-exclude','disabled','aria-pressed'] });
  let timer: ReturnType<typeof setTimeout> | undefined;
  let active: HTMLElement | null = null;
  const hide = () => { clearTimeout(timer); active = null; setTip(null); };
  const target = (event: Event) => event.target instanceof Element ? event.target.closest<HTMLElement>(controls) : null;
  const show = (control: HTMLElement | null, delay: number) => {
   hide();
   if (!control || control.closest('[data-mobile-icon-exclude="true"]') || control.matches(':disabled,[aria-disabled="true"]')) return;
   const visibleText = [...control.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) || [...control.querySelectorAll('span,p')].some(node => !node.classList.contains('sr-only') && node.textContent?.trim());
   if (!control.querySelector('svg') || (visibleText && !control.hasAttribute('data-icon-tooltip'))) return;
   const label = control.getAttribute('aria-label') || control.textContent?.trim();
   if (!label) return;
   active = control;
   timer = setTimeout(() => {
    if (!control.isConnected || active !== control) return;
    const rect = control.getBoundingClientRect();
    const half = Math.min(120, (window.innerWidth - 16) / 2);
    const below = rect.top < 48;
    setTip({ label, left: Math.max(half + 8, Math.min(window.innerWidth - half - 8, rect.left + rect.width / 2)), top: below ? rect.bottom + 6 : rect.top - 6, below });
   }, delay);
  };
  const pointerDown = (event: PointerEvent) => { input.current = event.pointerType === 'touch' || event.pointerType === 'pen' ? 'touch' : 'mouse'; hide(); };
  const pointerOver = (event: PointerEvent) => { if (event.pointerType !== 'mouse') return; const control = target(event); if (control && event.relatedTarget instanceof Node && control.contains(event.relatedTarget)) return; input.current = 'mouse'; show(control, 300); };
  const pointerOut = (event: PointerEvent) => { if (active && event.relatedTarget instanceof Node && active.contains(event.relatedTarget)) return; hide(); };
  const key = (event: KeyboardEvent) => { if (event.key === 'Escape') hide(); else { input.current = 'keyboard'; if (event.key === 'Tab') hide(); } };
  const focus = (event: FocusEvent) => { if (input.current === 'keyboard') show(target(event), 0); };
  document.addEventListener('pointerdown', pointerDown, true);
  document.addEventListener('pointerover', pointerOver, true);
  document.addEventListener('pointerout', pointerOut, true);
  document.addEventListener('keydown', key, true);
  document.addEventListener('focusin', focus, true);
  document.addEventListener('focusout', hide, true);
  document.addEventListener('click', hide, true);
  window.addEventListener('scroll', hide, true);
  window.addEventListener('resize', hide);
  return () => {
   observer.disconnect(); hide(); delete document.documentElement.dataset.mobileIconScope;
   document.removeEventListener('pointerdown', pointerDown, true); document.removeEventListener('pointerover', pointerOver, true); document.removeEventListener('pointerout', pointerOut, true); document.removeEventListener('keydown', key, true); document.removeEventListener('focusin', focus, true); document.removeEventListener('focusout', hide, true); document.removeEventListener('click', hide, true); window.removeEventListener('scroll', hide, true); window.removeEventListener('resize', hide);
   originals.forEach((attrs, element) => attrs.forEach((value, name) => value === null ? element.removeAttribute(name) : element.setAttribute(name, value)));
  };
 }, [enabled, pathname, arabic]);
 return enabled && tip ? createPortal(<div aria-hidden="true" dir={arabic ? 'rtl' : 'ltr'} className="mobile-icon-tooltip" style={{left:tip.left,top:tip.top,transform:tip.below?'translateX(-50%)':'translate(-50%, -100%)'}}>{tip.label}</div>, document.body) : null;
}
