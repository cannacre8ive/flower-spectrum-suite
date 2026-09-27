async (page) => {
 const report={checks:[],errors:[]};page.on('pageerror',e=>report.errors.push(e.message));
 const audit=()=>page.locator('.print-pages').evaluate(host=>({pages:host.querySelectorAll('.fs-printed-page').length,rows:host.querySelectorAll('.fs-row,.fs-pick,.fs-deal,.fs-card').length,overflow:[...host.querySelectorAll('.print-column')].filter(c=>[...c.children].some(x=>x.getBoundingClientRect().bottom>c.getBoundingClientRect().bottom+1)).length}));
 await page.goto('http://127.0.0.1:5178/#print');await page.locator('.fs-printed-page').first().waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(200);
 report.checks.push({mode:'flower portrait',...await audit()});await page.pdf({path:'output/pdf/print-menu-sample.pdf',printBackground:true,preferCSSPageSize:true});
 await page.getByRole('button',{name:'▭ Landscape',exact:true}).click();await page.waitForTimeout(150);report.checks.push({mode:'flower landscape',...await audit()});await page.pdf({path:'output/pdf/print-menu-landscape.pdf',printBackground:true,preferCSSPageSize:true});
 await page.getByRole('button',{name:'▯ Portrait',exact:true}).click();
 for(const cat of ['Pre-Rolls','Concentrates','Vapes','Edibles']){await page.getByRole('button',{name:cat,exact:true}).click();await page.waitForTimeout(100);report.checks.push({mode:cat,...await audit()})}
 await page.getByRole('button',{name:'Flower',exact:true}).click();
 for(const kind of ['Staff Picks','Deals']){await page.getByRole('button',{name:kind,exact:true}).click();await page.waitForTimeout(100);report.checks.push({mode:kind,...await audit()})}
 await page.getByRole('button',{name:'✦ Aroma Cards',exact:true}).click();await page.waitForTimeout(200);report.checks.push({mode:'aroma and terpene cards',...await audit()});await page.pdf({path:'output/pdf/aroma-shelf-cards.pdf',printBackground:true,preferCSSPageSize:true});
 await page.goto('http://127.0.0.1:5178/#labels');await page.getByLabel('Copies per product').fill('2');await page.getByRole('button',{name:'Generate PDF preview',exact:true}).click();const download=page.getByRole('link',{name:'Download PDF ↓',exact:true});await download.waitFor();const d=page.waitForEvent('download');await download.click();await (await d).saveAs('output/pdf/label-sheet-sample.pdf');report.checks.push({mode:'label preview',iframe:await page.locator('iframe[title="Generated label PDF"]').getAttribute('src')});
 await page.getByLabel('Copies per product').fill('3');report.checks.push({mode:'stale label preview cleared',pass:await download.count()===0});
 await page.getByLabel('Copies per product').fill('2');await page.getByLabel('Start at label').selectOption('5');await page.getByLabel('Copy order').selectOption('interleaved');await page.getByRole('button',{name:'Generate PDF preview',exact:true}).click();const dd=page.waitForEvent('download');await download.click();await (await dd).saveAs('output/playwright/labels-offset-test.pdf');
 return report;
}
