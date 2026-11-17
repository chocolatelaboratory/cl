const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({deviceScaleFactor:2,viewport:{width:1800,height:1000}});
p.on('console',m=>console.log(m.text()));p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+process.cwd()+'/orb_white.html',{waitUntil:'commit',timeout:0});await p.waitForFunction('window.DONE',null,{timeout:0});await p.waitForTimeout(1500);
for(const id of ['w_banner_large','w_banner_large_glow','w_icon','w_icon_glow','w_banner_mini','w_social_header'])await p.locator('#'+id).screenshot({path:`${id}.png`});await b.close()})();
