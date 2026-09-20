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

Ogni partita parte con uno **Scudo Temporale**: finché è intatto la carta in cima è avvolta in
una **bolla di vetro curvo** con bordo neon ciano. Al primo errore la bolla si spacca in
frammenti (`.shatter-effect`) con bagliore rosa e suono di vetro rotto, ma salva la streak.
Il secondo errore chiude la partita. Quando ti avvicini a due punti dal tuo record, un
**ghost** luminoso appare sullo sfondo.

La **Lente Quantistica** è un aiuto monouso per partita: nella modalità Swipe rivela il secolo
della carta in un badge che resta fino alla risposta; in Chrono-Reorder spegne a `opacity .3`
le carte fuori posto e conferma in verde quelle già al loro posto, senza svelare l'ordine.

### 🧩 Chrono-Reorder
Cinque eventi in colonna, da ordinare dal più antico al più recente. Tre modi per farlo:

- **Trascinamento** — le altre card si spostano con animazioni FLIP
- **Click-to-swap** — clicca due card per scambiarle
- **Tastiera** — seleziona una card e usa `↑` / `↓`

`Verifica Timeline` lancia un raggio laser che scansiona la colonna dall'alto: posizioni
corrette in verde neon con chime, sbagliate in rosso con vibrazione e anno rivelato.
Timeline perfetta = `+5` punti, `+3` di bonus e streak incrementata.

Da Game Over, `Spazio` ricomincia subito.

## Lobby pre-partita

Il pulsante **Gioca** apre un bottom sheet (pannello centrato su desktop) dove si sceglie
tutto prima di iniziare: modalità, difficoltà e argomenti. Lo stato è una *bozza*: nulla
viene applicato finché non si preme Avvia partita, così chiudere la lobby non tocca la
partita in corso. Alla prima visita si apre da sola dopo lo splash.

L'Archivio (icona statistiche) è tornato uno spazio di sola consultazione: mostra il
riepilogo delle impostazioni correnti con una scorciatoia alla lobby, più audio, cache e
prestazioni.

## Dataset

**600 carte, 50 esatte per ciascuna delle 12 categorie**, dal 3500 a.C. al 2023.
Gli anni avanti Cristo sono numeri negativi e vengono mostrati come «44 a.C.»; la funzione
di ordinamento del gioco li gestisce correttamente, anche fra mesi dello stesso anno negativo.

I file sorgente stanno in `data/`: `events-150.json`, `cat-arte.json`, `cat-letteratura.json`,
`cat-geografia.json`, `cat-spettacolo.json`, `extra-a.json`, `extra-b.json`.
Il campo `approx` marca gli elementi la cui data è una convenzione degli studiosi e non un
fatto documentato.

> **Gli slug Wikipedia non sono stati verificati contro il sito.** Sono scelti in base alla
> conoscenza dei titoli delle voci italiane, ma vanno controllati prima di considerarli
> definitivi. Uno slug sbagliato non rompe nulla: la carta ricade su mesh e icona.
>
> Due strumenti, uno offline e uno online:
>
> ```bash
> node data/lint-slugs.mjs              # offline: errori strutturali + casi a rischio
> node data/lint-slugs.mjs --dettaglio  # elenco completo dei casi da controllare
>
> node data/verify-slugs.mjs            # online: voci mancanti, redirect, pagine senza immagine
> node data/verify-slugs.mjs --fix-report   # scrive data/slug-report.json
> ```
>
> `verify-slugs.mjs` legge da solo ogni `.json` della cartella `data/`, così non dimentica
> i file aggiunti in seguito. Se tutte le richieste falliscono lo dice esplicitamente,
> invece di far sembrare che il dataset sia a posto.

## Modalità di partita

- **Classica** — uno Scudo Temporale assorbe il primo errore.
- **Morte Intrepida** — nessuno scudo, un solo errore chiude la partita, punteggio finale ×1,5.

