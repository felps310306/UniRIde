// Adaptado do ThemeContext.jsx do EscalaCCO-front: tema binário e contexto React.
import { createContext, useContext, useEffect, useState } from 'react';
const Context = createContext(null);
const KEY = 'uniride-campus:appearance:v1';
export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY))?.mode === 'dark' ? 'dark' : 'light'; }
    catch { return 'light'; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    document.documentElement.style.colorScheme = tema;
    try { localStorage.setItem(KEY, JSON.stringify({ mode: tema })); } catch { /* Modo local sem persistência. */ }
  }, [tema]);
  return <Context.Provider value={{ tema, alternarTema: () => setTema(v => v === 'dark' ? 'light' : 'dark') }}>{children}</Context.Provider>;
}
export const useTheme = () => useContext(Context);
