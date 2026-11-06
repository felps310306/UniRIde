// Atualização manual do material de apresentação. Nunca inclui posições GPS.
import { writeFile } from 'node:fs/promises';
import { catalog, lineDetails, positions } from '../server/semob.js';
import { CAMPUSES } from '../src/config.js';
const catalogs = {}, lines = {};
for (const campus of CAMPUSES) {
  const start=Date.now();
  catalogs[campus.id]=await catalog(campus.id);
  console.log(JSON.stringify({campus:campus.id,lines:catalogs[campus.id].lines.length,stops:catalogs[campus.id].stops.length,ms:Date.now()-start}));
}
// Um exemplo real de cada área e a circular da UnB; demais linhas permanecem na consulta online.
const codes=[...new Set(['0.110',...Object.values(catalogs).map(c=>c.lines[0]?.code).filter(Boolean)])];
for(const code of codes){lines[code]=await lineDetails(code);console.log(JSON.stringify({code,routes:lines[code].routes.length,schedules:lines[code].schedules.length}));}
const live=await positions('0.110');
console.log(JSON.stringify({line:'0.110',recentPositions:live.positions.length,discarded:live.discarded,fetchedAt:live.fetchedAt}));
await writeFile(new URL('../src/snapshot.json',import.meta.url),JSON.stringify({catalogs,lines}));
