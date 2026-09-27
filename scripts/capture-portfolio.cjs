async (page) => {
 await page.goto('http://127.0.0.1:5178/#overview');await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(700);
 await page.screenshot({path:'output/playwright/overview-desktop.png',fullPage:true,timeout:10000});
 await page.setViewportSize({width:1600,height:1000});await page.screenshot({path:'public/assets/portfolio-cover.png',timeout:10000});
 await page.setViewportSize({width:1200,height:630});await page.screenshot({path:'public/assets/social-preview.png',timeout:10000});
 await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:5178/#menu?profile=earthy_dank');await page.getByRole('button',{name:'ALL',exact:true}).click();await page.waitForTimeout(1000);
 await page.screenshot({path:'output/playwright/menu-desktop.png',timeout:10000});
 await page.getByText('Jelly Breath',{exact:true}).click();await page.getByRole('link',{name:'Create assets from this sample ↗'}).click();await page.frameLocator('iframe').getByLabel('Featured strain').waitFor();
 const detailHandoff=await page.frameLocator('iframe').getByLabel('Featured strain').inputValue();
 return {detailHandoff};
}
