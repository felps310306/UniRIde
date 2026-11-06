import { CAMPUSES } from './config.js';
export const CAMPUS_KEY='uniride:campus:v1';
export function readRoute(hash, fallback=CAMPUSES[0].id){
  const [requested,search='']=hash.replace(/^#/,'').split('?');
  const params=new URLSearchParams(search);
  const candidate=params.get('campus')||fallback;
  const campusId=CAMPUSES.some(c=>c.id===candidate)?candidate:CAMPUSES[0].id;
  const line=params.get('linha');
  return {page:['mapa','linhas','favoritos'].includes(requested)?requested:'mapa',campusId,line:/^\d{1,4}(\.\d{1,3})?$/.test(line||'')?line:null};
}
export function routeHash(route){
  const params=new URLSearchParams({campus:route.campusId});
  if(route.line)params.set('linha',route.line);
  return `#${route.page}?${params}`;
}
export function savedCampus(){try{return localStorage.getItem(CAMPUS_KEY)||CAMPUSES[0].id;}catch{return CAMPUSES[0].id;}}
