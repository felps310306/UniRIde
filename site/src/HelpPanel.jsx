import { useState } from 'react';
import { FiHelpCircle, FiExternalLink } from 'react-icons/fi';
import PainelLateral from './cco/components/PainelLateral/PainelLateral.jsx';
import { CAMPUSES, SOURCE_URL, CAMPUS_RADIUS_METERS } from './config.js';
import { normalizeSearch } from './transport.js';

const topics=[
  {title:'Como encontrar um ônibus para minha faculdade?',text:'Use Minha localização ou Marcar no mapa para definir de onde você sai. Depois escolha a faculdade e o campus. Perto de mim mostra paradas próximas da sua origem. Linhas mostra os traçados que passam perto da origem e do campus. Abra uma linha e confirme o sentido e a parada de embarque.'},
  {title:'Minha localização não funciona. E agora?',keywords:'gps localização permissão origem',text:'Autorize a localização no navegador ao tocar em Usar minha localização. Se o aparelho não conseguir localizar você, use Marcar no mapa ou informe latitude e longitude. A área atendida é o DF. Se a precisão informada for baixa, ajuste o ponto no mapa. Você pode atualizar ou remover a origem a qualquer momento.'},
  {title:'Minha localização fica salva?',keywords:'privacidade dados gps localização',text:'A origem fica apenas na memória enquanto o aplicativo está aberto. Ela é enviada ao servidor do UniRide para consultar linhas e paradas na SEMOB. Não a adicionamos à URL, aos favoritos nem ao armazenamento do navegador. O aplicativo não mantém histórico de localização. Os mapas-base são fornecidos pelo OpenStreetMap.'},
  {title:'Por que não apareceu uma conexão direta?',text:'A consulta procura uma mesma variante de linha perto dos dois pontos. Se não encontrar, pode ser necessário fazer baldeação ou escolher outra parada. As paradas perto de você continuam disponíveis. O UniRide ainda não calcula baldeações nem confirma qual linha atende cada parada; use o DF no Ponto para complementar o planejamento.'},
  {title:'O horário é de chegada à minha parada?',keywords:'horarios horários grade partida saída data sentido eta feriados',text:'Não. A grade mostra partidas programadas no ponto inicial da linha. Escolha a data e o sentido. O UniRide não calcula uma previsão de chegada à parada; feriados podem ter operação diferente.'},
  {title:'Por que não vejo nenhum ônibus no mapa?',text:'Só exibimos medições com até 2 minutos. A ausência de marcador pode indicar falta de dados recentes na SEMOB, e não ausência de ônibus circulando. Você pode tentar atualizar a consulta.'},
  {title:'Como salvar ou desfazer um favorito?',text:'Toque no coração da linha. Para desfazer, use o botão no aviso que aparece. Os favoritos são salvos neste navegador e organizados pelo campus escolhido; não são sincronizados com outros aparelhos.'},
  {title:'A consulta falhou. O que faço?',text:'Confira sua conexão e use Tentar novamente. Se houver um resultado anterior válido, ele continua visível com a data. No arquivo HTML de apresentação, a consulta usa uma amostra salva; atualizações exigem a versão online ou o servidor local.'},
  {title:'Posso usar pelo teclado?',text:'Use Tab para percorrer os controles e Enter para abrir. Alt + B leva à busca de linhas. As setas mudam entre Linhas e Paradas. Escape fecha os painéis. A opção Pular para o conteúdo leva à consulta.'},
];
export default function HelpPanel({open,onClose,campus}){
  const [query,setQuery]=useState('');
  const filtered=topics.filter(t=>normalizeSearch(t.title+' '+t.text+' '+(t.keywords||'')).includes(normalizeSearch(query)));
  return <PainelLateral aberto={open} onFechar={onClose} titulo="Ajuda e fontes" icone={<FiHelpCircle/>}><div className="source-info">
    <label className="field">Buscar ajuda<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Horários, favoritos, conexão…"/></label>
    {filtered.map(t=><details key={t.title} open={query?true:undefined}><summary>{t.title}</summary><p>{t.text}</p></details>)}
    {!filtered.length && <p role="status">Nenhum tópico encontrado. <button className="text-button" onClick={()=>setQuery('')}>Ver toda a ajuda</button></p>}
    <h3>Fonte dos dados</h3><p>Linhas, paradas, horários e posições: SEMOB/DF. Consulta sem chave de API. O UniRide é um projeto acadêmico independente.</p><a href={SOURCE_URL} target="_blank" rel="noreferrer">Abrir fonte oficial <FiExternalLink/></a>
    <h4>Como a origem e o destino são usados?</h4><p>As paradas ficam a até {CAMPUS_RADIUS_METERS} m da sua origem, ordenadas por distância em linha reta. Para aparecer na lista de linhas, um mesmo traçado deve passar a até {CAMPUS_RADIUS_METERS} m de você e do campus. Essa comparação não confirma a ordem de viagem, o sentido de embarque ou a ligação entre linha e parada. Não é distância a pé. O mapa ainda não calcula baldeações.</p>
    <h4>Campus selecionado</h4><p><strong>{campus.institution} · {campus.name}</strong><br/>{campus.address}</p><a href={campus.source} target="_blank" rel="noreferrer">Consultar referência do campus <FiExternalLink/></a>
    {campus.id==='projecao-taguatinga'&&<p className="data-warning">O ponto do mapa é uma referência próxima da faculdade na CNB 14. O endereço institucional é Área Especial 5/6. Confira a portaria antes de sair.</p>}
    <details><summary>Cobertura: {new Set(CAMPUSES.map(c=>c.institution)).size} instituições, {CAMPUSES.length} campi</summary>{CAMPUSES.map(c=><p key={c.id}><a href={c.source} target="_blank" rel="noreferrer">{c.institution} · {c.name}</a><br/><small>{c.address}</small></p>)}</details>
    {campus.coordinateSource&&<p><a href={campus.coordinateSource} target="_blank" rel="noreferrer">Referência geográfica no mapa <FiExternalLink/></a></p>}
    <p className="footnote">Referências geográficas aproximadas; não representam todas as portarias. Algumas coordenadas usam dados © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">colaboradores do OpenStreetMap · ODbL</a>. A fonte de transporte pode ficar indisponível ou alterar a cobertura. Não há reserva de assento ou informação de lotação.</p>
  </div></PainelLateral>;
}
