const {root:projectRoot,readSource,assertEntry,assertOrder}=require('./source-sections.cjs');

const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {harness}=require('./verify-storybook.cjs');
const {actionHarness}=require('./verify-create.cjs');
let checks=0;function check(name,fn){fn();checks++;console.log('PASS '+name);}
check('all 18 old IDs migrate by mood position without changing the drawing',()=>{
 const groups={joyful:['garden-bird','blooming-garden','dancing-fish'],calm:['sleeping-cat','lotus-pond','moonlit-river'],sad:['rainy-window','branch-bird','sheltered-seedling'],energetic:['sunrise-rooster','leaping-carp','swirling-dragon'],reflective:['banyan-tree','moon-boat','field-path'],unsure:['single-leaf','little-pig','abstract-garden']};
 let total=0;for(const [mood,ids]of Object.entries(groups))for(let i=0;i<3;i++){
  const h=harness({page:'workshop',guide:{version:3,exampleId:ids[i],moodId:mood,step:4,collapsed:true,pickerOpen:false}});h.run("initializeDrawing();drawingDraft.title='My existing art';drawingDraft.paper='#f0e8ff';drawUndo=[[]];drawRedo=[[]]");
  const before=h.run('JSON.stringify({drawingDraft,drawUndo,drawRedo})');const g=h.run('getDrawingGuide()');assert.equal(g.exampleId,h.run('PHOTO_MOOD_IDS')[mood][i]);assert.equal(g.step,0);assert(g.collapsed);assert.equal(g.collection,'free');assert.equal(g.moodId,mood);assert.equal(h.run('JSON.stringify({drawingDraft,drawUndo,drawRedo})'),before);total++;
 }assert.equal(total,18);
});
check('updated references and existing museum lessons retain progress on reload',()=>{
 for(const id of ['ga-dai-cat','dan-lon-am-duong','chan-trau-thoi-sao','vinh-hoa','phu-quy','dam-cuoi-chuot','study-mouse-wedding','study-rooster-hen','own']){
  const h=harness({guide:{version:4,exampleId:id,step:3,collapsed:false,pickerOpen:false,moodId:'reflective'}});assert.equal(h.run('getDrawingGuide().exampleId'),id);assert.equal(h.run('getDrawingGuide().step'),3);
 }
});
check('pickers load thumbnails only; selected photographs use title-only captions',()=>{
 const h=harness({page:'workshop'});h.guide();let html=h.run('renderDrawingGuide()');assert(html.includes('mouse-wedding-thumb.jpg'));assert(!html.includes('mouse-wedding-museum.jpg'));
 h.click('guide-collection-free');for(const mood of h.run('INSPIRATION_MOODS')){h.c.id=mood.id;h.run('chooseInspirationMood(id)');html=h.run('renderDrawingGuide()');assert(!html.includes('-full.jpg'));assert.equal((html.match(/loading="lazy"/g)||[]).length,3);assert(!/<img\b[^>]*\bsrc="assets\/[^"]+\.svg"/i.test(html));}
 h.run("chooseInspirationExample('phu-quy')");html=h.run('renderDrawingGuide()');assert(html.includes('phu-quy-full.jpg'));assert(!html.includes('ga-dai-cat-full.jpg'));assert(html.includes('Enlarge reference'));assert(!html.includes('Used with permission'));assert(!html.includes('Source &amp; image credit'));assert(!html.includes('CC0'));assert(!html.includes('Museum of Fine Arts'));
});
check('viewer opens at Fit, zooms within limits, resets scroll and restores focus',()=>{
 const h=actionHarness(),opener=h.get('#enlarge-reference');h.c.opener=opener;h.run("bindReferenceViewer();openReferenceViewer('ga-dai-cat',opener)");
 const dialog=h.get('#reference-viewer');assert(dialog.open);assert.equal(h.focused(),h.get('#reference-close'));assert.equal(h.get('#reference-image').src,'assets/ga-dai-cat-full.jpg');assert.equal(h.get('#reference-viewer-title').textContent,h.run("drawingPhotoReference('ga-dai-cat').title"));assert(!h.run('referenceViewerMarkup()').includes('reference-source'));
 assert.equal(h.get('#reference-zoom').textContent,'100%');assert(h.get('#reference-out').disabled);const fitWidth=parseFloat(h.get('#reference-image').style.width);
 h.get('#reference-in').emit('click');assert.equal(h.get('#reference-zoom').textContent,'150%');assert(parseFloat(h.get('#reference-image').style.width)>fitWidth);
 for(let i=0;i<12;i++)h.get('#reference-in').emit('click');assert.equal(dialog.referenceZoom,4);assert(h.get('#reference-in').disabled);
 h.get('#reference-viewport').scrollTop=100;h.get('#reference-fit').emit('click');assert.equal(dialog.referenceZoom,1);assert.equal(h.get('#reference-viewport').scrollTop,0);
 dialog.escape();assert(!dialog.open);assert.equal(h.focused(),opener);
});
check('viewer supports museum references and image errors without changing artwork',()=>{
 const h=actionHarness();h.run("beginDrawingStroke([10,20,1]);finishDrawingStroke();bindReferenceViewer()");const before=h.run('JSON.stringify(drawingDraft)');
 h.run("openReferenceViewer('study-mouse-wedding')");assert.equal(h.get('#reference-viewer-title').textContent,h.run("drawingPhotoReference('study-mouse-wedding').title"));h.get('#reference-image').emit('error');assert(h.get('#reference-image-status').textContent.includes('could not load'));h.get('#reference-close').emit('click');
 h.run("openReferenceViewer('vinh-hoa')");assert.equal(h.get('#reference-viewer-title').textContent,h.run("drawingPhotoReference('vinh-hoa').title"));assert.equal(h.get('#reference-image-status').textContent,'');assert.equal(h.run('JSON.stringify(drawingDraft)'),before);
});
check('viewer cleanup removes repeated listeners and closes a stale dialog',()=>{
 const h=actionHarness();h.run('bindReferenceViewer();bindReferenceViewer()');assert.equal(h.get('#reference-in').listeners.get('click').size,1);
 h.run("openReferenceViewer('dam-cuoi-chuot');disposeReferenceViewer();disposeReferenceViewer()");assert(!h.get('#reference-viewer').open);assert.equal(h.get('#reference-in').listeners.get('click').size,0);assert.equal(h.get('#reference-image').listeners.get('load').size,0);assert.equal(h.get('#reference-image').listeners.get('error').size,0);
});
check('metadata updates immediately but persists once after the 300ms quiet period',()=>{
 const h=actionHarness();h.get('#drawing-title').emit('input',{target:{value:'First'}});h.get('#drawing-title').emit('input',{target:{value:'Second'}});h.get('#drawing-artist').emit('input',{target:{value:'Maker'}});
 assert.equal(h.get('#drawing-current-title').textContent,'Second');assert.equal(h.run("safeGet('dongho-drawing-draft').name"),'Maker');assert.equal(h.writes.length,0);assert.equal(h.timers.size,1);
 h.advance(299);assert.equal(h.writes.length,0);h.advance(300);assert.deepEqual(h.writes,['dongho-drawing-draft']);assert.equal(JSON.parse(h.stored.get('dongho-drawing-draft')).title,'Second');
});
check('each completed stroke writes the draft only once and absorbs pending metadata',()=>{
 const h=actionHarness();h.get('#drawing-title').emit('input',{target:{value:'Pig family'}});h.run('beginDrawingStroke([10,20,1]);finishDrawingStroke()');assert.deepEqual(h.writes,['dongho-drawing-draft']);assert.equal(h.timers.size,0);assert.equal(JSON.parse(h.stored.get('dongho-drawing-draft')).title,'Pig family');
});
check('Done, Escape, page hiding and internal links flush pending metadata',()=>{
 for(const mode of ['done','escape','pagehide','hidden','click','auxclick','contextmenu']){
  const h=actionHarness();h.get('#drawing-name').emit('click');h.get('#drawing-title').emit('input',{target:{value:mode}});
  if(mode==='done')h.get('#drawing-metadata-done').emit('click');else if(mode==='escape')h.get('#drawing-metadata').escape();else if(mode==='pagehide')h.win.emit('pagehide');else if(mode==='hidden'){h.doc.visibilityState='hidden';h.doc.emit('visibilitychange');}else h.doc.emit(mode,{target:{closest:()=>({})}});
  assert.equal(JSON.parse(h.stored.get('dongho-drawing-draft')).title,mode);assert.equal(h.timers.size,0);
 }
});
check('exports flush metadata and blocked storage remains a usable session',()=>{
 for(const blocked of [false,true]){const h=actionHarness({blocked});h.run('beginDrawingStroke([20,30,1]);finishDrawingStroke()');h.get('#drawing-title').emit('input',{target:{value:'New title'}});h.get('#draw-download').emit('click');assert(h.paint.includes('New title'));assert.equal(h.run('drawingMetadataDirty'),false);assert.equal([...h.timers.values()].filter(t=>t.delay===300).length,0);
  h.get('#drawing-title').emit('input',{target:{value:'Gallery title'}});const link=h.get('#draw-exhibit');link.emit('click');assert.equal(JSON.parse(new URLSearchParams(link.getAttribute('href').split('#')[1]).get('drawing')).title,'Gallery title');if(blocked)assert(h.get('#drawing-status').textContent.includes('session'));
 }
});
check('runtime teardown flushes metadata and removes lifecycle subscriptions',()=>{
 const h=actionHarness(),pagehideCount=h.win.listeners.get('pagehide').size;h.run('bindDrawingRuntime();bindDrawingRuntime()');assert.equal(h.win.listeners.get('pagehide').size,pagehideCount);assert.equal(h.doc.listeners.get('visibilitychange').size,1);
 h.get('#drawing-title').emit('input',{target:{value:'Before rerender'}});h.run('disposeDrawingRuntime()');assert.equal(h.timers.size,0);assert.equal(h.win.listeners.get('pagehide').size,pagehideCount-1);assert.equal(h.doc.listeners.get('click').size,0);assert.equal(h.doc.listeners.get('visibilitychange').size,0);assert.equal(h.run('drawingRaster'),null);
});
check('generated pages retain resource order and source metadata identifies all six assets',()=>{
 for(const page of ['HomePage','HistoryPage','ExplorePage','WorkshopPage','ExhibitionPage','index'])assertEntry(readSource(page+'.html'));assertOrder(['drawing-runtime.js','shop-reference-data.js','drawing-inspiration.js','reference-viewer.js','drawing-guide.js','app.js']);
 const manifest=JSON.parse(fs.readFileSync(path.join(projectRoot,'assets/shop-sources.json'),'utf8'));assert.equal(manifest.length,6);for(const r of manifest){assert(r.permission.includes('User confirmed'));assert(r.source.startsWith('https://bizweb.dktcdn.net/'));assert(r.product.startsWith('https://tranhdangiandongho.com/'));}
});
console.log(`\n${checks} reference-workspace checks passed. Browser layout, native focus containment and touch still require visual acceptance.`);
