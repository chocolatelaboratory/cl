const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({deviceScaleFactor:2,viewport:{width:2200,height:700}});
await p.goto('file://'+process.cwd()+'/mono3.html');await p.waitForFunction('window.DONE');await p.waitForTimeout(500);await p.locator('#grid').screenshot({path:'monogram_samestart.png'});
for(let k=0;k<4;k++)await p.locator('#s'+k).screenshot({path:`samestart_${'ABCD'[k]}.png`});await b.close()})();
