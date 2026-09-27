async (page) => {
 const keys=['gas_fuel','earthy_dank','citrus_bright','fruity_sweet','floral_soft','dessert_creamy','spicy_warm','piney_fresh','herbal_woody','tropical_tangy'];
 await page.setViewportSize({width:1080,height:1080});
 for(const key of keys){await page.goto('http://127.0.0.1:5178/output/playwright/profile-artwork/'+key+'.html');await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:'public/assets/profiles/'+key+'.png'});}
 await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:5178/#print');await page.waitForTimeout(700);return {created:keys.length};
}
