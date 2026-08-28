/* Fierro · service worker: deja la app y las imágenes disponibles sin conexión.
   Dos estrategias, a propósito:
   - index.html (y toda navegación): network-first. Si hay conexión trae la
     versión nueva, y si no cae al caché. Con cache-first una actualización
     subida a Netlify no llegaría nunca al teléfono.
   - todo lo demás (imágenes, icono, manifest): cache-first, que es lo que
     hace que funcione en modo avión. */
const VERSION = "fierro-v1";
const NUCLEO = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg"
];
const MEDIA = [
  "bulgara.jpg", "bulgara_tempo.jpg", "curl_femoral.png",
  "curl_inclinado.jpg", "dominada.jpg", "face_pull.jpg",
  "flex_pica.jpg", "flex_pies.png", "flex_suelo.jpg",
  "fondos_silla.png", "gemelo.jpg", "gemelo_rango.jpg",
  "goblet.jpg", "hip_thrust.jpg", "hip_thrust_uni.jpg",
  "laterales.jpg", "laterales_banda.jpg", "plancha.png",
  "press_banca.jpg", "press_hombro.jpg", "press_inclinado.png",
  "puente.jpg", "rdl.jpg", "rdl_uni.jpg",
  "remo_inclinado.jpg", "remo_invertido.jpg", "remo_invertido_sup.jpg",
  "remo_una_mano.png", "sentadilla_asistida.jpg", "triceps.jpg",
  "zancada.jpg", "zancada_sp.jpg"
].map(f => "./media/ejercicios/" + f);

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(VERSION).then(cache =>
      // allSettled: si falta la carpeta de medios, la app se instala igual
      Promise.allSettled(NUCLEO.concat(MEDIA).map(u => cache.add(u)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function guardar(req, resp){
  if(resp && resp.ok){
    const copia = resp.clone();
    caches.open(VERSION).then(c => c.put(req, copia));
  }
  return resp;
}

self.addEventListener("fetch", e => {
  if(e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if(url.origin !== location.origin) return;

  const esApp = e.request.mode === "navigate" || url.pathname.endsWith("index.html");
  if(esApp){
    e.respondWith(
      fetch(e.request).then(r => guardar(e.request, r))
        .catch(() => caches.match(e.request).then(hit => hit || caches.match("./index.html")))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => hit ||
      fetch(e.request).then(r => guardar(e.request, r)))
  );
});
