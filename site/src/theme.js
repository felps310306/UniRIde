// Tema binário como no EscalaCCO: o destaque permanece verde.
// Executa antes dos estilos para evitar a troca de cor durante a abertura.
(() => {
  const KEY = 'uniride-campus:appearance:v1';
  const normalize = (value) => {
    const mode = value?.mode === 'system'
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : value?.mode;
    return { mode: mode === 'dark' ? 'dark' : 'light' };
  };
  const read = () => {
    try { return normalize(JSON.parse(localStorage.getItem(KEY))); }
    catch { return { mode: 'light' }; }
  };
  let preference = read();
  // Converte uma preferência antiga automática em uma escolha fixa.
  try { localStorage.setItem(KEY, JSON.stringify(preference)); } catch { /* Sem persistência. */ }
  function apply() {
    document.documentElement.dataset.theme = preference.mode;
    document.documentElement.removeAttribute('data-accent');
    document.documentElement.style.colorScheme = preference.mode;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = preference.mode === 'dark' ? '#0d0f14' : '#ffffff';
    window.dispatchEvent(new CustomEvent('uniride:appearance', { detail: { ...preference } }));
  }
  function set(update) {
    preference = normalize({ ...preference, ...update });
    apply();
    try { localStorage.setItem(KEY, JSON.stringify(preference)); return true; }
    catch { return false; }
  }
  window.UniRideAppearance = {
    get() { return { ...preference }; },
    set,
    toggle() { return set({ mode: preference.mode === 'dark' ? 'light' : 'dark' }); },
  };
  window.addEventListener('storage', (event) => {
    if (event.key === KEY || event.key === null) { preference = read(); apply(); }
  });
  apply();
})();
