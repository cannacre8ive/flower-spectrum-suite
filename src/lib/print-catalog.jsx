import { useMemo, useCallback } from 'react';
import { useFlowerCatalog } from './catalog.jsx';
import { productToPrint,printToProduct } from './product-model.js';
export function usePrintCatalog() {
 const [products,setProducts]=useFlowerCatalog();
 const rows=useMemo(()=>products.map(productToPrint),[products]);
 const setRows=useCallback(update=>setProducts(prev=>{const old=prev.map(productToPrint);const next=typeof update==='function'?update(old):update;return next.map(row=>{const original=prev.find(p=>p.id===row.id);return row===old.find(p=>p.id===row.id)?original:printToProduct(row,original)})}),[setProducts]);
 return [rows,setRows];
}
