async (page) => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.getByRole('button',{name:'Flower',exact:true}).click();
 await page.getByRole('button',{name:'Price',exact:false}).first().click();
 await page.screenshot({path:'output/playwright/menu-desktop.png'});
 for(const name of ['Pre-Rolls','Vapes','Concentrates','Edibles','◆ Staff Picks','◆ Flash Sale','◆ Learn']){await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(100);}
 await page.getByRole('button',{name:'⚙ DATA EDITOR',exact:true}).click();
 console.log('EDITOR',await page.locator('body').innerText());
 console.log('ERRORS',errors);
}
