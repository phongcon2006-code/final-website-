const {readSource,readRuntime,assertEntry,assertOrder}=require('./source-sections.cjs');

const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const read=file=>readSource(file);
let checks=0;
async function check(name,fn){await fn();checks++;console.log('PASS '+name);}
function element(){
 const attrs=new Map(),classes=new Set(),events=new Map();
 return {attrs,dataset:{},style:{setProperty(k,v){this[k]=v;}},textContent:'',innerHTML:'',isConnected:true,disabled:false,width:900,height:600,
  classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle(k,v){if(v===undefined)v=!classes.has(k);v?classes.add(k):classes.delete(k);return v;}},
  setAttribute:(k,v)=>attrs.set(k,String(v)),getAttribute:k=>attrs.get(k),removeAttribute:k=>attrs.delete(k),hasAttribute:k=>attrs.has(k),
  addEventListener(name,fn){if(!events.has(name))events.set(name,new Set());events.get(name).add(fn);},removeEventListener(name,fn){events.get(name)?.delete(fn);},
  emit(name,event={}){event.target??=this;event.preventDefault??=()=>event.prevented=true;for(const fn of events.get(name)||[])fn(event);},events,
  focus(){this.focused=true;},getBoundingClientRect(){return this.rect||{top:200,left:20,width:600,height:400};},closest:()=>null,
  setPointerCapture(){},contains(){return false;},click(){this.clicked=true;},toDataURL:()=> 'data:image/png;base64,test'};
}
function harness({defer=false,saved=[],hash='',blocked=false}={}){
 const nodes=new Map(),images=[],paints=[],downloads=[],storage=new Map(saved),resizes=[],media=element();media.matches=true;
 const get=s=>{if(!nodes.has(s))nodes.set(s,element());return nodes.get(s);};
 const doc=element();doc.body=element();doc.body.dataset.page='workshop';doc.documentElement=element();
 const moves=['left','up','down','right'].map(dir=>{const e=element();e.dataset.move=dir;return e;});
 doc.querySelector=get;doc.querySelectorAll=s=>s==='[data-move],#align'?[...moves,get('#align')]:s==='[data-move]'?moves:[];
 doc.createElement=tag=>{const e=element();if(tag==='canvas')e.getContext=()=>({fillRect(){},drawImage(image){paints.push(image);},fillText(){}});else if(tag==='a')e.click=()=>downloads.push(e);return e;};
 get('#print-canvas').getContext=()=>({clearRect(){},drawImage(image){paints.push(image);}});
 get('.site-header').rect={height:108,top:0};
 const c={console,URLSearchParams,Map,document:doc,location:{hash,pathname:'/WorkshopPage.html',protocol:'file:'},
  localStorage:{getItem:key=>{if(blocked)throw Error('Blocked');return storage.get(key)||null;},setItem:(k,v)=>{if(blocked)throw Error('Blocked');storage.set(k,v);}},
  setTimeout:()=>1,clearTimeout(){},matchMedia:()=>media,scrollBy:options=>c.scrolls.push(options),scrolls:[],
  Image:class{constructor(){images.push(this);}decode(){if(!defer)return Promise.resolve();return new Promise((resolve,reject)=>{this.resolve=resolve;this.reject=reject;});}},
  ResizeObserver:class{constructor(fn){this.fn=fn;this.active=false;resizes.push(this);}observe(){this.active=true;}disconnect(){this.active=false;}},
  ...{addEventListener:doc.addEventListener.bind(doc),removeEventListener:doc.removeEventListener.bind(doc)}};
 c.window=c;vm.createContext(c);
 vm.runInContext(readRuntime(),c);
 vm.runInContext('render=()=>{};toast=()=>{};',c);
 return {c,get,nodes,doc,media,moves,storage,images,paints,downloads,resizes,run:code=>vm.runInContext(code,c)};
}
async function main(){
 await check('header text size prefers saved settings over stale links and supports storage fallback',()=>{
  for(const entry of [
   {saved:'true',url:false,want:true},{saved:'false',url:true,want:false},
   {url:true,want:true},{url:false,want:false},{want:false},
   {saved:'invalid',url:true,want:true},{saved:'"true"',want:false},
   {saved:'false',url:true,blocked:true,want:true},{blocked:true,want:false}
  ]){
   const h=harness({saved:entry.saved===undefined?[]:[['dongho-large',entry.saved]],hash:'#studio='+encodeURIComponent(JSON.stringify({large:entry.url})),blocked:entry.blocked});
   assert.equal(h.run("safeGet('dongho-large',false)"),entry.want);
   for(const page of ['home','history','explore','workshop','exhibition']){
    h.c.pageName=page;h.run('page=pageName;syncTextSize()');
    assert.equal(h.doc.documentElement.style['--font'],entry.want?'18px':'16px');
    assert(h.run('header()').includes(`aria-pressed="${entry.want}">A<span`));
   }
  }
 });
 await check('open pages and browser Back synchronize Aa without rerendering the page',()=>{
  const h=harness();h.run('render=()=>{throw Error("Unexpected rerender")};page="home"');
  h.storage.set('dongho-large','true');h.doc.emit('storage',{key:'dongho-large'});
  assert.equal(h.doc.documentElement.style['--font'],'18px');
  assert.equal(h.get('#text-size').getAttribute('aria-pressed'),'true');
  h.storage.set('dongho-large','false');h.doc.emit('pageshow',{persisted:true});
  assert.equal(h.doc.documentElement.style['--font'],'16px');
  assert.equal(h.get('#text-size').getAttribute('aria-pressed'),'false');
 });
 await check('all five pages share identical header markup and style resources',()=>{
  const h=harness();let baseline;
  for(const page of ['home','history','explore','workshop','exhibition']){
   const html=h.run(`page='${page}';header()`),normalized=html.replace('class="active" aria-current="page"','');
   baseline??=normalized;assert.equal(normalized,baseline);assert.equal((html.match(/aria-current="page"/g)||[]).length,1);assert(html.includes('aria-controls="site-navigation"'));
  }
  for(const file of ['HomePage','index','HistoryPage','ExplorePage','WorkshopPage','ExhibitionPage']){
   const html=read(file+'.html');assertEntry(html);assertOrder(['print-layers.js','print-workshop.js','site-shell.js','app.js']);
   assert(html.includes('content="#f7f1e5"'));assertOrder(['storybook.css','site-theme.css']);
  }
  assert(!/body\[data-page="home"\].*\.(?:nav-wrap|brand|tools|menu)\b/.test(read('home-refinement.css')));
 });
 await check('shared text tokens and primary actions meet 4.5:1 contrast',()=>{
  const css=read('site-theme.css'),token=name=>css.match(new RegExp('--'+name+':(#[a-f0-9]{6})'))[1];
  const lum=hex=>{const values=hex.match(/[a-f0-9]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return values[0]*.2126+values[1]*.7152+values[2]*.0722;};
  const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
  for(const fg of ['ink','muted'])for(const bg of ['paper','surface','surface-tint'])assert(ratio(token(fg),token(bg))>=4.5,fg+'/'+bg);
  assert(ratio('#a83e2b',token('white'))>=4.5);
 });
 await check('header measurement updates sticky offsets after resize and Aa rerenders',()=>{
  const h=harness();h.c.SiteShell.mount();assert.equal(h.doc.documentElement.style['--site-header-height'],'108px');
  h.get('.site-header').rect.height=132;h.resizes[0].fn();assert.equal(h.doc.documentElement.style['--site-header-height'],'132px');
  h.c.SiteShell.mount();assert.equal(h.resizes.filter(r=>r.active).length,1);assert.equal(h.doc.events.get('focusin').size,1);
  h.c.SiteShell.destroy();assert.equal(h.resizes.filter(r=>r.active).length,0);assert.equal(h.doc.events.get('focusin').size,0);
 });
 await check('mobile menu closes on Escape, restores focus, and resets at desktop size',()=>{
  const h=harness();h.c.SiteShell.mount();h.get('#menu').onclick();assert.equal(h.get('#menu').getAttribute('aria-expanded'),'true');
  h.get('.site-header').emit('keydown',{key:'Escape'});assert(!h.get('#site-navigation').classList.contains('open'));assert(h.get('#menu').focused);
  h.get('#menu').onclick();h.media.matches=false;h.media.emit('change');assert.equal(h.get('#menu').getAttribute('aria-expanded'),'false');
 });
 await check('focused page content is revealed below the header without disturbing dialogs',()=>{
  const h=harness();h.c.SiteShell.mount();const field=element();field.rect={top:20,height:44};h.doc.emit('focusin',{target:field});assert.equal(h.c.scrolls[0].top,-104);
  field.closest=()=>({});h.doc.emit('focusin',{target:field});assert.equal(h.c.scrolls.length,1);
 });
 await check('all paintings start with paper only and release fills in their assigned stages',()=>{
  const h=harness();
  for(const [key,source] of Object.entries(h.c.ART_DATA))for(let stage=0;stage<5;stage++){
   const svg=h.c.PrintLayers.svgForStage(source,stage);let active=0;
   for(const tag of svg.match(/<(?:path|circle|ellipse|rect|line|polyline|polygon)\b[^>]*>/g)||[]){
    for(const kind of ['fill','stroke']){
     const assigned=tag.match(new RegExp(`data-print-${kind}="(\\d)"`));if(!assigned)continue;
     const color=tag.match(new RegExp(`\\s${kind}="([^"]+)"`))[1];
     if(Number(assigned[1])>stage)assert.equal(color,'none',`${key} stage ${stage}: future ${kind}`);
     else{assert.notEqual(color,'none');active++;}
    }
   }
   assert.equal(active===0,stage===0,key+'/'+stage);
   assert(svg.includes('fill="#ecddba"'));assert(svg.includes('id="grain"'));
  }
 });
 await check('pale pig bodies wait for ochre and contours wait for black, including nested figures',()=>{
  const h=harness(),source=h.c.ART_DATA.pigs;
  assert(!h.c.PrintLayers.svgForStage(source,0).includes('fill="#e5c99b"'));
  assert(!h.c.PrintLayers.svgForStage(source,2).includes('fill="#e5c99b"'));
  assert(h.c.PrintLayers.svgForStage(source,3).includes('fill="#e5c99b"'));
  assert(!(h.c.PrintLayers.svgForStage(source,4).match(/<(?:path|circle)\b[^>]*>/g)||[]).some(tag=>tag.includes('stroke="#292620"')));
 });
 await check('the fifth stage preserves original SVG artwork exactly for every painting',()=>{
  const h=harness();for(const [key,source] of Object.entries(h.c.ART_DATA)){assert.equal(h.c.PrintLayers.svgForStage(source,5),source);assert.equal(source,read('assets/'+key+'.svg'));}
  assert.throws(()=>h.c.PrintLayers.svgForStage(h.c.ART_DATA.mouse,6),/0 through 5/);
 });
 await check('alignment controls share the print panel, and both guides share the paper wrapper',()=>{
  const h=harness();h.run("studio.stage=3;studio.layers=0;studio.block=0;studio.offsetX=14;studio.offsetY=-10;");const html=h.run('printWorkspace()');
  assert(html.indexOf('class="print-controls"')<html.indexOf('id="align"'));assert(html.indexOf('id="align"')<html.indexOf('id="press"'));
  assert(/id="press"[^>]*disabled/.test(html));assert(html.includes('registration-target'));assert(html.includes('registration-surface'));
  const css=read('site-theme.css');assert(css.includes('.registration-target{position:absolute;inset:0;'));assert(css.includes('.alignment-block{inset:0;'));
 });
 await check('align, arrows and drag consistently update print readiness at the 4px boundary',()=>{
  const h=harness();h.run('studio.stage=3;studio.layers=0;studio.block=0;studio.offsetX=14;studio.offsetY=-10;bindStudio();');assert(h.get('#press').disabled);
  h.get('#align').onclick();assert(!h.get('#press').disabled);assert.equal(h.run('studio.offsetX'),0);
  h.run("move('right');move('right');");assert(!h.get('#press').disabled);h.run("move('right');");assert(h.get('#press').disabled);
  h.get('#align').onclick();h.get('#printing-table').onpointerdown({clientX:100,clientY:100,pointerId:1});h.get('#printing-table').onpointermove({clientX:106,clientY:100});assert(h.get('#press').disabled);assert.equal(h.run('studio.offsetX'),6);h.get('#printing-table').onpointerup();
 });
 await check('wrong order and repeated presses cannot advance; all paintings undo and reprint',async()=>{
  const h=harness();
  for(const art of ['mouse','pigs','chickens']){
   h.run(`studio.art='${art}';studio.stage=3;studio.layers=0;studio.block=2;studio.offsetX=0;studio.offsetY=0;studio.mode='independent';press();`);assert.equal(h.run('studio.layers'),0);
   for(let i=0;i<5;i++){await h.run(`studio.block=${i};studio.offsetX=0;studio.offsetY=0;var pendingPress=press();press();pendingPress;`);assert.equal(h.run('studio.layers'),i+1);}
   h.run('bindStudio()');h.get('#undo').onclick();assert.equal(h.run('studio.layers'),4);assert.equal(h.run('studio.block'),4);
   h.get('#align').onclick();await h.run('press()');assert.equal(h.run('studio.layers'),5);
  }
 });
 await check('switching to guided mode selects the correct next block without losing layers',()=>{
  const h=harness();h.run("studio.stage=3;studio.layers=2;studio.block=4;studio.mode='independent';bindStudio();");h.get('#mode').onchange({target:{value:'guided'}});assert.equal(h.run('studio.block'),2);assert.equal(h.run('studio.layers'),2);
 });
 await check('restored progress survives and malformed numeric controls are normalized',()=>{
  const work={stage:3,art:'pigs',layers:3,block:3,mode:'guided',offsetX:0,offsetY:0};const h=harness({saved:[['dongho-studio',JSON.stringify(work)]]});assert.equal(h.run('studio.layers'),3);assert.equal(h.run('studio.art'),'pigs');assert(h.run('printReadiness().ready'));
  const bad=harness({saved:[['dongho-studio',JSON.stringify({...work,block:99,offsetX:'bad',offsetY:100})]]});assert.equal(bad.run('studio.block'),3);assert.equal(bad.run('studio.offsetX'),0);assert.equal(bad.run('studio.offsetY'),45);
 });
 await check('late async previews cannot overwrite a newer stage or changed artwork',async()=>{
  const h=harness({defer:true});h.run('studio.layers=0;');const first=h.run('drawPrint(0)');h.run('studio.layers=1;');const second=h.run('drawPrint(1)');
  h.images[1].resolve();await second;h.images[0].resolve();await first;assert.deepEqual(h.paints,[h.images[1]]);
  h.run('studio.layers=2;');const oldArt=h.run('drawPrint(2)');h.run("studio.art='pigs';studio.layers=0;");const newArt=h.run('drawPrint(0)');h.images[3].resolve();await newArt;h.images[2].resolve();await oldArt;assert.deepEqual(h.paints,[h.images[1],h.images[3]]);
 });
 await check('preview failure reports recovery and can retry without losing progress',async()=>{
  const h=harness({defer:true});h.run('studio.layers=2;');const failed=h.run('drawPrint(2)');h.images[0].reject(Error('decode failed'));await failed;assert.match(h.get('#print-feedback').textContent,/progress is saved/);assert.equal(h.run('studio.layers'),2);
  const retry=h.run('drawPrint(2)');h.images[1].resolve();await retry;assert.equal(h.paints.length,1);
 });
 await check('PNG export still uses the complete original artwork and preserves the artist name',async()=>{
  const h=harness();await h.run("download('pigs','Maker')");assert.equal(h.downloads.length,1);assert.equal(h.downloads[0].download,'Dong-Ho-pigs.png');assert.equal(decodeURIComponent(h.images[0].src.split(',')[1]),h.c.ART_DATA.pigs);
 });
 console.log(`\n${checks} shared-header and printing checks passed. Real browser geometry and pixels still require visual QA.`);
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});

module.exports={harness};
