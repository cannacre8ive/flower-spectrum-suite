import * as pdfjs from 'pdfjs-dist';
import workerURL from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc=workerURL;
export const openPDF=data=>pdfjs.getDocument({data:new Uint8Array(data)}).promise;
function pdfItemsToLines(items){
  const rows=[];
  (items||[]).forEach(item=>{
    const str=String(item.str||"").trim();
    if(!str) return;
    const x=Number(item.transform&&item.transform[4])||0;
    const y=Number(item.transform&&item.transform[5])||0;
    let row=rows.find(r=>Math.abs(r.y-y)<=2.5);
    if(!row){ row={y,items:[]}; rows.push(row); }
    row.items.push({str,x,width:Number(item.width)||0});
  });
  return rows.sort((a,b)=>b.y-a.y).map(row=>{
    const cells=row.items.sort((a,b)=>a.x-b.x);
    let line="",cursor=null;
    cells.forEach(cell=>{
      if(cursor!=null){
        const gap=cell.x-cursor;
        const avg=Math.max(2,cell.width/Math.max(cell.str.length,1));
        line += gap>Math.max(9,avg*2.2) ? "\t" : " ";
      }
      line+=cell.str;
      cursor=cell.x+cell.width;
    });
    return line.trim();
  }).filter(Boolean).join("\n");
}


export {pdfItemsToLines};
