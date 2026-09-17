let f = 0; const ok = (c, m) => { if(!c){ f++; console.log("FALLA:", m); } else console.log("ok:", m); };
pintarImportar();
/* el ejemplo de la spec, con prosa alrededor y un ejercicio nuevo */
const adhoc = {
  tipo:"sesion-adhoc", id:"vacaciones-sin-equipo", nombre:"Vacaciones sin equipo",
  motivo:"Sin acceso a equipamiento. 30 minutos.", reemplazaDia:null, duracionEstimada:30,
  ejercicios:[
    {ref:"flexiones", series:4, min:8, max:15},
    {nuevo:{id:"sentadilla_bulgara_sin_peso", n:"Sentadilla búlgara sin peso", g:"Cuádriceps", patron:"rodilla", prog:{adhoc:"nivel"},
      niveles:[{i:0, n:"Con apoyo de mano", criterio:"3 × 12 por pierna"}, {i:1, n:"Sin apoyo"}, {i:2, n:"Sin apoyo, pausa 2 seg abajo"}],
      p:"Fundamento en un párrafo.", tec:"Cue técnico", video:"https://example.org", agarre:false}, series:3, min:8, max:12}
  ]
};
valores["#txtImport"] = "Acá va tu sesión:\n```json\n" + JSON.stringify(adhoc) + "\n```\nCualquier cosa me dices.";
validarImport();
ok(importPrevia && importPrevia.tipo === "adhoc", "valida la sesión ad hoc aunque venga con prosa y backticks");
ok(capt["#importSalida"].includes("Listo para cargar") && capt["#importSalida"].includes("nuevo") && capt["#importSalida"].includes("Sesión extra"), "previsualización con el ejercicio nuevo y el tipo de sesión");
cargarImport();
ok(DB.sesionesAdHoc.length === 1 && DB.sesionesAdHoc[0].id === "vacaciones-sin-equipo", "la sesión queda en la biblioteca");
ok(DB.ejerciciosCustom.sentadilla_bulgara_sin_peso && ej("sentadilla_bulgara_sin_peso").n === "Sentadilla búlgara sin peso", "el ejercicio nuevo queda disponible");
ok(progDe("sentadilla_bulgara_sin_peso", "casa") === "nivel" && escaleraDe("sentadilla_bulgara_sin_peso").length === 3, "progresa por nivel con su escalera propia");
ok(sel.adhoc === "vacaciones-sin-equipo", "al cargar se abre en HOY");
ok(capt["#app"].includes("Vacaciones sin equipo") && capt["#app"].includes("Sentadilla búlgara sin peso") && capt["#app"].includes("Flexiones"), "HOY pinta la ad hoc con sus ejercicios");
ok(casillasDe(sel, "casa")[0].series === 4 && casillasDe(sel, "casa")[0].max === 15, "la ref hereda la ficha pero manda la prescripción del JSON");
/* registrar una sesión ad hoc: historial propio y sin avanzar la rotación */
const antes = diaSugerido();
valores["#r_flexiones_0"] = "15"; anotarSerie("flexiones", 0);
valores["#r_sentadilla_bulgara_sin_peso_0"] = "12"; anotarSerie("sentadilla_bulgara_sin_peso", 0);
guardarSesion(); cerrarCierre();
ok(DB.sesiones.length === 1 && DB.sesiones[0].adhoc === "vacaciones-sin-equipo", "la sesión ad hoc se guarda con su id");
ok(diaSugerido() === antes, "una ad hoc extra no avanza la rotación");
ok(historial("flexiones").length === 1, "las flexiones acumulan historial desde la ad hoc (comparten con la rutina)");
/* volver a cargar la misma reemplaza, no duplica */
valores["#txtImport"] = JSON.stringify(Object.assign({}, adhoc, {nombre:"Vacaciones v2", reemplazaDia:"C"}));
pintarImportar(); validarImport(); cargarImport();
ok(DB.sesionesAdHoc.length === 1 && DB.sesionesAdHoc[0].nombre === "Vacaciones v2" && DB.sesionesAdHoc[0].reemplazaDia === "C", "mismo id reemplaza la guardada");
valores["#r_flexiones_0"] = "15"; anotarSerie("flexiones", 0); guardarSesion(); cerrarCierre();
ok(diaSugerido() === "D", "con reemplazaDia C la rotación queda en D");

