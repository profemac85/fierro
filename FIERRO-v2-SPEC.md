# Fierro v2 — Especificación técnica

Actualización de la app de entrenamiento existente (`fierro.html`). Un solo archivo HTML con CSS y JS embebidos, sin dependencias, sin build step, instalable como PWA en iPhone.

El usuario es Max: 41 años, 1,80 m, ~90 kg, entrena en casa con equipamiento limitado y a veces tiene acceso a un gimnasio completo. Objetivo: perder grasa y ganar músculo, con énfasis estético en la proporción hombro-cintura.

---

## 1. Qué cambia respecto de v1

v1 asumía una rutina fija de gimnasio con progresión por kilos. Eso no sirve: el usuario entrena en casa con mancuernas fijas de 10 kg, donde no se puede sumar carga.

Los cinco cambios estructurales:

1. **Progresión por niveles además de por peso.** Cada ejercicio declara su tipo de progresión. Con equipamiento fijo, avanzar significa subir de escalón (menos asistencia de banda, ángulo más difícil, más tempo), no sumar kilos.
2. **Dos modos: Casa y Gimnasio.** Un botón cambia la rutina completa. Misma estructura de días, ejercicios sustituidos.
3. **Sesiones ad hoc por JSON.** El usuario conversa con Claude, recibe un JSON y lo pega en la app. Se genera una sesión a medida con historial propio.
4. **Peso corporal como variable de carga.** En dominadas y fondos el peso corporal *es* la carga. Bajar de peso es progreso y la app debe mostrarlo.
5. **RIR opcional** en la última serie de cada ejercicio, para distinguir estancamiento real de falta de intensidad.

Se conserva de v1: la identidad visual, las cuatro vistas, el fundamento por ejercicio, el sistema de logros al guardar sesión, y la vista Antes/Ahora.

---

## 2. Modelo de datos

### 2.1 Ejercicio

```js
{
  id: "dominadas",
  n: "Dominadas",
  g: "Espalda",                    // grupo muscular para el conteo semanal
  patron: "tiron-vertical",        // tiron-vertical | tiron-horizontal | empuje-vertical
                                   // empuje-horizontal | bisagra | rodilla | core | acond
  modos: ["casa", "gym"],          // en qué modos aparece
  prog: {                          // TIPO DE PROGRESIÓN POR MODO (ver §2.2)
    casa: "nivel",
    gym:  "nivel"
  },
  niveles: [ ... ],                // solo si algún modo usa prog "nivel"
  series: 4, min: 5, max: 8,       // prescripción por defecto
  tempo: "3-0-1",                  // opcional, excéntrica-pausa-concéntrica en segundos
  descanso: 150,                   // segundos sugeridos
  p: "Párrafo de fundamento...",   // por qué se hace, qué dice la evidencia
  tec: "Cue técnico breve",
  video: "https://...",            // siempre presente
  img: "assets/dominadas.svg",     // opcional, ver §7
  agarre: true                     // true si carga el agarre (ver §6 lesiones)
}
```

### 2.2 Regla central: el tipo de progresión pertenece al par ejercicio × modo

Esta es la decisión de diseño más importante y hay que respetarla literalmente.

Tres categorías de ejercicio:

**A. Idénticos en ambos modos.** Dominadas, fondos, remo invertido, plancha, elevación de piernas colgado, flexiones. Mismo movimiento, misma escalera de niveles, **un solo historial compartido**. Seis dominadas con banda media en un hotel son el mismo dato que seis en casa. No fragmentar.

**B. Propios del gimnasio.** Jalón al pecho, prensa, remo en polea, extensión de tríceps en polea, curl en polea. `modos: ["gym"]`, `prog: {gym: "peso"}`. Historial propio por definición.

**C. Mismo movimiento, distinto universo de carga.** Press de banca con mancuernas, sentadilla búlgara, press militar, elevaciones laterales, curl martillo, peso muerto rumano. Un solo ejercicio, pero:

```js
prog: { casa: "nivel", gym: "peso" }
```

En casa progresan por tempo y variante; en gimnasio por kilos. **Cada serie se marca con el modo en que se hizo**, y la vista Avances los muestra como bloques separados. Nunca comparar 10 kg de casa contra 30 kg de gimnasio como si fuera un salto de fuerza.

### 2.3 Nivel

```js
{
  i: 3,
  n: "Dominada con banda media",
  desc: "Banda de resistencia media bajo las rodillas",
  criterio: "4 series completas de 8 repeticiones"  // cuándo se sube de nivel
}
```

