let f = 0; const ok = (c, m) => { if(!c){ f++; console.log("FALLA:", m); } };
const ids = Object.keys(LIB);
ok(ids.length === 22, "22 fichas en la rutina, hay " + ids.length);
ids.forEach(k => {
  const x = LIB[k];
  ok(x.n && x.g && x.patron && x.modos && x.prog && x.tec && x.video, k + ": ficha completa");
  ok(GRUPOS.includes(x.g) || x.g === "Acond", k + ": grupo válido (" + x.g + ")");
  ok(PATRONES[x.patron], k + ": patrón válido");
  const palabras = (x.p || "").trim().split(/\s+/).length;
  ok(palabras >= 80 && palabras <= 140, k + ": fundamento entre 80 y 140 palabras, tiene " + palabras);
  ok(!/—/.test(x.p + x.tec), k + ": sin rayas largas");
  x.modos.forEach(m => ok(x.prog[m], k + ": declara progresión en modo " + m));
  Object.keys(x.prog).forEach(m => {
    ok(["peso", "nivel", "tiempo", "reps"].includes(x.prog[m]), k + ": tipo de progresión válido en " + m);
    if(x.prog[m] === "nivel") ok(escaleraDe(k), k + ": progresa por nivel y tiene escalera");
  });
  ok(x.img || esquemaSVG(k), k + ": tiene demostración visual (imagen o esquema)");
  ok(typeof x.agarre === "boolean", k + ": declara agarre");
});
/* la regla central: el par ejercicio × modo */
ok(LIB.press_banca.prog.casa === "nivel" && LIB.press_banca.prog.gym === "peso", "press de banca: nivel en casa, peso en el gym");
ok(LIB.dominadas.prog.casa === LIB.dominadas.prog.gym, "dominadas: un solo historial en los dos modos");
ok(LIB.jalon.modos.length === 1 && LIB.jalon.modos[0] === "gym", "jalón solo en el gym");

/* rutina */
DIAS.forEach(d => RUTINA[d].items.forEach(it => ["casa", "gym"].forEach(m => { if(it[m]) ok(LIB[it[m]], "rutina " + d + ": " + it[m] + " existe"); })));
ok(casillasDeDia("A", "casa").length === 4 && casillasDeDia("A", "gym").length === 5, "día A: 4 casillas en casa, 5 en el gym");
ok(casillasDeDia("B", "casa").length === 5 && casillasDeDia("B", "gym").length === 6, "día B: 5 en casa, 6 en el gym");
ok(casillasDeDia("A", "casa")[0].id === "dominadas", "las dominadas van primero");
ok(casillasDeDia("B", "casa")[2].id === "nordico" && casillasDeDia("B", "gym")[2].id === "curl_femoral_maq", "casilla 3 de B cambia por modo");
ok(casillasDeDia("D", "casa")[0].series === 3 && casillasDeDia("D", "casa")[0].min === 10, "el remo invertido del día D lleva su propia prescripción");
/* volumen semanal por grupo con la rutina completa en casa, sin pausados */
DB.pausados = {};
const cuenta = {};
DIAS.forEach(d => casillasDeDia(d, "casa").forEach(c => { const g = LIB[c.id].g; cuenta[g] = (cuenta[g] || 0) + c.series; }));
console.log("series/semana en casa:", JSON.stringify(cuenta));
ok(cuenta.Espalda >= 8 && cuenta.Espalda <= 20, "espalda dentro de la banda 8 a 20, tiene " + cuenta.Espalda);
ok(cuenta.Pecho >= 8 && cuenta.Pecho <= 20, "pecho dentro de la banda, tiene " + cuenta.Pecho);
/* el sesgo al tirón se mide en series semanales (la rutina de la spec queda
   casi pareja por casillas: 4 y 4 en casa, 5 y 4 en el gym) */
const seriesDe = (m, re) => DIAS.reduce((a, d) => a + casillasDeDia(d, m).filter(c => re.test(LIB[c.id].patron)).reduce((b, c) => b + c.series, 0), 0);
console.log("series tirón:empuje, casa " + seriesDe("casa", /tiron/) + ":" + seriesDe("casa", /empuje/) + ", gym " + seriesDe("gym", /tiron/) + ":" + seriesDe("gym", /empuje/));
ok(seriesDe("casa", /tiron/) >= seriesDe("casa", /empuje/) && seriesDe("gym", /tiron/) > seriesDe("gym", /empuje/), "hay sesgo al tirón en series");

/* escaleras */
Object.keys(ESCALERAS).forEach(k => {
  const e = ESCALERAS[k];
  ok(e.every((n, i) => n.i === i && n.n), "escalera " + k + ": índices consecutivos y nombres");
});
ok(nombreNivel("dominadas", 3) === "Banda media", "semilla: dominadas en banda media");
ok(criterioDe("dominadas", 3).s === 4 && criterioDe("dominadas", 3).r === 8, "criterio de banda media: 4 × 8");
ok(criterioDe("dominadas", 8) === null, "el último peldaño no tiene criterio");
ok(textoCriterio("flexiones", 4) === "3 series de 20 repeticiones", "texto del criterio, es: " + textoCriterio("flexiones", 4));

/* esquemas SVG: geometría, encuadre y keyframes */
const css = cssEsquemas();
const kf = css.match(/@keyframes/g) || [];
ok(kf.length >= Object.keys(ESQ).length, "hay al menos un keyframe por esquema");
ok(!/\{\s*\}/.test(css) && !/transform:\}/.test(css), "ningún keyframe queda vacío");
ok((css.match(/rotate\(-?[\d.]+deg\)/g) || []).length === kf.length, "todas las rotaciones llevan deg");
Object.keys(ESQ).forEach(k => {
  const def = ESQ[k].rig(), c = def.caja;
  ok(c && c[2] > c[0] && c[3] > c[1], k + ": caja válida");
  const prop = (c[3] - c[1]) / (c[2] - c[0]);
  const alto = Math.round(Math.max(96, Math.min(200, 200 * prop)));
  const e = encuadre(c, 200, alto);
  ok(c[0] * e.zoom + e.dx >= -0.5 && c[2] * e.zoom + e.dx <= 200.5 && c[1] * e.zoom + e.dy >= -0.5 && c[3] * e.zoom + e.dy <= alto + 0.5, k + ": la figura cabe en su lienzo");
  ok(/viewBox="0 0 200 \d+"/.test(esquemaSVG(k)), k + ": el lienzo animado arranca en 0 0");
});
/* mapa v1 apunta a ids reales */
Object.keys(MAPA_V1).forEach(k => ok(LIB[MAPA_V1[k].id], "MAPA_V1 " + k + " → " + MAPA_V1[k].id + " existe"));
Object.keys(LEGADO_V1).forEach(k => ok(!LIB[k], "legado " + k + " no choca con la rutina"));
console.log(f ? "*** " + f + " FALLAS ***" : "biblioteca y rutina: todo verde");
process.exit(f ? 1 : 0);
