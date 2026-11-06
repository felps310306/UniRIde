import "./Paginacao.css"
import { MdArrowForwardIos, MdArrowBackIos } from "react-icons/md"
import { MdKeyboardDoubleArrowRight, MdKeyboardDoubleArrowLeft } from "react-icons/md"

export default function Paginacao({ pagina, totalPaginas, onChange }) {
  if (totalPaginas <= 1) return null

  const JANELA = 3
  let inicio = Math.max(0, pagina - Math.floor(JANELA / 2))
  let fim = inicio + JANELA
  if (fim > totalPaginas) {
    fim = totalPaginas
    inicio = Math.max(0, fim - JANELA)
  }
  const paginas = Array.from({ length: fim - inicio }, (_, i) => inicio + i)

  return (
    <div className="paginacao">
      <button onClick={() => onChange(0)} disabled={pagina === 0} title="Primeira">
        <MdKeyboardDoubleArrowLeft />
      </button>
      <button onClick={() => onChange(pagina - 1)} disabled={pagina === 0} title="Anterior">
        <MdArrowBackIos />
      </button>

      <div className="paginas-numeros">
        {inicio > 0 && <span className="tres-pontos">...</span>}
        {paginas.map(p => (
          <button key={p} onClick={() => onChange(p)} className={pagina === p ? "ativo" : ""} aria-label={`Página ${p + 1}`} aria-current={pagina === p ? 'page' : undefined}>
            {p + 1}
          </button>
        ))}
        {fim < totalPaginas && <span className="tres-pontos">...</span>}
      </div>

      <button onClick={() => onChange(pagina + 1)} disabled={pagina >= totalPaginas - 1} title="Próxima">
        <MdArrowForwardIos />
      </button>
      <button onClick={() => onChange(totalPaginas - 1)} disabled={pagina >= totalPaginas - 1} title="Última">
        <MdKeyboardDoubleArrowRight />
      </button>
    </div>
  )
}