El criterio de ascenso se evalúa automáticamente al guardar la sesión, pero **el ascenso lo confirma el usuario**, nunca la app sola. La app propone: "Completaste el criterio de X. ¿Subes al nivel Y?" con botones Sí / Todavía no.

### 2.4 Serie registrada

```js
{
  kg: 0,          // 0 si prog es "nivel" o "tiempo"
  reps: 6,        // repeticiones, o segundos si prog es "tiempo"
  nivel: 3,       // índice del nivel usado, null si prog es "peso"
  modo: "gym",    // OBLIGATORIO en cada serie
  rir: 2          // solo en la última serie, opcional, null si no se registró
}
```

### 2.5 Estado global (persistido en localStorage)

```js
{
  v: 2,
  modo: "casa",                    // modo activo
  pesoCorporal: [{ts, kg}],        // historial, ver §5
  sesiones: [{
    fecha: "2026-09-17",
    dia: "A",                      // A|B|C|D, o el id de la sesión ad hoc
    modo: "gym",
    adhoc: null,                   // o el id de la sesión ad hoc
    reg: { ejercicioId: [Serie, ...] },
    duracion: 2340                 // segundos, opcional
  }],
  niveles: { ejercicioId: 3 },     // nivel actual por ejercicio
  pausados: {
    ejercicioId: { desde: "2026-09-17", motivo: "...", sustituto: "otroId" }
  },
  sesionesAdHoc: [ SesionAdHoc ],  // biblioteca, ver §4
  ejerciciosCustom: { id: Ejercicio },  // los que llegan por JSON
  cardio: { "2026-09-14": 2 },     // sesiones por semana (clave = lunes)
  parametros: {
    sesgoTironEmpuje: "3:2",
    notaSesgo: "Corrige déficit de tirón + prioridad estética hombro-cintura"
  },
  pendiente: {}                    // sesión en curso sin guardar
}
```

Todo acceso a localStorage va envuelto en `try/catch` y la app debe renderizar correctamente con estado vacío.

---

## 3. Rutina base

Cuatro días. Rotación A → B → C → D → A. **El contador de rotación es global**: si hace el día A en el gimnasio, lo siguiente es B, sin importar el modo. El modo solo decide qué ejercicios se renderizan.

Reparto sugerido: lunes A, martes B, jueves C, viernes D. Nunca B y D consecutivos (ambos cargan piernas).

### Día A · Tirón

| # | Casa | Gimnasio | Series × reps |
|---|---|---|---|
| 1 | Dominadas | Dominadas | 4 × 5-8 |
| 2 | Remo invertido | Remo invertido | 4 × 8-12 |
| 3 | Face pull con bandas | Face pull en polea | 3 × 12-15 |
| 4 | — | Jalón al pecho | 3 × 8-12 |
| 5 | Curl martillo | Curl martillo | 3 × 10-12 |

Las dominadas van **primero**, con el cuerpo fresco: son el objetivo prioritario del usuario.

### Día B · Piernas

| # | Casa | Gimnasio | Series × reps |
|---|---|---|---|
| 1 | Sentadilla búlgara | Sentadilla búlgara | 3 × 8-12 por pierna |
| 2 | Peso muerto rumano 1 pierna | Peso muerto rumano | 3 × 8-12 |
| 3 | Curl nórdico | Curl femoral en máquina | 3 × 4-6 / 3 × 10-12 |
| 4 | Empuje de cadera con kettlebell | Empuje de cadera con barra | 3 × 12-15 |
| 5 | — | Prensa de piernas | 3 × 10-15 |
| 6 | Elevación de piernas colgado | Elevación de piernas colgado | 3 × 12-15 |

### Día C · Empuje

| # | Casa | Gimnasio | Series × reps |
|---|---|---|---|
| 1 | Fondos | Fondos | 4 × 6-10 |
| 2 | Press banca con mancuernas | Press banca con mancuernas | 3 × 8-12 |
| 3 | Press militar con mancuernas | Press militar con mancuernas | 3 × 10-12 |
| 4 | Elevaciones laterales | Elevaciones laterales | 3 × 12-15 |
| 5 | Extensión de tríceps | Extensión de tríceps en polea | 3 × 10-12 |

### Día D · Mixto y acondicionamiento

| # | Casa | Gimnasio | Series × reps |
|---|---|---|---|
| 1 | Remo invertido | Remo en polea | 3 × 10-12 |
| 2 | Sentadilla goblet | Sentadilla goblet | 3 × 12-15 |
| 3 | Flexiones en manillas | Flexiones en manillas | 3 × máximo |
| 4 | Plancha lateral | Plancha lateral | 3 × 30 seg por lado |
| 5 | Intervalos de burpees | Intervalos de burpees | 8-10 × 30 seg / 90 descanso |

