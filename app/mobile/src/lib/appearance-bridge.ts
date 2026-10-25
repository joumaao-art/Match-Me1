// Reports only resolved appearance. Never reads or transfers authentication data.
export const appearanceObserverScript = `
(function () {
  if (window.__matchmeAppearanceObserver) return;
  window.__matchmeAppearanceObserver = true;
  var report = function () {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'appearance', theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    }));
  };
  new MutationObserver(report).observe(document.documentElement, {attributes: true, attributeFilter: ['class']});
  report();
})(); true;
`;
