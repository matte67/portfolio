# Almost There · Percorso dei progetti

Intro in prima persona per il portfolio. La camera segue una strada sopraelevata, accelera tra le tappe e orienta lo sguardo verso ciascuna isola. Dopo l’ultima isola la nebbia intercetta le lastre della strada prima del tempio.

| Isola | Progetti e riferimenti nella scena |
| --- | --- |
| Infanzia, famiglia e calcio | RE:WILD, parete interattiva dell’habitat nel cortile della scuola. |
| Cinema | Spazio, home Android TV e telecomando accanto al proiettore. |
| Camerino | HackHub, bacheca con team, submission e giuria, accanto a gradini, palloni e scarpini. |
| UniStays | Ricerca su mappa, stanza, chat e invito. |
| Controllo accessi | Dormant Access Control Unit, banco con Arduino Nano, sensore, pulsante Morse e display. |
| Boccone, Spesino e Nodale | Ricettario e ingredienti, cesta con lista della spesa e portale per l’account condiviso. |
| Prenivo | Banco laboratorio, ritiro e agenda salone. |
| Politecnico | SEF, pipeline di elaborazione e segnale, vicino alla scrivania di studio. |

Gli abbinamenti tra isole biografiche e progetti sono tematici. Le vignette reinterpretano le funzionalità descritte nei case study.

## Rigenerare scena, video e dati delle card

Da un Terminale del Mac, nella root del repository, con Blender 5.3, Node.js e FFmpeg nel `PATH`:

```sh
blender_app=/Applications/Blender.app/Contents/MacOS/Blender
project=blender/almost_there
out="$project/output/scroll-route"

"$blender_app" --background --factory-startup --python-exit-code 1 \
  --python "$project/build.py"

"$blender_app" --background "$out/intro_prototype.blend" \
  --python-exit-code 1 --python "$project/render_preview.py"

node "$project/prepare_scroll_data.mjs"
```

Il `.blend`, il video e i tre PNG sono in `output/scroll-route/`. I prototipi precedenti si trovano in `output/` e `output/first-person/`. Gli output generati sono ignorati da Git. La preview H.264 usa Eevee, misura 960 × 540, dura 12 secondi e contiene 180 fotogrammi a 15 fps. FFmpeg scrive fotogrammi chiave a ciascuna tappa e almeno ogni sette fotogrammi per ridurre il lavoro necessario quando l’utente cambia posizione nel video.

Apri il `.blend` per modificare i singoli oggetti o spostare un’isola dal suo pivot nell’Outliner. Per rigenerare senza sovrascrivere modifiche manuali, passa `-- --output-dir /percorso/di/output` agli script Blender e la posizione di `scene_timeline.json` al comando Node. Il render accetta anche `-- --stills-only`. Se FFmpeg è assente, il render salva la sequenza PNG numerata.

## Usare la timeline per lo scroll

`scene_timeline.json` registra le fermate effettive della camera in Blender. `scroll_timeline.json` aggiunge i progetti associati con titolo, URL e riepilogo dal catalogo MDX in italiano e inglese. `href: null` indica che la card non ha ancora una pagina pubblica. In questa revisione è il caso di Nodale e Spazio. Il generatore verifica che ogni progetto del catalogo non archiviato appartenga a un’isola sola.

Ogni elemento di `stops` include `timeSeconds` per il seek, `progress` per lo snap, `focus` per la posizione del soggetto in coordinate normalizzate dall’angolo superiore sinistro e `suggestedCardSide` come indicazione per il layout desktop. `ending` identifica l’inizio della tappa conclusiva nel video. La posizione della camera usa la stessa curva della strada, con keyframe nativi in Blender.

Questo esempio collega una fermata a un video già caricato e ricava i dati delle card navigabili per la lingua attiva:

```js
const stop = timeline.stops.find(({ id }) => id === "nodale");
video.currentTime = stop.timeSeconds;
const cards = stop.projects.map(({ locales }) => locales.it).filter(({ href }) => href);
```

## Struttura

| File | Responsabilità |
| --- | --- |
| `config.py`, `animation.py`, `road.py` | Definizione di tappe e progetti, interpolazione della camera e costruzione della strada. |
| `catalogue_assets.py`, `projects.py`, `memories.py`, `cinema.py`, `football.py`, `monument.py` | Oggetti procedurali delle isole. |
| `scene.py`, `geometry.py`, `materials.py`, `atmosphere.py` | Composizione, geometria, materiali e nebbia. |
| `scroll_timeline.py`, `prepare_scroll_data.mjs` | Esportazione delle tappe e collegamento ai case study esistenti. |
| `build.py`, `render_preview.py` | Generazione del progetto e codifica della preview per il seek. |