---

## 4. Sesiones ad hoc por JSON

El caso de uso: el usuario está de vacaciones sin equipo, o tiene solo 30 minutos, o 90 minutos, o apareció una lesión. Conversa con Claude, recibe un JSON, lo pega en la app.

### 4.1 Interfaz

Quinta pestaña o botón en Hoy: **Importar**. Un textarea, un botón Validar, una previsualización de lo que se va a cargar (nombre, motivo, ejercicios, cuáles son nuevos), y un botón Cargar. Errores de validación en lenguaje claro, nunca un stack trace.

### 4.2 Esquema

```json
{
  "tipo": "sesion-adhoc",
  "id": "vacaciones-sin-equipo",
  "nombre": "Vacaciones sin equipo",
  "motivo": "Sin acceso a equipamiento. 30 minutos. Mantener el estímulo de empuje y core.",
  "reemplazaDia": null,
  "duracionEstimada": 30,
  "ejercicios": [
    { "ref": "flexiones", "series": 4, "min": 8, "max": 15 },
    {
      "nuevo": {
        "id": "sentadilla_bulgara_sin_peso",
        "n": "Sentadilla búlgara sin peso",
        "g": "Cuádriceps",
        "patron": "rodilla",
        "prog": { "adhoc": "nivel" },
        "niveles": [
          { "i": 0, "n": "Con apoyo de mano", "criterio": "3 × 12 por pierna" },
          { "i": 1, "n": "Sin apoyo" },
          { "i": 2, "n": "Sin apoyo, pausa 2 seg abajo" }
        ],
        "p": "Fundamento en un párrafo...",
        "tec": "Cue técnico",
        "video": "https://...",
        "agarre": false
      },
      "series": 3, "min": 8, "max": 12
    }
  ]
}
```

Reglas:

- `ref` apunta a un ejercicio ya existente en la biblioteca y **hereda su historial y su nivel**.
- `nuevo` define un ejercicio que se agrega a `ejerciciosCustom` y queda disponible para futuras sesiones.
- Si `reemplazaDia` es `"C"`, la sesión avanza la rotación y cuenta como el día C. Si es `null`, es un extra y **no avanza la rotación**.
- La sesión queda guardada en `sesionesAdHoc` y es **reutilizable**: aparece como botón en Hoy y acumula historial sesión a sesión.

### 4.3 Segundo tipo de JSON: actualización

```json
{
  "tipo": "actualizacion",
  "pausar": [
    { "ref": "curl_martillo", "motivo": "Sobrecarga de antebrazo", "sustituto": "curl_supino_liviano" }
  ],
  "reanudar": ["otro_id"],
  "nivel": [ { "ref": "dominadas", "i": 4 } ],
  "parametros": { "sesgoTironEmpuje": "2:2" }
}
```

Permite ajustar la rutina sin recargar una sesión completa.

---

## 5. Peso corporal como carga

Campo actualizable en Ajustes o en la cabecera. Guarda historial `{ts, kg}`.

En dominadas, fondos, remo invertido, flexiones y elevación de piernas (todos los de peso corporal), la app calcula **carga efectiva** y la usa en la vista Avances:

```
cargaEfectiva = pesoCorporalActual × repeticiones
```

Y genera el mensaje que hace visible el avance invisible:

> Tus 6 dominadas de hoy a 86 kg equivalen a 6 dominadas con 4 kg de lastre cuando pesabas 90.

Esta es una de las funciones más importantes de la app: conecta el progreso de la dieta con el del entrenamiento, que de otro modo se leen como cosas separadas.

No duplicar el registro de nutrición. El usuario ya usa otra app para eso.

---

## 6. Lesiones y pausas

Cada ejercicio tiene un flag `agarre: true/false`. El usuario tiene historial de sobrecarga de antebrazo, así que la app debe poder filtrar por eso.

- Mantener pulsado un ejercicio abre un menú: Pausar / Cambiar nivel / Ver fundamento.
- Al pausar se pide motivo y opcionalmente un sustituto.
- El ejercicio pausado **no se borra ni pierde su nivel**: queda congelado con fecha de inicio y se muestra atenuado.
- En la vista Semana aparece un aviso: "3 ejercicios en pausa desde hace 12 días".
- Si se pausa un ejercicio con `agarre: true`, la app sugiere revisar los otros con el mismo flag.

