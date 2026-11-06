// Destinos do NavBar do EscalaCCO, agora como abas no cabeçalho (barra inferior no celular).
import { FiMap, FiList, FiHeart } from 'react-icons/fi';
export default function NavBar({ page, onNavigate }) {
  const tabs = [['mapa', FiMap, 'Mapa'], ['linhas', FiList, 'Linhas'], ['favoritos', FiHeart, 'Favoritos']];
  return <nav className="navbar" aria-label="Navegação principal">
    {tabs.map(([id, Icon, label]) => <a href={`#${id}`} key={id} className={`navbar-item ${page === id ? 'active' : ''}`} aria-current={page === id ? 'page' : undefined} onClick={e => {e.preventDefault();onNavigate(id)}}><Icon aria-hidden="true" /><span className="navbar-label">{label}</span></a>)}
  </nav>;
}
