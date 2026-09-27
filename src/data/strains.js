import { classify, blendName } from "../lib/classifier.js";
export const STRAINS=[
  { id:"jb", name:"Jelly Breath", cross:"Mendo Breath × Do-Si-Dos",
    lot:"JB 071823", sample:"2310CH0095.0417", harvest:"07/18/2023",
    thc:"17.57", cbd:"0.04", cann:"19.86", terps:"2.32",
    aroma:"Dark, hoppy earth and cracked pepper over a diesel funk, with licorice and soft magnolia resin.",
    top:"Hops, lemon peel, magnolia, faint green fruit", mid:"Pepper, licorice, resin wood, soft floral", base:"Myrcene earth, hoppy spice, damp herb, dark sweetness",
    tags:[["earthy_dank","dark earth"],["spicy_warm","cracked pepper"],["gas_fuel","hoppy gas"],["dessert_creamy","licorice"],["floral_soft","magnolia resin"],["citrus_bright","lemon peel"]],
    copy:[
      "Jelly Breath leads with a darker kind of weight: dense myrcene earth, cracked pepper, and a hoppy diesel funk, edged with licorice and a soft magnolia resin.",
      "Myrcene sets the grounded base and caryophyllene builds the spice-and-gas frame; limonene adds a clean lemon cut, while bisabolol, linalool, and the farnesenes turn the finish softer and more perfumed. Gas reads as a supporting note here — an emergent balance, not a single loud terpene.",
    ],
    values:{myrcene:0.64,caryophyllene:0.35,limonene:0.23,humulene:0.16,farnesene_b:0.12,pinene_b:0.12,bisabolol:0.10,linalool:0.09,farnesene_a:0.09,phytol:0.06,valencene:0.05,fenchol:0.04},
    panel:[["β-Myrcene",0.64],["β-Caryophyllene",0.35],["Anisole",0.27],["δ-Limonene",0.23],["α-Humulene",0.16],["cis-β-Farnesene",0.12],["β-Pinene",0.12],["α-Bisabolol",0.10],["Linalool",0.09],["α-Farnesene",0.09],["trans-Phytol",0.06],["Valencene",0.05],["Endo-Fenchyl Alcohol",0.04]] },

  { id:"sdr", name:"Sunday Driver", cross:"Fruity Pebbles OG × Grape Pie",
    lot:"SDR 071823", sample:"2310CH0095.0413", harvest:"07/18/2023",
    thc:"23.11", cbd:"0.06", cann:"27.10", terps:"3.28",
    aroma:"Bright lemon oil folded into lavender and chamomile cream, finishing with soft pepper.",
    top:"Lemon oil, orange peel, bright citrus vapor", mid:"Lavender, chamomile, floral cream, soft spice", base:"Light herb, warm resin, sweet citrus, gentle pepper",
    tags:[["citrus_bright","lemon oil"],["floral_soft","lavender"],["floral_soft","chamomile cream"],["citrus_bright","soft citrus"],["spicy_warm","gentle spice"],["dessert_creamy","cream"]],
    copy:[
      "Sunday Driver is polished citrus over a soft floral interior: lemon oil first, then lavender, chamomile, and a creamy finish with just a whisper of pepper.",
      "Limonene leads the nose while linalool and bisabolol supply the lavender-cream softness; caryophyllene keeps a gentle spice spine underneath. It reads as the bright part of a lemon peel folded into a floral cream — refined, and built for a shelf where the nose matters as much as the number.",
    ],
    values:{limonene:0.91,linalool:0.49,caryophyllene:0.39,bisabolol:0.17,humulene:0.14,pinene_b:0.14,farnesene_b:0.14,ocimene:0.12,valencene:0.11,fenchol:0.10,terpineol:0.10,myrcene:0.10,farnesene_a:0.06,geranyl_acetate:0.05,phytol:0.04,camphene:0.03},
    panel:[["δ-Limonene",0.91],["Linalool",0.49],["β-Caryophyllene",0.39],["Anisole",0.19],["α-Bisabolol",0.17],["α-Humulene",0.14],["β-Pinene",0.14],["cis-β-Farnesene",0.14],["Ocimene",0.12],["Valencene",0.11],["Endo-Fenchyl Alcohol",0.10],["α-Terpineol",0.10],["β-Myrcene",0.10],["α-Farnesene",0.06],["Geranyl Acetate",0.05],["trans-Phytol",0.04],["Camphene",0.03]] },

  { id:"km", name:"Kush Mints", cross:"Bubba Kush × Animal Mints",
    lot:"KM 071823", sample:"2310CH0095.0412", harvest:"07/18/2023",
    thc:"34.64", cbd:"0.08", cann:"40.39", terps:"3.17",
    aroma:"Lemon oil and lavender up front, green resin and a cool mint-herb lift over a grounded kush finish.",
    top:"Lemon oil, green apple resin, mint-herb lift", mid:"Lavender, citrus rind, soft floral, pepper", base:"Kush earth, myrcene body, resin wood, hoppy spice",
    tags:[["citrus_bright","lemon oil"],["floral_soft","lavender"],["fruity_sweet","green resin"],["herbal_woody","mint-herb"],["earthy_dank","kush earth"],["spicy_warm","soft spice"]],
    copy:[
      "Kush Mints comes through sharper than the name suggests: lemon oil first, lavender close behind, then green resin and a quiet mint-herb lift cooling through the finish.",
      "Limonene drives the brightness and linalool gives the soft lavender center, while myrcene and caryophyllene hold the kush structure underneath and the farnesenes add a fresh green-resin note. Dense and high-definition — citrus on the inhale, floral resin through the middle, a grounded finish with enough lift to stay alive.",
    ],
    values:{limonene:0.91,linalool:0.50,myrcene:0.35,caryophyllene:0.28,farnesene_b:0.19,pinene_b:0.14,farnesene_a:0.14,valencene:0.11,fenchol:0.10,terpineol:0.10,humulene:0.09,bisabolol:0.04,nerolidol:0.04,terpinolene:0.03,phytol:0.03,camphene:0.03},
    panel:[["δ-Limonene",0.91],["Linalool",0.50],["β-Myrcene",0.35],["β-Caryophyllene",0.28],["cis-β-Farnesene",0.19],["β-Pinene",0.14],["α-Farnesene",0.14],["Valencene",0.11],["Endo-Fenchyl Alcohol",0.10],["α-Terpineol",0.10],["α-Humulene",0.09],["Anisole",0.09],["α-Bisabolol",0.04],["trans-Nerolidol",0.04],["Terpinolene",0.03],["trans-Phytol",0.03],["Camphene",0.03]] },
];
export const SBK=Object.fromEntries(STRAINS.map(s=>[s.id,s]));
STRAINS.forEach(s=>{ s.c=classify(s.values); s.blend=blendName(s.c); });
