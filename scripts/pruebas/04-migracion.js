let f = 0; const ok = (c, m) => { if(!c){ f++; console.log("FALLA:", m); } else console.log("ok:", m); };
/* se simula un teléfono con la v1 instalada: claves fz_* y ninguna fierro.v2 */
delete store[CLAVE];
fixtureV1();
cargar();
ok(DB.v === 2 && DB.migradoDeV1, "detecta la v1 y migra");
ok(DB.sesiones.length === 8, "las 8 sesiones terminadas pasan, hay " + DB.sesiones.length);
ok(DB.sesiones[0].fecha === "2026-08-29" && DB.sesiones[7].fecha === "2026-09-16", "ordenadas por fecha: " + DB.sesiones[0].fecha + " a " + DB.sesiones[7].fecha);
const a1 = DB.sesiones.find(s => s.dia === "A" && s.semanaV1 === 1);
ok(a1.modo === "casa" && a1.duracion === 1200 && a1.origen === "v1", "modo casa, duración en segundos, origen v1");
/* modo retroactivo: desde el 12-09 todo fue gimnasio de hotel */
const modos = DB.sesiones.map(s => s.fecha + ":" + s.modo).join(" ");
ok(DB.sesiones.filter(s => s.fecha < "2026-09-12").every(s => s.modo === "casa") && DB.sesiones.filter(s => s.fecha >= "2026-09-12").every(s => s.modo === "gym"), "casa hasta el 11-09, gimnasio desde el 12-09: " + modos);
ok(DB.sesiones.filter(s => s.modo === "gym").length === 5, "5 sesiones de hotel");
const a2 = DB.sesiones.find(s => s.dia === "A" && s.semanaV1 === 2);
ok(a2.reg.press_banca[0].modo === "gym" && a2.reg.press_banca[0].kg === 10 && a2.reg.press_banca[0].nivel === null, "en el hotel el press guarda kilos y modo gym");
ok(a1.reg.press_banca && a1.reg.press_banca.length === 2 && a1.reg.press_banca[0].incompleta === 1 && a1.reg.press_banca[0].nivel === null, "press de banca de la semana 1 sin kilos: series incompletas, no cero");
ok(a1.reg.press_militar && a1.reg.press_militar[0].kg === 0 && a1.reg.press_militar[0].nivel === 2 && a1.reg.press_militar[0].reps === 10, "press de hombro en casa con 10 kg → press militar nivel 2 (10 kg), sin kilos sueltos");
ok(a1.reg.laterales[0].nivel === 1 && a1.reg.laterales[0].kg === 0, "laterales con 7,5 kg → nivel 1");
ok(a1.reg.dominadas && a1.reg.dominadas[0].nivel === 3 && a1.reg.dominadas[0].modo === "casa", "dominada → dominadas con nivel banda media y modo");
ok(a1.reg.remo_inclinado && a1.reg.remo_inclinado[0].reps === 10 && a1.reg.remo_inclinado[0].incompleta === 1, "el remo inclinado se conserva como legado, incompleto sin kilos");
const c1 = DB.sesiones.find(s => s.dia === "C" && s.semanaV1 === 1);
ok(c1.reg.flexiones && c1.reg.flexiones[0].nivel === 5 && c1.reg.flexiones[1].reps === 15, "flexiones con pies elevados → flexiones nivel 5");
ok(c1.reg.triceps_ext && c1.reg.triceps_ext[0].nivel === 2 && c1.reg.triceps_ext[0].kg === 0, "tríceps en casa con 10 kg → nivel 2");
ok(c1.reg.angel_suelo && c1.reg.flex_diamante, "los sustitutos sin equipamiento quedan como legado");
const b1 = DB.sesiones.find(s => s.dia === "B" && s.semanaV1 === 1);
ok(b1.reg.plancha && b1.reg.plancha[0].reps === 45, "la plancha (por tiempo) guarda los segundos en reps");
ok(b1.reg.bulgara[0].kg === 0 && b1.reg.bulgara[0].nivel === 1 && b1.reg.bulgara[0].reps === 15, "búlgara con 7,5 kg → nivel 1: " + JSON.stringify(b1.reg.bulgara[0]));
ok(b1.reg.goblet[0].nivel === 1, "goblet con 10 kg en casa → mancuerna al pecho (nivel 1)");
ok(b1.reg.goblet && b1.reg.goblet.length === 2, "goblet migrado");
const d2 = DB.sesiones.find(s => s.dia === "D" && s.semanaV1 === 2);
ok(d2.reg.hip_thrust[1].kg === 22 && d2.reg.rdl[1].reps === 20 && d2.modo === "gym", "empuje de cadera y rumano de la semana 2, en el hotel con kilos");
/* bandas: nivel de banda, nunca kilos, y siempre modo casa */
const c2 = DB.sesiones.find(s => s.dia === "C" && s.semanaV1 === 2);
ok(c2.reg.face_pull.every(r => r.kg === 0 && r.nivel === 1 && r.modo === "casa"), "face pull con banda: sin kilos, banda media, modo casa aunque la sesión sea de hotel");
ok(d2.reg.curl_femoral.every(r => r.kg === 0), "el curl femoral con banda pierde los kilos inventados");
ok(historial("press_banca", "casa").length === 1 && historial("press_banca", "gym").length === 1, "Avances separa el press de casa del de hotel");
ok(tonelajeSesion(a1) === 90 * 9 + 0, "el tonelaje de la sesión 1 no cuenta las series incompletas ni las de nivel sin kilos: " + tonelajeSesion(a1));
/* semillas encima de la migración */
ok(nivelActual("dominadas") === 3 && nivelActual("fondos") === 3 && nivelActual("flexiones") === 5, "las semillas de nivel se aplican");
ok(DB.pausados.curl_martillo, "curl martillo pausado por semilla");
ok(pesoActual() === 90, "peso corporal 90");
ok(DB.logros.arranque === "2026-08-29" && DB.logros.records_10, "los logros de la v1 se conservan con su fecha");
/* la rotación sigue donde iba: la última fue D, toca A */
ok(diaSugerido() === "A", "después del día D de la semana 2 toca A");
/* los récords se recalculan desde las series: el press de hombro ya no dice 1.010 kg */
ok(!esRecord("press_militar", {kg:0, reps:10, nivel:2, modo:"casa"}, "casa"), "10 reps con 10 kg ya está en el historial, no es récord");
ok(esRecord("press_militar", {kg:0, reps:11, nivel:2, modo:"casa"}, "casa"), "11 reps con 10 kg sí sería récord");
ok(esRecord("press_militar", {kg:12, reps:8, modo:"gym"}, "gym"), "en el hotel hizo 10 kg: 12 kg es récord de peso");
/* las claves viejas no se borran y la migración no se repite */
ok(store["fz_sesion_1_A"], "las claves fz_ siguen ahí");
const antes = DB.sesiones.length;
cargar();
ok(DB.sesiones.length === antes && DB.migradoDeV1, "volver a cargar no duplica: lee fierro.v2");
/* un teléfono que migró con las reglas anteriores (todo en modo casa, kilos
   sueltos) se vuelve a traducir al cargar, sin tocar lo registrado después */
