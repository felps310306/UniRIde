import html from '../index.html';
import { handleApi } from '../server/semob.js';
export default {
  async fetch(request) {
    const api = await handleApi(request);
    if (api) return api;
    if (new URL(request.url).pathname !== '/' && new URL(request.url).pathname !== '/index.html') return new Response('Não encontrado',{status:404});
    return new Response(request.method === 'HEAD' ? null : html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});
  },
};
