// Leaflet/React-Leaflet e organização de camadas adotados do MapPage do EscalaCCO.
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, CircleMarker, Tooltip, Popup, GeoJSON, ZoomControl, useMap } from 'react-leaflet';
import { FiCrosshair, FiMapPin, FiLayers, FiPlus, FiMinus } from 'react-icons/fi';
import { MAP_TILES, CAMPUS_RADIUS_METERS } from './config.js';
import { NEARBY_RADIUS_METERS } from './origin.js';
import { paths } from './transport.js';
import 'leaflet/dist/leaflet.css';

function MapPosition({ campus, origin, routes, target, reset }) {
  const map = useMap();
  useEffect(()=>{
    if (target) map.setView([target.coordinates[1],target.coordinates[0]],17,{animate:false});
    else if (routes?.length) {
      const points = routes.flatMap(r=>paths(r.geometry)).flat().map(([x,y])=>[y,x]);
      if(points.length) map.fitBounds(points,{padding:[30,30],maxZoom:15,animate:false});
    } else if(origin)map.setView([origin.lat,origin.lng],16,{animate:false});
    else map.setView([campus.lat,campus.lng],15,{animate:false});
  },[map,campus,origin,routes,target,reset]);
  useEffect(()=>{
    const observer=new ResizeObserver(()=>map.invalidateSize());observer.observe(map.getContainer());return()=>observer.disconnect();
  },[map]);
  return null;
}
function MapTools({ campus, origin }) {
  const map=useMap();
  return <div className="map-tools toolbar-pill" role="toolbar" aria-label="Controles do mapa">
    <button className="pill-btn" title="Aproximar" aria-label="Aproximar mapa" onClick={()=>map.zoomIn()}><FiPlus /></button>
    <button className="pill-btn" title="Afastar" aria-label="Afastar mapa" onClick={()=>map.zoomOut()}><FiMinus /></button>
    <span className="tool-divider"/>
    <button className="pill-btn" title="Centralizar campus" aria-label="Centralizar campus" onClick={()=>map.setView([campus.lat,campus.lng],15)}><FiCrosshair /></button>
    {origin&&<button className="pill-btn" title="Voltar à minha origem" aria-label="Centralizar minha origem" onClick={()=>map.setView([origin.lat,origin.lng],16)}><FiMapPin /></button>}
  </div>;
}
export default function MapView({ campus, origin, stops, routes, positions, line, target, reset, offline }) {
  const [tilesError,setTilesError]=useState(false);
  return <section className="map-page" aria-label="Mapa de transporte">
    <MapContainer center={[campus.lat,campus.lng]} zoom={15} zoomControl={false} preferCanvas={false}>
      {!offline && <TileLayer url={MAP_TILES} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' eventHandlers={{tileerror:()=>setTilesError(true)}} />}
      <Circle center={[campus.lat,campus.lng]} radius={CAMPUS_RADIUS_METERS} pathOptions={{color:'#179452',weight:1,dashArray:'5 6',fillOpacity:.035}} interactive={false}/>
      {origin&&<><Circle center={[origin.lat,origin.lng]} radius={NEARBY_RADIUS_METERS} pathOptions={{color:'#495564',weight:1,dashArray:'5 6',fillOpacity:.03}} interactive={false}/><CircleMarker center={[origin.lat,origin.lng]} radius={9} pathOptions={{color:'#fff',weight:3,fillColor:'#303840',fillOpacity:1}}><Tooltip permanent direction="top" className="campus-label">Você · origem</Tooltip><Popup><strong>Ponto de partida</strong><p>{origin.source==='device'?'Localização informada pelo aparelho.':'Local escolhido no mapa.'}</p>{origin.accuracy&&<small>Precisão aproximada de {Math.round(origin.accuracy)} m.</small>}</Popup></CircleMarker></>}
      <CircleMarker center={[campus.lat,campus.lng]} radius={10} pathOptions={{color:'#fff',weight:3,fillColor:'#137f43',fillOpacity:1}}>
        <Tooltip permanent direction="top" offset={[0,-10]} className="campus-label">{campus.institution} · {campus.name}</Tooltip><Popup><strong>{campus.institution} · {campus.name}</strong><p>{campus.address}</p><small>Ponto de referência do campus. Distâncias aproximadas.</small></Popup>
      </CircleMarker>
      {(routes || []).map((r,i)=><GeoJSON key={`${line}-${r.direction}-${i}`} data={r.geometry} style={{color:i%2?'#596472':'#14944c',weight:4,opacity:.9,dashArray:i%2?'8 5':null}}><Tooltip>Linha {line} · {r.direction}</Tooltip></GeoJSON>)}
      {(stops || []).map(s=><CircleMarker key={s.key} center={[s.coordinates[1],s.coordinates[0]]} radius={target?.key===s.key?8:4} pathOptions={{color:'#fff',weight:1.5,fillColor:'#495564',fillOpacity:1}}><Tooltip>Parada {s.id}</Tooltip><Popup><strong>Parada {s.id}</strong><p>{s.address}</p><small>A {s.distance} m {origin?'de você':'do campus'} (linha reta). Confirme a linha e o lado da via.</small></Popup></CircleMarker>)}
      {(positions || []).map(p=><CircleMarker key={p.id} center={[p.coordinates[1],p.coordinates[0]]} radius={8} pathOptions={{color:'#fff',weight:2,fillColor:'#16934d',fillOpacity:1}}><Tooltip direction="top" permanent className="bus-label">{p.line}</Tooltip><Popup><strong>Ônibus {p.prefix}</strong><p>Linha {p.line}</p><small>Posição às {new Date(p.observedAt).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo'})}</small></Popup></CircleMarker>)}
      <MapPosition campus={campus} origin={origin} routes={routes} target={target} reset={reset}/><MapTools campus={campus} origin={origin}/>
    </MapContainer>
    <div className="map-caption"><FiLayers /><span>{line ? `Traçado da linha ${line}` : origin?'Paradas perto de você':offline?'Paradas do campus · amostra':'Escolha sua origem para ver paradas'}</span><span className="map-legend"><i/>Campus <i/>Paradas</span></div>
    {(offline || tilesError) && <div className="map-warning">{offline?'Arquivo local: mapa-base disponível na versão online.':'Não foi possível carregar parte do mapa-base. Os dados de transporte continuam disponíveis.'}</div>}
  </section>;
}
