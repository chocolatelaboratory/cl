const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({deviceScaleFactor:2,viewport:{width:1800,height:1000}});
p.on('console',m=>console.log(m.text()));p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+process.cwd()+'/orb3d.html');await p.waitForFunction('window.DONE',null,{timeout:120000});await p.waitForTimeout(1500);
for(const id of ['banner_large','banner_mini','icon','icon_mono','social_header'])await p.locator('#'+id).screenshot({path:`orb_${id}.png`});await b.close()})();
