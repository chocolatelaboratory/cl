const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({deviceScaleFactor:2});
await p.goto('file://'+process.cwd()+'/gen.html');await p.waitForTimeout(2500);
for(const id of ['b1','b2','b3','b4','i1','i2','i3','i4'])await p.locator('#'+id).screenshot({path:`${id}.png`});await b.close()})();
