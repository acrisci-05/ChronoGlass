#!/usr/bin/env node
/**
 * Controlli sugli slug che NON richiedono rete. Non sostituisce
 * verify-slugs.mjs (solo lui sa se una voce esiste davvero), ma intercetta
 * gli errori strutturali e segnala i casi da controllare per primi.
 *
 *   node data/lint-slugs.mjs
 */
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const items = [];
for (const f of fs.readdirSync(HERE).filter(f => f.endsWith(".json") && f !== "slug-report.json").sort()) {
  let arr;
  try { arr = JSON.parse(fs.readFileSync(path.join(HERE, f), "utf-8")); } catch { continue; }
  if (Array.isArray(arr)) for (const it of arr) if (it && it.wiki) items.push({ ...it, file: f });
}

const errori = [], sospetti = [], visti = new Map();
for (const it of items) {
  const w = it.wiki;
  if (/\s/.test(w))              errori.push([it, "contiene spazi: usa gli underscore"]);
  if (/^_|_$/.test(w))           errori.push([it, "inizia o finisce con underscore"]);
  if (/__/.test(w))              errori.push([it, "doppio underscore"]);
  if (/^[a-z]/.test(w))          errori.push([it, "iniziale minuscola: i titoli Wikipedia sono maiuscoli"]);
  if (/[<>\[\]{}|#]/.test(w))    errori.push([it, "carattere non ammesso in un titolo"]);
  const ap = (w.match(/\(/g) || []).length, ch = (w.match(/\)/g) || []).length;
  if (ap !== ch)                 errori.push([it, "parentesi non bilanciate"]);
  if (w.includes("/"))           errori.push([it, "contiene una barra: è una sottopagina"]);
  visti.set(w, (visti.get(w) || []).concat(it.id));

  // segnalazioni: non sono errori, ma sono i casi dove sbagliare è facile
  if (/\(/.test(w))              sospetti.push([it, "disambiguazione fra parentesi: la dicitura esatta varia spesso"]);
  else if (/_(19|20)\d\d$/.test(w)) sospetti.push([it, "anno in coda allo slug"]);
  if (/[àèéìòùÀÈÉÌÒÙčšžćđňřěůĐŠČŽ]/.test(w)) sospetti.push([it, "lettere accentate o con diacritici: verificare la traslitterazione"]);
}
for (const [w, ids] of visti) if (ids.length > 1) errori.push([{ id: ids.join(", "), wiki: w, file: "-" }, "slug usato da più elementi"]);

console.log(`=== LINT SLUG (offline) ===`);
console.log(`elementi con slug: ${items.length}`);
console.log(`slug distinti    : ${visti.size}\n`);

if (errori.length) {
  console.log(`ERRORI STRUTTURALI (${errori.length}) — da correggere:`);
  for (const [it, msg] of errori) console.log(`  ${it.id.padEnd(22)} "${it.wiki}"  → ${msg}`);
} else console.log("errori strutturali: nessuno ✅");

const perTipo = sospetti.reduce((m, [, msg]) => (m[msg] = (m[msg] || 0) + 1, m), {});
console.log(`\nDA CONTROLLARE PER PRIMI (${sospetti.length}) — riepilogo:`);
for (const [msg, n] of Object.entries(perTipo).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${msg}`);
if (process.argv.includes("--dettaglio")) {
  console.log("");
  for (const [it, msg] of sospetti) console.log(`  ${it.id.padEnd(22)} "${it.wiki}"  (${msg})`);
}
console.log(`\nQuesto lint non sa se una voce esiste: per quello serve`);
console.log(`  node data/verify-slugs.mjs   (richiede accesso a it.wikipedia.org)`);
process.exit(errori.length ? 1 : 0);
