/* Harness de las pruebas: finge localStorage y el DOM mínimo que la app toca.
   Lo que se pinta en innerHTML queda en `capt[selector]` para poder mirarlo,
   y `valores[selector]` alimenta el .value de los inputs. */
const store = {};
global.localStorage = {
  getItem:k => (k in store ? store[k] : null),
  setItem:(k, v) => { store[k] = String(v); },
  removeItem:k => { delete store[k]; },
  key:i => Object.keys(store)[i],
  get length(){ return Object.keys(store).length; }
};
const capt = {}, valores = {};
function el(sel){
  return {
    classList:{add(){}, remove(){}, toggle(){}, contains(){ return false; }},
    style:{}, dataset:{},
    set innerHTML(v){ capt[sel] = v; }, get innerHTML(){ return capt[sel] || ""; },
    set outerHTML(v){ capt[sel + ":outer"] = v; },
    textContent:"", className:"",
    appendChild(){}, focus(){}, select(){}, blur(){}, remove(){},
    querySelector(){ return null; }, querySelectorAll(){ return []; },
    addEventListener(){}, onclick:null, disabled:false,
    get value(){ return valores[sel] == null ? "" : valores[sel]; }, set value(v){ valores[sel] = v; },
    parentElement:null, isConnected:true
  };
}
global.document = {
  querySelector:sel => el(sel), querySelectorAll:() => [],
  addEventListener(){}, body:{classList:{add(){}, remove(){}, toggle(){}}},
  createElement:() => el("nuevo"), head:{appendChild(){}}, hidden:false
};
global.window = {scrollTo(){}, AudioContext:null};
/* en node 21+ `navigator` es un global de solo lectura: hay que redefinirlo */
Object.defineProperty(globalThis, "navigator", {value:{}, configurable:true, writable:true});
global.location = {protocol:"file:"};
global.setInterval = () => 0; global.clearInterval = () => {};
global.capt = capt; global.valores = valores; global.store = store;
/* setTimeout real molesta (deja el proceso vivo): se ejecuta de inmediato */
global.setTimeout = fn => { try{ fn(); }catch(e){} return 0; };
global.clearTimeout = () => {};

/* registro real de la v1 (agosto y septiembre de 2026), en el formato de sus
   claves fz_*, para probar la migración con datos de verdad */
