async (page) => {
 await page.goto('http://127.0.0.1:5178/#menu?profile=earthy_dank');
 await page.getByRole('button',{name:'⚙ DATA EDITOR',exact:true}).click();
 await page.getByRole('button',{name:'+ ADD PRODUCT',exact:true}).click();
 return await page.locator('body').innerText();
}
