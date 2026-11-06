import { CAMPUSES } from './config.js';
export function parseFavorites(current,legacy){
  try{
    const old=current==null;
    const data=JSON.parse((old?legacy:current)||'[]');
    if(!Array.isArray(data))return [];
    return data.filter(x=>x&&/^\d{1,4}(\.\d{1,3})?$/.test(x.code)&&typeof x.name==='string'&&(old||x.campusId===null||CAMPUSES.some(c=>c.id===x.campusId))).map(x=>({code:x.code,name:x.name,campusId:old?null:x.campusId}));
  }catch{return [];}
}
export function favoritesForCampus(values,campusId,lines){
  const codes=new Set(lines.map(l=>l.code));
  return values.filter(f=>f.campusId===campusId||(f.campusId===null&&codes.has(f.code)));
}
