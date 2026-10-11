// Apply a saved choice before the first paint. System preference is the CSS fallback.
(() => {
  try {
    const choice = localStorage.getItem('kheya-appearance');
    if (choice === 'light' || choice === 'dark') document.documentElement.dataset.theme = choice;
  } catch { /* Storage may be unavailable; the system theme still works. */ }
})();
