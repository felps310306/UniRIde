import { CAMPUS_RADIUS_METERS } from '../src/config.js';
import { distanceMeters, distanceToPath } from '../src/transport.js';
export function buildCampusCatalog(campus, routeFeatures, stopFeatures){
  const grouped=new Map();
  for(const feature of routeFeatures){
    const p=feature.properties||{},distance=distanceToPath([campus.lng,campus.lat],feature.geometry);
    if(!Number.isFinite(distance)||distance>CAMPUS_RADIUS_METERS||!/^\d{1,4}(\.\d{1,3})?$/.test(p.cd_linha||'')||p.situacao==='INATIVA')continue;
    const previous=grouped.get(p.cd_linha);
    if(previous){previous.distance=Math.min(previous.distance,Math.round(distance));if(!previous.directions.includes(p.lin_sentido))previous.directions.push(p.lin_sentido);}
    else grouped.set(p.cd_linha,{code:String(p.cd_linha),name:p.tx_linha||String(p.cd_linha),directions:[p.lin_sentido],distance:Math.round(distance)});
  }
  const uniqueStops=new Map();
  for(const feature of stopFeatures){
    if(feature.geometry?.type!=='Point'||feature.properties?.parada_ativa===false)continue;
    const coordinates=feature.geometry.coordinates;
    const id=feature.properties?.cod_parada_v2025??feature.properties?.id_ponto_parada_v2025;
    if(id==null||!Array.isArray(coordinates)||!coordinates.slice(0,2).every(Number.isFinite))continue;
    const distance=Math.round(distanceMeters([campus.lng,campus.lat],coordinates));
    if(!Number.isFinite(distance)||distance>CAMPUS_RADIUS_METERS)continue;
    const key=`${id}:${coordinates[0]},${coordinates[1]}`;
    if(!uniqueStops.has(key))uniqueStops.set(key,{key,id:String(id),address:feature.properties.endereco||'Endereço não informado',coordinates,distance});
  }
  const stops=[...uniqueStops.values()].sort((a,b)=>a.distance-b.distance);
  return {campusId:campus.id,radius:CAMPUS_RADIUS_METERS,lines:[...grouped.values()].sort((a,b)=>a.distance-b.distance||a.code.localeCompare(b.code,undefined,{numeric:true})),stops};
}
