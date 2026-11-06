import { mkdir, readFile, writeFile, rm, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const [template, themeScript, favicon, notices] = await Promise.all([
  readFile(path.join(root, 'src/index.template.html'), 'utf8'),
  readFile(path.join(root, 'src/theme.js'), 'utf8'),
  readFile(path.join(root, 'favicon.svg'), 'utf8'),
  readFile(path.join(root, 'THIRD-PARTY-NOTICES.txt'), 'utf8'),
]);
const bundle = await build({absWorkingDir:root,entryPoints:['src/main.jsx'],bundle:true,write:false,outfile:'app.js',format:'esm',platform:'browser',target:'es2022',jsx:'automatic',charset:'utf8',minify:true,legalComments:'none',define:{'process.env.NODE_ENV':'"production"'},loader:{'.png':'dataurl','.svg':'dataurl','.woff2':'dataurl'}});
const inlineScript=source=>source.replace(/<\/script/gi,'<\\/script');
const js=bundle.outputFiles.find(f=>f.path.endsWith('.js')).text;
const css=bundle.outputFiles.find(f=>f.path.endsWith('.css')).text;
const html=template.replace('href="/favicon.svg"',`href="data:image/svg+xml,${encodeURIComponent(favicon)}"`)
  .replace('<!-- THEME -->',()=>`<script>${inlineScript(themeScript)}</script>`)
  .replace('<!-- STYLES -->',()=>`<!-- ${notices.replace(/--/g,'—')} --><style>${css}</style>`)
  .replace('<!-- APP -->',()=>`<script type="module">${inlineScript(js)}</script>`);
if(path.dirname(dist)!==root || path.basename(dist)!=='dist')throw new Error('Diretório de build fora do projeto.');
await rm(dist,{recursive:true,force:true});
await mkdir(path.join(dist,'server'),{recursive:true});
await mkdir(path.join(dist,'.openai'),{recursive:true});
await writeFile(path.join(root,'index.html'),html);
await writeFile(path.join(root,'..','APRESENTAR-UNIRIDE.html'),html);
await build({absWorkingDir:root,entryPoints:['worker/index.js'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'neutral',target:'es2022',charset:'utf8',minify:true,legalComments:'none',loader:{'.html':'text'}});
await copyFile(path.join(root,'.openai/hosting.json'),path.join(dist,'.openai/hosting.json'));
console.log(`Build pronto: HTML de apresentação (${Math.round(Buffer.byteLength(html)/1024)} KB) e Worker com API.`);
