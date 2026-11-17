const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({deviceScaleFactor:2,viewport:{width:1700,height:1200}});
await p.goto('file://'+process.cwd()+'/mono2.html');await p.waitForTimeout(2500);await p.locator('#grid').screenshot({path:'monogram_interlock.png'});
for(let k=0;k<6;k++)await p.locator('#n'+k).screenshot({path:`interlock_${k+1}.png`});await b.close()})();
