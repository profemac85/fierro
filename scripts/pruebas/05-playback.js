let f=0; const ok=(c,m)=>{ if(!c){f++;console.log("FALLA:",m)} else console.log("ok:",m) };
ponerFase(1); semana=1; lset("semana",1);
const A=sesionDe("A");

// --- la secuencia de pasos ---
const pasos=pasosSesion(A);
ok(pasos[0].tipo==="prep","el primer paso es la preparacion");
ok(pasos.length===celdasSesion(A).length+1,"un paso por serie mas la preparacion, hay "+pasos.length);
ok(pasos[1].k==="press_banca" && pasos[1].ronda===0,"despues viene la primera serie del primer ejercicio");
ok(pasos[2].k==="remo_inclinado","alterna al segundo del par, no repite el primero");
ok(pasos[3].k==="press_banca" && pasos[3].ronda===1,"la ronda 2 vuelve al primero");

// --- la preparacion trae instrucciones ---
const movTorso=MOVILIDAD[tipoMovilidad("A")], movPierna=MOVILIDAD[tipoMovilidad("B")];
ok(tipoMovilidad("A")==="torso" && tipoMovilidad("C")==="torso","A y C son de torso");
ok(tipoMovilidad("B")==="pierna" && tipoMovilidad("D")==="pierna","B y D son de pierna");
ok(movTorso.every(m=>m.n&&m.c&&m.d&&m.d.length>40),"cada movilidad de torso explica como se hace");
ok(movPierna.every(m=>m.n&&m.c&&m.d&&m.d.length>40),"cada movilidad de pierna explica como se hace");
const ap=textoAproximacion(A);
ok(ap.d.includes("press de banca"),"la aproximacion nombra el ejercicio del dia: "+ap.c);
ok(textoAproximacion(sesionDe("D")).d.includes("peso muerto"),"y cambia segun la sesion");
ok(ap.d.includes("No se anota"),"deja claro que la aproximacion no cuenta como serie");

// --- el estimado de cada serie ---
ok(estimadoSerie(pasos[1])===15*3000,"press 8 a 15: estima el tope por 3 s");
const pPlancha=pasosSesion(sesionDe("B")).find(p=>p.tipo==="serie"&&esTiempo(p.k));
ok(estimadoSerie(pPlancha)===45000,"la plancha estima su tope de tiempo (45 s)");
ok(esDeTiempo(pPlancha),"la plancha es de tiempo");
ok(!esDeTiempo(pasos[1]),"el press no");

// --- el flujo: empezar, avanzar, anotar ---
sesionSel="A"; empezarSesion();
let s=sa();
ok(s.idx===0,"la sesion arranca en la preparacion");
ok(!!s.ejIniISO,"y con el reloj de la preparacion corriendo");
pbCheck();
s=sa();
ok(s.idx===1,"el check de la preparacion pasa a la primera serie sin descanso");
ok(!s.finDescansoISO,"no descansa despues de la preparacion");
ok(!!s.ejIniISO,"el reloj de la serie parte solo");

pbCheck();
s=sa();
const log=logDe("A","press_banca");
ok(!!log && rondaValida(log.rondas[0]),"el check anota la serie sin escribir nada");
ok(!!s.finDescansoISO,"y arranca el descanso");
ok(s.idx===1,"durante el descanso el paso sigue siendo la serie recien hecha (para corregirla)");
const falta=new Date(s.finDescansoISO).getTime()-ahoraMs();
ok(falta>58000 && falta<=60000,"el descanso es de 60 s, es de "+Math.round(falta/1000));

// corregir lo anotado durante el descanso
valores["pbReps"]="9"; valores["pbKg"]="12";
pbGuardarCampos();
ok(logDe("A","press_banca").rondas[0].reps===9,"corregir el campo reemplaza lo anotado");
ok(logDe("A","press_banca").rondas[0].kg===12,"y guarda el peso");

// el descanso termina y avanza solo
avanzar(1.1);
tick();
s=sa();
ok(s.idx===2,"al vencer el descanso pasa solo al siguiente ejercicio");
ok(!s.finDescansoISO,"y sale del descanso");
ok(pasoActual(s,A).paso.k==="remo_inclinado","el siguiente es el otro del par");

