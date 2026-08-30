let f=0; const ok=(c,m)=>{ if(!c){f++;console.log("FALLA:",m)} else console.log("ok:",m) };
ponerFase(2); semana=1;
const A=sesionDe("A"), C=sesionDe("C");

// --- cobertura del modo ---
ok(cambiables(A)===5,"sesion A: las 5 casillas cambian, porque sin equipo tampoco hay barra, hay "+cambiables(A));
ok(cambiables(C)===6,"sesion C: las 6 casillas cambian, hay "+cambiables(C));
ok(ejActivo(A,1,0)==="press_banca","por defecto arranca con mancuernas");
ok(modoSesion(A)==="normal","modo normal sin cambios");

// --- nivel casilla ---
alternarCasilla("A",1,0);
ok(ejActivo(A,1,0)==="flex_suelo","alternar una casilla la pasa a calistenia");
ok(ejActivo(A,1,1)==="remo_inclinado","las otras casillas no se tocan");
ok(esManual(A,1,0),"la casilla queda marcada como manual");
ok(modoSesion(A)==="mixto","con una casilla cambiada el modo es mixto");
alternarCasilla("A",1,0);
ok(ejActivo(A,1,0)==="press_banca","alternar de nuevo vuelve al original");
ok(modoSesion(A)==="normal","y el modo vuelve a normal");

// una casilla sin sustituto no cambia
alternarCasilla("A",2,1);
ok(ejActivo(A,2,1)==="remo_mesa_supino","la dominada tambien cambia: sin equipo no hay barra");
alternarCasilla("A",2,1);

// --- nivel sesion ---
alternarSesion("A");
ok(ejActivo(A,1,0)==="flex_suelo" && ejActivo(A,1,1)==="remo_mesa" &&
   ejActivo(A,2,0)==="flex_pica" && ejActivo(A,3,0)==="laterales_iso",
   "el interruptor cambia las 5 casillas");
ok(ejActivo(A,2,1)==="remo_mesa_supino","la dominada pasa al remo supino bajo la mesa");
ok(modoSesion(A)==="calistenia","con todas cambiadas el modo es calistenia");
ok(!esManual(A,1,0),"con el interruptor puesto ninguna queda marcada como manual");
alternarSesion("A");
ok(ejActivo(A,1,0)==="press_banca" && modoSesion(A)==="normal","apagar el interruptor devuelve todas");

// manual manda sobre el interruptor
alternarCasilla("A",1,0);
ok(ejActivo(A,1,0)==="flex_suelo" && esManual(A,1,0),"cambio manual con interruptor apagado");
alternarSesion("A");
ok(nCambiadas(A)===5,"el interruptor pasa por encima de la manual");
volverAOriginal("A");
ok(nCambiadas(A)===0 && !casillasHoy().sw.A,"volver a la original limpia todo");

// --- lo registrado nunca se reasigna ---
setRonda("A","press_banca",0,{kg:10,reps:12});
setRonda("A","press_banca",1,{kg:10,reps:11});
alternarCasilla("A",1,0);
ok(ejActivo(A,1,0)==="flex_suelo","cambio de casilla con rondas ya registradas");
ok(logDe("A","press_banca").rondas.length===2,"lo registrado sigue bajo el ejercicio anterior");
ok(!logDe("A","flex_suelo"),"el ejercicio nuevo arranca vacio");
setRonda("A","flex_suelo",0,{kg:0,reps:18});
ok(logDe("A","press_banca").rondas[0].reps===12,"los dos historiales conviven sin mezclarse");
ok(logDe("A","flex_suelo").rondas[0].reps===18,"y cada uno guarda lo suyo");

// --- la estructura no se toca ---
const celdas=celdasSesion(A);
ok(celdas.length===14,"sesion A sigue teniendo 14 celdas en fase 2, tiene "+celdas.length);
ok(celdas.filter(c=>c.tramo===1).length===6,"bloque 1 sigue con 3 rondas x 2 ejercicios");
ok(rondasDe(1,A)===3 && rondasDe(3,A)===2,"rondas por tramo intactas");

