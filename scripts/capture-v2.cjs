async(page)=>{
 const root='http://127.0.0.1:5178/';const report=[];
 for(const route of ['overview','classifier','print','profiles','labels','education','social']){
 await page.setViewportSize({width:1440,height:1000});await page.goto(root+'#'+route);await page.waitForTimeout(500);await page.evaluate(()=>document.fonts.ready);
 if(route==='labels'){await page.getByLabel('Copies per product').fill('2');await page.getByRole('button',{name:'Generate PDF preview',exact:true}).click();await page.waitForTimeout(700)}
 if(route==='social')await page.frameLocator('iframe').locator('#canvas').first().waitFor({timeout:2000}).catch(()=>{});
 await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(200);await page.screenshot({path:'documentation/assets/'+route+'-desktop.png',fullPage:route==='overview'||route==='labels',timeout:10000});
 if(route==='classifier'){await page.evaluate(()=>window.scrollTo(0,760));await page.screenshot({path:'documentation/assets/classifier-workspace.png'})}await page.setViewportSize({width:320,height:850});await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(400);await page.screenshot({path:'documentation/assets/'+route+'-mobile.png',timeout:10000});report.push(route);
 }
 await page.setViewportSize({width:1440,height:1000});await page.goto(root+'#menu?profile=earthy_dank');await page.getByRole('button',{name:'ALL',exact:true}).click();await page.waitForTimeout(400);await page.screenshot({path:'documentation/assets/menu-desktop.png'});
 await page.goto(root+'#overview');await page.setViewportSize({width:1600,height:1000});await page.waitForTimeout(500);await page.screenshot({path:'public/assets/portfolio-cover.png'});await page.setViewportSize({width:1200,height:630});await page.waitForTimeout(500);await page.screenshot({path:'public/assets/social-preview.png'});
 return report;
}
