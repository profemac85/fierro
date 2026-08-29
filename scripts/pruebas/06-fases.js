let f=0; const ok=(c,m)=>{ if(!c){f++;console.log("FALLA:",m)} else console.log("ok:",m) };

// --- la fase sale de la semana, sin que nadie confirme nada ---
const esperado={1:1,2:1,3:1,4:1,5:2,6:2,7:2,8:2,9:3,10:3,11:3,12:3};
let malas=[];
for(let w=1;w<=12;w++){ semana=w; if(faseActual()!==esperado[w]) malas.push(w+":"+faseActual()); }
ok(malas.length===0,"las 12 semanas caen en su fase, fallan: "+(malas.join(",")||"ninguna"));

semana=9;
ok(faseActual()===3,"la semana 9 es fase 3, no fase 1");
ok(FASES[faseActual()].rondas===3,"y trae 3 rondas por bloque");
ok(FASES[faseActual()].rir==="0 a 1","y RIR 0 a 1");
ok(celdasSesion(sesionDe("A")).length===14,"la sesion A de la semana 9 tiene 14 celdas, tiene "+celdasSesion(sesionDe("A")).length);
semana=5; ok(faseActual()===2 && FASES[2].rondas===3,"la semana 5 es fase 2 con 3 rondas");
semana=4; ok(faseActual()===1 && FASES[1].rondas===2,"la 4 sigue en fase 1 con 2 rondas");

// --- las variantes de fase 3 entran solas ---
semana=8; ok(ejEfectivo("flex_pies")==="flex_pies","en fase 2 sigue la version normal");
semana=9; ok(ejEfectivo("flex_pies")==="flex_deficit","en fase 3 entra la variante en estiramiento");
ok(ejEfectivo("goblet")==="goblet_talones","y la goblet con talones elevados");

// --- repetir una fase corre los cortes, no congela nada ---
localStorage.removeItem("fz_cortes"); localStorage.removeItem("fz_criterios");
semana=4;
ok(esUltimaDeFase(4),"la semana 4 es la ultima de la fase 1");
ok(!esUltimaDeFase(3),"la 3 no");
ok(criteriosHTML().includes("paso a la fase 2"),"en la semana 4 ofrece pasar a la fase 2");
decidirFase(false);                       // repite la fase 1
semana=5; ok(faseActual()===1,"tras repetir, la semana 5 sigue en fase 1");
semana=6; ok(faseActual()===2,"y la fase 2 empieza en la 6");
semana=10; ok(faseActual()===3,"la fase 3 tambien se corre una semana");
semana=9; ok(faseActual()===2,"la 9 ahora es fase 2");

// repetir dos veces corre dos semanas
semana=5; decidirFase(false);
semana=6; ok(faseActual()===1,"repetir de nuevo estira la fase 1 hasta la 6");
semana=7; ok(faseActual()===2,"y la fase 2 arranca en la 7");

// avanzar no mueve nada: los cortes ya avanzan solos
const antes=JSON.stringify(lget("cortes",null));
semana=6; decidirFase(true);
ok(JSON.stringify(lget("cortes",null))===antes,"aceptar el cambio no toca los cortes");
semana=7; ok(faseActual()===2,"y la fase 2 sigue empezando donde correspondia");

// --- la tarjeta no se repite una vez decidida ---
localStorage.removeItem("fz_cortes"); localStorage.removeItem("fz_criterios");
semana=4;
ok(criteriosHTML()!=="","la tarjeta aparece");
decidirFase(true);
ok(criteriosHTML()==="","y no vuelve a aparecer esa semana");
semana=3; ok(criteriosHTML()==="","no aparece a mitad de fase");
semana=8; ok(criteriosHTML().includes("paso a la fase 3"),"reaparece al cerrar la fase 2");
semana=12; ok(criteriosHTML()==="","en la fase 3 no hay siguiente que ofrecer");

// --- la clave vieja no manda ---
localStorage.setItem("fz_fase","1");
semana=9; ok(faseActual()===3,"una fz_fase vieja guardada no congela la fase");

console.log(f? "\n*** "+f+" FALLAS ***":"\nfases: todo verde");
process.exit(f?1:0);
