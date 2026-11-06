import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPUSES, CAMPUS_RADIUS_METERS } from '../src/config.js';
import { buildCampusCatalog } from '../server/catalog.js';
import { readRoute, routeHash } from '../src/navigation.js';
import { handleApi } from '../server/semob.js';
import { parseFavorites, favoritesForCampus } from '../src/favorites.js';

test('favoritos antigos são preservados e só aparecem em campi compatíveis',()=>{
  const old=parseFavorites(null,JSON.stringify([{code:'0.110',name:'UnB'}]));
  assert.equal(old.length,1);assert.equal(old[0].campusId,null);
  assert.equal(favoritesForCampus(old,'unb-darcy',[{code:'0.110'}]).length,1);
  assert.equal(favoritesForCampus(old,'ucb-taguatinga',[{code:'0.415'}]).length,0);
  assert.deepEqual(parseFavorites('[]',JSON.stringify(old)),[]);
  assert.deepEqual(parseFavorites('{corrompido',null),[]);
});

test('catálogo universitário exclui trajetos e paradas distantes e linhas inativas',()=>{
  const campus={id:'teste',lat:-15.76,lng:-47.87};
  const line=(code,lat,status='ATIVA')=>({properties:{cd_linha:code,tx_linha:'Campus',lin_sentido:'IDA',situacao:status},geometry:{type:'LineString',coordinates:[[-47.88,lat],[-47.86,lat]]}});
  const stop=(id,lat,active=true)=>({properties:{cod_parada_v2025:id,parada_ativa:active},geometry:{type:'Point',coordinates:[-47.87,lat]}});
  const result=buildCampusCatalog(campus,[line('1',-15.76),line('2',-15.78),line('3',-15.7605,'INATIVA'),line('1',-15.761)],[stop(1,-15.7601),stop(2,-15.78),stop(3,-15.7601,false)]);
  assert.equal(result.radius,CAMPUS_RADIUS_METERS);assert.deepEqual(result.lines.map(l=>l.code),['1']);assert.deepEqual(result.stops.map(s=>s.id),['1']);
});
test('paradas repetidas são removidas sem fundir locais distintos com o mesmo código',()=>{
  const campus={id:'teste',lat:-15.76,lng:-47.87};
  const stop=lat=>({properties:{cod_parada_v2025:'10'},geometry:{type:'Point',coordinates:[-47.87,lat]}});
  const result=buildCampusCatalog(campus,[],[stop(-15.7601),stop(-15.7601),stop(-15.7602)]);
  assert.equal(result.stops.length,2);assert.equal(new Set(result.stops.map(s=>s.key)).size,2);
});
test('navegação preserva campus e linha na URL e recupera parâmetros inválidos',()=>{
  const route={page:'favoritos',campusId:CAMPUSES[0].id,line:'0.110'};
  assert.deepEqual(readRoute(routeHash(route)),route);
  assert.deepEqual(readRoute('#desconhecido?campus=invalido&linha=%27OR1'),{page:'mapa',campusId:CAMPUSES[0].id,line:null});
});
test('API exige campus mesmo para uma linha válida',async()=>{
  for(const path of ['/api/line?code=0.110','/api/positions?code=0.110&campus=invalido']){
    const response=await handleApi(new Request('https://uniride.local'+path));assert.equal(response.status,400);
  }
});
test('campi têm identificador único, referência pública e coordenadas plausíveis do DF',()=>{
  assert.equal(new Set(CAMPUSES.map(c=>c.id)).size,CAMPUSES.length);
  for(const campus of CAMPUSES){assert.ok(campus.lat< -15.3&&campus.lat> -16.2);assert.ok(campus.lng< -47.2&&campus.lng> -48.4);assert.ok(campus.source.startsWith('https://'));assert.ok(campus.institution&&campus.name&&campus.address);}
});
