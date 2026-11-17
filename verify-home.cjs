const {root:projectRoot,readSource,assertEntry,assertOrder}=require('./source-sections.cjs');

const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const read=name=>readSource(name);
let checks=0;const check=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
function node(dataset={}){
 const attrs=new Map(),classes=new Set();
 return {dataset,attrs,style:{setProperty(k,v){this[k]=v;}},textContent:'',onclick:null,
  classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle(k,v){if(v===undefined)v=!classes.has(k);v?classes.add(k):classes.delete(k);return v;}},
  setAttribute:(k,v)=>attrs.set(k,String(v)),removeAttribute:k=>attrs.delete(k),getAttribute:k=>attrs.get(k),
  scrollIntoView(options){this.scrolled=options;},focus(){this.focused=true;},getBoundingClientRect:()=>({left:0,top:0,width:100,height:100})};
}
function media(matches){const listeners=new Set();return {matches,listeners,addEventListener:(_e,fn)=>listeners.add(fn),removeEventListener:(_e,fn)=>listeners.delete(fn),change(value){this.matches=value;for(const fn of [...listeners])fn();}};}
function harness({wide=true,observer=true,reduced=false}={}){
 const root=node(),svg=node(),art=node(),label=node(),scene=node(),motion=node(),body=node();
 const buttons=Array.from({length:4},(_,i)=>node({printStage:String(i)}));
 const steps=Array.from({length:4},(_,i)=>node({printStep:String(i)}));
 const wideMedia=media(wide),reduceMedia=media(reduced),fineMedia=media(true),observers=[],frames=new Map(),saved=new Map();
 root.querySelector=s=>s==='.print-story-art svg'?svg:s==='.print-story-art'?art:s==='.print-stage-label'?label:steps[Number(s.match(/print-step-(\d)/)?.[1])];
 root.querySelectorAll=s=>s==='[data-print-stage]'?buttons:s==='[data-print-step]'?steps:[];
 const query=s=>s==='#print-story'?root:s==='#motion-toggle'?motion:s==='.gateway-features'?scene:null;
 const c={console,document:{body,querySelector:query},location:{hash:''},URLSearchParams,
  matchMedia:q=>q.includes('min-width')?wideMedia:q.includes('reduced-motion')?reduceMedia:fineMedia,
  requestAnimationFrame:fn=>{const id=frames.size+1;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),
  $:query,$$:()=>[],safeGet:(key,fallback)=>saved.has(key)?saved.get(key):fallback,save:(key,value)=>saved.set(key,value),gatewayNavigation:null,
  resetGatewayTransition(){c.gatewayNavigation=null;},openGatewayFeature(){},village:'',assigned:[]};
 c.location.assign=url=>c.assigned.push(url);c.window=c;
 if(observer)c.IntersectionObserver=class{constructor(fn){this.fn=fn;this.targets=[];this.disconnected=false;observers.push(this);}observe(target){this.targets.push(target);}disconnect(){this.disconnected=true;this.targets=[];}};
 vm.createContext(c);vm.runInContext(read('home-print-story.js'),c);vm.runInContext(read('modern-home.js'),c);
 return {c,root,svg,art,label,scene,motion,body,buttons,steps,wideMedia,reduceMedia,observers,frames,saved,run:s=>vm.runInContext(s,c)};
}
check('four readable stages, accurate credits and complete reference image render offline',()=>{
 const h=harness(),html=h.c.HomePrintStory.html();
 assert.equal((html.match(/data-print-stage=/g)||[]).length,4);assert.equal((html.match(/data-print-step=/g)||[]).length,4);
 for(const phrase of ['The paper','The first impression','Color builds','The defining line','Daderot','CC0','not a historical block set'])assert(html.includes(phrase));
 for(const match of html.matchAll(/src="([^"]+)"/g)){assert(!match[1].startsWith('http'));assert(fs.existsSync(path.join(projectRoot,match[1])));}
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 const home=h.run('home()');assert(home.includes('assets/mouse-wedding-detail.jpg'));assert(home.indexOf('print-story')<home.indexOf('gateway-note'));
});
check('final contour groups contain only black marks and no concealed pigment fills',()=>{
 const html=harness().c.HomePrintStory.html(),groups=[...html.matchAll(/<g class="print-layer print-black"([\s\S]*?)<\/svg>/g)];
 assert.equal(groups.length,5);
 for(const group of groups)for(const color of group[1].matchAll(/(?:fill|stroke)="([^"]+)"/g))assert(['none','#292620'].includes(color[1]),color[1]);
});
check('scroll observation selects the matching stage without moving focus or scrolling',()=>{
 const h=harness();h.c.HomePrintStory.mount();assert(h.root.classList.contains('story-interactive'));
 h.observers[0].fn([{target:h.steps[2],isIntersecting:true,intersectionRatio:.7}]);
 assert.equal(h.root.dataset.stage,'2');assert.equal(h.buttons[2].getAttribute('aria-current'),'step');assert.equal(h.svg.getAttribute('class'),'print-study stage-2');assert.equal(h.steps[2].scrolled,undefined);assert.equal(h.buttons[2].focused,undefined);
});
check('manual stage selection updates illustration, caption and passage destination',()=>{
 const h=harness();h.c.HomePrintStory.mount();h.buttons[3].onclick();
 assert.equal(h.root.dataset.stage,'3');assert.equal(h.label.textContent,'04 / The defining line');assert.equal(h.steps[3].scrolled.behavior,'instant');assert(h.steps[3].focused);assert.equal(h.buttons[0].getAttribute('aria-current'),undefined);
});
check('mobile and missing-observer fallbacks expose static stages and keyboard destinations',()=>{
 for(const opts of [{wide:false},{observer:false}]){const h=harness(opts);h.c.HomePrintStory.mount();assert(h.root.classList.contains('story-static'));h.buttons[1].onclick();assert(h.steps[1].focused);assert.equal(h.observers.length,0);}
});
check('pause and viewport changes disconnect observers and restore static presentation',()=>{
 const h=harness();h.c.HomePrintStory.mount();h.c.HomePrintStory.setMotion(true);assert(h.observers[0].disconnected);assert(h.root.classList.contains('story-static'));
 h.c.HomePrintStory.setMotion(false);assert(h.root.classList.contains('story-interactive'));h.wideMedia.change(false);assert(h.root.classList.contains('story-static'));assert(h.observers.at(-1).disconnected);
});
check('rerender cleanup removes old observers, media subscriptions and handlers',()=>{
 const h=harness();h.run('bindModernHome()');h.run('bindModernHome()');
 assert.equal(h.reduceMedia.listeners.size,1);assert.equal(h.wideMedia.listeners.size,1);assert(h.observers.slice(0,-1).every(o=>o.disconnected));
 h.run('disposeModernHome()');assert.equal(h.reduceMedia.listeners.size,0);assert.equal(h.wideMedia.listeners.size,0);assert(h.observers.every(o=>o.disconnected));assert(h.buttons.every(b=>b.onclick===null));assert.equal(h.scene.onpointermove,null);
});
check('device reduced motion cancels pending frames and makes the story static',()=>{
 const h=harness();h.run('bindModernHome()');h.scene.onpointermove({clientX:90,clientY:90});assert.equal(h.frames.size,1);
 h.reduceMedia.change(true);assert.equal(h.frames.size,0);assert(h.body.classList.contains('motion-paused'));assert(h.root.classList.contains('story-static'));
});
check('motion runs by default despite an old pause preference and follows device changes',()=>{
 const h=harness();h.saved.set('dongho-motion-paused',true);h.run('bindModernHome()');
 assert(!h.run('home()').includes('motion-toggle'));assert(!h.body.classList.contains('motion-paused'));assert(!h.root.classList.contains('story-static'));
 h.reduceMedia.change(true);assert(h.body.classList.contains('motion-paused'));
 h.reduceMedia.change(false);assert(!h.body.classList.contains('motion-paused'));assert(!h.root.classList.contains('story-static'));
});
check('a motion change completes pending navigation once without leaving an overlay',()=>{
 const h=harness();h.run('bindModernHome()');h.c.gatewayNavigation={destination:'HistoryPage.html#studio=example'};h.reduceMedia.change(true);assert.equal(h.c.gatewayNavigation,null);assert.deepEqual(h.c.assigned,['HistoryPage.html#studio=example']);h.reduceMedia.change(true);assert.equal(h.c.assigned.length,1);
});
check('homepage palette meets text and focus contrast targets',()=>{
 const luminance=hex=>{const c=hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
 const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 for(const fg of ['#292620','#62584d','#746858'])assert(ratio(fg,'#f7f1e5')>=4.5,fg);
 assert(ratio('#485b70','#f7f1e5')>=3);assert(ratio('#fffaf0','#292620')>=4.5);
});
check('both generated home entries load enhancements after shared styles and before app startup',()=>{
 assert.equal(read('HomePage.html'),read('index.html'));
 for(const file of ['HomePage.html','index.html','HistoryPage.html','ExplorePage.html','WorkshopPage.html','ExhibitionPage.html'])assertEntry(read(file));assertOrder(['storybook.css','home-refinement.css','site-theme.css']);assertOrder(['home-print-story.js','modern-home.js','app.js']);

});
console.log(`\n${checks} homepage checks passed. Browser layout, real touch and screen-reader checks remain manual.`);