/* errores en lenguaje claro */
pintarImportar();
valores["#txtImport"] = '{"tipo":"sesion-adhoc","id":"x","nombre":"X","ejercicios":[{"ref":"no_existe"},{"series":3}]}';
validarImport();
ok(!importPrevia && capt["#importSalida"].includes("no existe en la biblioteca") && capt["#importSalida"].includes("tiene que traer ref"), "errores claros por ref inexistente y ejercicio sin ref ni nuevo");
valores["#txtImport"] = "esto no es json";
validarImport();
ok(!importPrevia && capt["#importSalida"].includes("No se pudo leer como JSON"), "texto suelto: error claro");
valores["#txtImport"] = '{"tipo":"sesion-adhoc","id":"y","nombre":"Y","reemplazaDia":"E","ejercicios":[{"nuevo":{"id":"Mal Id","n":"","prog":{"adhoc":"nivel"}},"series":0}]}';
validarImport();
const sal = capt["#importSalida"];
ok(sal.includes("A, B, C, D o null") && sal.includes("minúsculas") && sal.includes("falta el nombre") && sal.includes("no trae niveles") && sal.includes("mayor que cero"), "varios errores a la vez, todos explicados");
valores["#txtImport"] = '{"tipo":"otra"}';
validarImport();
ok(sal !== capt["#importSalida"] && capt["#importSalida"].includes("No reconozco el tipo"), "tipo desconocido");

/* actualización */
valores["#txtImport"] = JSON.stringify({tipo:"actualizacion", pausar:[{ref:"rdl", motivo:"Sobrecarga", sustituto:"hip_thrust"}], reanudar:["curl_martillo"], nivel:[{ref:"dominadas", i:4}], parametros:{sesgoTironEmpuje:"2:2"}});
validarImport();
ok(importPrevia && importPrevia.tipo === "actualizacion" && capt["#importSalida"].includes("Pausar Peso muerto rumano") && capt["#importSalida"].includes("nivel 4"), "previsualiza la actualización");
cargarImport();
ok(DB.pausados.rdl && DB.pausados.rdl.sustituto === "hip_thrust" && !DB.pausados.curl_martillo, "pausa y reanuda");
ok(nivelActual("dominadas") === 4 && DB.parametros.sesgoTironEmpuje === "2:2" && DB.ascensos.some(a => a.manual), "nivel y parámetros aplicados");
pintarImportar();
valores["#txtImport"] = JSON.stringify({tipo:"actualizacion", nivel:[{ref:"dominadas", i:40}]});
validarImport();
ok(!importPrevia && capt["#importSalida"].includes("niveles 0 a 8"), "nivel fuera de rango");
valores["#txtImport"] = JSON.stringify({tipo:"actualizacion"});
validarImport();
ok(!importPrevia && capt["#importSalida"].includes("no trae ningún cambio"), "actualización vacía");

/* respaldo por el mismo textarea */
const resp = exportarEstado();
DB.sesiones = []; guardar();
pintarImportar();
valores["#txtImport"] = resp;
validarImport();
ok(importPrevia && importPrevia.tipo === "respaldo" && capt["#importSalida"].includes("Respaldo completo"), "reconoce un respaldo exportado");
cargarImport();
ok(capt["#modalCaja"].includes("Restaurar respaldo"), "restaurar pide confirmación");
document.querySelector("#mbtn0").onclick;   /* el harness no guarda handlers: se aplica directo */
DB = importPrevia.estado; guardar();
ok(DB.sesiones.length === 2, "el estado restaurado trae las 2 sesiones");
/* el prompt para Claude lleva los ids y los niveles */
let copiado = "";
Object.defineProperty(globalThis, "navigator", {value:{clipboard:{writeText:t => { copiado = t; return Promise.resolve(); }}}, configurable:true, writable:true});
copiarPromptAdHoc();
ok(copiado.includes("dominadas=4") && copiado.includes("sentadilla_bulgara_sin_peso") && copiado.includes('"tipo":"sesion-adhoc"'), "las instrucciones para Claude llevan niveles, ids y el formato");
console.log(f ? "\n*** " + f + " FALLAS ***" : "\nimportar: todo verde");
process.exit(f ? 1 : 0);