La **difficoltà adattiva** (predefinita) stringe lo scarto fra gli eventi man mano che la streak
sale: oltre 25 anni fino a streak 3, da 5 a 15 anni fino a 7, da 1 a 4 anni da 8 in poi. La coda
guarda avanti — una carta viene scelta per la fascia in cui si troverà la streak quando verrà
giocata, non per quella attuale. Restano disponibili le fasce fisse manuali.

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
- **Story generator e condivisione** — un canvas 1080×1920 produce una card verticale in
  vetro con punteggio, streak, precisione e QR. Il pulsante *Condividi* usa la Web Share
  API con l'immagine allegata (Instagram, WhatsApp, Telegram); se il dispositivo non
  condivide file ripiega sul solo testo, e infine sul download
- **Feedback aptico** — `navigator.vibrate()`: colpetto breve alla conferma dello swipe,
  doppia vibrazione sull'errore, pattern lungo sul bonus. Silenzioso in modalità prestazioni
- **PWA** — manifest inline (data URI) e service worker generato a runtime, per installare
  l'app sulla home screen

## Esperienza visiva

- **Splash screen** — logo con alone animato, barra di avanzamento e stato testuale agganciati
  all'avvio vero (cache, primo round, prime immagini), con un tetto massimo perché offline non
  resti mai appeso. Viene rimosso dal DOM: "Rigioca" non lo ripropone.
- **Tilt 3D** — la carta in cima si inclina seguendo il puntatore e il trascinamento. Lo strato
  che ruota (`.card-tilt`) è separato da quello che viene trascinato, così i due transform non
  si sovrascrivono; il riflesso sta *sopra* il pannello in vetro, per non obbligare a
  ricalcolare il `backdrop-filter` sotto.
- **Icone neon procedurali** — un SVG a tratto per categoria (circuito, atomo, pellicola,
  colonnato, gamepad…) al posto delle emoji quando manca l'immagine. Nella pillola resta
  l'emoji: a 14px un'icona a tratto diventa illeggibile.
- **Particelle** — esplosione neon dalla carta su risposta corretta e sul bonus stesso-anno.
  Un solo canvas, simulazione basata sul tempo trascorso (non sui fotogrammi) e loop che si
  spegne da sé quando l'ultima particella svanisce.
- **Count-up** — punteggio, record e precisione salgono da zero con easing. Durante il
  conteggio il `backdrop-filter` della sheet viene sospeso: ridipingerebbe a ogni fotogramma.
- **Flip 3D in Chrono-Reorder** — alla verifica le carte ruotano e mostrano sul retro verdetto,
  titolo e anno reale, smeraldo o rubino. Il backdrop è sospeso per la durata della rotazione.
- **Storico del percorso** — nel Game Over, le carte giocate come nodi su una linea luminosa
  (ciano se azzeccate, rubino se sbagliate), con anno, icona di categoria e titolo. Un
  selettore passa dall'ordine di gioco alla linea temporale reale, e un clic su un nodo apre
  un popover con miniatura, data completa, categoria ed esito.
- **Odometro a rulli** — l'anno si rivela come un contachilometri in vetro fumé: ogni cifra è
  una finestrella con dentro una striscia di numeri che scorre, con giri crescenti da sinistra
  a destra e una sola transizione di `transform` per rullo. A rullo fermo le cifre escono dalla
  finestrella e ricevono un lampo neon: dentro, `overflow:hidden` ritaglierebbe l'alone in un
  rettangolo.
- **Logo cangiante** — un orologio disegnato a tratto in navbar e nello splash, con lancette e
  ingranaggio che ruotano e un `hue-rotate` continuo. Misurato dentro la navbar (che ha
  `backdrop-filter`): 1,15 ms/frame contro 1,11 da fermo, cioè dentro il rumore di misura.
- **Fine partita cinematografica** — 1,5 s di `Riavvolgimento` con le carte giocate che sfilano
  all'indietro su fondo a scansione, poi le **crepe nel vetro** (`.glass-fracture`) che si
  disegnano in neon viola e rosso dietro al pannello. Per quel secondo il `backdrop-filter`
  dell'overlay resta sospeso.
- **Passaporto Temporale** — nelle Statistiche, un badge olografico che si inclina in 3D
  seguendo il puntatore (`rotateX`/`rotateY`) e assegna un grado in base al record: Recluta,
  Viaggiatore, Crononauta, Custode del Tempo, Signore del Tempo.

## Condividi & QR

