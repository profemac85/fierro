const store={};
global.localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},key:i=>Object.keys(store)[i],get length(){return Object.keys(store).length}};
const capt={}; const valores={};
const el=(id)=>({classList:{add(){},remove(){},toggle(){}},style:{},set innerHTML(v){capt[id]=v},get innerHTML(){return capt[id]||""},set textContent(v){capt[id]=v},get textContent(){return capt[id]||""},appendChild(){},focus(){},select(){},blur(){},querySelector(){return null},getAnimations(){return[]},children:[{firstElementChild:{style:{}}},{firstElementChild:{style:{}}},{firstElementChild:{style:{}}},{firstElementChild:{style:{}}}],childElementCount:4,firstElementChild:{style:{}},onclick:null,disabled:false,get value(){return valores[id]||""},set value(v){valores[id]=v},className:"",dataset:{}});
global.capt=capt; global.valores=valores;
global.document={querySelector:s=>el(s.replace('#','')),querySelectorAll:()=>[],addEventListener(){},body:{classList:{add(){},remove(){},toggle(){}}},createElement:()=>el('x'),head:{appendChild(){}}};
global.window={scrollTo(){},AudioContext:null}; global.navigator={}; global.location={protocol:"file:"};
global.setInterval=()=>0; global.clearInterval=()=>{};
let ahora=new Date("2026-08-28T18:00:00.000Z").getTime();
const RealDate=Date;
global.Date=class extends RealDate{ constructor(...a){ return a.length? new RealDate(...a) : new RealDate(ahora) } static now(){ return ahora } };
global.avanzar=m=>{ ahora+=m*60000 };
global.ahoraMs=()=>ahora;

/* la fase ya no se guarda: se deriva de la semana. Para las pruebas se fuerza
   moviendo los cortes, así cualquier semana cae en la fase pedida. */
global.ponerFase = f => {
  if(f===1) localStorage.setItem("fz_cortes", JSON.stringify({f2:99,f3:99}));
  else if(f===2) localStorage.setItem("fz_cortes", JSON.stringify({f2:1,f3:99}));
  else localStorage.setItem("fz_cortes", JSON.stringify({f2:1,f3:1}));
};
