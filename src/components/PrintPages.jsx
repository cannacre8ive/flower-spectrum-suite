import {useLayoutEffect,useRef,useState} from 'react';
// Measure the source designs at their final physical size. Fill columns with whole
// rows/cards, repeating group labels and page furniture at every page boundary.
export default function PrintPages({children,orientation,columns,zoom}) {
 const source=useRef(null),output=useRef(null);const [count,setCount]=useState(0);const [error,setError]=useState('');
 useLayoutEffect(()=>{
 let cancelled=false;
 const paginate=()=>{
 if(cancelled)return;const sheet=source.current?.querySelector('.fs-sheet'),host=output.current;if(!sheet||!host)return;host.replaceChildren();
 const w=(orientation==='landscape'?11:8.5)*96,h=(orientation==='landscape'?8.5:11)*96;
 const items=[...sheet.querySelectorAll('.fs-row,.fs-pick,.fs-deal,.fs-card')];
 const first=sheet.firstElementChild;const header=(first.querySelector('.fs-row,.fs-pick,.fs-deal,.fs-card')?first.firstElementChild:first).cloneNode(true);
 const footer=[...sheet.children].filter(el=>!el.classList.contains('fs-no-print')).at(-1)?.cloneNode(true);let page,body,col,colIndex=0,groupKey='',pages=0,tooTall=false;
 function newPage(){page=document.createElement('section');page.className='fs-printed-page';Object.assign(page.style,{width:w+'px',height:h+'px',background:'#f4eee3',color:'#1a1816',padding:'28px 40px 20px',display:'flex',flexDirection:'column',boxSizing:'border-box',margin:'0 auto 24px',overflow:'hidden'});page.append(header.cloneNode(true));body=document.createElement('div');Object.assign(body.style,{display:'grid',gridTemplateColumns:`repeat(${columns},minmax(0,1fr))`,gap:'24px',flex:'1',minHeight:'0',paddingTop:'12px',overflow:'hidden'});page.append(body);for(let i=0;i<columns;i++){let c=document.createElement('div');c.className='print-column';body.append(c)}if(footer){let f=footer.cloneNode(true);f.style.padding='10px 0 0';page.append(f)}const n=document.createElement('div');n.className='print-page-number';n.textContent=`FLOWER SPECTRUM · PAGE ${++pages}`;page.append(n);host.append(page);colIndex=0;col=body.children[0];groupKey='';}
 function nextColumn(){colIndex++;if(colIndex>=columns)newPage();else {col=body.children[colIndex];groupKey=''}}
 newPage();
 for(const item of items){
 const group=item.closest('.fs-group,.fs-terp-group');const label=group?.firstElementChild;const key=label?.textContent||'';
 let block;
 function append(){block=document.createElement('div');block.className='print-block';if(label&&key!==groupKey){const l=label.cloneNode(true);l.dataset.repeatedGroup='true';block.append(l)}block.append(item.cloneNode(true));col.append(block)}
 append();
 if(block.getBoundingClientRect().bottom>body.getBoundingClientRect().bottom+0.5&&col.children.length>1){block.remove();nextColumn();append()}
 if(block.getBoundingClientRect().bottom>body.getBoundingClientRect().bottom+0.5){tooTall=true;page.style.overflow='visible';body.style.overflow='visible'}
 groupKey=key;
 }
 if(!items.length){const empty=document.createElement('p');empty.textContent='No products match this selection.';col.append(empty)}
 host.querySelectorAll('.fs-no-print').forEach(x=>x.remove());
 host.querySelectorAll('.print-page-number').forEach((n,i)=>n.textContent=`FLOWER SPECTRUM · PAGE ${i+1} OF ${pages}`);
 setCount(pages);setError(tooTall?'A card is taller than one page. Use fewer columns, portrait orientation, or shorten its content before printing.':'');
 };
 paginate();document.fonts.ready.then(paginate);return()=>{cancelled=true};
 },[children,orientation,columns]);
 return <><p className="fs-no-print print-count" role="status">{count} {count===1?'page':'pages'} · US Letter · Print at 100% / Actual size{error&&<strong role="alert">{error}</strong>}</p><div ref={source} className="print-measure" aria-hidden="true">{children}</div><div className="print-scale" style={{zoom}}><div ref={output} className="print-pages"/></div></>;
}
