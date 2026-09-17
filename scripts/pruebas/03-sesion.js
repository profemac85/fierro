let f = 0; const ok = (c, m) => { if(!c){ f++; console.log("FALLA:", m); } else console.log("ok:", m); };
/* una sesión completa del día A en casa, anotada por los campos */
sel = {dia:"A", adhoc:null};
DB.modo = "casa";
pintarHoy();
ok(capt["#app"].includes("Día A · Tirón") && capt["#app"].includes("Dominadas"), "HOY pinta el día A con dominadas");
ok(capt["#app"].includes("Banda media"), "muestra el nivel actual");
ok(capt["#app"].includes("pausado") && capt["#app"].includes("Sobrecarga de antebrazo"), "el curl martillo aparece pausado con su motivo");
valores["#r_dominadas_0"] = "6";
anotarSerie("dominadas", 0);
ok(pendiente() && pendiente().reg.dominadas[0].reps === 6 && pendiente().reg.dominadas[0].nivel === 3 && pendiente().reg.dominadas[0].modo === "casa", "la serie guarda reps, nivel y modo");
ok(pendiente().descansoFinISO, "anotar arranca el descanso");
ok(pendiente().reg.dominadas[0].ts && pendiente().primeraSerieISO === pendiente().reg.dominadas[0].ts, "la serie lleva marca de tiempo y el reloj de sesión parte con la primera");
/* descanso real: se finge que la primera serie fue hace 2 minutos */
pendiente().reg.dominadas[0].ts = new Date(Date.now() - 100000).toISOString(); pendiente().primeraSerieISO = pendiente().reg.dominadas[0].ts; guardar();
ok(seriesAnotadas() === 1, "una serie anotada");
valores["#r_dominadas_1"] = "5"; anotarSerie("dominadas", 1);
const d1 = pendiente().reg.dominadas[1].desc;
ok(d1 >= 80 && d1 <= 90, "el descanso real queda en la serie: 100 s menos la serie, es " + d1);
ok(capt["#notad_dominadas"] && capt["#notad_dominadas"].includes("no es retroceso"), "descanso corto en un ejercicio pesado: aviso antes de anotarlo como mala sesión");
valores["#r_dominadas_2"] = "5"; anotarSerie("dominadas", 2);
valores["#r_dominadas_3"] = "5"; anotarSerie("dominadas", 3);
marcarRIR("dominadas", 2);
ok(pendiente().reg.dominadas[3].rir === 2 && pendiente().reg.dominadas[2].rir == null, "el RIR va solo en la última serie");
/* cambiar el nivel de una serie */
valores["#n_dominadas_3"] = "4"; cambiarNivelSerie("dominadas", 3);
ok(pendiente().reg.dominadas[3].nivel === 4, "cambiar el nivel de una serie");
valores["#n_dominadas_3"] = "3"; cambiarNivelSerie("dominadas", 3);
/* borrar una serie: reps vacías */
valores["#r_dominadas_3"] = ""; anotarSerie("dominadas", 3);
ok(seriesAnotadas() === 3, "vaciar el campo quita la serie");
valores["#r_dominadas_3"] = "5"; anotarSerie("dominadas", 3);
/* face pull por nivel (banda) y remo invertido */
valores["#r_remo_invertido_0"] = "12"; anotarSerie("remo_invertido", 0);
valores["#r_face_pull_0"] = "15"; anotarSerie("face_pull", 0);
ok(seriesAnotadas() === 6, "seis series anotadas");
/* cambiar de modo con series anotadas pide confirmación y no cambia solo */
cambiarModo("gym");
ok(DB.modo === "casa" && capt["#modalCaja"].includes("Cambiar de modo"), "cambiar de modo con series pide confirmación");
cerrarModal();
/* guardar */
guardarSesion();
ok(DB.sesiones.length === 1 && !pendiente(), "la sesión se guardó y la pendiente se limpió");
const s = DB.sesiones[0];
ok(s.dia === "A" && s.modo === "casa" && s.reg.dominadas.length === 4 && s.reg.remo_invertido.length === 1, "registro completo");
ok(s.reg.dominadas[3].rir === 2, "el RIR queda guardado en la última serie");
ok(s.duracion >= 100 && s.duracion < 180, "la duración corre desde la primera serie: " + s.duracion + " s");
ok(capt["#cierreInt"].includes("Sesión guardada") && capt["#cierreInt"].includes("Primera sesión"), "modal de cierre con el logro de la primera sesión");
ok(DB.logros.arranque, "logro de constancia persistido");
ok(diaSugerido() === "B", "la rotación avanza a B");
cerrarCierre();

