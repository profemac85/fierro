#!/usr/bin/env python3
# Script de construcción de Fierro. Se corre UNA vez (o cuando se agreguen
# ejercicios); no forma parte de la app y la app funciona aunque nunca se corra.
#
# Baja imágenes de demostración del catálogo abierto de wger (licencia CC BY-SA,
# API pública https://wger.de/api/v2/) y las deja en /media/ejercicios/.
# Nota 2026: el endpoint /exercise/search/ ya no existe; se busca con el filtro
# ?name= de /exercise-translation/ (coincidencia parcial, inglés = language 2)
# y las imágenes salen de /exerciseimage/?exercise={id}.
#
# Requiere macOS (usa `sips` para redimensionar). Sin dependencias de pip.
#
# Salidas:
#   ../media/ejercicios/{clave}.jpg|png   imágenes a 640 px de ancho máximo
#   ../media/ejercicios/CREDITOS.md       autor y licencia de cada una
#   ../media/ejercicios/reporte.json      qué se encontró y qué no (lo lee el
#                                         que construye, no la app)

import json
import os
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request

BASE = "https://wger.de/api/v2"
UA = {"User-Agent": "FierroBuild/1.0 (app personal de entrenamiento)"}
AQUI = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.normpath(os.path.join(AQUI, "..", "media", "ejercicios"))
LANG_EN = 2

