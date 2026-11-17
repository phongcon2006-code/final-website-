const {root:projectRoot,readSource,readRuntime,assertEntry,assertOrder}=require('./source-sections.cjs');

const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {harness:guideHarness}=require('./verify-storybook.cjs');
const read=file=>readSource(file);
let checks=0;function check(name,fn){fn();checks++;console.log('PASS '+name);}
function actionHarness({blocked=false}={}){
 const nodes=new Map(),stored=new Map(),observers=[],paint=[],downloads=[],timers=new Map(),writes=[];let focused=null,nextTimer=1;
 function node(){const listeners=new Map(),attrs=new Map(),classes=new Set();return {
  listeners,attrs,clientWidth:640,clientHeight:480,isConnected:true,open:false,value:'',textContent:'',dataset:{},firstElementChild:{textContent:''},rect:{top:620,height:100,width:800,bottom:720,left:0},
  style:{setProperty(k,v){this[k]=v;},removeProperty(k){delete this[k];}},
  classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle(k,on){if(on===undefined)on=!classes.has(k);on?classes.add(k):classes.delete(k);return on;}},
  setAttribute:(k,v)=>attrs.set(k,String(v)),getAttribute:k=>attrs.get(k),toggleAttribute(k,on){on?attrs.set(k,''):attrs.delete(k);},
  addEventListener(k,fn){if(!listeners.has(k))listeners.set(k,new Set());listeners.get(k).add(fn);},removeEventListener(k,fn){listeners.get(k)?.delete(fn);},
  emit(k,e={}){e.target??=this;e.currentTarget??=this;e.preventDefault??=()=>e.prevented=true;this['on'+k]?.(e);for(const f of listeners.get(k)||[])f(e);return e;},
  focus(){focused=this;},contains:()=>false,closest:()=>null,getBoundingClientRect(){return this.rect;},showModal(){this.open=true;},close(){this.open=false;this.emit('close');},
  escape(){const event=this.emit('cancel');if(!event.prevented)this.close();},getContext:()=>ctx,setPointerCapture(){},toDataURL:()=> 'data:image/png;base64,test',
  click(){downloads.push(this.download);}
 };}
 const ctx={save(){},restore(){},clearRect(){},beginPath(){},arc(){},moveTo(){},lineTo(){},stroke(){},fill(){},fillRect(){},drawImage(){},fillText(text){paint.push(text);}};
 const get=s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);};
 const doc=node();doc.body=node();doc.body.dataset.page='workshop';doc.documentElement=node();doc.querySelector=get;doc.querySelectorAll=()=>[];doc.createElement=node;
 const win=node();const c={console,document:doc,URLSearchParams,location:{hash:'',protocol:'file:'},
  localStorage:{getItem:k=>{if(blocked)throw Error('blocked');return stored.get(k)||null;},setItem:(k,v)=>{if(blocked)throw Error('blocked');writes.push(k);stored.set(k,v);}},
  setTimeout:(fn,delay)=>{const id=nextTimer++;timers.set(id,{fn,delay});return id;},clearTimeout:id=>timers.delete(id),requestAnimationFrame:()=>1,scrolls:[],scrollBy:options=>c.scrolls.push(options),addEventListener:win.addEventListener.bind(win),removeEventListener:win.removeEventListener.bind(win),
  ResizeObserver:class{constructor(fn){this.fn=fn;this.active=false;observers.push(this);}observe(){this.active=true;}disconnect(){this.active=false;}}
 };c.window=c;vm.createContext(c);
 vm.runInContext(readRuntime(),c);
 const run=code=>vm.runInContext(code,c);run('initializeDrawing();bindDrawing();bindDrawingActions();updateDrawingControls()');
 // Only count writes caused by the action under test, after language/setup persistence.
 writes.length=0;
 return {c,run,get,doc,win,observers,stored,paint,downloads,writes,timers,advance(ms){for(const [id,t]of [...timers])if(t.delay<=ms){timers.delete(id);t.fn();}},focused:()=>focused};
}
module.exports={actionHarness};
if(require.main===module){
check('new visitors start with two documented museum references and three choices',()=>{
 const h=guideHarness({page:'workshop'});h.guide();assert.equal(h.run('getDrawingGuide().collection'),'tradition');
 assert.equal(h.c.document.querySelectorAll('[data-guide-example]').length,2);assert.equal(h.c.document.querySelectorAll('[data-guide-collection]').length,3);
 const html=h.run('renderDrawingGuide()');assert(html.includes('Begin with a'));assert(!html.includes('How are you'));
 h.click('guide-collection-free');assert.equal(h.c.document.querySelectorAll('[data-guide-mood]').length,6);h.click('guide-collection-own');assert.equal(h.run('getDrawingGuide().exampleId'),'own');
});
check('each museum lesson has five distinct illustrated stages with title-only photo captions',()=>{
 const h=guideHarness({page:'workshop'});h.guide();
 for(const r of h.run('TRADITIONAL_DRAWING_REFERENCES')){h.c.id=r.id;h.run('chooseInspirationExample(id)');assert.equal(r.steps.length,5);const stages=new Set();
  for(let step=0;step<5;step++){h.c.step=step;const html=h.run('getDrawingGuide().step=step;renderDrawingGuide()');const svg=h.run('guideSketch()');stages.add(svg);assert(html.includes(r.image));assert(!html.includes(r.source));assert(html.includes('<strong>'+r.title+'</strong>'));assert(!html.includes('Photograph: Daderot'));assert(html.includes('Simplified drawing study'));assert(svg.includes('role="img"'));assert(!svg.includes('<image'));assert(html.includes(r.steps[step].body));}
  assert.equal(stages.size,5);assert(h.run('guideSketch()').includes('data-study-part="details"'));
 }
});
check('traditional references and brush presets preserve drawings, paper and undo history',()=>{
 const h=guideHarness({page:'workshop'});h.run("initializeDrawing();drawingDraft={title:'Study',name:'Maker',paper:'#f0e8ff',strokes:[{tool:'ink',color:'#df8aa6',size:8,points:[[10,10,1]]}]};drawUndo=[[]];drawRedo=[drawingDraft.strokes];originalDrawing=cleanDrawing(drawingDraft)");h.guide();
 const snapshot=()=>h.run('JSON.stringify({drawingDraft,originalDrawing,drawUndo,drawRedo})'),before=snapshot();
 h.c.applyPresets=[];h.run('applyDrawingPreset=preset=>applyPresets.push(preset)');
 h.mount('<p id="drawing-status"></p>','status');
 for(const id of ['study-mouse-wedding','study-rooster-hen','garden-bird','own']){h.c.id=id;h.run('chooseInspirationExample(id)');for(let step=0;step<4;step++)h.click('guide-next');h.click('guide-preset');assert.equal(snapshot(),before);}
 assert.equal(h.c.applyPresets.length,4);
});
check('old and new guide preferences restore their selection, step and visibility',()=>{
 for(const exampleId of ['garden-bird','study-mouse-wedding','study-rooster-hen','own']){const h=guideHarness({guide:{version:2,exampleId,step:3,collapsed:true,pickerOpen:false}});const g=h.run('getDrawingGuide()');assert.equal(g.exampleId,exampleId==='garden-bird'?'ga-dai-cat':exampleId);assert.equal(g.step,exampleId==='garden-bird'?0:3);assert(g.collapsed);assert.equal(g.collection,exampleId.startsWith('study-')?'tradition':exampleId==='own'?'own':'free');}
 const h=guideHarness({guide:{version:3,exampleId:'study-mouse-wedding',collection:'free',pickerOpen:true,step:2}});assert.equal(h.run('getDrawingGuide().collection'),'free');assert.equal(h.run('getDrawingGuide().step'),2);
});
check('museum lessons retain speech and written instructions without changing the canvas',()=>{
 const h=guideHarness({page:'workshop'});h.guide();h.click('guide-idea-study-rooster-hen');h.click('guide-listen');assert(h.spoken.at(-1).text.includes('tall rooster'));h.click('guide-next');assert(!h.run('narrating'));h.click('guide-listen');assert(h.spoken.at(-1).text.includes(h.run('drawingLesson().body')));
});
check('metadata dialog focuses its title, ignores repeated open and returns focus on Done/Escape',()=>{
 const h=actionHarness(),name=h.get('#drawing-name'),dialog=h.get('#drawing-metadata');name.emit('click');assert(dialog.open);assert.equal(h.focused(),h.get('#drawing-title'));
 name.emit('click');h.get('#drawing-metadata-done').emit('click');assert(!dialog.open);assert.equal(h.focused(),name);
 name.emit('click');dialog.escape();assert(!dialog.open);assert.equal(h.focused(),name);
 const guideButton=h.get('#guide-next');h.c.opener=guideButton;h.run('openDrawingMetadata(opener)');dialog.escape();assert.equal(h.focused(),guideButton);
});
check('traditional brush setup changes only the selected tool and leaves saved artwork untouched',()=>{
 const h=actionHarness();h.run("beginDrawingStroke([25,30,1]);finishDrawingStroke();drawingDraft.paper='#f0e8ff'");const before=h.run('JSON.stringify({drawingDraft,drawUndo,drawRedo})');
 for(const id of ['study-mouse-wedding','study-rooster-hen']){h.c.id=id;h.run('applyDrawingPreset(traditionalReference(id).steps[3])');assert.equal(h.run('drawingTool'),'brush');assert.equal(h.run('drawingColor'),id==='study-mouse-wedding'?'#b74732':'#d5a24b');assert.equal(h.run('JSON.stringify({drawingDraft,drawUndo,drawRedo})'),before);}
});
check('naming commits pending strokes and title edits reach the bar, PNG and gallery',()=>{
 const h=actionHarness();h.run("beginDrawingStroke([25,30,1])");h.get('#drawing-name').emit('click');assert.equal(h.run('drawingDraft.strokes.length'),1);assert.equal(h.run('activeStroke'),null);
 h.get('#drawing-title').emit('input',{target:{value:'My rooster'}});h.get('#drawing-artist').emit('input',{target:{value:'Maker'}});assert.equal(h.get('#drawing-current-title').textContent,'My rooster');
 h.get('#draw-download').emit('click');assert(h.paint.includes('My rooster'));assert(h.paint.some(text=>text.includes('Maker')));assert(h.downloads.length===1);
 const link=h.get('#draw-exhibit');link.emit('click');const params=new URLSearchParams(link.getAttribute('href').split('#')[1]),drawing=JSON.parse(params.get('drawing'));assert.equal(drawing.title,'My rooster');assert.equal(drawing.name,'Maker');assert.equal(drawing.strokes.length,1);
 assert.equal(JSON.parse(h.stored.get('dongho-drawing-draft')).title,'My rooster');
});
check('empty drawings cannot exhibit and undo/reprint-style editing refreshes export readiness',()=>{
 const h=actionHarness(),download=h.get('#draw-download'),link=h.get('#draw-exhibit');assert(download.disabled);assert.equal(link.getAttribute('aria-disabled'),'true');assert(link.emit('click').prevented);
 h.run('beginDrawingStroke([10,20,1]);finishDrawingStroke()');assert(!download.disabled);h.run('drawingUndo()');assert(download.disabled);h.run('drawingRedo()');assert(!download.disabled);h.get('#draw-clear').emit('click');assert(download.disabled);assert(link.emit('click').prevented);
 h.get('#drawing-title').emit('input',{target:{value:'   '}});assert.equal(h.get('#drawing-current-title').textContent,'Untitled artwork');
});
check('blocked storage retains metadata and state-bearing gallery export',()=>{
 const h=actionHarness({blocked:true});h.run('beginDrawingStroke([10,20,1]);finishDrawingStroke()');h.get('#drawing-title').emit('input',{target:{value:'Session study'}});h.run('flushDrawingMetadata()');assert(h.get('#drawing-status').textContent.includes('session'));
 const link=h.get('#draw-exhibit');link.emit('click');assert.equal(JSON.parse(new URLSearchParams(link.getAttribute('href').split('#')[1]).get('drawing')).title,'Session study');h.get('#draw-download').emit('click');assert(h.downloads.length===1);
});
check('measured dock clearance updates on resize and cleanup removes observers/listeners',()=>{
 const h=actionHarness(),root=h.doc.documentElement;assert.equal(root.style['--create-actions-height'],'100px');assert(root.classList.contains('has-drawing-actions'));
 h.get('#drawing-actions').rect.height=160;h.observers[0].fn();assert.equal(root.style['--create-actions-height'],'160px');
 h.run('bindDrawingActions()');assert.equal(h.observers.filter(o=>o.active).length,1);assert.equal(h.get('#drawing-name').listeners.get('click').size,1);assert.equal(h.win.listeners.get('resize').size,1);
 h.get('#drawing-name').emit('click');h.run('disposeDrawingActions();disposeDrawingActions()');assert(!h.get('#drawing-metadata').open);assert.equal(h.observers.filter(o=>o.active).length,0);assert.equal(h.win.listeners.get('resize').size,0);assert.equal(h.get('#drawing-name').listeners.get('click').size,0);assert(!root.classList.contains('has-drawing-actions'));assert.equal(root.style['--create-actions-height'],undefined);
});
check('shared shell reveals focused content above the dock without scrolling dock controls',()=>{
 const h=actionHarness();h.get('.site-header').rect={height:108,top:0};h.run('SiteShell.mount()');
 const target=h.get('#below-dock');target.rect={top:600,bottom:640,height:40};h.doc.emit('focusin',{target});assert.equal(h.c.scrolls.at(-1).top,36);
 h.get('#drawing-actions').contains=e=>e===h.get('#drawing-name');const count=h.c.scrolls.length;h.doc.emit('focusin',{target:h.get('#drawing-name')});assert.equal(h.c.scrolls.length,count);h.run('SiteShell.destroy()');
});
check('generated entries retain new modules in order and all references are local JPEGs',()=>{
 for(const file of ['HomePage','HistoryPage','ExplorePage','WorkshopPage','ExhibitionPage','index'])assertEntry(read(file+'.html'));assertOrder(['drawing-tradition.js','create-actions.js','drawing-guide.js','app.js']);
 for(const file of ['mouse-wedding-museum.jpg','rooster-hen-museum.jpg']){const data=fs.readFileSync(path.join(projectRoot,'assets',file));assert(data.length>10000&&data.length<650000);assert.equal(data.readUInt16BE(0),0xffd8);}
 const css=read('create-refinement.css');assert(css.includes('object-fit:contain'));assert(css.includes('env(safe-area-inset-bottom)'));assert(css.includes('scroll-padding-bottom'));assert(css.includes('100dvh'));
});
check('title dialog markup is unique, escaped and keyboard help precedes the canvas',()=>{
 const h=actionHarness();h.run("drawingDraft.title='<script>x</script>'");const html=h.run('workshop()');assert(html.includes('&lt;script&gt;'));assert(!html.includes('<script>x'));
 for(const id of ['drawing-title','drawing-artist','draw-download','draw-exhibit','drawing-metadata'])assert.equal(html.split('id="'+id+'"').length-1,1);
 assert(html.indexOf('draw-keyboard-help')<html.indexOf('<canvas'));assert(html.includes('maxlength="70"'));assert(html.includes('maxlength="50"'));assert(!read('drawing-guide.js').includes('scrollIntoView'));
});
console.log(`\n${checks} Create refinement checks passed. Native dialog, mobile keyboard and rendered layout remain browser acceptance items.`);

}
