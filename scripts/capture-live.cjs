async(page)=>{
 const base='https://flower-spectrum-suite.vercel.app/';
 await page.setViewportSize({width:1440,height:1000});await page.goto(base);await page.waitForTimeout(700);await page.screenshot({path:'documentation/assets/overview-desktop.png',fullPage:true,timeout:10000});
 await page.goto(base+'#menu?profile=earthy_dank');await page.getByRole('button',{name:'ALL',exact:true}).click();await page.waitForTimeout(700);await page.screenshot({path:'documentation/assets/menu-desktop.png',timeout:10000});
 await page.goto(base+'#education');await page.getByRole('heading',{name:'Nine pieces, one system.'}).waitFor();await page.waitForTimeout(300);await page.screenshot({path:'documentation/assets/education-desktop.png',timeout:10000});
 await page.goto(base+'#social');const f=page.frameLocator('iframe');await f.locator('#gallery .frame').first().waitFor();await f.locator('body').evaluate(()=>scrollTo(0,470));await page.waitForTimeout(500);await page.screenshot({path:'documentation/assets/social-desktop.png',timeout:10000});
 await page.setViewportSize({width:390,height:900});await page.goto(base);await page.waitForTimeout(500);await page.screenshot({path:'documentation/assets/overview-mobile.png',fullPage:true,timeout:10000});
 await page.setViewportSize({width:320,height:900});await page.goto(base+'#menu?profile=earthy_dank');await page.getByRole('button',{name:'Flower',exact:true}).waitFor();await page.waitForTimeout(700);await page.screenshot({path:'documentation/assets/menu-mobile.png',timeout:10000});
 await page.goto(base+'#social');await f.locator('#gallery .frame').first().waitFor();await f.getByRole('button',{name:'Chemovar Cards',exact:true}).click();const phoneCards=await f.locator('body').evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
 return {captured:6,phoneCards};
}