# clave de la biblioteca -> nombre visible y términos de búsqueda en orden.
# Los ejercicios raros llevan solo su término real: si no está, el reporte los
# marca y en la app caen al esquema SVG (capa 2 del brief).
# clave: (nombre visible, términos de búsqueda en orden, palabras excluidas)
# Los términos pueden ser nombres exactos del catálogo (van primero) o genéricos.
# Son los 22 ejercicios del programa: 20 de las sesiones A a D más las 2
# variantes de la fase 3 (que se espera que no estén y caigan al esquema SVG).
EJERCICIOS = {
    "press_banca":    ("Press de banca con mancuernas",   ["Bench Press Dumbbell", "dumbbell bench press", "bench press"], ["incline", "decline", "narrow", "smith", "barbell", "close"]),
    # ojo: la imagen wger "Bent Over Dumbbell Rows" es en realidad el remo a una
    # mano en banco (queda para remo_una_mano); para el remo inclinado bilateral
    # se usa la ilustración de remo inclinado de Everkinetic
    "remo_inclinado": ("Remo inclinado con mancuernas",   ["Bent Over Rowing", "bent over row"], ["reverse", "one arm", "rear delt", "single", "dumbbell"]),
    "press_hombro":   ("Press de hombro sentado",         ["Shoulder Press Dumbbells", "seated dumbbell shoulder press", "shoulder press"], ["machine", "multi", "arnold", "smith", "standing", "single"]),
    "dominada":       ("Dominadas y negativas",           ["pull up", "pull ups", "chin up"], ["assisted", "machine"]),
    "laterales":      ("Elevaciones laterales",           ["lateral raises", "lateral raise", "side raise"], ["cable", "machine"]),
    "bulgara":        ("Sentadilla bulgara",              ["Bulgarian Squat with Dumbbells", "bulgarian split squats", "split squat"], []),
    "gemelo":         ("Elevacion de gemelo a una pierna", ["single leg calf raise", "standing calf raises", "calf raise"], ["seated", "machine", "donkey"]),
    "goblet":         ("Sentadilla goblet",               ["goblet squat", "goblet"], []),
    "plancha":        ("Plancha frontal",                 ["plank"], ["side", "adductor", "dynamic"]),
    "zancada":        ("Zancada en retroceso",            ["reverse lunges", "reverse lunge", "lunge"], ["walking", "side"]),
    "flex_pies":      ("Flexiones con pies elevados",     ["decline push up", "feet elevated push up", "elevated push up"], []),
    "remo_una_mano":  ("Remo a una mano con mancuerna",   ["Bent Over Dumbbell Rows", "one arm dumbbell row", "single arm row"], ["rear delt"]),
    "press_inclinado":("Press inclinado con mancuernas",  ["Incline Bench Press Dumbbell", "incline dumbbell press"], ["smith", "barbell", "cable", "close"]),
    "face_pull":      ("Face pull con banda",             ["Face pulls with yellow green band", "Face Pulls"], ["dumbbell", "kurzhantel", "mancuerna", "doorframe"]),
    "curl_inclinado": ("Curl en banco inclinado",         ["Seated W Curl", "Curl inclinado con mancuernas", "incline dumbbell curl", "Biceps Curls With Dumbbell"], ["hammer", "cable", "barbell", "machine"]),
    "triceps":        ("Extension de triceps sobre la cabeza", ["Triceps Overhead Dumbbell", "overhead triceps extension", "triceps extension"], ["cable", "machine", "kickback", "lying", "bench"]),
    "rdl":            ("Peso muerto rumano con mancuernas", ["Dumbbell Romanian Deadlift", "Romanian Deadlift"], ["single", "one leg", "barbell"]),
    "hip_thrust":     ("Hip thrust apoyado en el banco",  ["hip thrust", "hip thrusts"], ["machine", "single"]),
    "curl_femoral":   ("Curl femoral con banda en banco", ["Leg curl with elastic", "leg curl"], ["machine", "sitting", "seated", "standing"]),
    "puente":         ("Puente de gluteo a una pierna",   ["single leg glute bridge", "one leg glute bridge", "glute bridge"], ["barbell", "machine"]),
    "flex_deficit":   ("Flexiones en deficit",            ["deficit push", "deep push"], []),
    "goblet_talones": ("Goblet con talones elevados",     ["heels elevated goblet squat", "cyclist squat"], []),

    # --- modo calistenia (seccion 4.9) y escalera de flexiones ---
    # flex_mesa y flex_silla no van a wger a proposito: el catalogo solo tiene la
    # flexion normal y en estos peldanos la altura de las manos ES el ejercicio,
    # asi que usan esquema propio (ver ESQ en index.html)

    "flex_suelo":     ("Flexiones en el suelo",           ["Push-Up", "push up"], ["incline", "decline", "wall", "deficit", "diamond", "archer", "pike"]),
    "flex_arqueras":  ("Flexiones arqueras",              ["archer push up"], []),
    "flex_pica":      ("Flexiones en pica",               ["pike push up"], []),
    "flex_diamante":  ("Flexiones diamante",              ["diamond push up", "close grip push up", "triangle push up"], []),
    "remo_invertido": ("Remo invertido en barra baja",    ["inverted row", "bodyweight row", "australian pull"], []),
    "remo_invertido_sup":("Remo invertido supino",        ["inverted row", "bodyweight row", "australian pull"], []),
    "laterales_banda":("Elevaciones laterales con banda", ["band lateral raise", "lateral raise band", "lateral raises"], ["cable", "machine"]),
    "curl_banda":     ("Curl de biceps con banda",        ["band biceps curl", "resistance band curl", "biceps curl band"], []),
    "fondos_silla":   ("Fondos en la silla",              ["bench dips", "chair dips", "triceps dips", "dips"], ["parallel", "ring"]),
    "bulgara_tempo":  ("Sentadilla bulgara con tempo",    ["Bulgarian Squat with Dumbbells", "bulgarian split squats"], []),
    "gemelo_rango":   ("Gemelo a una pierna, rango completo", ["single leg calf raise", "standing calf raises", "calf raise"], ["seated", "machine", "donkey"]),
    "sentadilla_asistida":("Sentadilla asistida a una pierna", ["assisted pistol squat", "pistol squat", "single leg squat"], []),
    "zancada_sp":     ("Zancada en retroceso sin peso",   ["reverse lunges", "reverse lunge", "lunge"], ["walking", "side", "dumbbell", "barbell"]),
    "rdl_uni":        ("Peso muerto rumano a una pierna", ["single leg deadlift", "one leg deadlift", "single leg romanian"], []),
    "hip_thrust_uni": ("Hip thrust a una pierna",         ["single leg hip thrust", "hip thrust"], ["machine"]),
    # curl_toalla tampoco: lo unico parecido en el catalogo es el Reverse Nordic,
    # que es el movimiento contrario (extension de cuadriceps). Esquema propio.

}


