async (page) => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5178/#menu?profile=earthy_dank');
 await page.getByRole('button',{name:'⚙ DATA EDITOR',exact:true}).click();
 await page.getByRole('button',{name:'+ ADD PRODUCT',exact:true}).click();
 await page.getByRole('textbox',{name:'Name',exact:true}).fill('QA temporary sample');
 await page.getByRole('spinbutton',{name:'Price 1g',exact:true}).fill('9');
 await page.getByRole('button',{name:'SAVE',exact:true}).click();
 await page.getByRole('button',{name:'DONE',exact:true}).click();
 await page.reload();await page.getByRole('button',{name:'⚙ DATA EDITOR',exact:true}).click();
 const persisted=await page.getByText('QA temporary sample',{exact:true}).count();
 await page.getByRole('button',{name:'Export / Templates',exact:true}).click();
 const dlPromise=page.waitForEvent('download');await page.getByRole('link',{name:/EXPORT ALL PRODUCTS/}).click();const dl=await dlPromise;await dl.saveAs('output/playwright/catalog-roundtrip.csv');
 await page.getByRole('button',{name:'Import CSV',exact:true}).click();
 await page.getByPlaceholder('…or paste CSV text here').fill('Category,Name,Price1g\nflower,Bad,-1');
 await page.getByRole('button',{name:'REPLACE ALL',exact:true}).click();
 await page.getByRole('button',{name:'Products',exact:true}).click();
 const retained=await page.getByText('QA temporary sample',{exact:true}).count();
 // Remove only the temporary QA record through the editor.
 page.once('dialog',d=>d.accept());await page.getByText('QA temporary sample',{exact:true}).locator('..').getByRole('button',{name:'✕',exact:true}).click();
 await page.getByRole('button',{name:'DONE',exact:true}).click();
 await page.getByRole('link',{name:'Education',exact:true}).click();
 await page.waitForTimeout(300);
 return {persisted,invalidImportRetainedCatalog:retained,errors,education:await page.locator('body').innerText()};
}
