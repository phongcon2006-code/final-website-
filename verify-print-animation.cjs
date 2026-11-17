const assert=require('assert/strict');
const {harness}=require('./verify-shell-print.cjs');
function setup(options){
 const h=harness(options),timers=new Map();let id=0;
 h.media.matches=false;
 h.c.setTimeout=(fn,delay)=>{timers.set(++id,{fn,delay});return id;};
 h.c.clearTimeout=id=>timers.delete(id);
 h.run("studio.stage=3;studio.layers=0;studio.block=0;studio.offsetX=0;studio.offsetY=0;bindStudio()");
 h.tick=delay=>{for(const [id,t]of [...timers])if(t.delay===delay){timers.delete(id);t.fn();}};
 h.timers=timers;return h;
}
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
async function main(){
 let checks=0;
 for(const art of ['mouse','pigs','chickens']){
  const h=setup();h.c.art=art;h.run('studio.art=art');
  for(let i=0;i<5;i++){
   h.run('studio.offsetX=0;studio.offsetY=0');const pending=h.run('press()');await flush();
   assert.equal(h.get('#press-block').dataset.phase,'lowering');
   assert(h.get('#press').disabled);h.run('press();move("right")');h.get('#undo').onclick();
   assert.equal(h.run('studio.layers'),i);assert.equal(h.run('studio.offsetX'),0);
   h.tick(250);assert.equal(h.run('studio.layers'),i+1);assert.equal(h.get('#press-block').dataset.phase,'pressing');
   h.tick(550);assert.equal(h.get('#press-block').dataset.phase,'lifting');
   h.tick(1000);await pending;assert.equal(h.run('printPressAction'),null);
  }
  assert(h.get('#print-feedback').textContent.includes('5 of 5'));checks++;
 }
 for(const contact of [false,true]){
  const h=setup(),pending=h.run('press()');await flush();if(contact)h.tick(250);
  h.run('cancelPrintPress()');await pending;assert.equal(h.timers.size,0);assert.equal(h.run('studio.layers'),contact?1:0);checks++;
 }
 {
  const h=setup({defer:true}),pending=h.run('press()');h.run('cancelPrintPress()');h.images.at(-1).resolve();await pending;
  assert.equal(h.run('studio.layers'),0);assert.equal(h.timers.size,0);checks++;
 }
 {
  const h=setup({defer:true}),pending=h.run('press()');h.images.at(-1).reject(Error('decode'));await pending;
  assert.equal(h.run('studio.layers'),0);assert.equal(h.run('printPressAction'),null);assert(h.get('#print-feedback').textContent.includes('retry'));checks++;
 }
 for(const paused of [false,true]){
  const h=setup();if(paused)h.doc.body.classList.add('motion-paused');else h.media.matches=true;
  await h.run('press()');assert.equal(h.run('studio.layers'),1);assert.equal(h.timers.size,0);checks++;
 }
 {
  const h=setup(),pending=h.run('press()');await flush();h.media.emit('change',{matches:true});await pending;
  assert.equal(h.run('studio.layers'),1);assert.equal(h.timers.size,0);checks++;
 }
 console.log(`${checks} print animation checks passed.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
