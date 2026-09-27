import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { withClassification } from './product-model.js';
import { DEFAULT_PRODUCTS } from '../data/products.js';
const Context = createContext(null);
const KEY='fs-suite-catalog-v1';
export function CatalogProvider({children}) {
  const [products,setProducts]=useState(()=>{try{const data=JSON.parse(localStorage.getItem(KEY));return Array.isArray(data)&&data.every(p=>p&&typeof p.id==='string'&&typeof p.name==='string')?data:structuredClone(DEFAULT_PRODUCTS);}catch{return structuredClone(DEFAULT_PRODUCTS)}});
  const [storageError,setStorageError]=useState(false);
  useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(products));setStorageError(false);}catch{setStorageError(true)}},[products]);
  const current=useMemo(()=>products.map(withClassification),[products]);
  return <Context.Provider value={[current,setProducts]}>{storageError&&<div role="status" className="storage-warning">Browser storage is unavailable. Export your CSV before closing this tab.</div>}{children}</Context.Provider>;
}
export function useCatalog(){return useContext(Context)}

export function useFlowerCatalog(){
 const [all,setAll]=useCatalog();const flower=useMemo(()=>all.filter(p=>p.category==='flower'),[all]);
 const setFlower=update=>setAll(prev=>{const next=typeof update==='function'?update(prev.filter(p=>p.category==='flower')):update;return [...prev.filter(p=>p.category!=='flower'),...next.filter(p=>p.category==='flower')]});
 return [flower,setFlower];
}
