import { CAMPUSES } from '../src/config.js';
import { freshPositions } from '../src/transport.js';
import { buildCampusCatalog } from './catalog.js';
import { buildJourneyCatalog } from './journey.js';
import { validOrigin } from '../src/origin.js';
import { createSnapshotCache } from './cache.js';

export const UPSTREAM = 'https://geoserver.semob.df.gov.br/geoserver/semob/ows';
const layers = { routes:'semob:percuso das linhas', stops:'semob:ponto_parada_v2025', schedules:'semob:Horários das Linhas', positions:'semob:ultima_posicao' };
const cache = createSnapshotCache();
export class ProviderError extends Error { constructor(message, status = 502) { super(message); this.status = status; } }
export async function wfs(layer, params = {}, fetcher = fetch) {
  const url = new URL(UPSTREAM);
  url.search = new URLSearchParams({ service:'WFS',version:'1.0.0',request:'GetFeature',typeName:layers[layer],outputFormat:'application/json',srsName:'EPSG:4326',maxFeatures:'2500', ...params });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 22000);
  try {
    const response = await fetcher(url, { signal:controller.signal,headers:{ Accept:'application/json','User-Agent':'UniRideCampus/0.2 (+https://uniride-campus-brasilia-lf.lipibcg.chatgpt.site)' } });
    if (!response.ok) throw new ProviderError('A SEMOB está indisponível no momento. Tente novamente.');
    const data = await response.json();
    if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) throw new ProviderError('A SEMOB retornou uma resposta não reconhecida.');
    if (data.features.length >= 2500) throw new ProviderError('A consulta ultrapassou o limite de dados. Tente uma área menor.');
    return data;
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError('Não foi possível consultar a SEMOB. Tente novamente em instantes.', 503);
  } finally { clearTimeout(timeout); }
}
const envelope = entry => ({ ...entry.data, source:'SEMOB/DF · GeoServer WFS', fetchedAt:new Date(entry.time).toISOString(), stale:entry.stale });
export function validateLine(value) {
  if (!/^\d{1,4}(?:\.\d{1,3})?$/.test(value || '')) throw new ProviderError('Número de linha inválido.',400);
  return value;
}
export async function catalog(campusId) {
  const campus = CAMPUSES.find(c=>c.id === campusId);
  if (!campus) throw new ProviderError('Campus inválido.',400);
  return envelope(await cache.get(`catalog:${campusId}`, async () => {
    const bbox = [campus.lng-.012,campus.lat-.012,campus.lng+.012,campus.lat+.012,'EPSG:4326'].join(',');
    const [routeData, stopData] = await Promise.all([wfs('routes',{bbox}),wfs('stops',{bbox})]);
    return buildCampusCatalog(campus,routeData.features,stopData.features);
  },{ttl:3600000,staleFor:86400000}));
}
export async function lineDetails(raw) {
  const code = validateLine(raw);
  return envelope(await cache.get(`line:${code}`,async()=>{
    const CQL_FILTER = `cd_linha='${code}'`;
    const [routeData, scheduleData] = await Promise.all([wfs('routes',{CQL_FILTER}),wfs('schedules',{CQL_FILTER})]);
    if (!routeData.features.length) throw new ProviderError('Linha não encontrada na SEMOB.',404);
    const seen = new Set();
    const schedules = scheduleData.features.map(f=>f.properties).filter(p=>{
      const key=[p.hr_prevista,p.sentido,p.dias_semana,p.id_operadora,p.dt_inicio_vigencia,p.dt_final_vigencia].join('|');
      if (seen.has(key) || !/^\d{2}:\d{2}/.test(p.hr_prevista || '')) return false; seen.add(key); return true;
    }).map(p=>({time:p.hr_prevista,direction:p.sentido,days:p.dias_semana,daysLabel:p.dia_label,operator:p.nm_operadora,validFrom:p.dt_inicio_vigencia,validUntil:p.dt_final_vigencia}));
    return {code,name:routeData.features[0].properties.tx_linha,routes:routeData.features.map(f=>({direction:f.properties.lin_sentido,geometry:f.geometry})),schedules};
  },{ttl:3600000,staleFor:86400000}));
}
export async function positions(raw) {
  const code = validateLine(raw);
  const entry = await cache.get(`positions:${code}`,async()=>{
    const data = await wfs('positions',{CQL_FILTER:`cd_linha='${code}'`,propertyName:'geom_point,id_operadora,prefixo,datalocal,cd_linha,dataregistro,sentido'});
    return {features:data.features};
  },{ttl:30000,staleFor:120000});
  const current = freshPositions(entry.data.features);
  return {source:'SEMOB/DF · última posição',code,fetchedAt:new Date(entry.time).toISOString(),stale:entry.stale,positions:current,discarded:entry.data.features.length-current.length,maxAgeSeconds:120};
}
export async function journey(campusId, origin) {
  const campus=CAMPUSES.find(c=>c.id===campusId);
  if(!campus)throw new ProviderError('Campus inválido.',400);
  if(!validOrigin(origin))throw new ProviderError('Informe um ponto de partida válido no Distrito Federal.',400);
  // Consulta anônima por área. A origem não é persistida no cache do servidor.
  const bbox=[origin.lng-.012,origin.lat-.012,origin.lng+.012,origin.lat+.012,'EPSG:4326'].join(',');
  const [routes,stops]=await Promise.all([wfs('routes',{bbox}),wfs('stops',{bbox})]);
  return {...buildJourneyCatalog(campus,origin,routes.features,stops.features),source:'SEMOB/DF · GeoServer WFS',fetchedAt:new Date().toISOString(),stale:false};
}
export async function handleApi(request) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/')) return null;
  const headers = {'Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'};
  const method=url.pathname==='/api/journey'?'POST':'GET';
  if (request.method !== method) return new Response(JSON.stringify({error:'Método não permitido.'}),{status:405,headers:{...headers,Allow:method}});
  try {
    let data;
    if(url.pathname==='/api/journey'){
      if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw new ProviderError('Envie a origem em formato JSON.',415);
      const reader=request.body?.getReader();let body='',size=0;
      if(!reader)throw new ProviderError('Informe o ponto de partida.',400);
      try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1024){await reader.cancel();throw new ProviderError('Consulta de origem muito grande.',413);}body+=new TextDecoder().decode(value,{stream:true});}}finally{reader.releaseLock();}
      let input;try{input=JSON.parse(body);}catch{throw new ProviderError('Origem inválida. Escolha sua localização novamente.',400);}
      data=await journey(input?.campus,input?.origin);
    }
    else if (url.pathname === '/api/catalog') data = await catalog(url.searchParams.get('campus'));
    else if (url.pathname === '/api/line' || url.pathname === '/api/positions') {
      const code=validateLine(url.searchParams.get('code'));
      const area=await catalog(url.searchParams.get('campus'));
      if(!area.lines.some(line=>line.code===code))throw new ProviderError('Esta linha não consta na consulta do campus selecionado.',404);
      data=url.pathname === '/api/line'?await lineDetails(code):await positions(code);
    }
    else return new Response(JSON.stringify({error:'Consulta não encontrada.'}),{status:404,headers});
    return new Response(JSON.stringify(data),{headers});
  } catch(error) { return new Response(JSON.stringify({error:error instanceof ProviderError ? error.message : 'Não foi possível concluir a consulta.'}),{status:error.status || 502,headers}); }
}
