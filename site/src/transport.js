export function distanceMeters(a, b) {
  const lat = (a[1] + b[1]) * Math.PI / 360;
  return Math.hypot((a[0] - b[0]) * Math.cos(lat) * 111320, (a[1] - b[1]) * 110540);
}
export function paths(geometry) {
  return geometry?.type === 'LineString' ? [geometry.coordinates] : geometry?.type === 'MultiLineString' ? geometry.coordinates : [];
}
export function distanceToPath(point, geometry) {
  let closest = Infinity;
  const scaleX = Math.cos(point[1] * Math.PI / 180) * 111320;
  for (const path of paths(geometry)) {
    for (let i = 1; i < path.length; i++) {
      const a = [(path[i-1][0] - point[0]) * scaleX, (path[i-1][1] - point[1]) * 110540];
      const b = [(path[i][0] - point[0]) * scaleX, (path[i][1] - point[1]) * 110540];
      const dx = b[0]-a[0], dy = b[1]-a[1], length = dx*dx+dy*dy;
      const t = length ? Math.max(0, Math.min(1, -(a[0]*dx+a[1]*dy)/length)) : 0;
      closest = Math.min(closest, Math.hypot(a[0]+t*dx, a[1]+t*dy));
    }
  }
  return closest;
}
export function sourceTimestamp(value) {
  if (!value || typeof value !== 'string') return NaN;
  const text = value.trim().replace(' ', 'T');
  return Date.parse(/[zZ]$|[+-]\d\d:?\d\d$/.test(text) ? text : `${text}-03:00`);
}
export function freshPositions(features, now = Date.now(), maxAge = 120000) {
  const seen = new Set();
  return [...features].sort((a,b)=>sourceTimestamp(b.properties?.datalocal)-sourceTimestamp(a.properties?.datalocal)).filter(f => {
    const p = f.properties || {}, c = f.geometry?.coordinates;
    const stamp = sourceTimestamp(p.datalocal);
    const age = now - stamp;
    const key = `${p.id_operadora}:${p.prefixo}`;
    if (f.geometry?.type !== 'Point' || !Array.isArray(c) || !Number.isFinite(c[0]) || !Number.isFinite(c[1]) || c[0] < -48.4 || c[0] > -47.2 || c[1] < -16.2 || c[1] > -15.4 || p.prefixo == null || !Number.isFinite(age) || age < -30000 || age > maxAge || seen.has(key)) return false;
    seen.add(key); return true;
  }).map(f => ({ id: `${f.properties.id_operadora}:${f.properties.prefixo}`, prefix: String(f.properties.prefixo), line: String(f.properties.cd_linha), coordinates: f.geometry.coordinates, observedAt: new Date(sourceTimestamp(f.properties.datalocal)).toISOString() }));
}
export function isDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10) === value;
}
export function todayBrasilia(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit' }).format(now);
}
export function scheduleForDate(rows, date, direction = '') {
  if (!isDate(date)) return [];
  const weekday = (new Date(`${date}T12:00:00Z`).getUTCDay()+6)%7;
  return rows.filter(row => row.days?.[weekday] === 'S' && (!direction || row.direction === direction) && (!row.validFrom || date >= row.validFrom.slice(0,10)) && (!row.validUntil || date <= row.validUntil.slice(0,10))).sort((a,b) => a.time.localeCompare(b.time));
}
export const directionLabel = value => ({ I:'Ida', V:'Volta', C:'Circular', IDA:'Ida', VOLTA:'Volta', CIRCULAR:'Circular' }[value] || value || 'Sentido não informado');
export const normalizeSearch = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