def pedir(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def licencias():
    mapa = {}
    url = f"{BASE}/license/?format=json&limit=50"
    while url:
        d = pedir(url)
        for lic in d["results"]:
            mapa[lic["id"]] = lic.get("short_name") or lic.get("full_name") or "?"
        url = d.get("next")
    return mapa


def catalogo():
    # baja el catálogo completo en inglés una vez (el filtro ?name= de la API
    # distingue mayúsculas y guiones, así que se busca localmente) y lo cachea
    cache = os.path.join(AQUI, "_catalogo_wger.json")
    if os.path.exists(cache):
        with open(cache, encoding="utf-8") as f:
            return json.load(f)
    todos = []
    url = f"{BASE}/exercise-translation/?format=json&language={LANG_EN}&limit=100"
    while url:
        d = pedir(url)
        todos += [{"name": r["name"], "exercise": r["exercise"]} for r in d["results"]]
        url = d.get("next")
        print(f"    catálogo: {len(todos)} nombres...", end="\r")
    print()
    with open(cache, "w", encoding="utf-8") as f:
        json.dump(todos, f)
    return todos


def normalizar(s):
    for c in "-_,()/":
        s = s.replace(c, " ")
    return " ".join(s.lower().split())


def buscar_traducciones(termino, cat, excluir):
    palabras = normalizar(termino).split()
    # también acepta plurales simples: "push up" debe encontrar "Push-ups"
    def contiene(nombre, p):
        return p in nombre or p.rstrip("s") in nombre
    out = []
    for r in cat:
        n = normalizar(r["name"])
        if all(contiene(n, p) for p in palabras) and not any(x in n for x in excluir):
            out.append(r)
    return out


def imagenes_de(exercise_id):
    url = f"{BASE}/exerciseimage/?format=json&exercise={exercise_id}"
    try:
        res = pedir(url)["results"]
    except Exception:
        return []
    res.sort(key=lambda i: (not i.get("is_main"), i.get("id", 0)))
    return res


def elegir(termino, resultados):
    # prefiere el nombre más corto que contenga todas las palabras del término
    palabras = termino.lower().split()
    def puntaje(r):
        n = r["name"].lower()
        completo = all(p in n for p in palabras)
        return (0 if completo else 1, len(n))
    return sorted(resultados, key=puntaje)


def sips(args):
    r = subprocess.run(["sips"] + args, capture_output=True, text=True, timeout=60)
    if r.returncode != 0:
        raise RuntimeError(f"sips falló: {r.stderr.strip() or r.stdout.strip()}")


def redimensionar(origen, destino_sin_ext):
    # ancho máx 640, JPG calidad 80 con objetivo < 80 KB; los PNG con
    # transparencia se quedan PNG para no terminar con fondo negro al convertir
    es_png = origen.lower().endswith(".png")
    try:
        salida = subprocess.run(["sips", "-g", "pixelWidth", origen],
                                capture_output=True, text=True, timeout=30)
        ancho = int(salida.stdout.strip().rsplit(" ", 1)[-1])
    except Exception:
        ancho = 9999
    if es_png:
        destino = destino_sin_ext + ".png"
        if ancho > 640:
            sips(["--resampleWidth", "640", origen, "-o", destino])
        else:
            shutil.copyfile(origen, destino)  # sips no acepta correr sin operaciones
    else:
        destino = destino_sin_ext + ".jpg"
        sips(["-s", "format", "jpeg", "-s", "formatOptions", "80"] +
             (["--resampleWidth", "640"] if ancho > 640 else []) +
             [origen, "-o", destino])
        if os.path.getsize(destino) > 80 * 1024:
            sips(["-s", "format", "jpeg", "-s", "formatOptions", "65",
                  "--resampleWidth", "560", origen, "-o", destino])
    # si un PNG quedó pesado, se intenta como JPG igual (suelen ser dibujos livianos)
    if es_png and os.path.getsize(destino) > 80 * 1024:
        alt = destino_sin_ext + ".jpg"
        sips(["-s", "format", "jpeg", "-s", "formatOptions", "80", destino, "-o", alt])
        if os.path.exists(alt) and os.path.getsize(alt) < os.path.getsize(destino):
            os.remove(destino)
            destino = alt
        else:
            os.remove(alt)
    # ajuste final: ningún JPG debe pasar de 80 KB
    if destino.endswith(".jpg") and os.path.getsize(destino) > 80 * 1024:
        sips(["-s", "format", "jpeg", "-s", "formatOptions", "65",
              "--resampleWidth", "560", destino, "-o", destino])
    return destino


def main():
    os.makedirs(DEST, exist_ok=True)
    cat = catalogo()
    print(f"catálogo wger: {len(cat)} ejercicios en inglés")
    lic = licencias()
    creditos = []
    reporte = {"encontrados": {}, "faltantes": []}
    cache = {}  # url origen -> ruta local ya procesada

    for clave, (nombre, terminos, excluir) in EJERCICIOS.items():
        print(f"[{clave}] {nombre}")
        elegido = None
        for termino in terminos:
            candidatos = elegir(termino, buscar_traducciones(termino, cat, excluir))
            for cand in candidatos[:8]:
                imgs = imagenes_de(cand["exercise"])
                if imgs:
                    elegido = (termino, cand, imgs[0])
                    break
            if elegido:
                break
        if not elegido:
            print("    sin imagen en wger, cae al esquema SVG")
            reporte["faltantes"].append(clave)
            continue

        termino, cand, img = elegido
        url = img["image"]
        destino_sin_ext = os.path.join(DEST, clave)
        try:
            if url in cache:
                origen_local = cache[url]
                ext = os.path.splitext(origen_local)[1]
                destino = destino_sin_ext + ext
                shutil.copyfile(origen_local, destino)
            else:
                bruto = os.path.join(DEST, "_bruto" + os.path.splitext(url)[1])
                req = urllib.request.Request(url, headers=UA)
                with urllib.request.urlopen(req, timeout=60) as r, open(bruto, "wb") as f:
                    f.write(r.read())
                destino = redimensionar(bruto, destino_sin_ext)
                os.remove(bruto)
                cache[url] = destino
            kb = os.path.getsize(destino) / 1024
            autor = img.get("license_author") or "autor no informado"
            licencia = lic.get(img.get("license"), "CC BY-SA")
            print(f"    ok: {os.path.basename(destino)} ({kb:.0f} KB), "
                  f"'{cand['name']}', {autor}, {licencia}")
            reporte["encontrados"][clave] = {
                "archivo": os.path.basename(destino),
                "wger": cand["name"],
                "autor": autor,
                "licencia": licencia,
                "url": url,
            }
            creditos.append((clave, nombre, cand["name"], autor, licencia, url))
        except Exception as e:
            print(f"    error bajando: {e}")
            reporte["faltantes"].append(clave)

    with open(os.path.join(DEST, "CREDITOS.md"), "w", encoding="utf-8") as f:
        f.write("# Créditos de las imágenes\n\n")
        f.write("Imágenes del catálogo abierto de [wger](https://wger.de), ")
        f.write("licencia Creative Commons Attribution Share-Alike (CC BY-SA), ")
        f.write("redimensionadas a 640 px de ancho máximo.\n\n")
        f.write("| Ejercicio | Imagen wger | Autor | Licencia |\n|---|---|---|---|\n")
        for clave, nombre, wnombre, autor, licencia, url in creditos:
            # el pipe rompe la tabla markdown: hay nombres como "Push-Ups | Decline"
            wnombre = wnombre.replace("|", "\\|")
            f.write(f"| {nombre} | [{wnombre}]({url}) | {autor} | {licencia} |\n")
        if reporte["faltantes"]:
            f.write("\nSin imagen en el catálogo (usan esquema propio de la app): ")
            f.write(", ".join(reporte["faltantes"]) + ".\n")

    with open(os.path.join(DEST, "reporte.json"), "w", encoding="utf-8") as f:
        json.dump(reporte, f, ensure_ascii=False, indent=2)

    print(f"\nListo: {len(creditos)} imágenes, {len(reporte['faltantes'])} faltantes: "
          f"{', '.join(reporte['faltantes']) or 'ninguno'}")


if __name__ == "__main__":
    sys.exit(main())
