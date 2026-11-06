import { useEffect, useState } from 'react';
import snapshot from './snapshot.json';
export const offline = location.protocol === 'file:';
export async function apiGet(path, signal, body=null) {
  if (offline) {
    const url = new URL(path,'https://offline.local');
    if (url.pathname === '/api/positions') return { positions:[],offline:true };
    const data = url.pathname === '/api/catalog' ? snapshot.catalogs[url.searchParams.get('campus')] : snapshot.lines[url.searchParams.get('code')];
    if (!data) throw new Error('Esta linha precisa de internet. Abra a versão online para consultar os dados.');
    return {...data,...(url.pathname==='/api/catalog'?{lines:data.lines.filter(l=>snapshot.lines[l.code])}:{}),offline:true,stale:true};
  }
  let response;
  try{response=await fetch(path,{signal,method:body?'POST':'GET',headers:{Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});}
  catch(error){if(error.name==='AbortError')throw error;throw new Error('Não conseguimos acessar o serviço. Verifique sua conexão e tente novamente.');}
  let data;
  try { data = await response.json(); } catch { throw new Error('O serviço não respondeu como esperado. Tente novamente.'); }
  if (!response.ok) throw new Error(data.error || 'Não foi possível consultar os dados.');
  return data;
}
export function useRemote(url, refresh = 0, body = null) {
  const bodyKey=body?JSON.stringify(body):'';
  const path=url?url+bodyKey:null;
  const [state, setState] = useState({path,data:null,loading:!!path,error:''});
  const [retry, setRetry] = useState(0);
  useEffect(()=>{
    if (!path) { setState({path,data:null,loading:false,error:''}); return; }
    let disposed = false, controller;
    setState(previous=>previous.path===path?{...previous,loading:true,error:''}:{path,data:null,loading:true,error:''});
    const run = async () => {
      if (disposed || controller) return;
      controller = new AbortController();
      const timeout = setTimeout(()=>controller?.abort(),30000);
      try { const data=await apiGet(url,controller.signal,bodyKey?JSON.parse(bodyKey):null); if(!disposed)setState({path,data,loading:false,error:''}); }
      catch(error){ if(!disposed)setState(s=>({...s,loading:false,error:error.name==='AbortError'?'A consulta demorou mais que o esperado. Tente novamente.':error.message})); }
      finally { clearTimeout(timeout); controller=null; }
    };
    run();
    const timer = refresh && !offline ? setInterval(()=>{if(!document.hidden)run();},refresh) : null;
    const onVisible = ()=>{if(refresh && !document.hidden)run();};
    const onOnline = ()=>run();
    document.addEventListener('visibilitychange',onVisible);
    if(!offline)window.addEventListener('online',onOnline);
    return ()=>{disposed=true;controller?.abort();clearInterval(timer);document.removeEventListener('visibilitychange',onVisible);window.removeEventListener('online',onOnline);};
  },[path,refresh,retry]);
  return {...(state.path===path?state:{data:null,loading:!!path,error:''}),retry:()=>setRetry(v=>v+1)};
}