// --- atras y saltar ---
pbAtras(); ok(sa().idx===1,"atras retrocede un paso");
pbSaltar(); ok(sa().idx===2,"saltar avanza sin anotar");
const antes=JSON.stringify(logDe("A","remo_inclinado"));
pbSaltar();
ok(JSON.stringify(logDe("A","remo_inclinado"))===antes,"saltar no anota nada");

// --- no pisa lo ya anotado al volver atras ---
pbIr(1);
pbCheck();
ok(logDe("A","press_banca").rondas[0].reps===9,"volver a pasar por una serie ya anotada no la pisa");

// --- la ultima serie no lleva descanso ---
const total=pasosSesion(A).length;
pbIr(total-1);
pbCheck();
s=sa();
ok(s.idx===total,"la ultima serie cierra la sesion");
ok(!s.finDescansoISO,"y no deja un descanso colgando al final");
ok(pasoActual(s,A).paso===null,"pasado el ultimo paso no hay mas");

// --- el tramo del cronometro sigue al playback, solo hacia adelante ---
saGuardar(null); semana=1; sesionSel="A"; empezarSesion();
pbIr(1); ok(sa().tramo===1,"al entrar a una serie del bloque 1 el tramo se sincroniza");
const pB2=pasosSesion(A).findIndex(p=>p.tipo==="serie"&&p.tramo===2);
pbIr(pB2); ok(sa().tramo===2,"al llegar al bloque 2 el tramo avanza");
pbIr(1); ok(sa().tramo===2,"volver atras no devuelve el tramo: el tiempo ya paso");
// y moverse de paso corta cualquier descanso que viniera corriendo
pbCheck(); ok(!!sa().finDescansoISO,"el check deja el descanso corriendo");
pbSaltar(); ok(!sa().finDescansoISO,"cambiar de paso corta el descanso");

// --- ejercicios por tiempo: se aprieta Empezar ---
saGuardar(null); semana=1; sesionSel="B"; empezarSesion();
const pasosB=pasosSesion(sesionDe("B"));
const idxPl=pasosB.findIndex(p=>p.tipo==="serie"&&esTiempo(p.k));
pbIr(idxPl);
ok(sa().ejIniISO===null,"la plancha no arranca sola: espera que aprietes Empezar");
pbEmpezarEj();
ok(!!sa().ejIniISO,"Empezar arranca el reloj de la plancha");
avanzar(0.6);
pbCheck();
const lp=logDe("B","plancha");
ok(!!lp && lp.rondas[pasosB[idxPl].ronda].seg===36,"anota los segundos que realmente aguanto, anoto "+(lp?lp.rondas[pasosB[idxPl].ronda].seg:"?"));

// --- salir a la lista y volver ---
verLista=true; ok(!enPlayback(),"ver lista saca del playback");
verLista=false; ok(enPlayback(),"y se vuelve al playback");

// --- una sesion vieja, sin indice, retoma donde iba ---
const s2=sa(); delete s2.idx; saGuardar(s2);
const pa=pasoActual(sa(),sesionDe("B"));
ok(pa.paso && pa.paso.tipo==="serie","sin indice guardado retoma en una serie, no desde el principio");
ok(!rondaValida((logDe("B",pa.paso.k)||{rondas:[]}).rondas[pa.paso.ronda]),"y esa serie es una sin registrar");

// --- si se acaban los 3 min de preparacion, el playback avanza con el tramo ---
saGuardar(null); semana=1; sesionSel="A"; empezarSesion();
ok(sa().idx===0,"arranca en la preparacion");
avanzar(3.1); tick();
ok(sa().tramo===1,"el tramo pasa al bloque 1");
ok(sa().idx===1,"y la pantalla deja de mostrar el calentamiento");

// --- recargar a mitad de sesion no deja el boton de terminar sin efecto ---
saGuardar(null); semana=1; sesionSel="A"; empezarSesion();
pbIr(1); pbCheck();
sesionSel=null;              // es lo que pasa al recargar la app
pintarHoy();
ok(sesionSel==="A","al repintar en playback se recupera que sesion es");
terminarSesion();
ok(!!sesionHecha(1,"A"),"y terminar sesion la cierra de verdad");

console.log(f? "\n*** "+f+" FALLAS ***":"\nplayback: todo verde");
process.exit(f?1:0);
