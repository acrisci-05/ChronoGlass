# ChronoGlass

Trivia game di cronologia in stile Tinder con estetica Liquid Glass. Swipe tra eventi storici
con immagini dalla Wikipedia REST API, sound design sintetico e zero backend. 100% client-side.

Tutta l'applicazione vive in un unico file: [`index.html`](index.html) (HTML + CSS + JS).
Nessun build step, nessuna dipendenza da installare: aprilo nel browser e gioca.

## Come si gioca

### ⚡ Swipe Veloce
Una card misteriosa contro l'evento di riferimento. Decidi con un gesto:

| Gesto | Tastiera | Significato |
|---|---|---|
| Swipe a sinistra | `←` | **PRIMA** — è successo prima del riferimento |
| Swipe a destra | `→` | **DOPO** — è successo dopo il riferimento |
| Swipe in alto | `↑` | **STESSO ANNO** — stesso anno solare, **+3 punti** e coriandoli oro |

Se i due eventi cadono nello stesso anno e rispondi PRIMA/DOPO, il confronto scende a
giorno e mese: non vieni penalizzato per una scelta che è comunque cronologicamente corretta.

Ogni partita parte con uno **Scudo Temporale**: il primo errore manda in frantumi il vetro
(crepe animate + suono di vetro rotto) ma salva la streak. Il secondo errore chiude la partita.
Quando ti avvicini a due punti dal tuo record, un **ghost** luminoso appare sullo sfondo.

### 🧩 Chrono-Reorder
Cinque eventi in colonna, da ordinare dal più antico al più recente. Tre modi per farlo:

- **Trascinamento** — le altre card si spostano con animazioni FLIP
- **Click-to-swap** — clicca due card per scambiarle
- **Tastiera** — seleziona una card e usa `↑` / `↓`

`Verifica Timeline` lancia un raggio laser che scansiona la colonna dall'alto: posizioni
corrette in verde neon con chime, sbagliate in rosso con vibrazione e anno rivelato.
Timeline perfetta = `+5` punti, `+3` di bonus e streak incrementata.

Da Game Over, `Spazio` ricomincia subito.

## Design

L'interfaccia è un sistema **Liquid Glass** costruito a strati:

- **Sfondo mesh vivo** — quattro sfere neon (cyan, magenta, violetto, ambra) su piani diversi,
  in moto continuo. La morbidezza viene dagli stop dei gradienti, non da un `filter: blur()`
  a runtime: la scelta vale circa 2× di frame budget a parità di resa.
- **Card full-bleed** — l'immagine (o il mesh cyberpunk di categoria con emoji 3D fluttuante)
  occupa tutta la card; titolo, categoria e anno vivono in un pannello di vetro ancorato in
  basso, con `backdrop-filter` che lascia trasparire il colore sottostante.
- **Aura per categoria** — ogni card espone un accento RGB (`--accent`) che colora bordo,
  alone esterno e pillola: Storia ambra, Tecnologia cyan, Musica magenta, e così via.
- **Directional edge glow** — trascinando, il bordo dello schermo si accende nella direzione
  del gesto: cyan a sinistra (PRIMA), magenta a destra (DOPO), oro verso l'alto (STESSO ANNO).
- **Spina dorsale neon** in Chrono-Reorder, con nodi sferici che pulsano e diventano smeraldo
  o rubino alla verifica, sotto un raggio laser con particelle.
- **Motion blur dei rulli** durante la rivelazione dell'anno, sincronizzato con il tick meccanico.

## Caratteristiche

- **Dataset** — 55 eventi verificati (79 d.C. → 2022) su 8 categorie, con 10 anni condivisi
  tra eventi diversi perché il bonus *Stesso Anno* sia realmente giocabile
- **Immagini Wikipedia** — lead image via `https://it.wikipedia.org/api/rest_v1/page/summary/{slug}`,
  con precaricamento e decodifica in RAM delle 3 card successive per transizioni senza flicker
- **Fallback** — se l'immagine manca o la rete non risponde, la card usa il gradiente della
  categoria e la sua emoji; il gioco resta completamente funzionante offline
- **Audio Web Audio API** — whoosh, click meccanico dei rulli, chime, vetro infranto,
  flourish dorato e sub-bass di game over, sintetizzati al volo senza file esterni
- **Rulli slot-machine** — l'anno si rivela con quattro rulli sfalsati che si fermano uno dopo
  l'altro, seguiti dalla data completa in dissolvenza
- **Statistiche locali** — partite, precisione, media e distribuzione dei punteggi in
  `localStorage`; il record di streak è salvato in `best_streak`
- **Story generator** — un canvas 1080×1920 produce una card verticale in vetro con punteggio,
  streak, precisione e QR, pronta per lo share nativo o il download
- **PWA** — manifest inline (data URI) e service worker generato a runtime, per installare
  l'app sulla home screen

## Note tecniche

- CDN usate: Tailwind CSS, Lucide Icons, canvas-confetti. Il layout non dipende dalle classi
  Tailwind: tutto lo stile critico è nel `<style>` inline, così l'app resta identica anche
  senza rete. Se il CDN delle icone non risponde, i segnaposto ricadono su glifi testuali.
- Il `backdrop-filter` dei pannelli viene sospeso durante il trascinamento (`:active`,
  `:has(.dragging)`): il backdrop andrebbe ricalcolato a ogni frame proprio mentre serve
  la massima fluidità.
- Il service worker viene registrato solo su `http(s)`; aprendo il file con `file://`
  la registrazione viene saltata e il resto dell'app funziona normalmente.

## Crediti

Creato da **Antonio** ([@acrisci05](https://instagram.com/acrisci05)).
Immagini e dati storici da Wikipedia. Nessun backend, nessun tracciamento.
