import './Toast.css'
import { FaCheck, FaXmark } from 'react-icons/fa6'

export default function Toast({ toast, onFechar }) {
    if (!toast) return null
    return (
        <div className={`toast toast-${toast.tipo}`} role="status" aria-live="polite">
            <div className='toast-icone'>
                {toast.tipo === 'sucesso' ? <FaCheck /> : <FaXmark />}
            </div>
            <div className='toast-conteudo'>
                <p className='toast-titulo'>
                    {toast.titulo}
                </p>
                {toast.descricao && <p className='toast-descricao'>{toast.descricao}</p>}
            </div>
            {toast.acao && <button className="toast-action" onClick={toast.acao}>{toast.rotuloAcao || 'Desfazer'}</button>}
            <button className='toast-fechar' onClick={onFechar} aria-label="Fechar aviso">
                <FaXmark />
            </button>
        </div>
    )
}
