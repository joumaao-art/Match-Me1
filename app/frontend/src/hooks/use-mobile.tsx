import * as React from 'react';
import { isSeekerExperiencePath, mobileExperience, MOBILE_BREAKPOINT } from '@/lib/responsive-experience';

// A candidate journey that enters compact mode stays in the same component tree
// when unfolded. Dimensions change presentation, never account or action state.
let compactJourney = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;

export function useIsMobile() {
  const [compact, setCompact] = React.useState(() => window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches);
  React.useEffect(() => {
    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      if (query.matches) compactJourney = true;
      setCompact(query.matches);
    };
    query.addEventListener('change', onChange);
    onChange();
    return () => query.removeEventListener('change', onChange);
  }, []);
  return mobileExperience(compact, !!window.ReactNativeWebView, compactJourney,
    isSeekerExperiencePath(window.location.pathname, window.location.search));
}