/* estimación de tiempos: teórica sin historial, real con historial */
const casA = casillasDeDia("A", "casa");
ok(estimadoEjSeg(casA.find(c => c.id === "face_pull"), "casa") === 3 * (15 * 3 + 60), "estimación teórica del face pull: 3 × (45 + 60) s");
ok(tiempoRealEjSeg("dominadas", "casa") > 0 && estimadoEjSeg(casA[0], "casa") === tiempoRealEjSeg("dominadas", "casa"), "con historial, las dominadas usan su tiempo real promedio: " + tiempoRealEjSeg("dominadas", "casa") + " s");
ok(estimadoSesionSeg(casA, "casa") > 600, "la sesión entera suma minutos: " + fmtMin(estimadoSesionSeg(casA, "casa")));
sel = {dia:"A", adhoc:null}; pintarHoy();
ok(capt["#app"].includes("Estimado") && capt["#app"].includes("(real)"), "HOY muestra el estimado de la sesión y marca el real");
/* segunda sesión del día A: récords, volumen, propuesta de nivel y adaptación por descanso */
sel = {dia:"A", adhoc:null};
["8", "8", "8", "8"].forEach((v, i) => {
  valores["#r_dominadas_" + i] = v; anotarSerie("dominadas", i);
  /* descansos de 60 s: la misma marca (o mejor) con menos descanso */
  pendiente().reg.dominadas[i].desc = 60; guardar();
});
ok(pendiente().reg.dominadas[0].rec === 1, "8 reps al mismo nivel marca récord en vivo");
valores["#r_remo_invertido_0"] = "12"; anotarSerie("remo_invertido", 0);
guardarSesion();
ok(DB.sesiones.length === 2, "segunda sesión guardada");
ok(capt["#cierreInt"].includes("Subida de nivel") && capt["#cierreInt"].includes("banda delgada"), "propone subir a banda delgada");
ok(capt["#cierreInt"].includes("Récord"), "muestra el récord");
ok(capt["#cierreInt"].includes("Más trabajo que la última vez"), "muestra el volumen contra la última vez del mismo día");
ok(capt["#cierreInt"].includes("Adaptación") && capt["#cierreInt"].includes("60 s de descanso"), "misma marca con menos descanso aparece como logro de adaptación");
ok(nivelActual("dominadas") === 3, "el nivel NO sube solo");
aceptarNivel("dominadas", 0);
ok(nivelActual("dominadas") === 4 && DB.ascensos.length === 1, "al aceptar sube y queda el ascenso registrado");
cerrarCierre();

/* pausar con agarre sugiere revisar los otros con agarre */
pausarEjercicio("rdl", "molestia", null);
ok(DB.pausados.rdl && DB.pausados.rdl.desde === fechaISO(), "pausar guarda la fecha");
ok(otrosConAgarre("rdl").includes("dominadas") && !otrosConAgarre("rdl").includes("curl_martillo"), "otros con agarre, sin los ya pausados");
reanudarEjercicio("rdl");
ok(!DB.pausados.rdl, "reanudar");

/* sustituto: aparece como tarjeta extra en HOY */
pausarEjercicio("dominadas", "codo", "jalon");
DB.modo = "gym"; sel = {dia:"A", adhoc:null}; pintarHoy();
ok(capt["#app"].split('id="ej_jalon"').length === 2, "en el gym el jalón ya está en el día A: no se duplica");
DB.modo = "casa"; pintarHoy();
ok(capt["#app"].includes("sustituto") && capt["#app"].split('id="ej_jalon"').length === 2, "en casa el sustituto se agrega como tarjeta");
reanudarEjercicio("dominadas");

