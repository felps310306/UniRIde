import { useEffect, useMemo, useRef, useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiSearch, FiHeart, FiRefreshCw, FiMapPin, FiClock, FiInfo, FiX, FiMap, FiList, FiWifiOff, FiHelpCircle } from 'react-icons/fi';
import { TbBus } from 'react-icons/tb';
import NavBar from './cco/NavBar.jsx';
import SelectBusca from './cco/components/Form/SelectBusca.jsx';
import Paginacao from './cco/components/Paginacao/Paginacao.jsx';
import Toast from './cco/components/Toast/Toast.jsx';
import CampusPicker from './CampusPicker.jsx';
import OriginPicker from './OriginPicker.jsx';
import { NEARBY_RADIUS_METERS } from './origin.js';
import HelpPanel from './HelpPanel.jsx';
import MapView from './MapView.jsx';
import { CAMPUSES, SITE_URL, CAMPUS_RADIUS_METERS } from './config.js';
import { useRemote, offline } from './api.js';
import { todayBrasilia, scheduleForDate, directionLabel, normalizeSearch, isDate, distanceToPath } from './transport.js';
import { readRoute, routeHash, savedCampus, CAMPUS_KEY } from './navigation.js';
import { parseFavorites, favoritesForCampus } from './favorites.js';

const FAVORITES_KEY='uniride:campus-favorites:v2';
function readFavorites(){try{return parseFavorites(localStorage.getItem(FAVORITES_KEY),localStorage.getItem('uniride:public-lines:v1'));}catch{return [];}}
const timestamp=value=>value?new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'—';
function ErrorState({message,retry,onHelp}){return <div className="error-state" role="alert"><FiWifiOff/><strong>Não foi possível consultar</strong><p>{message}</p><div className="recovery-actions"><button className="btn" onClick={retry}><FiRefreshCw/>Tentar novamente</button><button className="text-button" onClick={onHelp}>Ajuda com a consulta</button></div></div>;}
function Loader(){return <div className="loading-state" role="status"><span className="spinner"/>Consultando a SEMOB…</div>;}