// --- la sesion cuenta igual ---
celdasSesion(A).forEach(c=>{ if(!logDe("A",c.k)||!rondaValida((logDe("A",c.k)||{rondas:[]}).rondas[c.ronda]))
  setRonda("A",c.k,c.ronda, esTiempo(c.k)?{seg:35}:{kg:0,reps:15}); });
terminarSesionDe(1,"A",true);
const d=sesionHecha(1,"A");
ok(!!d,"la sesion mixta se termina igual");
ok(d.modo==="mixto","guarda el modo mixto, guardo "+d.modo);
ok(d.seriesTotales>0 && d.rondasCompletadas>0,"cuenta series y rondas normalmente");
ok(calcRacha().n===1,"suma a la racha igual que cualquier otra");
ok(!!lget("logros",{}).arranque,"desbloquea logros igual");

// --- el estado dura solo el dia ---
const c=casillasHoy(); c.fecha="2020-01-01"; lset("casillas",c);
ok(nCambiadas(sesionDe("A"))===0,"al cambiar de dia las casillas vuelven a mancuernas");

// --- la escalera de flexiones esta encadenada ---
let e="flex_arqueras", cad=[e];
while(LIB[e].progresaDe){ e=LIB[e].progresaDe; cad.push(e); }
ok(cad.length===6,"la escalera tiene 6 peldanos, tiene "+cad.length);
semana=2;
ok(ultimaVez("A","flex_pies")?.k==="flex_suelo","el peldano hereda el historial del anterior");

// --- sin equipamiento: ningun sustituto puede pedir mancuerna, banda o barra ---
const subs=[...new Set(Object.keys(SIN_PESO).map(k=>SIN_PESO[k]))];
ok(subs.every(k=>LIB[k]),"todos los sustitutos existen");
const conEquipo=subs.filter(k=>["mancuerna","kettlebell","banda"].includes(LIB[k].tipo));
ok(conEquipo.length===0,"ningun sustituto usa mancuerna, kettlebell ni banda: "+(conEquipo.join(",")||"ok"));
// la barra de dominadas tampoco: se detecta por el texto de la ficha
const conBarra=subs.filter(k=>/barra (alta|baja|de dominadas)|de la barra/i.test(LIB[k].how.join(" ")+LIB[k].n));
ok(conBarra.length===0,"ningun sustituto usa la barra: "+(conBarra.join(",")||"ok"));
// dos casillas de una misma sesion no pueden compartir sustituto: los registros
// se guardan por ejercicio y uno pisaria al otro
SESIONES.forEach(ses=>{
  const s=[];
  [1,2,3].forEach(t=>ejerciciosDeTramo(ses,t).forEach((it,i)=>{
    const base=ejBase(ses,t,i), alt=LIB[base]&&LIB[base].sinPeso;
    if(alt) s.push(alt);
  }));
  ok(new Set(s).size===s.length,"sesion "+ses.id+": ningun sustituto se repite");
});
// toda casilla que use equipo tiene que tener sustituto
SESIONES.forEach(ses=>{
  const sin=[];
  [1,2,3].forEach(t=>ejerciciosDeTramo(ses,t).forEach((it,i)=>{
    const b=ejBase(ses,t,i);
    if(!LIB[b].sinPeso && ["mancuerna","kettlebell","banda"].includes(LIB[b].tipo)) sin.push(b);
  }));
  ok(sin.length===0,"sesion "+ses.id+": toda casilla con equipo tiene sustituto "+(sin.join(",")||""));
});
// y todos tienen demostracion visual
const sinVis=subs.filter(k=>!LIB[k].img&&!esquemaSVG(k));
ok(sinVis.length===0,"todos los sustitutos tienen imagen o esquema "+(sinVis.join(",")||""));

console.log(f? "\n*** "+f+" FALLAS ***":"\ncalistenia: todo verde");
process.exit(f?1:0);
