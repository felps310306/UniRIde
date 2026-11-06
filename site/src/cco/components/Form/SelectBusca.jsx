import { useId } from 'react'
import './SelectBusca.css'
export default function SelectBusca({ label, value, onChange, options = [], placeholder = 'Selecionar...', disabled = false }) {
  const id = useId()
  const itens = options.map(o => typeof o === 'string' ? { value:o, label:o } : o)
  return <label className="campo-select-busca" htmlFor={id}><span>{label}</span>
    <select id={id} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
      title={itens.find(o => o.value === value)?.label || placeholder}>
      {itens.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </label>
}
