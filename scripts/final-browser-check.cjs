async (page) => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5178/#education');
 const counts=[];
 for(const text of ['01 ·','02 ·','03 ·','04 ·','05 ·','06 ·','07 ·','08 ·','09 ·']){await page.getByRole('button').filter({hasText:text}).click();counts.push(await page.locator('.fs-sheet-wrap.is-active').count())}
 const quiz=await page.locator('.fs-sheet-wrap.is-active').innerText();
 await page.getByRole('button').filter({hasText:'01 ·'}).click();
 await page.evaluate(()=>document.documentElement.setAttribute('data-printonly','primer'));
 await page.pdf({path:'output/pdf/education-primer.pdf',printBackground:true,preferCSSPageSize:true});
 await page.evaluate(()=>document.documentElement.removeAttribute('data-printonly'));
 await page.setViewportSize({width:1440,height:1000});
 await page.screenshot({path:'output/playwright/education-desktop.png',timeout:10000});
 await page.getByRole('button').filter({hasText:'09 ·'}).click();
 return {counts,quiz,errors,catalog:await page.evaluate(()=>{const a=JSON.parse(localStorage.getItem('fs-suite-catalog-v1'));return {count:a.length,temporary:a.filter(p=>p.name==='QA temporary sample').length}})};
}
