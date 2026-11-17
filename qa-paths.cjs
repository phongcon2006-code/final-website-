const os=require('os'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const identity=process.platform==='win32'?root.toLowerCase():root;
const id=crypto.createHash('sha256').update(identity).digest('hex').slice(0,12);
const qa=path.join(os.tmpdir(),'dongho-studio-'+id);
module.exports={qa};
if(require.main===module)console.log(qa);