---

## 7. Demostración visual por ejercicio

Requisito heredado de v1, en este orden de preferencia:

1. Imagen de banco abierto si existe.
2. Si no, un SVG animado inline que muestre el movimiento.
3. **Siempre** un enlace a video, independientemente de lo anterior.

Sin dependencias externas: los SVG van embebidos en el archivo.

---

## 8. Vistas

### 8.1 Hoy

- Cabecera: selector **Casa / Gimnasio** (segmented control, cambio inmediato), día de la rotación, contador de sesión.
- Lista de ejercicios en orden, cada uno con: número, nombre, grupo, prescripción, **nivel actual** si aplica, demostración visual, campos de registro por serie, y el botón desplegable "¿Por qué este ejercicio?" con el fundamento y el cue técnico.
- Línea de sugerencia sobre los campos, derivada de la sesión anterior del mismo ejercicio **en el mismo modo**. Ejemplos:
  - `Última vez: 6, 5, 5, 5 con banda media. Apunta a 7 en la primera.`
  - `Completaste 4×8 con banda media. Toca banda delgada y volver a 5.`
  - `Última vez: 22,5 kg × 10, 10, 9. Mantén el peso y suma una repetición.`
- **RIR solo en la última serie**: tres botones (0-1, 2-3, 4+), opcional, un toque.
- Botones de sesiones ad hoc disponibles, si las hay.
- Temporizador de descanso opcional entre series, con el valor de `descanso` del ejercicio.

### 8.2 Semana

Igual que v1, más:
- Marca de qué días se hicieron en qué modo.
- Barra de series por grupo muscular contra la banda de 8-20 semanales.
- Ejercicios en pausa.
- Cardio (1/2/3 sesiones).
- Historial de las últimas 12 sesiones.

### 8.3 Avances

El corazón de la app. Para cada ejercicio con datos:

- **Antes y ahora**: primera serie registrada contra mejor serie actual, con porcentaje.
- **Separado por modo** cuando hay datos en ambos. Dos bloques, nunca mezclados.
- **Escalera de niveles** visualizada: los escalones recorridos en verde, el actual destacado, los que faltan atenuados. Esto es lo que más motiva en un ejercicio como dominadas.
- **Carga efectiva** con el ajuste por peso corporal (§5).
- Sparkline de evolución cuando hay 3 o más sesiones.

KPIs arriba: sesiones, semanas entrenando, toneladas movidas, niveles subidos.

### 8.4 Método

Los principios de entrenamiento de v1, más una sección nueva de **criterios de diseño** con los seis fundamentos de esta rutina y su estado:

1. Sesgo al tirón 3:2 — *activo, revisar al llegar a 8 dominadas libres*
2. Progresión por dificultad — *activo mientras el equipamiento sea fijo*
3. Frecuencia 2× por grupo — *permanente*
4. Piernas a una pierna — *activo en modo Casa*
5. Agarre como recurso limitado — *activo mientras haya molestia de antebrazo*
6. Acondicionamiento separado — *permanente*

Cada uno con su párrafo de justificación. Los que son contextuales van marcados como tales, con el disparador que los debería hacer caducar. **La app avisa cuando se cumple un disparador, pero no cambia nada sola**: sugiere conversarlo.

### 8.5 Importar

§4.1.

---

## 9. Logros al guardar sesión

Modal al terminar. Jerarquía por impacto:

1. **Subida de nivel** (lo más alto). "Primera dominada libre" debe sentirse como un hito, no como una línea de registro.
2. **Récord**: más peso, más reps al mismo peso, más tiempo.
3. **Carga efectiva**: el ajuste por peso corporal.
4. **Volumen**: más trabajo total que la última vez que hizo ese día en ese modo.
5. **Constancia**: sesiones acumuladas, semanas seguidas.
6. **Acumulado**: toneladas totales desde el inicio.

Si la sesión cumplió el criterio de ascenso de algún ejercicio, el modal lo propone con botones Sí / Todavía no.

---

## 10. Datos semilla

Niveles conocidos al momento de escribir esto, precargados y editables:

| Ejercicio | Nivel inicial |
|---|---|
| Dominadas | Banda media (6 repeticiones) |
| Remo invertido | Cuerpo horizontal (12 repeticiones) |
| Fondos | Libres, 10 repeticiones (listo para lastre) |
| Elevación de piernas colgado | Piernas rectas sobre 90° |
| Flexiones | En manillas |

Estado inicial: `curl_martillo` pausado por sobrecarga de antebrazo. Peso corporal: 90 kg.

