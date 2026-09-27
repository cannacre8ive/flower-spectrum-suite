async (page) => {
 await page.goto('http://127.0.0.1:5178/#social');
 await page.setViewportSize({width:1440,height:1050});
 const frame=page.frameLocator('iframe');await frame.locator('#gallery .asset').first().waitFor();
 await frame.getByLabel('Farm name').fill('CannaCre8ive / Portfolio');
 await frame.getByLabel('Social handle').fill('@cannacre8ive');
 await frame.getByLabel('Featured strain').selectOption('sdr');
 const selected=await frame.locator('#gallery .asset').first().innerText();
 await page.reload();await frame.locator('#gallery .asset').first().waitFor();
 const branding=await frame.getByLabel('Farm name').inputValue();
 await frame.getByLabel('Featured strain').selectOption('jb');
 await frame.getByLabel('Farm name').fill('Ideal Cannabis');await frame.getByLabel('Social handle').fill('@idealcannabis');
 const files=[];
 for(let i=0;i<6;i++){
  const dlPromise=page.waitForEvent('download',{timeout:60000});
  await frame.getByRole('button',{name:'Export PNG',exact:true}).nth(i).click();
  const dl=await dlPromise;await dl.saveAs('public/assets/'+dl.suggestedFilename());files.push(dl.suggestedFilename());
 }
 await frame.getByRole('button',{name:'Chemovar Cards',exact:true}).click();const cards=await frame.locator('#cards .sheet').count();
 await frame.getByRole('button',{name:'How to Use',exact:true}).click();
 await frame.getByRole('button',{name:'Social Templates',exact:true}).click();
 await frame.locator('body').evaluate(()=>scrollTo(0,470));
 await page.screenshot({path:'output/playwright/social-desktop.png',timeout:10000});
 return {selectedSundayDriver:selected.includes('Sunday Driver'),brandingPersisted:branding==='CannaCre8ive / Portfolio',files,cards};
}
