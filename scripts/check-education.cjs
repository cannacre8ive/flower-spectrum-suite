async (page) => {
 const counts=[];
 for(const label of ['01 · The Nose Knows Customer','02 · The Ten Profiles Customer + Staff','03 · Major Terpenes Staff','04 · Minor & Supporting Staff','05 · Budtender Reference Staff','06 · The Great THC Myth Customer','07 · How to Read a Jar Customer + Staff','08 · The Science of Smell Enthusiast','09 · Find Your Profile Customer · Interactive']){await page.getByRole('button',{name:label,exact:true}).click();counts.push({label,visible:await page.locator('.fs-sheet-wrap.is-active').count()})}
 await page.getByRole('button',{name:'01 · The Nose Knows Customer',exact:true}).click();await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:'output/playwright/education-desktop.png'});
 await page.evaluate(()=>document.documentElement.setAttribute('data-printonly','primer'));
 await page.pdf({path:'output/pdf/education-primer.pdf',printBackground:true,preferCSSPageSize:true});
 await page.evaluate(()=>document.documentElement.removeAttribute('data-printonly'));
 await page.getByRole('button',{name:'09 · Find Your Profile Customer · Interactive',exact:true}).click();
 return {counts,quiz:await page.locator('.fs-sheet-wrap.is-active').innerText()};
}