/* cinturón de lastre: dominadas y fondos pasan a kilos, la escalera se archiva */
ok(progDe("dominadas", "casa") === "nivel", "sin lastre las dominadas van por nivel");
alternarLastre();
ok(DB.lastre && progDe("dominadas", "casa") === "peso" && progDe("fondos", "gym") === "peso" && progDe("remo_invertido", "casa") === "nivel", "con lastre, dominadas y fondos por peso; el resto igual");
ok(nivelActual("dominadas") === 4 && DB.ascensos.length === 1, "el nivel y los ascensos se conservan como archivo");
sel = {dia:"A", adhoc:null}; pintarHoy();
ok(capt["#app"].includes("kilos colgados") && capt["#app"].includes('id="k_dominadas_0"'), "HOY muestra el chip de lastre y el campo de kilos");
let sg = sugerencia(casillasDeDia("A", "casa")[0], "casa");
ok(sg.t.includes("Primera vez con lastre") && sg.t.includes("8, 8, 8, 8"), "sugerencia con lastre recién puesto: " + sg.t);
ok(!esRecord("dominadas", {kg:5, reps:6, modo:"casa"}, "casa"), "la primera serie con lastre no es récord contra las de nivel");
DB.sesiones.push({fecha:fechaISO(), ts:hoyISO(), dia:"A", modo:"casa", adhoc:null, reg:{dominadas:[{kg:5, reps:6, nivel:null, modo:"casa"}]}});
ok(esRecord("dominadas", {kg:7.5, reps:6, modo:"casa"}, "casa") && !esRecord("dominadas", {kg:5, reps:6, modo:"casa"}, "casa"), "desde la segunda serie con lastre, más kilos es récord");
DB.sesiones.pop();
pintarAvances();
ok(capt["#app"].includes("Escalera archivada"), "Avances marca la escalera como archivada");
alternarLastre();
ok(!DB.lastre && progDe("dominadas", "casa") === "nivel", "apagar el lastre devuelve la escalera");
/* descanso */
iniciarDescanso(90, "Dominadas");
ok(pendiente() && pendiente().descansoFinISO, "descanso manual crea la pendiente y arranca");
ajustarDescanso(30);
terminarDescanso();
ok(!pendiente().descansoFinISO, "terminar el descanso");
DB.pendiente = null;

/* exportar e importar el estado completo */
const json = exportarEstado();
const obj = JSON.parse(json);
ok(obj.app === "fierro" && obj.formato === 2 && obj.ejercicios.dominadas.niveles.length === 9, "el respaldo lleva diccionario de ejercicios y niveles");
ok(obj.estado.sesiones.length === 2 && obj.estado.niveles.dominadas === 4, "y el estado completo");
const r = importarEstado(json);
ok(!r.error && r.estado.sesiones.length === 2, "importarEstado lee el respaldo");
ok(importarEstado("{no}").error && importarEstado('{"v":1}').error, "rechaza lo que no es un respaldo v2");
const txt = exportarTexto();
ok(txt.includes("Dominadas (banda media): 8 d60s, 8 d60s, 8 d60s, 8 d60s") && txt.includes("NIVELES"), "registro en texto con nivel y descanso: " + (txt.match(/Dominadas[^\n]*/) || [""])[0]);

/* estado vacío o corrupto: la app pinta igual */
store[CLAVE] = "{{{";
cargar();
ok(DB.v === 2 && DB.sesiones.length === 0, "con almacenamiento corrupto arranca de cero sin reventar");
pintarHoy(); pintarSemana(); pintarAvances(); pintarMetodo(); pintarImportar();
ok(capt["#app"].includes("Pegar JSON"), "las cinco vistas pintan con estado vacío");
console.log(f ? "\n*** " + f + " FALLAS ***" : "\nsesión y guardado: todo verde");
process.exit(f ? 1 : 0);
