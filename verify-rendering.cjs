const {root:projectRoot,readSource}=require('./source-sections.cjs');

const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const {createCanvas,loadImage}=require('../.qa/canvas/node_modules/@napi-rs/canvas');
let checks=0;const check=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
function harness(){
 const display=createCanvas(1200,800),reference=createCanvas(1200,800),frames=new Map(),downloads=[],status={textContent:''};let frameId=0;
 const document={body:{dataset:{page:'workshop'}},createElement:tag=>tag==='canvas'?createCanvas(1,1):{click(){downloads.push(this.href);}},querySelector:s=>s==='#drawing-canvas'?display:s==='#drawing-status'?status:null};
 const c={console,document,reference,URLSearchParams,downloads,localStorage:{setItem(){}},safeGet:(_,fallback)=>fallback,save:()=>true,memoryState:{},t:s=>s,toast(){},clearTimeout(){},setTimeout:()=>1,
  $:s=>document.querySelector(s),requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId;},cancelAnimationFrame:id=>frames.delete(id),addEventListener(){},removeEventListener(){}};
 c.window=c;vm.createContext(c);for(const file of ['free-draw.js','drawing-runtime.js'])vm.runInContext(readSource(file),c);
 const run=code=>vm.runInContext(code,c);run('initializeDrawing()');
 return {c,run,display,reference,frames,downloads,pixels:canvas=>Buffer.from(canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data),compare(){run('paintDrawingCanvas(reference,drawingDraft,activeStroke);repaintDrawing()');assert(this.pixels(display).equals(this.pixels(reference)),'Cached and baseline RGBA differ');}};
}
const sample=(tool,color,size=18)=>({tool,color,size,points:[[180,180,.15],[220,210,.4],[250,180,1],[300,260,.65],[320,210,.2]]});
check('cached previews and commits match original pixels for pen, pressure brush and eraser',()=>{
 const h=harness();for(const stroke of [sample('ink','#b74732'),sample('brush','#58734d',38),sample('brush','#d5a24b',28),sample('eraser','#292620',14),{tool:'brush',color:'#485b70',size:25,points:[[250,230,.5]]}]){
  h.c.stroke=stroke;h.run('activeStroke=stroke');h.compare();h.run('finishDrawingStroke()');h.compare();
 }
 assert.equal(h.run('drawingDraft.strokes.length'),5);
});
check('Undo, Redo, Clear and a restored artwork rebuild identical pixels',()=>{
 const h=harness();h.c.strokes=[sample('ink','#b74732'),sample('brush','#58734d',38),sample('eraser','#292620',14)];
 h.run('for(const stroke of strokes){activeStroke=stroke;finishDrawingStroke()}');h.compare();h.run('drawingUndo()');h.compare();h.run('drawingRedo()');h.compare();
 h.run('rememberDrawing();drawingDraft.strokes=[];repaintDrawing()');h.compare();assert(h.pixels(h.display).every(v=>v===0));h.run('drawingUndo()');h.compare();
 h.run("drawingDraft=cleanDrawing({title:'Restored',paper:'#f0e8ff',strokes:strokes.slice(0,2)})");h.compare();
});
check('pending frames cannot repaint a new workspace after disposal',()=>{
 const h=harness();h.run('scheduleDrawingPaint()');const late=[...h.frames.values()][0];h.run('disposeDrawingRuntime()');assert.equal(h.frames.size,0);
 h.run('paintCachedDrawing=()=>{throw Error("stale repaint")};scheduleDrawingPaint()');late();assert.notEqual(h.run('drawFrame'),0);
});
check('500 and 2500 completed strokes do not increase active-frame stroke replay',()=>{
 for(const count of [500,2500]){
  const h=harness();h.c.strokes=Array.from({length:count},(_,i)=>({tool:i%11===0?'brush':'ink',color:i%2?'#b74732':'#58734d',size:3,points:Array.from({length:100},(_,j)=>[20+(j*7+i)%1140,20+(i*13+j)%740,.5])}));
  h.run('drawingDraft.strokes=strokes;repaintDrawing();let replayed=0;const originalStrokeRenderer=strokeToContext;strokeToContext=(ctx,s)=>{replayed++;originalStrokeRenderer(ctx,s)}');
  h.c.pending=sample('brush','#d5a24b');h.run('activeStroke=pending;for(let i=0;i<5;i++)repaintDrawing()');assert.equal(h.run('replayed'),5);
  h.compare();h.run('replayed=0;finishDrawingStroke()');assert.equal(h.run('replayed'),1);console.log(`  ${count} strokes / ${count*100} saved points: 1 current-stroke replay per frame`);
 }
});
check('PNG export remains pixel-equivalent to the original vector replay',()=>{
 const h=harness();h.c.strokes=[sample('ink','#b74732'),sample('brush','#58734d',38),sample('eraser','#292620',14)];h.run("drawingDraft={title:'My study',name:'Maker',paper:'#fff0dc',strokes};repaintDrawing();downloadDrawing(drawingDraft)");
 assert(h.downloads[0].startsWith('data:image/png;base64,'));

 h.run('drawingRaster.getContext("2d").clearRect(0,0,1200,800);downloadDrawing(drawingDraft)');assert.equal(h.downloads[0],h.downloads[1]);
});
(async()=>{
 for(const r of JSON.parse(fs.readFileSync(path.join(projectRoot,'assets/shop-references/sources.json'),'utf8'))){
  const full=await loadImage(path.join(projectRoot,'assets/shop-references',r.images.full.file));const thumb=await loadImage(path.join(projectRoot,'assets/shop-references',r.images.thumb.file));
  assert.equal(full.width,r.images.full.width);assert.equal(full.height,r.images.full.height);assert.equal(thumb.width,r.images.thumb.width);assert.equal(thumb.height,r.images.thumb.height);assert(r.images.thumb.bytes<60000);
 }
 checks++;console.log('PASS all six local photographs and thumbnails decode with reserved dimensions');
 console.log(`\n${checks} rendering and image checks passed using Skia. Browser timing, layout and native interaction remain unverified.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
