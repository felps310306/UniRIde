import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { handleApi } from '../server/semob.js';
const port = Number(process.env.PORT || 4173);
createServer(async(req,res)=>{
 try {
  let body;
  if(!['GET','HEAD'].includes(req.method)){
    const chunks=[];let size=0;
    for await(const chunk of req){size+=chunk.length;if(size>1024){res.writeHead(413);res.end('Consulta muito grande.');return;}chunks.push(chunk);}
    body=Buffer.concat(chunks);
  }
  const request = new Request('http://127.0.0.1:'+port+req.url,{method:req.method,headers:req.headers,...(body?{body}:{})});
  let result=await handleApi(request);
  if(!result){
    if(!['/','/index.html'].includes(new URL(request.url).pathname)){res.writeHead(404);res.end('Não encontrado');return;}
    result=new Response(await readFile(new URL('../index.html',import.meta.url)),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'}});
  }
  res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
 } catch {res.writeHead(500);res.end('Não foi possível responder.');}
}).listen(port,'127.0.0.1',()=>console.log('UniRide Campus: http://127.0.0.1:'+port));
