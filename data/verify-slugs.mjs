#!/usr/bin/env node
/**
 * Verifica che ogni slug "wiki" del dataset corrisponda a una voce reale di
 * Wikipedia in italiano. Da eseguire in locale (serve accesso a it.wikipedia.org):
 *
 *   node data/verify-slugs.mjs
 *   node data/verify-slugs.mjs --fix-report   (scrive data/slug-report.json)
 *
 * Esce con codice 1 se trova slug non validi, così è usabile anche in CI.
 */
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
/* Controlla tutti i file del dataset presenti in data/. */
const FILES = ["events-150.json", "cat-arte.json", "cat-letteratura.json",
               "cat-geografia.json", "cat-spettacolo.json"];
const events = [];
for (const f of FILES) {
  const full = path.join(HERE, f);
  if (!fs.existsSync(full)) continue;
  const items = JSON.parse(fs.readFileSync(full, "utf-8"));
  for (const it of items) events.push({ id: it.id, wiki: it.wiki, file: f });
  console.log(`caricato ${f}: ${items.length} elementi`);
}
if (!events.length) { console.error("nessun dataset trovato in data/"); process.exit(1); }
const API = "https://it.wikipedia.org/api/rest_v1/page/summary/";
const CONCURRENZA = 6;          // gentili con l'API
const report = { ok: [], redirect: [], mancanti: [], senzaImmagine: [], errori: [] };

async function controlla(ev) {
  const url = API + encodeURIComponent(ev.wiki);
  try {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (r.status === 404) { report.mancanti.push({ id: ev.id, wiki: ev.wiki }); return; }
    if (!r.ok) { report.errori.push({ id: ev.id, wiki: ev.wiki, stato: r.status }); return; }
    const j = await r.json();
    // il titolo canonico può differire: è un redirect, funziona ma conviene aggiornarlo
    const canonico = (j.titles && j.titles.canonical) || null;
    if (canonico && canonico !== ev.wiki) {
      report.redirect.push({ id: ev.id, wiki: ev.wiki, canonico });
    } else {
      report.ok.push(ev.id);
    }
    const img = (j.originalimage && j.originalimage.source) || (j.thumbnail && j.thumbnail.source);
    if (!img) report.senzaImmagine.push({ id: ev.id, wiki: ev.wiki });
  } catch (e) {
    report.errori.push({ id: ev.id, wiki: ev.wiki, errore: String(e.message || e) });
  }
}

const coda = events.slice();
await Promise.all(Array.from({ length: CONCURRENZA }, async () => {
  while (coda.length) {
    const ev = coda.shift();
    await controlla(ev);
    process.stdout.write(".");
  }
}));

console.log("\n\n=== VERIFICA SLUG WIKIPEDIA ===");
console.log("eventi controllati :", events.length);
console.log("slug esatti        :", report.ok.length);
console.log("redirect (ok ma da aggiornare):", report.redirect.length);
console.log("VOCI MANCANTI      :", report.mancanti.length);
console.log("senza immagine     :", report.senzaImmagine.length, "(la card userà mesh + icona)");
console.log("errori di rete     :", report.errori.length);

if (report.redirect.length) {
  console.log("\n-- redirect: sostituisci lo slug con il titolo canonico --");
  for (const r of report.redirect) console.log(`  ${r.id}: "${r.wiki}" -> "${r.canonico}"`);
}
if (report.mancanti.length) {
  console.log("\n-- DA CORREGGERE: nessuna voce con questo slug --");
  for (const r of report.mancanti) console.log(`  ${r.id}: "${r.wiki}"`);
}
if (report.senzaImmagine.length) {
  console.log("\n-- voce esistente ma senza immagine di apertura --");
  for (const r of report.senzaImmagine) console.log(`  ${r.id}: "${r.wiki}"`);
}
if (process.argv.includes("--fix-report")) {
  fs.writeFileSync(path.join(HERE, "slug-report.json"), JSON.stringify(report, null, 2));
  console.log("\nreport scritto in data/slug-report.json");
}
process.exit(report.mancanti.length || report.errori.length ? 1 : 0);
