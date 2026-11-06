import test from 'node:test';
import assert from 'node:assert/strict';
import { distanceToPath, freshPositions, sourceTimestamp, scheduleForDate, todayBrasilia, isDate } from '../src/transport.js';
import { createSnapshotCache } from '../server/cache.js';
import { handleApi, wfs } from '../server/semob.js';

test('distância usa segmentos: não confunde envelope da linha com passagem perto do campus',()=>{
  const p=[-47.87,-15.76];
  assert.equal(distanceToPath(p,{type:'LineString',coordinates:[[-48,-15.76],[-47,-15.76]]}),0);
  assert.ok(distanceToPath(p,{type:'LineString',coordinates:[[-48,-16],[-48,-15],[-47,-15],[-47,-16]]})>10000);
  assert.equal(distanceToPath(p,{type:'MultiLineString',coordinates:[[[ -48,-15.76],[-47,-15.76]]]}),0);
});
test('usa datalocal de Brasília, ignora ingestão nova de GPS antigo, coordenadas inválidas e futuro',()=>{
  const now=Date.parse('2026-11-05T17:00:00Z');
  const f=(prefixo,datalocal,coordinates=[-47.88,-15.77])=>({geometry:{type:'Point',coordinates},properties:{id_operadora:1,prefixo,cd_linha:'0.110',datalocal,dataregistro:'2026-11-05T17:00:00Z'}});
  assert.equal(sourceTimestamp('2026-11-05 14:00:00'),now);
  assert.equal(sourceTimestamp('2026-11-05T17:00:00Z'),now);
  const result=freshPositions([f(1,'2026-11-05 13:59:00'),f(2,'2020-11-05 14:00:00'),f(3,'2026-11-05 14:00:00',[0,0]),f(4,'2026-11-05 14:01:00'),f(5,'2026-11-05 14:00:00',[]),f(1,'2026-11-05 13:59:50')],now);
  assert.equal(result.length,1);assert.equal(result[0].observedAt,'2026-11-05T16:59:50.000Z');
});
test('grade respeita dia da semana, sentido e vigência; não calcula ETA',()=>{
  const rows=[{time:'06:00',days:'SSSSSNN',direction:'I',validFrom:'2026-11-01',validUntil:'2026-11-30'},{time:'07:00',days:'NNNNNSN',direction:'I'},{time:'08:00',days:'NNNNNNS',direction:'V'}];
  assert.deepEqual(scheduleForDate(rows,'2026-11-05','I').map(x=>x.time),['06:00']);
  assert.deepEqual(scheduleForDate(rows,'2026-11-07').map(x=>x.time),['07:00']);
  assert.deepEqual(scheduleForDate(rows,'2026-11-08','V').map(x=>x.time),['08:00']);
  assert.deepEqual(scheduleForDate(rows,'2026-12-01'),[]);
  assert.deepEqual(scheduleForDate(rows,'2026-02-30'),[]);
  assert.equal(isDate('2026-99-99'),false);
  assert.equal(todayBrasilia(new Date('2026-11-06T01:00:00Z')),'2026-11-05');
});
test('cache compartilha carregamento, respeita validade e preserva último resultado apenas dentro do limite',async()=>{
  let time=0,calls=0;const cache=createSnapshotCache({now:()=>time});const load=async()=>{calls++;return 'ok'};const options={ttl:10,staleFor:30};
  const entries=await Promise.all([cache.get('a',load,options),cache.get('a',load,options)]);
  assert.equal(calls,1);assert.equal(entries[0].data,'ok');time=5;await cache.get('a',load,options);assert.equal(calls,1);
  time=15;assert.equal((await cache.get('a',()=>{throw Error('offline')},options)).stale,true);
  time=31;await assert.rejects(cache.get('a',()=>{throw Error('offline')},options));
  assert.equal((await cache.get('a',load,options)).stale,false);assert.equal(calls,2);
});
test('falha síncrona não prende chave do cache em promessa rejeitada',async()=>{
  const cache=createSnapshotCache();await assert.rejects(cache.get('x',()=>{throw Error('falha')}));
  assert.equal((await cache.get('x',()=>42)).data,42);
});
test('proxy rejeita injeção, campus desconhecido, caminhos e métodos não permitidos antes da rede',async()=>{
  for(const [path,status,method] of [['/api/line?code=0.110%27OR1=1',400],['/api/positions?code=https://example.com',400],['/api/catalog?campus=desconhecido',400],['/api/anything',404],['/api/catalog',405,'POST']]){
    const response=await handleApi(new Request('https://uniride.local'+path,{method:method||'GET'}));assert.equal(response.status,status);assert.ok((await response.json()).error);
  }
  assert.equal(await handleApi(new Request('https://uniride.local/')),null);
});
test('adaptador detecta indisponibilidade, resposta inválida e truncamento da SEMOB',async()=>{
  await assert.rejects(wfs('routes',{},async()=>new Response('offline',{status:503})),/indisponível/);
  await assert.rejects(wfs('routes',{},async()=>Response.json({type:'other'})),/não reconhecida/);
  await assert.rejects(wfs('routes',{},async()=>Response.json({type:'FeatureCollection',features:Array(2500).fill({})})),/limite/);
});