export default function App(){
  const [origin,setOrigin]=useState(null);
  const [route,setRoute]=useState(()=>readRoute(location.hash,savedCampus()));
  const [query,setQuery]=useState(''),[target,setTarget]=useState(null),[tab,setTab]=useState('linhas'),[mobileView,setMobileView]=useState('lista'),[info,setInfo]=useState(false),[toast,setToast]=useState(null),[pagination,setPagination]=useState(0),[favorites,setFavorites]=useState(readFavorites),[clock,setClock]=useState(Date.now()),[date,setDate]=useState(todayBrasilia),[direction,setDirection]=useState(''),[online,setOnline]=useState(navigator.onLine);
  const searchRef=useRef(null),tabsRef=useRef([]),lastLineRef=useRef(null);
  const {page,campusId,line:lineCode}=route;
  const campus=CAMPUSES.find(c=>c.id===campusId);
  const changeRoute=(update,{replace=false}={})=>{const next={...route,...update};setRoute(next);history[replace?'replaceState':'pushState']({uniride:true},'',routeHash(next));};
  const needsOrigin=!origin&&!offline;
  const catalog=useRemote(offline?`/api/catalog?campus=${campusId}`:origin?'/api/journey':null,0,origin?{campus:campusId,origin:{lat:origin.lat,lng:origin.lng}}:null);
  const permitted=!!lineCode && !!catalog.data?.lines.some(l=>l.code===lineCode);
  const detail=useRemote(permitted?`/api/line?code=${encodeURIComponent(lineCode)}&campus=${campusId}`:null);
  const tracking=useRemote(permitted?`/api/positions?code=${encodeURIComponent(lineCode)}&campus=${campusId}`:null,30000);
  const mappedRoutes=useMemo(()=>detail.data?.routes.filter(r=>!origin||(distanceToPath([origin.lng,origin.lat],r.geometry)<=NEARBY_RADIUS_METERS&&distanceToPath([campus.lng,campus.lat],r.geometry)<=CAMPUS_RADIUS_METERS)),[detail.data,origin,campus]);
  const selected=lineCode?(catalog.data?.lines.find(l=>l.code===lineCode)||{code:lineCode,name:`Linha ${lineCode}`}):null;
  const hasDetail=!!selected,showMap=page==='mapa'||hasDetail;
  useEffect(()=>{const update=()=>setRoute(readRoute(location.hash,savedCampus()));window.addEventListener('popstate',update);window.addEventListener('hashchange',update);return()=>{window.removeEventListener('popstate',update);window.removeEventListener('hashchange',update);};},[]);
  useEffect(()=>{try{localStorage.setItem(CAMPUS_KEY,campusId);}catch{}setQuery('');setPagination(0);setTarget(null);setMobileView('lista');},[campusId,page]);
  useEffect(()=>{setDirection('');setDate(todayBrasilia());setTarget(null);if(!lineCode && lastLineRef.current){const previousCode=lastLineRef.current;requestAnimationFrame(()=>document.querySelector(`[data-line="${previousCode}"]`)?.focus());}lastLineRef.current=lineCode;},[lineCode]);
  useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),5000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{const update=()=>setOnline(navigator.onLine);window.addEventListener('online',update);window.addEventListener('offline',update);return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update);};},[]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(null),toast.acao?12000:5000);return()=>clearTimeout(timer);},[toast]);
  useEffect(()=>{const shortcut=e=>{if(e.altKey && e.key.toLowerCase()==='b' && !info && !document.getElementById('app').inert){e.preventDefault();if(lineCode){changeRoute({line:null});setTimeout(()=>searchRef.current?.focus(),0);}else searchRef.current?.focus();}};window.addEventListener('keydown',shortcut);return()=>window.removeEventListener('keydown',shortcut);},[lineCode,route,info]);
  const navigate=p=>{setMobileView('lista');changeRoute({page:p,line:null});};
  const chooseCampus=id=>changeRoute({campusId:id,line:null});
  const chooseOrigin=value=>{setOrigin(value);setTab('paradas');setQuery('');setPagination(0);setTarget(null);setMobileView('lista');changeRoute({line:null});};
  const chooseLine=line=>{setMobileView('lista');changeRoute({line:line.code});};
  const closeLine=()=>{setMobileView('lista');changeRoute({line:null});};
  const writeFavorites=next=>{setFavorites(next);try{localStorage.setItem(FAVORITES_KEY,JSON.stringify(next));return true;}catch{return false;}};
  const favorite=line=>{
    const previous=favorites,exists=favorites.some(f=>f.code===line.code && (f.campusId===campusId||f.campusId===null));
    const next=exists?favorites.filter(f=>!(f.code===line.code && (f.campusId===campusId||f.campusId===null))):[...favorites,{code:line.code,name:line.name,campusId}];
    const saved=writeFavorites(next);
    setToast({tipo:saved?'sucesso':'erro',titulo:exists?'Linha removida dos favoritos':'Linha adicionada aos favoritos',descricao:saved?`${campus.institution} · ${campus.name}`:'O navegador não permitiu salvar. A mudança vale apenas nesta sessão.',acao:()=>{const persisted=writeFavorites(previous);setToast({tipo:persisted?'sucesso':'erro',titulo:persisted?'Alteração desfeita':'Alteração desfeita apenas nesta sessão'});}});
  };
  const savedForCampus=favoritesForCampus(favorites,campusId,catalog.data?.lines||[]);
  const base=page==='favoritos'?savedForCampus:catalog.data?.lines||[];
  const lines=useMemo(()=>base.filter(l=>normalizeSearch(`${l.code} ${l.name}`).includes(normalizeSearch(query))),[base,query]);
  const stops=(catalog.data?.stops||[]).filter(s=>normalizeSearch(`${s.id} ${s.address}`).includes(normalizeSearch(query)));
  const live=offline?[]:(tracking.data?.positions||[]).filter(p=>clock-Date.parse(p.observedAt)<=120000);
  const rows=scheduleForDate(detail.data?.schedules||[],date,direction);
  const directions=[...new Set((detail.data?.schedules||[]).map(s=>s.direction))];
  const totalPages=Math.ceil(lines.length/10),safePage=Math.min(pagination,Math.max(0,totalPages-1)),visibleLines=lines.slice(safePage*10,safePage*10+10);
  const sourceState=offline?'Amostra salva':needsOrigin?'Defina sua origem':!online?'Sem conexão':catalog.loading?(catalog.data?'Atualizando consulta':'Consultando fonte'):catalog.error?'Falha na atualização':catalog.data?.stale?'Consulta anterior':'Dados da SEMOB';
  const refresh=()=>{catalog.retry();if(permitted){detail.retry();tracking.retry();}};
  const changeTab=value=>{setTab(value);setQuery('');setPagination(0);setTarget(null);};
  const tabKeys=(event,index)=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?1:1-index;changeTab(next?'paradas':'linhas');tabsRef.current[next]?.focus();}};
  const isSaved=code=>savedForCampus.some(f=>f.code===code);
  const lineRow=line=><div key={line.code} className="line-row"><button data-line={line.code} className="line-open" onClick={()=>chooseLine(line)} aria-label={`Ver linha ${line.code}`}><span className="line-number">{line.code}</span><span className="line-description"><strong>{line.name}</strong><small>{line.directions?.map(directionLabel).join(' · ')||'Favorita deste campus'}{line.distance!=null?origin?` · trajeto a ${line.distance} m de você · a ${line.destinationDistance} m do campus`:` · trajeto a ${line.distance} m do campus`:''}</small></span><FiArrowRight className="row-arrow"/></button><button className={`icon-btn favorite-btn ${isSaved(line.code)?'saved':''}`} aria-label={`${isSaved(line.code)?'Remover':'Adicionar'} linha ${line.code} ${isSaved(line.code)?'dos':'aos'} favoritos`} aria-pressed={isSaved(line.code)} onClick={()=>favorite(line)}><FiHeart/></button></div>;
  return <div className="cco-app-layout">
    <NavBar page={page} onNavigate={navigate} onInfo={()=>setInfo(true)}/>
    <div className="app-frame">
      <header className="app-header"><div className="header-title"><TbBus/><strong>UniRide</strong><span className="header-divider"/><span>Brasília · DF</span></div><div className="header-status" role="status" aria-live="polite"><span className={`source-dot ${!online||catalog.error||catalog.data?.stale||offline?'warn':''}`}/><span>{sourceState}</span><button className="icon-btn" aria-label="Ajuda e fontes" title="Ajuda e fontes" onClick={()=>setInfo(true)}><FiHelpCircle/></button></div></header>
      {offline?<div className="offline-banner"><FiWifiOff/><span>Apresentação · amostra de {timestamp(catalog.data?.fetchedAt)}. Para dados atuais, <a href={SITE_URL}>abra a versão online</a>.</span></div>:!online && <div className="connection-banner" role="status"><FiWifiOff/>Sem conexão. As informações já carregadas continuam disponíveis. Reconecte para atualizar.</div>}
      <main id="main" tabIndex={-1} className={`workspace ${!showMap?'table-mode':''} mobile-${mobileView}`}>
        <aside className={`consultation-panel ${origin?'has-origin':''} ${selected?'has-detail':''}`} aria-label="Consulta de linhas">
          <div className="panel-top"><div className="panel-heading"><span className="small-label">SEU CAMINHO ATÉ O CAMPUS</span><h1>{page==='favoritos'?'Linhas favoritas':page==='linhas'?'Linhas para o campus':'Chegar à faculdade'}</h1></div><button className="icon-btn" title="Atualizar consulta" aria-label="Atualizar consulta" disabled={needsOrigin||catalog.loading||offline||!online} onClick={refresh}><FiRefreshCw className={catalog.loading?'refreshing':''}/></button></div>
          <div className="journey-fields"><OriginPicker origin={origin} onChange={chooseOrigin} offline={offline}/>
          <CampusPicker campus={campus} onChange={chooseCampus}/></div>
          {needsOrigin?<div className="empty-panel origin-empty"><FiMapPin/><h2>Encontre uma parada perto de você</h2><p>Informe seu ponto de partida acima. Vamos buscar paradas próximas e linhas que também passam perto da faculdade escolhida.</p></div>:selected?<>
            <div className="detail-head"><button className="text-button" onClick={closeLine}><FiArrowLeft/>Voltar à lista</button><div className="detail-title"><span className="line-number large">{selected.code}</span><button className={`icon-btn ${isSaved(selected.code)?'saved':''}`} aria-label={isSaved(selected.code)?'Remover linha selecionada dos favoritos':'Favoritar linha selecionada'} aria-pressed={isSaved(selected.code)} onClick={()=>favorite(selected)} disabled={!permitted}><FiHeart/></button></div><h2>{selected.name}</h2></div>
            <div className="panel-scroll detail-scroll" aria-busy={catalog.loading||detail.loading}>
              {catalog.loading&&!catalog.data?<Loader/>:catalog.error&&!catalog.data?<ErrorState message={catalog.error} retry={catalog.retry} onHelp={()=>setInfo(true)}/>:!permitted?<div className="empty-panel" role="status"><FiMapPin/><h2>Linha fora desta consulta</h2><p>Não encontramos esta linha perto da sua origem e da faculdade selecionada.</p><button className="btn" onClick={closeLine}>Ver linhas deste percurso</button></div>:<>
                {origin&&<div className="journey-summary"><strong>Da sua origem até {campus.institution}</strong><p>Este traçado passa perto dos dois pontos. Confirme o sentido e a parada de embarque antes de sair.</p></div>}
                <section className="tracking-box" aria-live="polite"><div><TbBus/><strong>{tracking.loading?'Buscando posições…':live.length?`${live.length} ônibus com posição recente`:'Sem posição recente disponível'}</strong></div><p>{offline?'Posições disponíveis na versão online.':tracking.loading?'Consultando as últimas posições publicadas pela SEMOB.':tracking.error?'A atualização de posições falhou. Confira sua conexão e tente novamente.':live.length?'Medições de até 2 minutos. Consulta a cada 30 segundos.':'A SEMOB não informou posições recentes para esta linha. Isso não confirma ausência de ônibus circulando.'}</p>{tracking.data?.fetchedAt&&<small>Consulta {timestamp(tracking.data.fetchedAt)}</small>}{tracking.error&&<button className="text-button" onClick={tracking.retry}>Tentar posições novamente</button>}</section>
                {detail.loading&&!detail.data?<Loader/>:detail.error&&!detail.data?<ErrorState message={detail.error} retry={detail.retry} onHelp={()=>setInfo(true)}/>:detail.data&&<section className="schedule-section">
                  <h3><FiClock/>Horários de saída</h3><p>Partidas programadas no ponto inicial. Não são horários de chegada à sua parada.</p>
                  {(detail.data.stale||detail.error)&&<p className="data-warning" role="status">Consulta salva em {timestamp(detail.data.fetchedAt)}. Não foi possível atualizar.</p>}
                  <div className="date-control"><label className="field">Data da consulta<input type="date" value={date} onChange={e=>setDate(e.target.value)} aria-invalid={!isDate(date)} aria-describedby={!isDate(date)?'date-error':undefined}/></label><button className="text-button" onClick={()=>setDate(todayBrasilia())}>Hoje</button></div>
                  {!isDate(date)&&<p id="date-error" className="field-error" role="alert">Escolha uma data válida para consultar os horários.</p>}
                  <SelectBusca label="Sentido da linha" value={direction} onChange={setDirection} options={[{value:'',label:'Todos os sentidos'},...directions.map(d=>({value:d,label:directionLabel(d)}))]}/>
                  <div className="schedule-summary" role="status">{isDate(date)?`${rows.length} partidas na data e sentido escolhidos`:''}</div>
                  <div className="schedule-list" aria-label="Horários de saída">{rows.length?rows.map((r,i)=><div className="schedule-row" key={`${r.time}-${r.direction}-${i}`}><time>{r.time}</time><span>{directionLabel(r.direction)}</span><small>{r.operator}</small></div>):isDate(date)&&<div className="empty-inline">Nenhum horário informado para esta data e sentido. <button className="text-button" onClick={()=>{setDate(todayBrasilia());setDirection('');}}>Consultar hoje em todos os sentidos</button></div>}</div>
                  <p className="footnote">Grade semanal da SEMOB. Feriados podem ter operação diferente.</p>
                </section>}
              </>}
            </div>
          </>:<>
            <div className="query-field"><FiSearch/><input ref={searchRef} value={query} onChange={e=>{setQuery(e.target.value);setPagination(0);}} placeholder={tab==='paradas'&&page==='mapa'?'Número ou endereço da parada':'Número da linha ou destino'} aria-label="Buscar linha ou parada" aria-keyshortcuts="Alt+B"/>{query&&<button className="icon-btn" aria-label="Limpar busca" onClick={()=>{setQuery('');setPagination(0);searchRef.current?.focus();}}><FiX/></button>}</div>
            {page==='mapa'?<div className="panel-tabs" role="tablist" aria-label="Tipo de consulta">{['linhas','paradas'].map((value,i)=><button key={value} ref={el=>tabsRef.current[i]=el} id={`tab-${value}`} role="tab" aria-controls="consultation-results" aria-selected={tab===value} tabIndex={tab===value?0:-1} onKeyDown={e=>tabKeys(e,i)} onClick={()=>changeTab(value)}>{i?(origin?'Perto de mim':'Paradas'):'Linhas'} <span>{catalog.data?.[i?'stops':'lines'].length??'—'}</span></button>)}</div>:<div className="list-summary">{lines.length} linhas {page==='favoritos'?'salvas para este percurso':'entre sua origem e o campus'}</div>}
            <div id="consultation-results" className="panel-scroll" role={page==='mapa'?'tabpanel':undefined} aria-labelledby={page==='mapa'?`tab-${tab}`:undefined} aria-busy={page!=='favoritos'&&catalog.loading}>
              {page!=='favoritos'&&catalog.loading&&!catalog.data?<Loader/>:page!=='favoritos'&&catalog.error&&!catalog.data?<ErrorState message={catalog.error} retry={catalog.retry} onHelp={()=>setInfo(true)}/>:<>
                {(catalog.error||catalog.data?.stale)&&page!=='favoritos'&&!offline&&<div className="data-warning" role="status">Não foi possível atualizar. Consulta de {timestamp(catalog.data.fetchedAt)}. <button className="text-button" onClick={catalog.retry}>Tentar novamente</button></div>}
                {tab==='paradas'&&page==='mapa'?<><p className="list-note">{origin?`Paradas a até ${NEARBY_RADIUS_METERS} m de você, ordenadas pela distância em linha reta. Confirme quais linhas atendem cada parada.`:`Amostra: paradas a até ${CAMPUS_RADIUS_METERS} m do campus, não da sua localização.`}</p>{stops.length?stops.map(s=><button key={s.key} className={`stop-row ${target?.key===s.key?'selected':''}`} onClick={()=>{setTarget(s);setMobileView('mapa');}}><FiMapPin/><span><strong>Parada {s.id}</strong><small>{s.address}</small></span><b>{s.distance} m</b></button>):<div className="empty-panel"><FiMapPin/><h2>Nenhuma parada encontrada</h2><p>Tente outro endereço ou ajuste o ponto de partida.</p>{query&&<button className="btn" onClick={()=>setQuery('')}>Limpar busca</button>}</div>}</>:<>
                  {page!=='favoritos'&&<p className="list-note">{origin?`Traçados a até ${NEARBY_RADIUS_METERS} m de você e ${CAMPUS_RADIUS_METERS} m do campus. Confira o sentido e o embarque. Não calculamos baldeações.`:`Amostra: trajetos a até ${CAMPUS_RADIUS_METERS} m do campus.`}</p>}
                  {query&&<p className="search-count" role="status">{lines.length} {lines.length===1?"resultado":"resultados"} para “{query}”</p>}
                  {lines.length?visibleLines.map(lineRow):<div className="empty-panel"><FiHeart/><h2>{page==='favoritos'&&!query?'Nenhuma favorita neste percurso':origin&&!query?'Nenhuma conexão direta encontrada':'Nenhuma linha encontrada'}</h2><p>{page==='favoritos'&&!query?'Favoritas aparecem aqui quando passam perto da origem e do campus.':origin&&!query?'Não encontramos um mesmo traçado perto dos dois pontos. Você pode precisar de uma baldeação. Confira as paradas perto de você ou altere a origem.':'Tente outro número ou destino. A busca considera sua origem e este campus.'}</p>{query?<button className="btn" onClick={()=>{setQuery('');setPagination(0);}}>Limpar busca</button>:page==='favoritos'&&<button className="btn" onClick={()=>navigate('linhas')}>Ver linhas deste percurso</button>}</div>}
                  {origin&&!lines.length&&!query&&page!=='favoritos'&&<div className="empty-recovery"><button className="btn" onClick={()=>{navigate('mapa');changeTab('paradas');}}>Ver paradas perto de mim</button><a className="text-button" href="https://dfnoponto.semob.df.gov.br/pesquisa-geral/" target="_blank" rel="noreferrer">Planejar conexão no DF no Ponto</a></div>}
                  <Paginacao pagina={safePage} totalPaginas={totalPages} onChange={p=>{setPagination(p);document.querySelector('.panel-scroll')?.scrollTo({top:0});}}/>
                  {totalPages>1&&<p className="page-count" role="status">Página {safePage+1} de {totalPages}</p>}
                </>}
              </>}
            </div>
          </>}
          <footer className="panel-footer"><span><FiInfo/>SEMOB/DF · {timestamp((selected?detail.data:catalog.data)?.fetchedAt)}</span><button className="text-button" onClick={()=>setInfo(true)}>Ajuda e fontes</button></footer>
        </aside>
        {showMap&&<MapView campus={campus} origin={origin} stops={catalog.data?.stops} routes={permitted&&detail.data?.code===lineCode?mappedRoutes:null} positions={live} line={permitted?lineCode:null} target={target} offline={offline}/>}
        {showMap&&<button className="mobile-switch btn" onClick={()=>setMobileView(v=>v==='mapa'?'lista':'mapa')}>{mobileView==='mapa'?<FiList/>:<FiMap/>}{mobileView==='mapa'?'Ver lista':'Ver mapa'}</button>}
      </main>
    </div>
    <HelpPanel open={info} onClose={()=>setInfo(false)} campus={campus}/>
    <Toast toast={toast} onFechar={()=>setToast(null)}/>
  </div>;
}


