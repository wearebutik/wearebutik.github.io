#!/usr/bin/env bash
# IndexNow (#188): dopo un deploy di produzione avvisa Bing, e con lui gli
# altri motori che aderiscono (Yandex, Seznam, Naver…), delle pagine nuove o
# cambiate, senza aspettare che rileggano la sitemap. Google non lo usa.
#
#   indexnow.sh cambiate <dist> <sito> > elenco.txt   prima del deploy
#   indexnow.sh invia <dist> <sito> < elenco.txt       dopo il deploy
#
# `cambiate` confronta ogni pagina della sitemap appena costruita con quella
# online: la build è deterministica, quindi una pagina diversa è una pagina
# cambiata. Una pagina che online non c'è (o non risponde 200) è nuova.
#
# `invia` legge la chiave dal file `<32 cifre esadecimali>.txt` in <dist>
# (copiato da apps/web/public), che i motori scaricano per verificare che
# l'avviso venga dal proprietario del sito. Un errore di IndexNow non fa
# fallire il deploy: lo segnala e basta.
set -euo pipefail

comando=${1:?cambiate | invia}
dist=${2:?cartella della build}
sito=${3:?indirizzo del sito, es. https://wearebutik.com}
sito=${sito%/}

case "$comando" in
  cambiate)
    tmp=$(mktemp)
    trap 'rm -f "$tmp"' EXIT
    for sitemap in "$dist"/sitemap-[0-9]*.xml; do
      grep -oE '<loc>[^<]+' "$sitemap" | sed 's/<loc>//'
    done | while read -r url; do
      percorso=${url#"$sito"}
      file="$dist${percorso%/}/index.html"
      [[ "$percorso" == */ ]] || file="$dist$percorso"
      if [[ ! -f "$file" ]]; then
        echo "$url"
        continue
      fi
      codice=$(curl -s -o "$tmp" -w '%{http_code}' --max-time 20 "$url" || echo 000)
      if [[ "$codice" != 200 ]] || ! cmp -s "$tmp" "$file"; then
        echo "$url"
      fi
    done
    ;;

  invia)
    mapfile -t urls
    if [[ ${#urls[@]} -eq 0 ]]; then
      echo "IndexNow: nessuna pagina cambiata."
      exit 0
    fi
    # Con un ciclo e non con `find -regex`, che ha sintassi diverse su GNU
    # (il runner) e BSD (macOS).
    chiave=
    for f in "$dist"/*.txt; do
      nome=$(basename "$f" .txt)
      if [[ "$nome" =~ ^[0-9a-f]{32}$ ]]; then
        chiave=$nome
        break
      fi
    done
    if [[ -z "$chiave" ]]; then
      echo "::warning::IndexNow: nessun file della chiave in $dist"
      exit 0
    fi
    corpo=$(jq -n --arg host "${sito#https://}" --arg key "$chiave" \
      --arg loc "$sito/$chiave.txt" '{host: $host, key: $key, keyLocation: $loc, urlList: $ARGS.positional}' \
      --args "${urls[@]}")
    codice=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 \
      -H 'Content-Type: application/json; charset=utf-8' \
      -d "$corpo" https://api.indexnow.org/indexnow || echo 000)
    # 200 e 202 sono entrambe risposte buone (202: chiave in verifica).
    if [[ "$codice" == 200 || "$codice" == 202 ]]; then
      echo "IndexNow: ${#urls[@]} pagine inviate (HTTP $codice)."
      printf '  %s\n' "${urls[@]}"
    else
      echo "::warning::IndexNow ha risposto HTTP $codice"
    fi
    ;;

  *)
    echo "comando sconosciuto: $comando (cambiate | invia)" >&2
    exit 2
    ;;
esac
