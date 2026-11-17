const {root:projectRoot,readSource}=require('./source-sections.cjs');
const fs=require('fs'),path=require('path'),vm=require('vm');
const context={};vm.createContext(context);for(const file of ['shop-reference-data.js','drawing-inspiration.js'])vm.runInContext(readSource(file),context);
const examples=vm.runInContext('DRAWING_EXAMPLES',context);
for(const item of examples)for(const asset of [item.image,item.thumbnail])if(!fs.existsSync(path.join(projectRoot,asset)))throw Error('Missing local reference: '+asset);
console.log(`${examples.length} photographic references verified. Refresh authorized photographs with build-shop-assets.ps1; no reconstructed images are generated.`);
