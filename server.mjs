import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'dist');
const port=Number(process.env.PORT)||4173;
const url=`http://127.0.0.1:${port}`;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json','.woff2':'font/woff2'};
function openBrowser(){if(process.argv.includes('--no-open'))return;if(process.platform==='win32')spawn('cmd.exe',['/c','start','',url],{windowsHide:true,stdio:'ignore'}).unref();else console.log(`Open ${url} in your browser.`);}
try{await stat(resolve(root,'index.html'));}catch{console.error('The local build is missing. Run npm install, then npm run build.');process.exit(1);}
const server=http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,url).pathname);
  if(pathname==='/health'){res.writeHead(200,{'Content-Type':'text/plain'});res.end('mach20-local');return;}
  const path=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!path.startsWith(root+sep)){res.writeHead(403);res.end('Forbidden');return;}
  const data=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':extname(path)==='.html'?'no-store':'public, max-age=3600','X-Content-Type-Options':'nosniff'});res.end(data);
 }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
});
server.on('error',async error=>{
 if(error.code==='EADDRINUSE'){
  try{if(await(await fetch(url+'/health')).text()==='mach20-local'){console.log(`Mach 20 is already running at ${url}`);openBrowser();return;}}catch{}
  console.error(`Port ${port} is in use by another application. Set PORT to an unused port and try again.`);
 }else console.error(error.message);process.exitCode=1;
});
server.listen(port,'127.0.0.1',()=>{console.log(`\nMach 20 — Class 3-E\n${url}\n\nKeep this window open while playing. Ctrl+C stops the local server.\nNo internet connection is needed.\n`);openBrowser();});
