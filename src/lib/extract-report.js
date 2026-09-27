import {openPDF,pdfItemsToLines} from './pdf.js';
import {parsePanel,reviewPanel} from './coa-import.js';
export async function extractReport(file,status,signal){
 if(file.size>25*1024*1024)throw Error('Choose a report smaller than 25 MB.');
 let worker,pdf;
 const abort=()=>{worker?.terminate();pdf?.loadingTask.destroy()};signal?.addEventListener('abort',abort,{once:true});
 const check=()=>{if(signal?.aborted)throw new DOMException('Cancelled','AbortError')};
 async function ocr(image){check();status('Reading the image on this device…');if(!worker){const {createWorker}=await import('tesseract.js');worker=await createWorker('eng',1,{workerPath:'/vendor/ocr/worker.min.js',corePath:'/vendor/ocr',langPath:'/vendor/ocr',logger:m=>{if(m.status==='recognizing text')status(`Reading text · ${Math.round(m.progress*100)}%`)}})}check();const result=await worker.recognize(image);check();return result.data.text}
 try{
  if(/\.csv$/i.test(file.name)){const text=await file.text();check();return {pages:[{text,method:'CSV',...parsePanel(text,{csv:true})}],selected:0}}
  if(/\.pdf$/i.test(file.name)||file.type==='application/pdf'){
   pdf=await openPDF(await file.arrayBuffer());if(pdf.numPages>20)throw Error('This report has more than 20 pages. Upload only the terpene test pages.');
   const pages=[];
   for(let i=1;i<=pdf.numPages;i++){check();status(`Reading PDF page ${i} of ${pdf.numPages}…`);const page=await pdf.getPage(i);const content=await page.getTextContent();let text=pdfItemsToLines(content.items), method='PDF text';
    if(text.replace(/\s/g,'').length<40){const vp=page.getViewport({scale:Math.min(2,2400/page.getViewport({scale:1}).width)});const canvas=document.createElement('canvas');canvas.width=vp.width;canvas.height=vp.height;await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;text=await ocr(canvas);method='PDF image / OCR';canvas.width=canvas.height=0}
    const fullText=text;let panel=parsePanel(text);
    if(method==='PDF text'){
     const mid=page.getViewport({scale:1}).width/2;
     const headerY=Math.max(...content.items.filter(x=>/^Analyte$/i.test(x.str.trim())).map(x=>x.transform[5]),-Infinity);
     const stopY=Math.max(...content.items.filter(x=>/^(Primary Aromas|Method:|Quality Control)/i.test(x.str.trim())&&x.transform[5]<headerY).map(x=>x.transform[5]),-Infinity);
     const tableItems=content.items.filter(x=>x.transform[5]>stopY);
     const totalLine=text.replace(/\s+/g,' ').match(/([0-9]*\.?[0-9]+)\s*%\s*Total Terpenes/i);
     const columns=[tableItems.filter(x=>x.transform[4]<mid),tableItems.filter(x=>x.transform[4]>=mid)].map(pdfItemsToLines).join('\nMethod: Column boundary\n')+(totalLine?'\nTotal Terpenes '+totalLine[1]+' %':'');
     const alternative=parsePanel(columns);
     const score=p=>{const a=reviewPanel(p.rows,p.total);return p.rows.filter(r=>r.key&&Number(r.value)>0).length+(p.total!==''?8:0)-(p.total!==''?Math.min(30,Math.abs(a.sum-Number(p.total))*20):0)};
     if(score(alternative)>score(panel)){panel=alternative;text=columns}
    }
    pages.push({...panel,method,text:fullText,page:i});
   }
   const scores=pages.map(p=>p.rows.filter(r=>r.key&&Number(r.value)>0).length+(p.total!==''?100:0)+(reviewPanel(p.rows,p.total).issues.length===0?50:0)-(/Quality Control Data/i.test(p.text)?100:0));return {pages,selected:scores.indexOf(Math.max(...scores))};
  }
  if(/^image\/(png|jpeg|webp)$/.test(file.type)){const text=await ocr(file);return {pages:[{...parsePanel(text),text,method:'Image / OCR'}],selected:0}}
  throw Error('Choose a PDF, CSV, PNG, JPG, or WebP test report.');
 }finally{await worker?.terminate();await pdf?.loadingTask.destroy();signal?.removeEventListener('abort',abort)}
}
export async function preparePhoto(file){
 if(!/^image\/(png|jpeg|webp)$/.test(file.type))throw Error('Choose a PNG, JPG, or WebP flower photograph.');
 if(file.size>20*1024*1024)throw Error('Choose a flower photo smaller than 20 MB.');
 const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});const scale=Math.min(1,900/Math.max(bitmap.width,bitmap.height));const c=document.createElement('canvas');c.width=bitmap.width*scale;c.height=bitmap.height*scale;c.getContext('2d').drawImage(bitmap,0,0,c.width,c.height);bitmap.close();return c.toDataURL('image/jpeg',.76);
}
