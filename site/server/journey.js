import { CAMPUS_RADIUS_METERS } from '../src/config.js';
import { NEARBY_RADIUS_METERS } from '../src/origin.js';
import { distanceToPath } from '../src/transport.js';
import { buildCampusCatalog } from './catalog.js';

// A mesma variante precisa passar pelas duas áreas. Não relaciona paradas a linhas
// nem deduz embarque, orientação do traçado ou baldeação sem dados oficiais.
export function buildJourneyCatalog(campus,origin,routeFeatures,stopFeatures){
  const nearby=buildCampusCatalog({id:'origin',...origin},[],stopFeatures);
  const matches=new Map();
  for(const feature of routeFeatures){
    const p=feature.properties||{},code=String(p.cd_linha||'');
    if(p.situacao==='INATIVA'||!/^\d{1,4}(\.\d{1,3})?$/.test(code))continue;
    const distance=distanceToPath([origin.lng,origin.lat],feature.geometry);
    const destinationDistance=distanceToPath([campus.lng,campus.lat],feature.geometry);
    if(!Number.isFinite(distance)||!Number.isFinite(destinationDistance)||distance>NEARBY_RADIUS_METERS||destinationDistance>CAMPUS_RADIUS_METERS)continue;
    const current=matches.get(code);
    if(current){
      if(!current.directions.includes(p.lin_sentido))current.directions.push(p.lin_sentido);
      if(distance<current.distance){current.distance=Math.round(distance);current.destinationDistance=Math.round(destinationDistance);}
    }else matches.set(code,{code,name:p.tx_linha||code,directions:[p.lin_sentido],distance:Math.round(distance),destinationDistance:Math.round(destinationDistance)});
  }
  return {campusId:campus.id,radius:NEARBY_RADIUS_METERS,mode:'origin',lines:[...matches.values()].sort((a,b)=>a.distance-b.distance||a.code.localeCompare(b.code,undefined,{numeric:true})),stops:nearby.stops};
}
