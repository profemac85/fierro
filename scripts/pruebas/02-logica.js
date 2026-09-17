let f = 0; const ok = (c, m) => { if(!c){ f++; console.log("FALLA:", m); } else console.log("ok:", m); };
/* estado limpio con semillas */
ok(DB.v === 2 && DB.modo === "casa", "arranca en v2, modo casa");
ok(nivelActual("dominadas") === 3 && nivelActual("flexiones") === 5 && nivelActual("press_banca") === 2 && nombreNivel("press_banca", 2) === "10 kg", "semillas de nivel: banda media, pies elevados, 10 kg");
ok(!!DB.pausados.curl_martillo, "curl martillo parte pausado");
ok(pesoActual() === 90, "peso corporal semilla 90");

/* rotación global */
ok(diaSugerido() === "A", "sin sesiones, sugiere A");
const ses = (fecha, dia, modo, reg, extra) => { DB.sesiones.push(Object.assign({fecha, ts:fecha + "T12:00:00.000Z", dia, modo, adhoc:null, reg}, extra || {})); DB.sesiones.sort((a, b) => a.ts.localeCompare(b.ts)); };
ses("2026-09-01", "A", "gym", {dominadas:[{kg:0, reps:6, nivel:3, modo:"gym"}]});
ok(diaSugerido() === "B", "después de A en el gym toca B (el contador es global)");
DB.sesionesAdHoc.push({id:"extra", nombre:"Extra", reemplazaDia:null, ejercicios:[{ref:"flexiones"}]});
ses("2026-09-02", null, "casa", {flexiones:[{kg:0, reps:15, nivel:4, modo:"casa"}]}, {adhoc:"extra"});
ok(diaSugerido() === "B", "una ad hoc extra no mueve la rotación");
DB.sesionesAdHoc.push({id:"corta", nombre:"Corta", reemplazaDia:"C", ejercicios:[{ref:"fondos"}]});
ses("2026-09-03", null, "casa", {fondos:[{kg:0, reps:8, nivel:3, modo:"casa"}]}, {adhoc:"corta"});
ok(diaSugerido() === "D", "una ad hoc que reemplaza el día C deja la rotación en D");

/* universos de carga separados */
ses("2026-09-05", "C", "casa", {press_banca:[{kg:0, reps:10, nivel:2, modo:"casa"}, {kg:0, reps:10, nivel:2, modo:"casa"}, {kg:0, reps:10, nivel:2, modo:"casa"}]});
ses("2026-09-08", "C", "gym", {press_banca:[{kg:22.5, reps:10, nivel:null, modo:"gym"}, {kg:22.5, reps:10, nivel:null, modo:"gym"}, {kg:22.5, reps:9, nivel:null, modo:"gym"}]});
ok(historial("press_banca", "casa").length === 1 && historial("press_banca", "gym").length === 1, "press de banca: un historial por modo");
ok(historial("press_banca").length === 2, "sin modo, se ve todo");
ses("2026-09-06", "A", "casa", {dominadas:[{kg:0, reps:7, nivel:3, modo:"casa"}]});
ok(historial("dominadas", "casa").length === 2, "dominadas: casa y gym comparten historial");
ok(modosConDatos("press_banca").length === 2, "press de banca tiene datos en los dos modos");

/* sugerencias en el mismo modo */
const casPB = casillasDeDia("C", "gym").find(c => c.id === "press_banca");
let s = sugerencia(casPB, "gym");
ok(s.t.includes("22,5 kg × 10, 10, 9") && s.t.includes("suma una repetición"), "sugerencia gym: mantener y sumar una: " + s.t);
s = sugerencia(casillasDeDia("C", "casa").find(c => c.id === "press_banca"), "casa");
ok(s.t.includes("10, 10, 10") && s.t.includes("con 10 kg") && s.t.includes("Apunta a <b>11</b>"), "sugerencia casa por nivel: " + s.t);
ses("2026-09-05", "C", "casa", {press_banca:[{kg:0, reps:12, nivel:2, modo:"casa"}, {kg:0, reps:12, nivel:2, modo:"casa"}, {kg:0, reps:12, nivel:2, modo:"casa"}]});
s = sugerencia(casillasDeDia("C", "casa").find(c => c.id === "press_banca"), "casa");
ok(s.lista && s.t.includes("Completaste 3×12 con 10 kg") && s.t.includes("pausa de 2 segundos"), "en casa, 3×12 con 10 kg propone el peldaño siguiente (criterio genérico: todas al tope): " + s.t);
DB.sesiones.splice(DB.sesiones.findIndex(x => x.fecha === "2026-09-05" && x.reg.press_banca[0].reps === 12), 1);
const casDom = casillasDeDia("A", "casa")[0];
s = sugerencia(casDom, "casa");
ok(s.t.includes("Última vez: 7") && s.t.includes("banda media"), "sugerencia dominadas: " + s.t);
ses("2026-09-09", "A", "casa", {dominadas:[8, 8, 8, 8].map(r => ({kg:0, reps:r, nivel:3, modo:"casa"}))});
s = sugerencia(casDom, "casa");
ok(s.lista && s.t.includes("Completaste 4×8 con banda media") && s.t.includes("banda delgada"), "criterio cumplido: propone subir: " + s.t);
ok(cumpleCriterio("dominadas", DB.sesiones[DB.sesiones.length - 1].reg.dominadas), "cumpleCriterio con 4 × 8 en banda media");
ok(!cumpleCriterio("dominadas", [8, 8, 8, 7].map(r => ({kg:0, reps:r, nivel:3}))), "con 3 series de 8 no cumple");
ok(!cumpleCriterio("dominadas", [8, 8, 8, 8].map(r => ({kg:0, reps:r, nivel:2}))), "series en otro nivel no cuentan");
const casGob = casillasDeDia("D", "gym").find(c => c.id === "goblet");
ses("2026-09-10", "D", "gym", {goblet:[{kg:24, reps:15, modo:"gym"}, {kg:24, reps:15, modo:"gym"}, {kg:24, reps:15, modo:"gym"}]});
s = sugerencia(casGob, "gym");
ok(s.lista && s.t.includes("sube el peso"), "todas al tope: sube el peso: " + s.t);