---

## 11. Escaleras de progresión

### Dominadas
0. Remo invertido inclinado → 1. Remo invertido horizontal → 2. Banda gruesa → **3. Banda media** → 4. Banda delgada → 5. Negativas 5 seg → 6. Dominada libre → 7. Libre × 8 → 8. Con lastre *(pasa a prog "peso")*

Criterio de ascenso entre niveles de banda: 4 series de 8.

### Remo invertido
0. Barra alta, cuerpo 60° → 1. Cuerpo 45° → 2. Cuerpo 30° → **3. Horizontal** → 4. Horizontal con pies elevados → 5. Con pausa 2 seg → 6. A una mano asistido

### Fondos
0. Pies en el suelo → 1. Con banda → 2. Negativas → **3. Libres** → 4. Con lastre *(pasa a prog "peso")*

### Curl nórdico
0. Mucha ayuda de manos → 1. Ayuda moderada → 2. Ayuda mínima en el último tercio → 3. Sin ayuda

### Elevación de piernas colgado
0. Rodillas a 90° → 1. Rodillas al pecho → 2. Piernas rectas a 90° → **3. Rectas sobre 90°** → 4. Rectas hasta la barra → 5. Con bajada de 3 seg

### Flexiones
0. En pared → 1. En banco → 2. Rodillas → 3. Normales → **4. En manillas** → 5. Pies elevados → 6. Arquero

### Ejercicios con mancuernas fijas de 10 kg (modo Casa)
Escalera genérica de tempo y variante:
0. Sin peso → 1. Una mancuerna → 2. Dos mancuernas → 3. Dos con pausa 2 seg abajo → 4. Tempo 3-1-1 → 5. Tempo 4-2-1

En modo Gimnasio estos mismos ejercicios usan `prog: "peso"` y la escalera no aplica.

---

## 12. Fundamentos por ejercicio

Cada ejercicio necesita un párrafo de `p` que explique **por qué se hace y qué dice la evidencia**. Esto no es decorativo: es el requisito explícito del usuario y la razón por la que la app le sirve.

Criterios de redacción:
- Un párrafo, entre 80 y 140 palabras.
- Qué músculos trabaja, por qué está en esta rutina específicamente, qué dice la evidencia relevante.
- Tono directo, sin lenguaje motivacional ni promocional.
- Sin rayas como inciso. Usar comas o paréntesis.
- Español de Chile, natural.

Los fundamentos de los ejercicios que ya existían en v1 se conservan. Los nuevos (remo invertido, curl nórdico, sentadilla búlgara, peso muerto rumano a una pierna, flexiones en manillas, plancha lateral, burpees, jalón al pecho, prensa, remo en polea) hay que escribirlos con el mismo criterio.

---

## 13. Identidad visual

Se conserva íntegra de v1.

```css
--tiza: #EDEEE9;      /* fondo */
--fierro: #171C1F;    /* texto y acento oscuro */
--pino: #2F5D50;      /* verde, progreso y confirmación */
--bronce: #A8781F;    /* dorado, récords y destaques */
--pizarra: #4A5A63;   /* azul grisáceo, constancia */
--rojo: #8E3B2F;      /* alertas */
```

Tipografía: Oswald (títulos), Source Sans 3 (cuerpo), Spline Sans Mono (números y etiquetas). Fondo con retícula sutil de líneas horizontales. Estética de cuaderno de registro industrial, no de app de fitness comercial.

Responsive, mobile first, con `prefers-color-scheme` respetado y `prefers-reduced-motion` honrado.

---

## 14. Requisitos técnicos

- Un solo archivo `fierro.html`. HTML, CSS y JS embebidos. Cero dependencias, cero build.
- Fuentes desde Google Fonts con stack de respaldo real.
- PWA instalable en iOS: manifest inline o vía meta tags, `apple-mobile-web-app-capable`, icono embebido como data URI.
- Persistencia en `localStorage`, siempre con `try/catch`.
- **Exportar e importar todo el estado como JSON.** Imprescindible por dos razones: respaldo, y porque el paso siguiente del proyecto es un agente asesor que va a consumir estos datos. El formato de exportación debe ser estable y autodescriptivo.
- Migración desde v1: si detecta estado de la versión anterior, convertirlo sin perder historial.

---

## 15. Fuera de alcance en esta versión

- Registro de nutrición (el usuario ya tiene otra app).
- Sincronización entre dispositivos.
- El agente asesor. Se construye después, y va a consumir el JSON de exportación de §14. Diseñar ese formato pensando en eso.
