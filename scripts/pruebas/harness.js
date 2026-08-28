const store={};
global.localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},key:i=>Object.keys(store)[i],get length(){return Object.keys(store).length}};
const el=()=>({classList:{add(){},remove(){},toggle(){}},style:{},set innerHTML(v){},get innerHTML(){return""},textContent:"",appendChild(){},children:[{firstElementChild:{style:{}}},{firstElementChild:{style:{}}},{firstElementChild:{style:{}}},{firstElementChild:{style:{}}}],childElementCount:4,firstElementChild:{style:{}},onclick:null,disabled:false,value:"",className:"",dataset:{}});
global.document={querySelector:()=>el(),querySelectorAll:()=>[],addEventListener(){},body:{classList:{add(){},remove(){},toggle(){}}},createElement:()=>el(),head:{appendChild(){}}};
global.window={scrollTo(){},AudioContext:null}; global.navigator={}; global.location={protocol:"file:"};
global.setInterval=()=>0; global.clearInterval=()=>{};
