async(page)=>{
 const report={errors:[],checks:[]};page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('https://flower-spectrum-suite.vercel.app/#classifier');await page.getByPlaceholder('Cultivar name').waitFor();const saved=await page.evaluate(()=>localStorage.getItem('fs-suite-catalog-v1'));
 try{
 await page.getByPlaceholder('Cultivar name').fill('QA Connected Panel');await page.getByRole('button',{name:'Save to catalog',exact:true}).click();await page.getByRole('status').filter({hasText:'saved to the shared catalog'}).waitFor();
 const entry=await page.evaluate(()=>JSON.parse(localStorage.getItem('fs-suite-catalog-v1')).find(p=>p.name==='QA Connected Panel'));report.checks.push({save:!!entry,values:Object.keys(entry.values).length,profile:entry.primaryKey});
 await page.getByRole('button',{name:'Detailed',exact:true}).click();await page.getByRole('button',{name:'Pin to Compare',exact:true}).click();await page.getByRole('button',{name:'Positive Mental Attitude',exact:true}).click();await page.getByRole('button',{name:/^Pin to Compare/}).click();await page.getByRole('button',{name:'Compare · 2',exact:true}).click();report.checks.push({comparePanels:await page.getByText('QA Connected Panel',{exact:true}).count()});
 await page.goto('https://flower-spectrum-suite.vercel.app/#menu?profile=spicy_warm');await page.waitForTimeout(350);report.checks.push({digital:await page.getByText('QA Connected Panel',{exact:true}).count()>0});
 await page.goto('https://flower-spectrum-suite.vercel.app/#print');await page.locator('.print-pages').waitFor();report.checks.push({print:await page.locator('.print-pages').getByText('QA Connected Panel',{exact:true}).count()});
 await page.getByRole('button',{name:'⚙ Data',exact:true}).click();const row=page.locator('tr').filter({has:page.locator('input[value="QA Connected Panel"]')});const inputs=await row.locator('input').count();report.checks.push({editorInputs:inputs});
 await page.goto('https://flower-spectrum-suite.vercel.app/#labels');await page.getByRole('button',{name:'None',exact:true}).click();await page.getByRole('checkbox',{name:/QA Connected Panel/}).check();await page.getByRole('button',{name:'Generate PDF preview',exact:true}).click();report.checks.push({label:await page.getByRole('link',{name:'Download PDF ↓',exact:true}).count()===1});
 }finally{await page.evaluate(s=>localStorage.setItem('fs-suite-catalog-v1',s),saved);await page.reload()}
 for(const route of ['overview','classifier','menu','print','labels','profiles','education','social','portfolio']){await page.setViewportSize({width:320,height:850});await page.goto('https://flower-spectrum-suite.vercel.app/#'+route);await page.waitForTimeout(300);report.checks.push({mobile:route,...await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}))})}
 return report;
}
