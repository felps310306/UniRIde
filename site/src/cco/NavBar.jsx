// Estrutura e classes do NavBar do EscalaCCO, com destinos do passageiro.
import { FiMap, FiList, FiHeart, FiInfo, FiSun, FiMoon } from 'react-icons/fi';
import { TbBus } from 'react-icons/tb';
import { useTheme } from './ThemeContext.jsx';
import './NavBar.css';
export default function NavBar({ page, onNavigate, onInfo }) {
  const { tema, alternarTema } = useTheme();
  const tabs = [['mapa', FiMap, 'Mapa'], ['linhas', FiList, 'Linhas'], ['favoritos', FiHeart, 'Favoritos']];
  return <nav className="navbar" aria-label="Navegação principal">
    <a className="navbar-logo" href="#mapa" aria-label="UniRide, início" onClick={e => {e.preventDefault();onNavigate('mapa')}}><span className="navbar-logo-img"><TbBus /></span><span className="navbar-label brand-name">UniRide</span></a>
    <div className="navbar-items">{tabs.map(([id, Icon, label]) => <a href={`#${id}`} key={id} className={`navbar-item ${page === id ? 'active' : ''}`} aria-current={page === id ? 'page' : undefined} title={label} onClick={e => {e.preventDefault();onNavigate(id)}}><Icon /><span className="navbar-label">{label}</span></a>)}</div>
    <div className="navbar-bottom"><button className="navbar-item" onClick={onInfo} aria-label="Sobre os dados" title="Sobre os dados"><FiInfo /><span className="navbar-label">Sobre os dados</span></button><button className="navbar-item" onClick={alternarTema} aria-label={tema === 'dark' ? 'Tema claro' : 'Tema escuro'} title={tema === 'dark' ? 'Tema claro' : 'Tema escuro'}>{tema === 'dark' ? <FiSun /> : <FiMoon />}<span className="navbar-label">{tema === 'dark' ? 'Tema claro' : 'Tema escuro'}</span></button></div>
  </nav>;
}
