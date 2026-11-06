import { useState } from 'react';
import { FiSearch, FiChevronDown, FiCheck, FiX } from 'react-icons/fi';
import { TbSchool } from 'react-icons/tb';
import PainelLateral from './cco/components/PainelLateral/PainelLateral.jsx';
import { CAMPUSES } from './config.js';
import { normalizeSearch } from './transport.js';

export default function CampusPicker({campus,onChange}){
  const [open,setOpen]=useState(false),[query,setQuery]=useState('');
  const found=CAMPUSES.filter(c=>normalizeSearch(`${c.institution} ${c.fullName||''} ${c.name} ${c.address} ${c.region||''}`).includes(normalizeSearch(query)));
  const groups=[...new Set(found.map(c=>c.institution))];
  return <>
    <div className="campus-picker"><span className="field-label">Para onde? · Faculdade e campus</span><button className="campus-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={()=>{setQuery('');setOpen(true);}}><TbSchool/><span><strong>{campus.institution}</strong><small>{campus.name}</small></span><FiChevronDown/><span className="sr-only">Trocar faculdade</span></button></div>
    <PainelLateral aberto={open} onFechar={()=>setOpen(false)} titulo="Escolher faculdade" icone={<TbSchool/>}>
      <div className="campus-search"><label htmlFor="campus-search">Buscar instituição, campus ou região</label><div className="query-field"><FiSearch/><input id="campus-search" autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ex.: Católica, IESB, Taguatinga"/>{query && <button className="icon-btn" aria-label="Limpar busca de faculdade" onClick={()=>setQuery('')}><FiX/></button>}</div></div>
      <p className="campus-count" role="status">{found.length} {found.length===1?"campus":"campi"} · {groups.length} {groups.length===1?"instituição":"instituições"}</p>
      {groups.map(institution=><section className="campus-group" key={institution}><h3>{institution}</h3>{found.filter(c=>c.institution===institution).map(c=><button key={c.id} className={`campus-option ${c.id===campus.id?'chosen':''}`} onClick={()=>{onChange(c.id);setOpen(false);}} aria-pressed={c.id===campus.id}><span><strong>{c.name}</strong><small>{c.address}</small></span>{c.id===campus.id && <FiCheck/>}</button>)}</section>)}
      {!found.length && <div className="empty-panel"><TbSchool/><h3>Nenhuma faculdade encontrada</h3><p>Tente a sigla, o nome da instituição ou a região.</p><button className="btn" onClick={()=>setQuery('')}>Mostrar todas as faculdades</button></div>}
      <p className="footnote">Campi presenciais com referência geográfica verificada. A lista de cobertura e suas fontes está na ajuda.</p>
    </PainelLateral>
  </>;
}

