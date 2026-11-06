// Adaptado do ErrorBoundary do EscalaCCO-front, sem dependência da sessão de gestão.
import { Component } from 'react';
export default class ErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  componentDidCatch(error) { console.error('Falha na interface UniRide:', error.message); }
  render() {
    if (this.state.error) return <section className="empty-panel" role="alert"><h1>Não foi possível abrir esta tela</h1><p>Seus favoritos continuam salvos neste navegador.</p><button className="btn" onClick={() => location.reload()}>Recarregar</button></section>;
    return this.props.children;
  }
}