/* récords */
ok(esRecord("press_banca", {kg:25, reps:8, modo:"gym"}, "gym"), "más peso es récord");
ok(esRecord("press_banca", {kg:22.5, reps:11, modo:"gym"}, "gym"), "más reps al mismo peso es récord");
ok(!esRecord("press_banca", {kg:22.5, reps:10, modo:"gym"}, "gym"), "igualar no es récord");
ok(!esRecord("press_banca", {kg:12, reps:20, modo:"casa"}, "casa"), "casa y gym no se comparan (12 kg en casa no es récord del gym... ni de casa)");
/* num(): separador de miles es-CL */
ok(num("1.010") === 1010 && num("10,5") === 10.5 && num("1.5") === 1.5, "num lee 1.010 como mil diez y 1.5 como uno y medio");
/* escalera de dos cargas */
ok(ESCALERAS.mancuerna.length === 7 && ESCALERAS.mancuerna[1].n === "7,5 kg" && ESCALERAS.mancuerna[6].n.includes("una extremidad"), "escalera de mancuernas: 7,5 y 10 kg, siete peldaños");
ok(LIB.rdl.escalera === "mancuerna" && LIB.hip_thrust.escalera === "mancuerna", "rumano y empuje de cadera usan la escalera de dos cargas");
ok(LIB.dominadas.descanso === 150 && LIB.remo_invertido.descanso === 150 && LIB.press_banca.descanso === 150 && LIB.press_militar.descanso === 90 && LIB.prensa.descanso === 90 && LIB.laterales.descanso === 60 && LIB.plancha_lateral.descanso === 60, "descansos por ejercicio: 150 pesados, 90 medios, 60 aislados");
ok(esRecord("dominadas", {kg:0, reps:9, nivel:3, modo:"casa"}, "casa"), "más reps al mismo nivel es récord");
ok(esRecord("dominadas", {kg:0, reps:3, nivel:4, modo:"casa"}, "casa"), "un nivel más alto es récord aunque sean menos reps");
ok(!esRecord("dominadas", {kg:0, reps:8, nivel:3, modo:"casa"}, "casa"), "igualar el nivel y las reps no es récord");

/* subir de nivel */
subirNivel("dominadas");
ok(nivelActual("dominadas") === 4 && DB.ascensos.length === 1 && DB.ascensos[0].de === 3, "subirNivel registra el ascenso");

/* carga efectiva */
registrarPeso(86);
ok(pesoActual() === 86 && pesoInicial() === 90, "historial de peso: 90 al inicio, 86 ahora");
const ce = cargaEfectivaHTML("dominadas");
ok(ce.includes("Pesas 4 kg menos") && ce.includes("cada repetición carga 4 kg menos"), "carga efectiva conecta la dieta con la dominada: " + ce.replace(/<[^>]+>/g, ""));
ok(pesoEn("2026-09-01") === 90, "pesoEn: antes del registro nuevo pesaba 90");

/* series por grupo de la semana del 7 al 13 de septiembre */
const cuenta = seriesPorGrupo("2026-09-07");
ok(cuenta.Pecho === 3 && cuenta.Espalda === 4, "series por grupo de la semana: pecho 3, espalda 4, hay " + JSON.stringify(cuenta));
ok(semanasEntrenando() === 2, "dos semanas con registro, hay " + semanasEntrenando());

/* tonelaje: kilos × reps, y peso corporal × reps en los de peso corporal */
const t = tonelajeSesion(DB.sesiones.find(x => x.fecha === "2026-09-08"));
ok(t === 22.5 * 29, "tonelaje del press: " + t);
const tDom = tonelajeSesion(DB.sesiones.find(x => x.fecha === "2026-09-01"));
ok(tDom === 90 * 6, "tonelaje de dominadas usa el peso corporal de esa fecha: " + tDom);

/* criterios de diseño y disparadores */
let crit = criteriosDiseno();
ok(crit.length === 6 && crit.every(c => c.p && c.n), "seis criterios con texto");
ok(!crit[0].cumplido, "sesgo al tirón sigue activo sin 8 dominadas libres");
ses("2026-09-11", "A", "casa", {dominadas:[{kg:0, reps:8, nivel:6, modo:"casa"}]});
crit = criteriosDiseno();
ok(crit[0].cumplido && avisosCriterios().length === 1, "8 dominadas libres disparan el aviso del sesgo");
ok(crit[4].estado === "activo", "agarre como recurso limitado está activo con el curl pausado");

console.log(f ? "\n*** " + f + " FALLAS ***" : "\nlógica: todo verde");
process.exit(f ? 1 : 0);
