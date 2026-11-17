const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({deviceScaleFactor:2,viewport:{width:2200,height:1300}});
await p.goto('file://'+process.cwd()+'/mono.html');await p.waitForTimeout(2500);await p.locator('#grid').screenshot({path:'monogram_mockups.png'});
for(let k=0;k<8;k++)await p.locator('#m'+k).screenshot({path:`mono_${'ABCDEFGH'[k]}.png`});
await p.goto('file://'+process.cwd()+'/white_banner.html');await p.waitForTimeout(2500);for(const id of ['white_banner_mini','white_banner_large'])await p.locator('#'+id).screenshot({path:`${id}.png`});await b.close()})();
