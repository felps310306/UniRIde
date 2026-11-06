// Entrada da hospedagem na Vercel: reaproveita o mesmo Worker do build (dist/server/index.js).
// O vercel.json reescreve /api/* para cá e informa o caminho original em __path.
import worker from '../dist/server/index.js';

async function handle(request) {
  const url = new URL(request.url);
  const path = url.searchParams.get('__path');
  if (path === null) return worker.fetch(request);
  url.searchParams.delete('__path');
  url.pathname = `/${path}`;
  const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer();
  return worker.fetch(new Request(url, { method: request.method, headers: request.headers, body }));
}

export const GET = handle;
export const HEAD = handle;
export const POST = handle;
