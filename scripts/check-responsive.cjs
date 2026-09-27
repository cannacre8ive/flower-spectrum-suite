async (page) => {
 const results=[];
 await page.evaluate(()=>document.documentElement.removeAttribute('data-printonly'));
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});
  for(const route of ['overview','menu?profile=earthy_dank','education','social']){
   await page.goto('http://127.0.0.1:5178/#'+route);await page.waitForTimeout(500);
   results.push({width,route,...await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}))});
   if(width===390&&route==='overview')await page.screenshot({path:'output/playwright/overview-mobile.png',fullPage:true,timeout:10000});
   if(width===320&&route==='menu?profile=earthy_dank')await page.screenshot({path:'output/playwright/menu-mobile.png',timeout:10000});
   if(route==='social'){const f=page.frameLocator('iframe');await f.locator('#gallery .asset').first().waitFor();results.push({width,innerSocial:await f.locator('body').evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}))})}
  }
 }
 return results;
}
