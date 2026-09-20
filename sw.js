/* ChronoGlass — service worker.
 *
 * Deve stare in un file suo: il worker generato al volo da un Blob veniva
 * rifiutato da tutti i browser ("protocollo blob: non supportato"), quindi
 * l'app non è mai stata davvero disponibile offline.
 *
 * Tre strategie, una per tipo di richiesta:
 *   - guscio dell'app  → cache-first, aggiornata in sottofondo
 *   - schede Wikipedia → stale-while-revalidate (si gioca subito, si aggiorna dopo)
 *   - immagini e CDN   → cache-first con tetto massimo di voci
 */
const VER    = "v3";
const SHELL  = "chronoglass-shell-" + VER;
const DATI   = "chronoglass-dati-"  + VER;
const MEDIA  = "chronoglass-media-" + VER;
const MEDIA_MAX = 400;              // circa 40-60 MB di miniature

/* Il guscio: tutto ciò che serve per far partire una partita senza rete. */
const GUSCIO = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg"
];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(SHELL).then(c =>
      /* addAll fallisce tutto se un solo file manca: si aggiungono uno a uno. */
      Promise.all(GUSCIO.map(u =>
        c.add(new Request(u, { cache: "reload" })).catch(() => {})))
    )
  );
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const nomi = await caches.keys();
    await Promise.all(nomi
      .filter(n => n.startsWith("chronoglass-") && ![SHELL, DATI, MEDIA].includes(n))
      .map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

/* Tiene la cache sotto una certa soglia buttando le voci più vecchie. */
async function pota(nome, max){
  const c = await caches.open(nome);
  const k = await c.keys();
  if (k.length <= max) return;
  await Promise.all(k.slice(0, k.length - max).map(r => c.delete(r)));
}

async function cacheFirst(req, nome, max){
  const c = await caches.open(nome);
  const hit = await c.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === "opaque")){
    c.put(req, res.clone());
    if (max) pota(nome, max);
  }
  return res;
}

async function staleWhileRevalidate(req, nome){
  const c = await caches.open(nome);
  const hit = await c.match(req);
  const rete = fetch(req).then(res => {
    if (res && res.ok) c.put(req, res.clone());
    return res;
  }).catch(() => null);
  return hit || rete || new Response("", { status: 504 });
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch(err){ return; }
  if (!/^https?:$/.test(url.protocol)) return;

  /* Navigazione: si tenta la rete, ma se manca si serve il guscio.
     È questa la riga che fa funzionare il gioco in metropolitana. */
  if (req.mode === "navigate"){
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        const c = await caches.open(SHELL);
        c.put("./index.html", res.clone());
        return res;
      } catch(err){
        const c = await caches.open(SHELL);
        return (await c.match("./index.html")) ||
               (await c.match("./")) ||
               new Response("Offline", { status: 503 });
      }
    })());
    return;
  }

  // schede di Wikipedia: testo leggero, va tenuto fresco quando c'è rete
  if (/\/api\/rest_v1\/page\/summary\//.test(url.pathname)){
    e.respondWith(staleWhileRevalidate(req, DATI));
    return;
  }
  // immagini di Wikimedia: non cambiano mai, cache-first con tetto
  if (/^upload\.wikimedia\.org$/.test(url.hostname) || req.destination === "image"){
    e.respondWith(cacheFirst(req, MEDIA, MEDIA_MAX).catch(() =>
      caches.match(req).then(m => m || new Response("", { status: 504 }))));
    return;
  }
  // script e fogli di stile (anche da CDN): servono anche offline
  if (["script","style","font"].includes(req.destination)){
    e.respondWith(cacheFirst(req, SHELL).catch(() =>
      caches.match(req).then(m => m || new Response("", { status: 504 }))));
    return;
  }
  // tutto il resto, incluso lo stesso sito
  if (url.origin === self.location.origin){
    e.respondWith(staleWhileRevalidate(req, SHELL));
  }
});

/* La pagina può chiedere di svuotare le cache dalle impostazioni. */
self.addEventListener("message", e => {
  if (e.data && e.data.tipo === "svuota"){
    e.waitUntil(caches.keys().then(k =>
      Promise.all(k.filter(n => n.startsWith("chronoglass-")).map(n => caches.delete(n)))));
  }
});
