import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { IoCloseSharp } from 'react-icons/io5'
import { MdFilterList } from 'react-icons/md'
import './PainelLateral.css'

// Barra compacta: botão que abre o painel de filtros e os filtros em uso, removíveis um a um.
// filtros: [{ id, rotulo, valor, limpar }]; children vai à direita (total, download...).
export function BarraFiltros({ filtros, onAbrir, children }) {
    return (
        <div className="filtros-barra">
            <button type="button" className={`filtros-botao${filtros.length ? ' ativo' : ''}`} onClick={onAbrir} aria-haspopup="dialog">
                <MdFilterList /> Filtros
                {filtros.length > 0 && <span className="filtros-qtd" aria-label={`${filtros.length} em uso`}>{filtros.length}</span>}
            </button>
            {filtros.map(f => (
                <span key={f.id} className="filtros-chip" title={`${f.rotulo}: ${f.valor}`}>
                    {f.rotulo}: <strong>{f.valor}</strong>
                    <button type="button" aria-label={`Remover filtro ${f.rotulo}`} onClick={f.limpar}><IoCloseSharp /></button>
                </span>
            ))}
            {children && <div className="filtros-barra-extra">{children}</div>}
        </div>
    )
}

// Painel que abre da direita por cima da página (ex.: filtros). Esc ou clique fora fecham.
export default function PainelLateral({ aberto, onFechar, titulo, icone, rodape, children }) {
    const painel = useRef(null)

    useEffect(() => {
        if (!aberto) return
        const anterior = document.activeElement
        const app = document.getElementById('app')
        if (app) app.inert = true
        if (!painel.current?.contains(document.activeElement)) painel.current?.focus()
        return () => { if (app) app.inert = false; anterior?.focus?.() }
    }, [aberto])

    useEffect(() => {
        if (!aberto) return
        function tecla(e) {
            if (e.key === 'Escape') onFechar()
            if (e.key === 'Tab') {
                const itens = [...painel.current.querySelectorAll('a[href],button:not(:disabled),input,select,textarea,[tabindex="0"]')]
                const primeiro = itens[0], ultimo = itens[itens.length - 1]
                if (e.shiftKey && (document.activeElement === primeiro || document.activeElement === painel.current)) { e.preventDefault(); ultimo?.focus() }
                else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro?.focus() }
            }
        }
        document.addEventListener('keydown', tecla)
        return () => document.removeEventListener('keydown', tecla)
    }, [aberto, onFechar])

    if (!aberto) return null
    return createPortal(
        <div className="painel-lateral-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onFechar() }}>
            <aside ref={painel} className="painel-lateral" role="dialog" aria-modal="true" aria-labelledby="painel-lateral-titulo" tabIndex={-1}>
                <header className="painel-lateral-cabecalho">
                    <h2 id="painel-lateral-titulo">{icone}{titulo}</h2>
                    <button type="button" className="painel-lateral-fechar" onClick={onFechar} aria-label="Fechar">
                        <IoCloseSharp />
                    </button>
                </header>
                <div className="painel-lateral-corpo">{children}</div>
                {rodape && <footer className="painel-lateral-rodape">{rodape}</footer>}
            </aside>
        </div>,
        document.body
    )
}
