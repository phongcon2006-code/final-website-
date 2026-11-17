const assert=require('assert/strict');
const {harness}=require('./verify-storybook.cjs');
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}
check('all 45 lessons show concise summaries and retain full guidance and narration',()=>{
 const h=harness({page:'workshop'});h.guide();
 const ids=h.run('[...TRADITIONAL_DRAWING_REFERENCES,...DRAWING_EXAMPLES].map(x=>x.id).concat("own")');
 for(const id of ids){
  h.c.exampleId=id;h.run('chooseInspirationExample(exampleId)');
  for(let step=0;step<5;step++){
   const lesson=h.run('drawingLesson()'),html=h.run('renderDrawingGuide()');
   assert(lesson.summary && lesson.summary.length<lesson.body.length);
   assert(html.includes('<p>'+lesson.summary+'</p></div><details'));
   const details=html.slice(html.indexOf('<details'),html.indexOf('</details>'));
   assert(details.includes(lesson.body));assert(details.includes(lesson.tip));
   assert(!h.get('guide-more').open);
   h.click('guide-listen');assert(h.spoken.at(-1).text.includes(lesson.body));assert(h.spoken.at(-1).text.includes(lesson.tip));
   h.get('guide-more').open=true;
   if(step<4)h.click('guide-next');
  }
 }
});
check('museum tabs support keyboard selection, preserve disclosure and drawing, and follow steps',()=>{
 const h=harness({page:'workshop'});h.guide();h.run("initializeDrawing();chooseInspirationExample('study-mouse-wedding')");
 const before=h.run('JSON.stringify(drawingDraft)');
 assert(!h.get('guide-panel-original').hidden);assert(h.get('guide-panel-example').hidden);
 h.get('guide-more').open=true;h.click('guide-reference-example');
 assert(h.get('guide-more').open);assert(h.get('guide-panel-original').hidden);assert(!h.get('guide-panel-example').hidden);
 for(const [key,id] of [['ArrowRight','original'],['ArrowLeft','example'],['Home','original'],['End','example']]){
  h.focused().dispatch('keydown',{key});
  assert.equal(h.focused(),h.get('guide-reference-'+id));
  assert.equal(h.focused().getAttribute('aria-selected'),'true');
  assert.equal(h.focused().getAttribute('tabindex'),'0');
 }
 for(let step=1;step<5;step++){
  h.click('guide-next');assert(!h.get('guide-panel-example').hidden);assert(!h.get('guide-more').open);
  assert(h.run('renderDrawingGuide()').includes('Simplified drawing study / Step '+(step+1)));
 }
 h.click('guide-back');assert(!h.get('guide-panel-example').hidden);
 assert.equal(h.run('JSON.stringify(drawingDraft)'),before);
 assert(!h.stored.get('dongho-drawing-guide').includes('guideReferenceTab'));
 h.run("chooseInspirationExample('study-rooster-hen')");assert(!h.get('guide-panel-original').hidden);
});
check('My own idea has no tabs and enlargement stays inside the original panel',()=>{
 const h=harness({page:'workshop'});h.guide();
 for(const id of ['own']){
  h.c.exampleId=id;h.run('chooseInspirationExample(exampleId)');
  assert(!h.get('guide-reference-original'));assert(!h.get('guide-reference-example'));
  assert.equal(!!h.get('enlarge-reference'),id!=='own');
 }
 h.run("chooseInspirationExample('study-mouse-wedding')");
 const html=h.run('renderDrawingGuide()');
 assert(html.indexOf('id="enlarge-reference"')>html.indexOf('id="guide-panel-original"'));
 assert(html.indexOf('id="enlarge-reference"')<html.indexOf('id="guide-panel-example"'));
});
check('all inspiration paintings have five progressive studies and preserve drawing state',()=>{
 const h=harness({page:'workshop'});h.guide();h.run('initializeDrawing()');
 const before=h.run('JSON.stringify({drawingDraft,drawUndo,drawRedo})');
 for(const ref of h.run('SHOP_DRAWING_REFERENCES')){
  h.c.id=ref.id;h.run('chooseInspirationExample(id)');
  assert(!h.get('guide-panel-original').hidden);h.click('guide-reference-example');
  const stages=[];
  for(let step=0;step<5;step++){
   assert(!h.get('guide-panel-example').hidden);
   const svg=h.run('guideSketch()');stages.push(svg);
   assert(svg.includes('role="img"'));assert(svg.includes(`step ${step+1}:`));
   assert(svg.includes(step===0?'data-study-part="composition"':'data-study-part="silhouettes"'));
   assert.equal(svg.includes('data-study-part="support"'),step>=2);
   assert.equal(svg.includes('data-study-part="details"'),step===4);
   assert(!svg.includes('undefined'));assert(!svg.includes('<image'));
   if(step<4)h.click('guide-next');
  }
  assert.equal(new Set(stages).size,5);
  h.click('guide-back');assert(!h.get('guide-panel-example').hidden);
  h.get('guide-reference-example').dispatch('keydown',{key:'Home'});
  assert(!h.get('guide-panel-original').hidden);
  assert.equal(h.focused(),h.get('guide-reference-original'));
  assert.equal(h.run('JSON.stringify({drawingDraft,drawUndo,drawRedo})'),before);
 }

 const seen=new Map();
 for(const mood of h.run('INSPIRATION_MOODS')){
  h.c.mood=mood.id;h.run('chooseInspirationMood(mood)');
  for(const ref of h.run('moodDrawingExamples(mood)')){
   h.c.id=ref.id;h.run('chooseInspirationExample(id)');const svg=h.run('guideSketch()');
   if(seen.has(ref.id))assert.equal(svg,seen.get(ref.id));else seen.set(ref.id,svg);
  }
 }
 assert.equal(seen.size,6);
});
console.log(`\n${checks} compact guide checks passed. Native disclosure, focus and layout still require browser QA.`);
