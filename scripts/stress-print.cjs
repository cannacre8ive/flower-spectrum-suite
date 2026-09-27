async (page) => {
 await page.goto('http://127.0.0.1:5178/#print');await page.locator('.print-pages').waitFor();
 const saved=await page.evaluate(()=>localStorage.getItem('fs-suite-catalog-v1'));
 const rows=Array.from({length:900},(_,i)=>({id:'stress-'+i,category:'flower',name:'Stress Product '+String(i).padStart(4,'0'),grower:'QA fixture',lineage:'Example lineage',blurb:'A long aroma description to exercise wrapped lines and repeat group headings without clipping or dropping rows.',thc:25,priceEighth:35,tier:'Top Shelf',primaryKey:'citrus_bright',primaryPct:60,secondaryKey:'gas_fuel',secondaryPct:40,staffPick:i%3===0,salePct:i%4===0?15:null}));
 const report=[];
 try{await page.evaluate(r=>localStorage.setItem('fs-suite-catalog-v1',JSON.stringify(r)),rows);await page.reload();await page.locator('.fs-printed-page').first().waitFor();await page.evaluate(()=>document.fonts.ready);
 for(const orientation of ['portrait','landscape']){
 if(orientation==='landscape')await page.getByRole('button',{name:'▭ Landscape',exact:true}).click();
 const data=await page.locator('.print-pages').evaluate(h=>({pages:h.querySelectorAll('.fs-printed-page').length,rows:h.querySelectorAll('.fs-row').length,overflow:[...h.querySelectorAll('.print-column')].filter(c=>[...c.children].some(x=>x.getBoundingClientRect().bottom>c.getBoundingClientRect().bottom+1)).length,unique:new Set([...h.querySelectorAll('.fs-row')].map(r=>r.innerText.match(/Stress Product \d+/)?.[0])).size}));report.push({orientation,...data});
 if(orientation==='portrait')await page.pdf({path:'output/playwright/stress-900.pdf',printBackground:true,preferCSSPageSize:true});
 }
 }finally{await page.evaluate(s=>localStorage.setItem('fs-suite-catalog-v1',s),saved);await page.reload()}
 return report;
}