const viejo = JSON.parse(store[CLAVE]);
viejo.migracionV1 = undefined;
viejo.niveles.flexiones = 4;
viejo.sesiones.forEach(s => { s.modo = "casa"; Object.keys(s.reg).forEach(id => s.reg[id].forEach(r => { r.modo = "casa"; })); });
viejo.sesiones.push({fecha:"2026-09-17", ts:"2026-09-17T12:00:00.000Z", dia:"A", modo:"casa", adhoc:null, reg:{dominadas:[{kg:0, reps:6, nivel:3, modo:"casa"}]}});
store[CLAVE] = JSON.stringify(viejo);
cargar();
ok(DB.migracionV1 === MIGRACION_V1 && DB.sesiones.length === 9, "re-migra y conserva la sesión nueva: " + DB.sesiones.length);
ok(DB.sesiones.filter(s => s.origen === "v1" && s.modo === "gym").length === 5 && DB.niveles.flexiones === 5, "las de la v1 vuelven a salir con modo por fecha y la semilla de flexiones se corrige");
ok(DB.sesiones[8].fecha === "2026-09-17" && DB.sesiones[8].reg.dominadas[0].reps === 6, "la sesión registrada en la v2 no se toca");
DB.sesiones.pop(); guardar();
/* las vistas pintan con los datos reales */
pintarSemana();
ok(capt["#app"].includes("Últimas sesiones") && capt["#app"].includes("Día D · Mixto"), "SEMANA lista las sesiones migradas");
semanaVista = "2026-09-14"; pintarSemana();
ok(capt["#app"].includes("Series por grupo"), "series por grupo de la semana del 14");
pintarAvances();
ok(capt["#app"].includes("Ejercicios de la rutina anterior") && capt["#app"].includes("Press de banca con mancuernas"), "AVANCES separa legado y rutina");
ok(capt["#app"].includes("Casa") && capt["#app"].includes("Gimnasio") && capt["#app"].includes("sin peso anotado") === false, "el press de banca sale en dos bloques y las series incompletas no entran a la comparación");
ok(capt["#app"].includes("Sentadilla búlgara") && capt["#app"].includes("+"), "búlgara con porcentaje");
sel = {dia:"C", adhoc:null}; DB.modo = "casa"; pintarHoy();
ok(capt["#app"].includes("Primera vez en este nivel (10 kg)"), "en casa el press parte en 10 kg sin referencia (la semana 1 no tenía kilos y la 2 fue en el hotel): " + (capt["#app"].match(/(Última|Primera) vez[^<]{0,50}/) || ["no"])[0]);
DB.modo = "gym"; pintarHoy();
ok(capt["#app"].includes("Última vez: 10 kg × 15, 15"), "en el gym la sugerencia usa el press del hotel: " + (capt["#app"].match(/Última vez: [^<]{0,40}/) || ["no"])[0]);
DB.modo = "casa";
const txt = exportarTexto();
ok(txt.includes("2026-08-29 · Día A · Tirón · casa") && txt.includes("Press militar con mancuernas (10 kg): 10, 10") && txt.includes("2026-09-16 · Día D") && txt.includes("gimnasio"), "el registro en texto muestra lo migrado con modo y nivel");
const resp = JSON.parse(exportarEstado());
ok(resp.esquema === "fierro-v2.1" && resp.nivelesActuales.dominadas.nombre === "Banda media" && resp.estado.sesiones[0].reg.dominadas[0].nivelNombre === "Banda media" && resp.estado.sesiones[0].reg.dominadas[0].modo === "casa" && resp.estado.pesoCorporal[0].ts, "respaldo autodescriptivo: esquema, niveles con nombre, modo por serie, peso con fecha");
ok(importarEstado(exportarEstado()).estado.sesiones[0].reg.dominadas[0].nivelNombre === undefined, "al importar, los nombres legibles no se guardan");
console.log(f ? "\n*** " + f + " FALLAS ***" : "\nmigración: todo verde");
process.exit(f ? 1 : 0);
