const {root:projectRoot}=require('./source-sections.cjs');
// Run with: node verify-header-layout.cjs <path-to-chrome-headless-shell>
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {pathToFileURL}=require('url'),{spawn}=require('child_process');
const executable=process.argv[2]||process.env.CHROME_BIN;
if(!executable)throw Error('Pass a Chrome/headless-shell executable path, or set CHROME_BIN.');
const {qa}=require('./qa-paths.cjs');fs.mkdirSync(qa,{recursive:true});
const files=['HomePage','index','HistoryPage','ExplorePage','WorkshopPage','ExhibitionPage'];
const widths=[320,390,768,1199,1200,1440,1920];
const cases=widths.flatMap(width=>files.flatMap(file=>[false,true].map(large=>({file,width,large}))));
const fixture=path.join(qa,'header-layout.html');
fs.writeFileSync(fixture,`<!doctype html><html><head><base href="${pathToFileURL(projectRoot+path.sep).href}"></head><body><pre id="results"></pre><script>
(async()=>{
 const results=[];
 for(const entry of ${JSON.stringify(cases)}){
  const frame=document.createElement('iframe');frame.style.cssText='display:block;border:0;height:900px;width:'+entry.width+'px';
  const loaded=new Promise(resolve=>frame.onload=resolve);frame.src=entry.file+'.html';document.body.append(frame);await loaded;
  const doc=frame.contentDocument,win=frame.contentWindow;
  // Model independently saved Aa preferences, including file:// pages.
  win.localStorage.setItem('dongho-large',JSON.stringify(entry.large));
  win.dispatchEvent(new win.Event('pageshow'));
  await new Promise(resolve=>setTimeout(resolve,20));
  const measure=selector=>{const el=doc.querySelector(selector),r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,font:win.getComputedStyle(el).fontSize};};
  const navigation=doc.querySelector('#site-navigation'),mobile=entry.width<1200;
  const result={...entry,rootFont:win.getComputedStyle(doc.documentElement).fontSize,header:measure('.site-header'),brand:measure('.brand'),logo:measure('.brand strong'),tools:measure('.tools'),sound:measure('#ambient'),textSize:measure('#text-size'),navHidden:win.getComputedStyle(navigation).display==='none'};
  if(mobile)doc.querySelector('#menu').click();
  result.nav=measure('#site-navigation');result.links=[...navigation.querySelectorAll('a')].map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,font:win.getComputedStyle(el).fontSize};});
  if(mobile){doc.querySelector('#menu').dispatchEvent(new win.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));result.closed=win.getComputedStyle(navigation).display==='none';}
  results.push(result);frame.remove();
 }
 document.querySelector('#results').textContent=JSON.stringify(results);
})().catch(error=>document.querySelector('#results').textContent=JSON.stringify({error:String(error)}));
</script></body></html>`);
const profile=fs.mkdtempSync(path.join(qa,'header-profile-'));
function cleanupProfile(){
 const target=path.resolve(profile),parent=path.resolve(qa);
 if(path.dirname(target)!==parent||!path.basename(target).startsWith('header-profile-'))throw Error('Unexpected browser profile path');
 fs.rmSync(target,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}
const child=spawn(executable,['--headless','--disable-gpu','--no-first-run','--allow-file-access-from-files','--user-data-dir='+profile,'--dump-dom','--timeout=25000','--virtual-time-budget=15000',pathToFileURL(fixture).href],{windowsHide:true});
let stdout='',stderr='';child.stdout.on('data',chunk=>stdout+=chunk);child.stderr.on('data',chunk=>stderr+=chunk);
const timer=setTimeout(()=>{child.kill();console.error('Header layout browser timed out.');process.exitCode=1;},35000);
child.on('error',error=>{clearTimeout(timer);console.error(error);process.exitCode=1;});
child.on('close',code=>{
 clearTimeout(timer);
 try{
  assert.equal(code,0,stderr.slice(-2000));
  const output=stdout.match(/<pre id="results">([^<]*)<\/pre>/)?.[1];assert(output,'Browser did not finish the layout fixture.');
  const results=JSON.parse(output);assert.equal(results.length,cases.length,JSON.stringify(results));
  for(const width of widths){
   const group=results.filter(result=>result.width===width),baseline=group.find(result=>result.file==='HistoryPage');
   const home=group.find(result=>result.file==='HomePage');
   const index=group.find(result=>result.file==='index');
   for(const result of group){
    const label=result.file+' @ '+width+'px / Aa '+result.large;
    assert.equal(result.rootFont,result.large?'18px':'16px',label+' page text must still resize');
    for(const key of ['header','brand','logo','tools','sound','textSize','nav','links']){
     if(width>=1440&&(result.file==='HomePage'||result.file==='index')){
      if(key==='nav'||key==='links')continue;
      if(key==='brand'||key==='tools')assert.equal(result[key].y,baseline[key].y,label+' '+key+' vertical alignment');
      else assert.deepEqual(result[key],baseline[key],label+' '+key);
     }else assert.deepEqual(result[key],baseline[key],label+' '+key);
    }
    assert.equal(result.navHidden,width<1200,label+' responsive menu visibility');
    if(width>=1200){
     assert.equal(result.nav.width,590,label);
     assert.equal(result.nav.height,64,label);
     assert(result.links.every(link=>link.font==='16px'),label);
    }
    else assert.equal(result.closed,true,label+' Escape closes mobile menu');
    for(const rect of [result.brand,result.tools,result.nav,...result.links])assert(rect.x>=0&&rect.x+rect.width<=width,label+' header overflow');
   }
   assert.deepEqual(home.nav,index.nav,'HomePage and index Studio menus must match at '+width+'px');
   assert.deepEqual(home.links,index.links,'HomePage and index Studio links must match at '+width+'px');
   if(width>=1440){
    const homeNav=group.find(result=>result.file==='HomePage').nav;
    const historyNav=baseline.nav;
    assert.equal(homeNav.x+homeNav.width/2,historyNav.x+historyNav.width/2,'Studio menu is centered at '+width+'px');
   }
  }
  fs.writeFileSync(path.join(qa,'header-layout-results.json'),JSON.stringify(results,null,2));
  console.log('PASS '+results.length+' browser layouts: six entries, seven viewport widths, both Aa sizes; shared desktop menu 590 x 64, mobile menu and Escape.');
 }catch(error){console.error(error);process.exitCode=1;}
 finally{try{cleanupProfile();}catch(error){console.error('Could not remove temporary browser profile:',error);process.exitCode=1;}}
});
