async(page)=>{
 const root=page.url().startsWith('https:')?'https://flower-spectrum-suite.vercel.app/':'http://127.0.0.1:5178/';
 const live=root.startsWith('https:'), report={live,errors:[],checks:[]};
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(root+'#profiles');await page.reload();await page.locator('.fingerprint-library article').first().waitFor();await page.evaluate(()=>document.fonts.ready);
 const cards=await page.locator('.fingerprint-library article').evaluateAll(cards=>cards.map(c=>({spokes:c.querySelectorAll('svg path[opacity="0.95"]').length,bands:c.querySelectorAll('.profile-spectrum-band>span').length})));
 if(cards.length!==10||cards.some(c=>c.spokes!==10||c.bands!==10))throw Error('Incomplete layered profiles');report.checks.push({cards});
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:live?'output/playwright/live-profiles-v3_1.png':'documentation/assets/profiles-desktop.png'});
 await page.locator('.fingerprint-library article').first().screenshot({path:'output/playwright/profile-card-v3_1.png'});
 await page.getByRole('button',{name:'How a fingerprint is generated ↓',exact:true}).click();await page.waitForTimeout(500);
 if(!await page.getByRole('heading',{name:/A fingerprint is a blend/}).isVisible())throw Error('Guide missing');
 const initial=await page.locator('.lab-result').innerText();if(!initial.includes('Floral / Soft leads at 33%'))throw Error(initial);
 await page.getByRole('slider',{name:'Linalool concentration',exact:true}).press('Home');for(let i=0;i<10;i++)await page.getByRole('slider',{name:'Linalool concentration',exact:true}).press('ArrowRight');await page.waitForTimeout(100);
 const changed=await page.locator('.lab-result').innerText();if(!changed.includes('Earthy / Dank leads'))throw Error(changed);
 await page.getByRole('button',{name:'Reset example',exact:true}).click();await page.waitForTimeout(100);if((await page.locator('.lab-result').innerText())!==initial)throw Error('Reset mismatch');
 for(const name of ['Myrcene','D-Limonene','Linalool']){await page.getByRole('slider',{name:name+' concentration',exact:true}).press('Home');await page.waitForTimeout(100);}
 if(!await page.getByText('Add a measured amount to build a fingerprint.',{exact:true}).isVisible())throw Error('Empty panel not handled');
 await page.getByRole('button',{name:'Reset example',exact:true}).click();report.checks.push({sliders:'Floral → Earth; empty and reset pass'});
 await page.locator('.fingerprint-example').screenshot({path:'output/playwright/kush-example-v3_1.png'});
 await page.locator('.fingerprint-lab').screenshot({path:live?'output/playwright/live-profile-explainer.png':'documentation/assets/profile-explainer.png'});
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:950});await page.waitForTimeout(150);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(overflow)throw Error('Overflow at '+width);report.checks.push({width,overflow});if(width===320&&!live){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'documentation/assets/profiles-mobile.png'})}}
 await page.getByRole('link',{name:'Open this flower in Social studio →'}).click();await page.frameLocator('iframe').locator('#selStrain option[value="km"]').waitFor({state:'attached'});const selected=await page.frameLocator('iframe').locator('#selStrain').inputValue();if(selected!=='km')throw Error('Wrong social strain '+selected);report.checks.push({socialSelection:selected});
 await page.goto(root+'#education');await page.getByRole('button',{name:'02 · The Ten Profiles Customer + Staff',exact:true}).click();report.checks.push({educationVisible:await page.locator('.fs-sheet-wrap.is-active').count()});
 await page.goto(root+'#print');await page.getByRole('button',{name:'✦ Aroma Cards',exact:true}).click();await page.locator('.print-pages .fs-card').first().waitFor();report.checks.push({printCards:await page.locator('.print-pages .fs-card').count()});
 if(!live){await page.evaluate(()=>document.fonts.ready);await page.pdf({path:'output/pdf/aroma-shelf-cards.pdf',printBackground:true,preferCSSPageSize:true})}
 if(report.errors.length)throw Error(JSON.stringify(report.errors));return report;
}