L'icona di condivisione in navbar (sotto i 620px il link in fondo alla Lobby) e il pulsante
`Condividi` del Game Over aprono `#shareModal`: un pannello in vetro liquido con il QR Code
generato al volo da `api.qrserver.com` nei colori dell'app, il link in evidenza e — se arrivi
dal Game Over — il punteggio appena fatto.

- **Condividi** usa `navigator.share` per il foglio nativo di sistema (WhatsApp, Telegram,
  Stories); su desktop ripiega sulla copia negli appunti.
- **Copia link** passa da `navigator.clipboard.writeText`, con `execCommand` di riserva sui
  contesti non sicuri, e conferma con un toast.
- **Scarica QR** scarica il `.png`: l'immagine è su un altro dominio, quindi l'attributo
  `download` da solo verrebbe ignorato e si passa da `fetch` + blob.
- Se il QR non arriva (offline, o rete che blocca il servizio) la scheda resta leggibile con i
  mirini disegnati a CSS e rimanda a "Copia link".

## Filtri, offline e prestazioni

Dalla modale **Statistiche** (icona grafico nella navbar):

- **Filtra per argomento** — chip per categoria, con il numero di eventi disponibili.
  Se la selezione lascia meno di 6 eventi si torna automaticamente a tutte le categorie.
- **Difficoltà** — non è un'etichetta sui singoli eventi ma la distanza fra i due
  confrontati: `Facile` ≥ 25 anni, `Media` 6–24, `Difficile` ≤ 5 anni, dove contano
  mese e giorno. In Chrono-Reorder regola l'intervallo complessivo dei cinque eventi.
- **Sfondo animato** — spegne sfere, sfocature e grana. Attivo di default se il sistema
  chiede meno animazioni (`prefers-reduced-motion`) o se il dispositivo dichiara
  ≤ 4 core **e** ≤ 4 GB. La scelta manuale vince sempre e viene ricordata.
- **Cache Wikipedia** — mostra quante schede sono salvate in locale e permette di svuotarle.

**Caching.** I metadati di ogni evento (URL immagine e descrizione) finiscono in
`localStorage` con scadenza di 14 giorni: alla seconda partita nessuna scheda già vista
richiama la REST API. I *byte* delle immagini non stanno lì — in base64 saturerebbero la
quota da ~5 MB in poche carte — ma nella cache HTTP e, quando l'app gira su http(s), in
quella del service worker.

**Offline.** Se la rete manca, `WIKI.get()` non tenta nemmeno la chiamata e la carta usa
subito mesh e emoji. Compare un badge discreto e il gioco resta completamente
giocabile: lo skeleton non aspetta mai la rete per sparire.

## Note tecniche

- CDN usate: Tailwind CSS, Lucide Icons, canvas-confetti. Il layout non dipende dalle classi
  Tailwind: tutto lo stile critico è nel `<style>` inline, così l'app resta identica anche
  senza rete. Se il CDN delle icone non risponde, i segnaposto ricadono su glifi testuali.
- Il `backdrop-filter` dei pannelli viene sospeso durante il trascinamento (`:active`,
  `:has(.dragging)`): il backdrop andrebbe ricalcolato a ogni frame proprio mentre serve
  la massima fluidità.
- Nessuna animazione continua dentro o dietro un pannello con `backdrop-filter`. Il
  vecchio `????` pulsante costava da solo 49 ms/frame contro 16.7 da fermo: la sfocatura
  veniva ricalcolata a ogni fotogramma. Ora è statico.
- Niente auto-diagnosi delle prestazioni a runtime: misurare i fotogrammi per dedurre la
  potenza del dispositivo si è rivelato inaffidabile (nei primi secondi l'app si assesta e
  ogni soglia degradava la grafica a dispositivi sani). Si usano solo segnali dichiarati.
- Le crepe del Game Over e il riavvolgimento sono animazioni **a colpo singolo**, non continue:
  durano meno di un secondo e in quella finestra il backdrop dell'overlay e quello della sheet
  (già sospeso dal count-up) restano spenti.
- Il service worker viene registrato solo su `http(s)`; aprendo il file con `file://`
  la registrazione viene saltata e il resto dell'app funziona normalmente.

## Crediti

Creato da **Antonio** ([@acrisci05](https://instagram.com/acrisci05)).
Immagini e dati storici da Wikipedia. Nessun backend, nessun tracciamento.
