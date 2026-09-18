const fs=require('fs'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'server.js'),'utf8');
const files=[
  ['/index.html','index.html','utf8','text/html; charset=utf-8'],
  ['/game.js','game.js','utf8','text/javascript; charset=utf-8'],
  ['/styles.css','styles.css','utf8','text/css; charset=utf-8'],
  ['/assets/rake/rake.glb','assets/rake/rake.glb','base64','model/gltf-binary']
];
const obj={};
for(const [url,file,encoding,type] of files){
  const data=fs.readFileSync(path.join(__dirname,file),encoding);
  obj[url]={data,encoding:encoding==='base64'?'base64':'utf8',type};
}
const marker='const EMBEDDED_ASSETS = {};';
if(!source.includes(marker)) throw new Error('Embedding marker missing');
const out=source.replace(marker,'const EMBEDDED_ASSETS = '+JSON.stringify(obj)+';');
fs.mkdirSync(path.join(__dirname,'build'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'build','server.js'),out);
console.log('Embedded browser assets:',Object.keys(obj).join(', '));
