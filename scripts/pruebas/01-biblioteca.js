let f=0; const ok=(c,m)=>{ if(!c){f++;console.log("FALLA:",m)} };
const claves=Object.keys(LIB);
ok(claves.length===40,"40 ejercicios (20 del programa, 2 variantes de fase 3, 18 de calistenia), hay "+claves.length);
ok(claves.every(k=>LIB[k].how&&LIB[k].cue&&LIB[k].err&&LIB[k].n&&LIB[k].m&&LIB[k].patron&&LIB[k].tipo),"todas las fichas completas");
ok(claves.every(k=>LIB[k].how.length>=4&&LIB[k].how.length<=5),"how entre 4 y 5 pasos");
ok(claves.every(k=>LIB[k].img||esquemaSVG(k)),"todos tienen visual");
const usadas=new Set(); SESIONES.forEach(s=>[].concat(s.b1,s.b2,s.cierre.ej).forEach(it=>{usadas.add(it.k); if(VARIANTES[it.k])usadas.add(VARIANTES[it.k])}));
ok([...usadas].every(k=>LIB[k]),"todas las claves del programa existen en LIB");
ok(usadas.size===22,"el programa con mancuernas usa 22, usa "+usadas.size);
const conCalistenia=new Set(usadas);
Object.keys(SIN_PESO).forEach(k=>conCalistenia.add(SIN_PESO[k]));
ok([...conCalistenia].every(k=>LIB[k]),"todos los sustitutos existen en LIB");
ok(Object.keys(ESQ).every(k=>esquemaSVG(k).includes('esq animado')&&esquemaSVG(k).includes('esq estatico')),"esquemas con capa animada y estatica");
ok(Object.keys(VARIANTES).every(k=>LIB[VARIANTES[k]].progresaDe===k),"las variantes declaran progresaDe");

// --- esquemas SVG: geometria, encuadre y keyframes ---
const css=cssEsquemas();
const kf=css.match(/@keyframes/g)||[];
ok(kf.length>=Object.keys(ESQ).length,"hay al menos un keyframe por esquema, hay "+kf.length);
// un keyframe vacio no da error en ninguna parte: deja la figura quieta y ya
ok(!/\{\s*\}/.test(css) && !/46%,58%\{transform:\}/.test(css),"ningun keyframe queda vacio");
ok((css.match(/rotate\(-?[\d.]+deg\)/g)||[]).length===kf.length,"todas las rotaciones llevan deg (CSS, no atributo SVG)");
ok((css.match(/translate\([-\d.]+px,[-\d.]+px\)/g)||[]).length>=kf.length*2,"todos los translate llevan px");
Object.keys(ESQ).forEach(k=>{
  const def=ESQ[k].rig(), c=def.caja;
  ok(!!c && c[2]>c[0] && c[3]>c[1], k+": declara una caja valida");
  const prop=(c[3]-c[1])/(c[2]-c[0]);
  const alto=Math.round(Math.max(96,Math.min(200,200*prop)));
  const e=encuadre(c,200,alto);
  const dentro = c[0]*e.zoom+e.dx>=-0.5 && c[2]*e.zoom+e.dx<=200.5 &&
                 c[1]*e.zoom+e.dy>=-0.5 && c[3]*e.zoom+e.dy<=alto+0.5;
  ok(dentro, k+": la figura cabe entera en su lienzo");
  const svg=esquemaSVG(k);
  ok(/viewBox="0 0 200 \d+"/.test(svg), k+": el lienzo animado arranca en 0 0 (si no, se descuadran los pivotes)");
  ok(svg.includes("inicio")&&svg.includes("fin"), k+": la version sin movimiento rotula las dos poses");
});

ponerFase(2);
const cuenta={};
SESIONES.forEach(s=>celdasSesion(s).forEach(c=>{cuenta[c.k]=(cuenta[c.k]||0)+1}));
ok(cuenta.gemelo===6,"gemelo 6 series/semana, hay "+cuenta.gemelo);
ok(cuenta.curl_inclinado===2&&cuenta.triceps===2,"brazo directo 4 series");
const pecho=cuenta.press_banca+cuenta.flex_pies+cuenta.press_inclinado;
const espalda=cuenta.remo_inclinado+cuenta.remo_una_mano+cuenta.dominada+cuenta.face_pull;
const isquio=cuenta.rdl+cuenta.hip_thrust+cuenta.curl_femoral+cuenta.puente;
const cuadri=cuenta.bulgara+cuenta.goblet+cuenta.zancada;
ok(pecho===9,"pecho 9 series, hay "+pecho);
ok(espalda===12,"espalda 12 series, hay "+espalda);
ok(isquio===11,"isquio y gluteo 11 series, hay "+isquio);
ok(cuadri===8,"cuadriceps 8 series, hay "+cuadri);
console.log("volumen fase 2:", JSON.stringify(cuenta));
console.log("celdas/sesion fase 2:", SESIONES.map(s=>s.id+"="+celdasSesion(s).length).join(" "));
ponerFase(1);
console.log("celdas/sesion fase 1:", SESIONES.map(s=>s.id+"="+celdasSesion(s).length).join(" "));
console.log(f? "*** "+f+" FALLAS ***":"biblioteca y volumen: todo verde");
process.exit(f?1:0);
