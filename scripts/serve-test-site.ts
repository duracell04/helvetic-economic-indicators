// Test-only static file server. The application itself remains backend-free.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { resolveSiteConfig } from '../site.config.mjs';
const root=path.resolve(process.argv[2]),port=Number(process.argv[3]);
const { base } = resolveSiteConfig();
const types:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.csv':'text/csv'};
createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url!,'http://localhost').pathname);
    if(!pathname.startsWith(base)){res.writeHead(404);res.end();return;}
    let file=path.resolve(root,pathname.slice(base.length));
    if(file!==root&&!file.startsWith(root+path.sep))throw new Error('Invalid path');
    if((await stat(file)).isDirectory())file=path.join(file,'index.html');
    res.writeHead(200,{'Content-Type':types[path.extname(file)]??'application/octet-stream','Cache-Control':'no-store'});res.end(await readFile(file));
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Static test site listening on ${port}`));
