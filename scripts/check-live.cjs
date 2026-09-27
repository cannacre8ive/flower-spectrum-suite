async (page) => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const failures=[];page.on('response',r=>{if(r.status()>=400)failures.push({url:r.url(),status:r.status()})});
 const base='https://flower-spectrum-suite.vercel.app/';
 await page.setViewportSize({width:1200,height:630});await page.goto(base);await page.waitForTimeout(1000);
 await page.screenshot({path:'public/assets/social-preview.png',timeout:10000});
 await page.setViewportSize({width:1600,height:1000});await page.waitForTimeout(500);await page.screenshot({path:'public/assets/portfolio-cover.png',timeout:10000});
 await page.goto(base+'#menu?profile=earthy_dank');await page.getByRole('button',{name:'Flower',exact:true}).waitFor();
 const menu=await page.locator('main').innerText();
 await page.getByRole('link',{name:'Education',exact:true}).click();await page.getByRole('button').filter({hasText:'09 ·'}).click();
 await page.getByRole('link',{name:'Social studio',exact:true}).click();const f=page.frameLocator('iframe');await f.locator('#gallery .frame').first().waitFor();
 const canvas=await f.locator('#gallery .frame').evaluateAll(xs=>xs.map(x=>({width:x.offsetWidth,height:x.offsetHeight,padScroll:x.querySelector('.pad').scrollHeight,padHeight:x.querySelector('.pad').clientHeight})));
 await page.getByRole('link',{name:'Portfolio',exact:true}).click();await page.getByRole('heading',{name:'A portfolio kit, ready to share.'}).waitFor();
 const files=await page.locator('.download-grid a').count();
 const dlP=page.waitForEvent('download');await page.getByRole('link',{name:'Download the full kit ↓',exact:true}).click();const dl=await dlP;await dl.saveAs('output/playwright/live-portfolio-kit.zip');
 await page.setViewportSize({width:320,height:900});await page.waitForTimeout(500);const mobile=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
 await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(500);await page.screenshot({path:'output/playwright/portfolio-desktop.png',fullPage:true,timeout:10000});
 return {errors,failures,menuFilter:menu.includes('Jelly Breath')&&menu.includes('Meat Stomper'),canvas,downloadLinks:files,mobile,downloadName:dl.suggestedFilename()};
}
