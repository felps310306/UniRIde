export const NEARBY_RADIUS_METERS = 800;
export function validOrigin(value){
  return !!value && typeof value.lat==='number' && typeof value.lng==='number' && Number.isFinite(value.lat) && Number.isFinite(value.lng) && value.lat>=-16.2 && value.lat<=-15.3 && value.lng>=-48.4 && value.lng<=-47.2;
}
export function locationError(error){
  return ({1:'Localização não autorizada. Você pode liberar a permissão no navegador ou marcar sua origem no mapa.',2:'O aparelho não conseguiu determinar sua posição. Tente novamente ou marque sua origem no mapa.',3:'A localização demorou para responder. Tente novamente ou marque sua origem no mapa.'})[error?.code] || 'Não foi possível obter sua localização. Marque sua origem no mapa.';
}
