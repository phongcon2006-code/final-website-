const {root:projectRoot}=require('./source-sections.cjs');
const fs=require('fs');const path=require('path');
const pages={HomePage:'home',HistoryPage:'history',ExplorePage:'explore',WorkshopPage:'workshop',ExhibitionPage:'exhibition'};
for(const [file,page] of Object.entries(pages)){
const html=`<!doctype html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#f7f1e5"><meta name="description" content="Explore six chapters of Dong Ho history, discover painting symbols, and create original artwork in a guided digital studio."><title>Dong Ho — The Living Printmaking Studio</title><link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="styles.css"><script defer src="app.js"></script></head><body data-page="${page}"><noscript><main style="padding:40px;font:20px Georgia"><h1>Dong Ho — The Living Printmaking Studio</h1><p>This interactive educational prototype needs JavaScript. Please enable JavaScript to explore the studio.</p></main></noscript></body></html>\n`;
fs.writeFileSync(path.join(projectRoot,file+'.html'),html);
if(page==='home')fs.writeFileSync(path.join(projectRoot,'index.html'),html);
}
console.log('Five pages + index generated.');



