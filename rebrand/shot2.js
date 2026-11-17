const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({deviceScaleFactor:2,viewport:{width:1800,height:1000}});
await p.goto('file://'+process.cwd()+'/orb.html');await p.waitForTimeout(2500);
for(const id of ['banner_large','banner_mini','icon','icon_mono','social_header'])await p.locator('#'+id).screenshot({path:`orb_${id}.png`});await b.close()})();
