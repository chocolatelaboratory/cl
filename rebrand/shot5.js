const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({deviceScaleFactor:2,viewport:{width:1800,height:1000}});
await p.goto('file://'+process.cwd()+'/white_banner.html');await p.waitForTimeout(2500);
for(const id of ['white_banner_mini','white_banner_large','white_icon'])await p.locator('#'+id).screenshot({path:`${id}.png`});await b.close()})();
