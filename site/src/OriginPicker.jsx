import { useEffect, useRef, useState } from 'react';
import { FiCrosshair, FiMapPin, FiEdit2, FiX } from 'react-icons/fi';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import PainelLateral from './cco/components/PainelLateral/PainelLateral.jsx';
import { MAP_TILES } from './config.js';
import { validOrigin, locationError } from './origin.js';

function PickPoint({point,onPick}){
  const map=useMap();
  useMapEvents({click:event=>onPick({lat:event.latlng.lat,lng:event.latlng.lng})});
  useEffect(()=>{if(point)map.panTo([point.lat,point.lng],{animate:false});},[map,point?.lat,point?.lng]);
  useEffect(()=>{const observer=new ResizeObserver(()=>map.invalidateSize());observer.observe(map.getContainer());return()=>observer.disconnect();},[map]);
  return point?<CircleMarker center={[point.lat,point.lng]} radius={8} pathOptions={{color:'#fff',fillColor:'#333',fillOpacity:1,weight:3}}><Tooltip permanent>Sua origem</Tooltip></CircleMarker>:null;
}
export default function OriginPicker({origin,onChange,offline}){
  const [locating,setLocating]=useState(false),[error,setError]=useState(''),[open,setOpen]=useState(false),[lat,setLat]=useState(''),[lng,setLng]=useState('');
  const request=useRef(0);
  const changeRef=useRef(onChange);changeRef.current=onChange;
  useEffect(()=>()=>{request.current++;},[]);
  const point=lat.trim()&&lng.trim()?{lat:Number(lat),lng:Number(lng)}:null;
  const usable=validOrigin(point);
  const pick=p=>{setLat(p.lat.toFixed(6));setLng(p.lng.toFixed(6));};
  const cancel=()=>{request.current++;setLocating(false);};
  const locate=()=>{
    const id=++request.current;setError('');
    if(!navigator.geolocation||!window.isSecureContext){setError('Este navegador não oferece localização aqui. Use a versão HTTPS ou marque sua origem no mapa.');return;}
    setLocating(true);
    navigator.geolocation.getCurrentPosition(position=>{
      if(id!==request.current)return;
      setLocating(false);
      const p={lat:position.coords.latitude,lng:position.coords.longitude,accuracy:position.coords.accuracy,source:'device'};
      if(!validOrigin(p)){setError('Sua localização está fora da área atendida no Distrito Federal. Marque um ponto de partida no DF.');return;}
      changeRef.current(p);
    },failure=>{if(id===request.current){setLocating(false);setError(locationError(failure));}},{enableHighAccuracy:true,timeout:15000,maximumAge:0});
  };
  const openMap=()=>{cancel();setError('');setLat(origin?String(origin.lat):'');setLng(origin?String(origin.lng):'');setOpen(true);};
  return <>
    <section className="origin-picker" aria-label="Ponto de partida">
      <span className="field-label">De onde você sai?</span>
      {offline?<p className="origin-note">Arquivo de demonstração: a localização e as paradas perto de você estão na versão online.</p>:<>
        {origin?<div className="origin-current"><FiMapPin/><span><strong>{origin.source==='device'?'Minha localização':'Origem marcada no mapa'}</strong><small>{origin.lat.toFixed(5)}, {origin.lng.toFixed(5)}{origin.accuracy?` · precisão ±${Math.round(origin.accuracy)} m`:''}</small></span><button className="icon-btn" aria-label="Remover origem" onClick={()=>{cancel();setError('');onChange(null);}}><FiX/></button></div>:null}
        <div className="origin-actions"><button className="btn locate-button" title={origin?'Atualizar localização':'Usar minha localização'} disabled={locating} onClick={locate}><FiCrosshair/>{locating?'Localizando…':origin?'Atualizar localização':'Usar minha localização'}</button><button className="text-button" title={origin?'Alterar origem no mapa':'Marcar origem no mapa'} onClick={openMap}><FiEdit2/>{origin?'Alterar no mapa':'Marcar no mapa'}</button>{locating&&<button className="text-button" onClick={cancel}>Cancelar</button>}</div>
        {!origin&&<p className="origin-note">O navegador pedirá sua permissão. Você também pode escolher a origem no mapa.</p>}
        {origin?.accuracy>200&&<p className="origin-note" role="status">A localização está aproximada. Confira o ponto e ajuste no mapa para encontrar as paradas certas.</p>}
        {error&&<p className="field-error" role="alert">{error}</p>}
      </>}
    </section>
    <PainelLateral aberto={open} onFechar={()=>setOpen(false)} titulo="Marcar ponto de partida" icone={<FiMapPin/>} rodape={<div className="origin-actions"><button className="btn" onClick={()=>setOpen(false)}>Cancelar</button><button className="btn primary" disabled={!usable} onClick={()=>{onChange({...point,source:'manual'});setOpen(false);}}>Usar este ponto</button></div>}>
      <p className="origin-instructions">Toque no mapa onde você vai embarcar ou informe as coordenadas. Nenhum ponto é escolhido automaticamente.</p>
      <div className="origin-map"><MapContainer center={origin?[origin.lat,origin.lng]:[-15.7939,-47.8828]} zoom={origin?16:12} scrollWheelZoom={false}><TileLayer url={MAP_TILES} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'/><PickPoint point={usable?point:null} onPick={pick}/></MapContainer></div>
      <div className="coordinate-fields"><label className="field">Latitude<input type="number" step="any" value={lat} onChange={e=>setLat(e.target.value)} placeholder="Ex.: -15.794"/></label><label className="field">Longitude<input type="number" step="any" value={lng} onChange={e=>setLng(e.target.value)} placeholder="Ex.: -47.883"/></label></div>
      {point&&!usable&&<p className="field-error" role="alert">Escolha coordenadas válidas dentro da área atendida no DF.</p>}
      <p className="origin-note">A origem é enviada ao UniRide para consultar o entorno na SEMOB. Ela não é salva nos favoritos, no histórico de navegação nem no armazenamento do aplicativo.</p>
    </PainelLateral>
  </>;
}