global.fixtureV1 = function(){
  const ses = (w, sid, fecha, dur, series, ton, modo) =>
    store["fz_sesion_" + w + "_" + sid] = JSON.stringify({fecha:fecha, duracionReal:dur, seriesTotales:series, tonelaje:ton, modo:modo || "normal"});
  const log = (w, sid, k, fecha, rondas) =>
    store["fz_log_" + sid + "_" + k + "_s" + w] = JSON.stringify({fecha:fecha, rondas:rondas});
  const f = d => "2026-" + d + "T15:00:00.000Z";
  ses(1, "A", f("08-29"), 20, 10, 350); ses(1, "B", f("08-29"), 25, 10, 1348);
  ses(1, "C", f("09-03"), 25, 12, 800, "mixto"); ses(1, "D", f("09-12"), 23, 10, 1875);
  ses(2, "A", f("09-12"), 25, 10, 1110); ses(2, "B", f("09-14"), 17, 10, 1820);
  ses(2, "C", f("09-13"), 33, 12, 1893); ses(2, "D", f("09-16"), 23, 10, 2629);
  log(1, "A", "press_banca", f("08-29"), [{kg:0, reps:10}, {kg:0, reps:10}]);
  log(1, "A", "remo_inclinado", f("08-29"), [{kg:0, reps:10}, {kg:0, reps:10}]);
  log(1, "A", "press_hombro", f("08-29"), [{kg:10, reps:10}, {kg:10, reps:10, rec:1}]);
  log(1, "A", "dominada", f("08-29"), [{kg:0, reps:5}, {kg:0, reps:4}]);
  log(1, "A", "laterales", f("08-29"), [{kg:7.5, reps:10}, {kg:7.5, reps:10}]);
  log(1, "B", "bulgara", f("08-29"), [{kg:7.5, reps:15, rec:1}, {kg:7.5, reps:15}]);
  log(1, "B", "gemelo", f("08-29"), [{kg:15, reps:20, rec:1}, {kg:15, reps:20}]);
  log(1, "B", "goblet", f("08-29"), [{kg:10, reps:20, rec:1}, {kg:10, reps:12}]);
  log(1, "B", "plancha", f("08-29"), [{seg:45}, {seg:45}]);
  log(1, "B", "zancada", f("08-29"), [{kg:7.5, reps:15, rec:1}, {kg:7.5, reps:12}]);
  log(1, "C", "flex_pies", f("09-03"), [{kg:0, reps:12, rec:1}, {kg:0, reps:15, rec:1}]);
  log(1, "C", "remo_una_mano", f("09-03"), [{kg:10, reps:20, rec:1}, {kg:10, reps:20}]);
  log(1, "C", "flex_diamante", f("09-03"), [{kg:0, reps:10}, {kg:0, reps:10}]);
  log(1, "C", "angel_suelo", f("09-03"), [{kg:0, reps:10}, {kg:0, reps:10}]);
  log(1, "C", "curl_inclinado", f("09-03"), [{kg:10, reps:10}, {kg:10, reps:10}]);
  log(1, "C", "triceps", f("09-03"), [{kg:10, reps:10}, {kg:10, reps:10}]);
  log(1, "D", "rdl", f("09-12"), [{kg:12.5, reps:20, rec:1}, {kg:12.5, reps:20}]);
  log(1, "D", "gemelo", f("09-12"), [{kg:12.5, reps:20}, {kg:12.5, reps:20}]);
  log(1, "D", "hip_thrust", f("09-12"), [{kg:12.5, reps:20, rec:1}, {kg:12.5, reps:20}]);
  log(1, "D", "curl_femoral", f("09-12"), [{kg:12.5, reps:15}, {kg:12.5, reps:15}]);
  log(1, "D", "puente", f("09-12"), [{kg:0, reps:10}, {kg:0, reps:10}]);
  log(2, "A", "press_banca", f("09-12"), [{kg:10, reps:15}, {kg:10, reps:15}]);
  log(2, "A", "remo_inclinado", f("09-12"), [{kg:14, reps:15, rec:1}, {kg:14, reps:15}]);
  log(2, "A", "press_hombro", f("09-12"), [{kg:10, reps:12}, {kg:10, reps:12}]);
  log(2, "A", "dominada", f("09-12"), [{kg:0, reps:10, rec:1}, {kg:0, reps:5}]);
  log(2, "A", "laterales", f("09-12"), [{kg:7.5, reps:10}, {kg:7.5, reps:10}]);
  log(2, "B", "bulgara", f("09-14"), [{kg:10, reps:12, rec:1}, {kg:10, reps:15, rec:1}]);
  log(2, "B", "gemelo", f("09-14"), [{kg:15, reps:15}, {kg:15, reps:15}]);
  log(2, "B", "goblet", f("09-14"), [{kg:20, reps:20, rec:1}, {kg:20, reps:20}]);
  log(2, "B", "plancha", f("09-14"), [{seg:45}, {seg:45}]);
  log(2, "B", "zancada", f("09-14"), [{kg:10, reps:15, rec:1}, {kg:10, reps:15}]);
  log(2, "C", "flex_pies", f("09-13"), [{kg:0, reps:15}, {kg:0, reps:15}]);
  log(2, "C", "remo_una_mano", f("09-13"), [{kg:18, reps:15, rec:1}, {kg:18, reps:15, rec:1}]);
  log(2, "C", "press_inclinado", f("09-13"), [{kg:13.5, reps:15, rec:1}, {kg:13.5, reps:15}]);
  log(2, "C", "face_pull", f("09-13"), [{kg:5.6, reps:16, rec:1}, {kg:22.5, reps:15, rec:1}]);
  log(2, "C", "curl_inclinado", f("09-13"), [{kg:9, reps:11, rec:1}, {kg:9, reps:10}]);
  log(2, "C", "triceps", f("09-13"), [{kg:15.8, reps:11, rec:1}, {kg:15.8, reps:10}]);
  log(2, "D", "rdl", f("09-16"), [{kg:17, reps:10, rec:1}, {kg:17, reps:20}]);
  log(2, "D", "gemelo", f("09-16"), [{kg:12.5, reps:20}, {kg:12.5, reps:20}]);
  log(2, "D", "hip_thrust", f("09-16"), [{kg:20, reps:15, rec:1}, {kg:22, reps:17, rec:1}]);
  log(2, "D", "curl_femoral", f("09-16"), [{kg:35, reps:12, rec:1}, {kg:35, reps:15, rec:1}]);
  log(2, "D", "puente", f("09-16"), [{kg:0, reps:10}, {kg:0, reps:10}]);
  store["fz_logros"] = JSON.stringify({arranque:f("08-29"), semana_llena:f("09-12"), racha_8:f("09-16"), primer_record:f("08-29"), records_10:f("09-03"), techo:f("08-29")});
  store["fz_semana"] = "3";
};
