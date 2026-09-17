#!/bin/bash
# Pruebas de Fierro. No hay framework: se extrae el JS del index.html, se le
# antepone un harness que finge localStorage y DOM, y se corre con node.
#
#   bash scripts/pruebas/correr.sh
set -e
cd "$(dirname "$0")/../.."
T=$(mktemp -d)

python3 -c "
import re
s = open('index.html', encoding='utf-8').read()
js = re.search(r'<script>\n\"use strict\";(.*?)</script>', s, re.S).group(1)
open('$T/fierro.js', 'w').write(js)
h = set(re.findall(r'on(?:click|input|change|error|load|toggle)=\"(\w+)\(', s))
d = set(re.findall(r'function (\w+)', js))
faltan = sorted(h - d)
print('handlers sin definir:', faltan or 'ninguno')
print('guiones largos:', s.count('—'))
print('balance divs:', s.count('<div') - s.count('</div>'))
assert not faltan, 'hay handlers sin definir'
assert s.count('—') == 0, 'hay guiones largos en la interfaz'
assert s.count('<div') == s.count('</div>'), 'divs descuadrados'
"
node --check "$T/fierro.js"
echo "sintaxis ok"

P=scripts/pruebas
# ojo: nada de \`node ... | tail\`, que se traga el código de salida y deja
# pasar una suite con fallas. Se guarda la salida y se muestra el final.
correr(){   # $1 = prueba
  echo "--- $1 ---"
  cat "$P/harness.js" "$T/fierro.js" "$P/$1.js" > "$T/s.js"
  if node "$T/s.js" > "$T/out.txt" 2>&1; then
    tail -3 "$T/out.txt"
  else
    cat "$T/out.txt"; echo "FALLO en $1"; exit 1
  fi
}
for prueba in 01-biblioteca 02-logica 03-sesion 04-migracion 05-importar 06-guia; do correr "$prueba"; done

rm -rf "$T"
echo "todo verde"
