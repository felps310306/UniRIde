import test from 'node:test';
import assert from 'node:assert/strict';
import { buildJourneyCatalog } from '../server/journey.js';
import { handleApi } from '../server/semob.js';
import { validOrigin, locationError } from '../src/origin.js';

test('origem define as paradas e exige a mesma variante perto do destino',()=>{
  const origin={lat:-15.79,lng:-47.88},campus={id:'campus',lat:-15.76,lng:-47.88};
  const line=(code,coordinates,direction='IDA')=>({properties:{cd_linha:code,lin_sentido:direction,tx_linha:code},geometry:{type:'LineString',coordinates}});
  const stop=(id,lat)=>({properties:{cod_parada_v2025:id},geometry:{type:'Point',coordinates:[-47.88,lat]}});
  const routes=[line('1',[[-47.88,-15.80],[-47.88,-15.75]]),line('2',[[-47.88,-15.762],[-47.88,-15.758]]),line('3',[[-47.88,-15.792],[-47.88,-15.788]]),line('3',[[-47.88,-15.762],[-47.88,-15.758]],'VOLTA')];
  const result=buildJourneyCatalog(campus,origin,routes,[stop('perto',-15.791),stop('mais-perto',-15.7901),stop('campus',-15.76),stop('perto',-15.791)]);
  assert.deepEqual(result.lines.map(l=>l.code),['1']);
  assert.deepEqual(result.stops.map(s=>s.id),['mais-perto','perto']);
  assert.equal(result.mode,'origin');assert.ok(result.stops.every(s=>s.distance<=800));
});
test('sem conexão direta preserva paradas próximas e não inventa baldeação',()=>{
  const result=buildJourneyCatalog({id:'campus',lat:-15.76,lng:-47.88},{lat:-15.79,lng:-47.88},[],[{properties:{cod_parada_v2025:1},geometry:{type:'Point',coordinates:[-47.88,-15.79]}}]);
  assert.deepEqual(result.lines,[]);assert.equal(result.stops.length,1);
});
test('API de origem valida método, formato, tamanho e localização antes da consulta',async()=>{
  const request=(body,headers={'Content-Type':'application/json'},method='POST')=>new Request('https://uniride.local/api/journey',{method,headers,...(body!=null?{body}:{})});
  const cases=[[request(null,{},'GET'),405],[request('{}',{}),415],[request('{'),400],[request('x'.repeat(1025)),413],[request(JSON.stringify({campus:'unb-darcy',origin:{lat:0,lng:0}})),400],[request(JSON.stringify({campus:'invalido',origin:{lat:-15.79,lng:-47.88}})),400],[request(JSON.stringify({campus:'unb-darcy',origin:{lat:'-15.79',lng:-47.88}})),400]];
  for(const [req,status]of cases){const response=await handleApi(req);assert.equal(response.status,status);assert.equal(response.headers.get('Cache-Control'),'no-store');}
});
test('localização distingue falhas e rejeita posição fora da cobertura',()=>{
  assert.ok(validOrigin({lat:-15.7939,lng:-47.8828}));assert.equal(validOrigin({lat:NaN,lng:-47.88}),false);assert.equal(validOrigin(null),false);assert.match(locationError({code:1}),/não autorizada/);assert.match(locationError({code:3}),/demorou/);
});
