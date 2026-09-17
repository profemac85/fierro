let f = 0; const ok = (c, m) => { if(!c){ f++; console.log("FALLA:", m); } else console.log("ok:", m); };
/* la sesión guiada del día A en casa, con una sesión previa para tener referencia */
DB.sesiones.push({fecha:"2026-09-10", ts:"2026-09-10T12:00:00.000Z", dia:"A", modo:"casa", adhoc:null, duracion:1500,
  reg:{dominadas:[6, 5, 5, 5].map(r => ({kg:0, reps:r, nivel:3, modo:"casa"})), remo_invertido:[{kg:0, reps:12, nivel:3, modo:"casa"}]}});
sel = {dia:"A", adhoc:null}; DB.modo = "casa";
pintarHoy();
ok(capt["#app"].includes("Empezar sesión ·"), "HOY ofrece empezar la sesión con su estimado");
empezarSesion();
let p = pendiente();
ok(p && p.pb && p.pb.idx === 0 && enPlayback(), "empezar crea la guía en la preparación");
ok(capt["#app"].includes("Preparación") && capt["#app"].includes("Colgarse de la barra"), "la preparación del día de torso");
const pasos = pasosPB();
ok(pasos.length === 1 + 4 + 4 + 3, "pasos: preparación más las series de dominadas, remo y face pull (el curl está pausado): " + pasos.length);
tick();
ok(capt["#bCtl"].includes("Pausa") && capt["#bCtl"].includes("Salir"), "la barra de abajo lleva la pausa y la salida (el reloj total va en bReloj)");
pbCheck();
p = pendiente();
ok(p.pb.idx === 1 && capt["#app"].includes("Dominadas") && capt["#app"].includes("Serie 1 de 4") && capt["#app"].includes("Banda media"), "primera serie de dominadas en primer plano con su nivel");
ok(capt["#app"].includes("Última vez: 6, 5, 5, 5 con banda media"), "muestra la vez pasada");
ok(p.pb.ejIniISO, "el reloj de la serie parte solo");
/* el check anota el sugerido (lo de la vez pasada) y abre el descanso */
pbCheck();
p = pendiente();
const s0 = serieDe("dominadas", 0);
ok(s0 && s0.reps === 6 && s0.nivel === 3 && s0.modo === "casa", "el check deja anotada la serie con lo de la vez pasada: " + JSON.stringify(s0));
ok(p.descansoFinISO && capt["#app"].includes("descanso") && capt["#app"].includes("pbReps"), "abre el descanso con los campos para corregir");
ok(capt["#app"].includes("sigue") && capt["#app"].includes("serie 2"), "muestra qué sigue");
/* corregir el valor durante el descanso */
valores["#pbReps"] = "7"; valores["#pbNivel"] = "3"; pbGuardarCampos();
ok(serieDe("dominadas", 0).reps === 7 && serieDe("dominadas", 0).rec === 1, "corregir a 7 marca récord (la vez pasada fueron 6)");
/* Listo salta el descanso y pasa a la serie 2 */
pbListo();
p = pendiente();
ok(p.pb.idx === 2 && !p.descansoFinISO && capt["#app"].includes("Serie 2 de 4"), "Listo pasa a la serie 2 sin descanso colgado");
/* el descanso vencido avanza solo */
pbCheck(); p = pendiente();
p.descansoFinISO = new Date(Date.now() - 1000).toISOString(); guardar();
pbFirma = ""; refrescarPB(); tick();
ok(pendiente().pb.idx === 3 && capt["#app"].includes("Serie 3 de 4"), "al vencer el descanso pasa solo a la serie 3");
/* pausa: el reloj de sesión se congela */
const antes = tiempoSesionMs(pendiente(), pendiente().inicioISO);
pausarReanudar();
ok(!!pendiente().pausadoEn, "en pausa");
const enPausa = tiempoSesionMs(pendiente(), pendiente().inicioISO);
ok(Math.abs(enPausa - antes) < 50, "el reloj no avanza en pausa");
pausarReanudar();
ok(!pendiente().pausadoEn, "reanuda");
/* atrás y saltar */
pbAtras(); ok(pendiente().pb.idx === 2, "atrás vuelve un paso");
pbSaltar(); pbSaltar(); ok(pendiente().pb.idx === 4, "saltar avanza sin anotar");
ok(!serieDe("dominadas", 3), "la serie saltada queda vacía");
/* ver lista y volver */
verLista = true; pintar();
ok(!enPlayback() && capt["#app"].includes("Volver a la sesión guiada") && capt["#app"].includes('id="r_dominadas_0"'), "la lista muestra lo anotado y deja volver");
empezarSesion();
ok(enPlayback() && pendiente().pb.idx === 4, "volver retoma en el mismo paso");
/* series por tiempo: hay que apretar Empezar */
sel = {dia:"D", adhoc:null}; DB.pendiente = null; empezarSesion();
const pasosD = pasosPB();
const iPl = pasosD.findIndex(x => x.tipo === "serie" && x.c.id === "plancha_lateral");
pbIr(iPl);
ok(capt["#app"].includes("Empezar") && capt["#app"].includes("aguanta este tiempo") && !pendiente().pb.ejIniISO, "la plancha espera el Empezar");
pbEmpezarEj();
pendiente().pb.ejIniISO = new Date(Date.now() - 38000).toISOString(); guardar();
pbCheck();
ok(serieDe("plancha_lateral", 0).reps === 38, "el check anota los segundos que corrió el reloj: " + serieDe("plancha_lateral", 0).reps);
/* fin: todas las series hechas → guardar */
pbIr(pasosD.length);
ok(capt["#app"].includes("Sesión completa") && capt["#app"].includes("Guardar sesión"), "al terminar los pasos ofrece guardar");
guardarSesion();
ok(!pendiente() && DB.sesiones[DB.sesiones.length - 1].reg.plancha_lateral[0].reps === 38 && !enPlayback(), "guardar cierra la guía y registra la sesión");
cerrarCierre();
/* salir de la guía conserva lo anotado */
sel = {dia:"A", adhoc:null}; empezarSesion(); pbCheck(); pbCheck();
ok(seriesAnotadas() === 1, "una serie anotada en la guía");
terminarPlayback(); DB.pendiente.pb = null; guardar(); verLista = false; pintar();
ok(seriesAnotadas() === 1 && capt["#app"].includes("Seguir con la guía"), "salir a la lista conserva la serie y ofrece seguir");
guardarSesion(); cerrarCierre();
/* el mapa de Avances y el detalle de una sesión */
pintarAvances();
ok(capt["#app"].includes('class="mapa"') && capt["#app"].includes(">A<") && capt["#app"].includes(">D<"), "el mapa pinta los días con sesión con su letra");
const s10 = DB.sesiones.find(s => s.fecha === "2026-09-10");
verSesionMapa(s10.ts);
ok(capt["#detalleSesion"].includes("Día A · Tirón") && capt["#detalleSesion"].includes("Dominadas") && capt["#detalleSesion"].replace(/<[^>]+>/g, "").includes("6 · 5 · 5 · 5"), "el detalle muestra la sesión con sus series");
ok(capt["#detalleSesion"].includes("<svg") && capt["#detalleSesion"].includes("en ámbar esta sesión"), "y la tendencia de cada ejercicio con el punto de esta sesión marcado");
console.log(f ? "\n*** " + f + " FALLAS ***" : "\nsesión guiada: todo verde");
process.exit(f ? 1 : 0);
