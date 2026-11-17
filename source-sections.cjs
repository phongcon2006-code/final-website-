// Focused VM tests and asset generators read named sections from the combined files.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
function markers(file){return ['/* === SECTION: '+file+' === */\n','/* === END SECTION: '+file+' === */'];}
function readSource(file){
 if(!file.endsWith('.js')&&!file.endsWith('.css'))return fs.readFileSync(path.join(root,file),'utf8');
 const source=fs.readFileSync(path.join(root,file.endsWith('.js')?'app.js':'styles.css'),'utf8');
 const [start,end]=markers(file),first=source.indexOf(start),last=source.indexOf(end,first);
 assert(first>=0&&last>first,'Missing bundled section: '+file);
 return source.slice(first+start.length,last);
}
function readRuntime(){return fs.readFileSync(path.join(root,'app.js'),'utf8').replace(/\nrender\(\);(?=\s*\/\* === END SECTION: app\.js === \*\/)/,'\n');}
function replaceSection(file,value){
 const target=path.join(root,file.endsWith('.js')?'app.js':'styles.css'),source=fs.readFileSync(target,'utf8');
 const [start,end]=markers(file),first=source.indexOf(start),last=source.indexOf(end,first);
 assert(first>=0&&last>first,'Missing bundled section: '+file);
 fs.writeFileSync(target,source.slice(0,first+start.length)+value.replace(/^\uFEFF/,'').trimEnd()+'\n;\n'+source.slice(last));
}
function assertEntry(html){
 assert.deepEqual([...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(m=>m[1]),['app.js']);
 assert.deepEqual([...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(m=>m[1]),['styles.css']);
 assert(html.includes('<script defer src="app.js"></script>'));
}
function assertOrder(files){
 const source=fs.readFileSync(path.join(root,files[0].endsWith('.css')?'styles.css':'app.js'),'utf8');
 let previous=-1;
 for(const file of files){const index=source.indexOf(markers(file)[0]);assert(index>previous,'Section order: '+file);previous=index;}
}
module.exports={root,readSource,readRuntime,replaceSection,assertEntry,assertOrder};
