// scripts/build-image-review.cjs
//
// Genera un visor HTML autocontenido para REVISAR la biblioteca de imágenes de
// las fichas BIBLIA (image_pool de cada país y, opcional, galerías de jugador).
// Carlos lo abre en el navegador, marca las que NO sirven y exporta la lista de
// descartes (JSON). Luego se aplican con scripts/prune-images.cjs.
//
// Uso:
//   node scripts/build-image-review.cjs            # solo image_pool (país)
//   node scripts/build-image-review.cjs --players  # incluye galerías de jugador
//   node scripts/build-image-review.cjs --team=belgica
//
// Salida: scripts/image-review.html  (ábrelo con doble clic)

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const val = (n, d) => {
  const h = args.find((a) => a.startsWith(`--${n}=`));
  return h ? h.split("=")[1] : d;
};

const WITH_PLAYERS = flag("players");
const ONLY_TEAM = val("team", null);
const TEAMS_DIR = "data/teams";
const OUT = "scripts/image-review.html";

const slugs = (
  ONLY_TEAM
    ? [ONLY_TEAM]
    : fs.readdirSync(TEAMS_DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""))
).sort();

const data = [];
for (const slug of slugs) {
  const t = JSON.parse(fs.readFileSync(path.join(TEAMS_DIR, `${slug}.json`), "utf8"));
  const wc = t.wc_2026 || {};
  const entry = {
    slug,
    name: t.name_es || t.name_en || slug,
    iso: t.iso || "",
    pool: (wc.image_pool || []).filter(Boolean),
    players: [],
  };
  if (WITH_PLAYERS) {
    for (const p of wc.likely_squad || []) {
      const imgs = (p.photos || []).filter(Boolean);
      if (imgs.length > 0) {
        entry.players.push({ name: p.display_name || p.full_name, current: p.photo_url || null, photos: imgs });
      }
    }
  }
  data.push(entry);
}

const totalPool = data.reduce((n, d) => n + d.pool.length, 0);
const totalPlayers = data.reduce((n, d) => n + d.players.reduce((m, p) => m + p.photos.length, 0), 0);

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ZonaMundial · Revisión de imágenes</title>
<style>
  :root { --bg:#0f1115; --card:#181b22; --line:#2a2f3a; --txt:#e8eaed; --muted:#9aa0aa; --bad:#ef4444; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--txt); font:14px/1.4 system-ui,Segoe UI,Roboto,sans-serif; }
  header { position:sticky; top:0; z-index:10; background:#0f1115ee; backdrop-filter:blur(6px);
    border-bottom:1px solid var(--line); padding:12px 16px; display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
  header h1 { font-size:16px; margin:0; }
  header .muted { color:var(--muted); }
  input[type=search]{ background:var(--card); border:1px solid var(--line); color:var(--txt);
    border-radius:8px; padding:8px 10px; min-width:200px; }
  button { background:#2563eb; color:#fff; border:0; border-radius:8px; padding:8px 12px; cursor:pointer; font-weight:600; }
  button.secondary { background:var(--card); border:1px solid var(--line); }
  section { padding:14px 16px; border-bottom:1px solid var(--line); }
  section h2 { font-size:15px; margin:0 0 10px; display:flex; align-items:center; gap:8px; }
  .count { color:var(--muted); font-weight:400; font-size:13px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:10px; }
  .cell { position:relative; background:var(--card); border:1px solid var(--line); border-radius:10px; overflow:hidden; }
  .cell img { width:100%; height:150px; object-fit:cover; display:block; background:#222; cursor:zoom-in; }
  .cell .cap { font-size:11px; color:var(--muted); padding:6px 8px; word-break:break-all; max-height:48px; overflow:hidden; }
  .cell.bad { outline:3px solid var(--bad); }
  .cell.bad img { opacity:.4; }
  .mark { position:absolute; top:6px; right:6px; background:#000a; color:#fff; border-radius:6px;
    padding:4px 7px; font-size:12px; cursor:pointer; user-select:none; border:1px solid #fff3; }
  .cell.bad .mark { background:var(--bad); }
  .player h3 { font-size:13px; margin:12px 0 6px; color:var(--muted); }
  dialog { background:transparent; border:0; }
  dialog img { max-width:92vw; max-height:88vh; border-radius:8px; }
  #exportBox { width:100%; height:180px; background:var(--card); color:var(--txt); border:1px solid var(--line);
    border-radius:8px; padding:10px; font-family:ui-monospace,monospace; font-size:12px; display:none; margin-top:10px; }
</style>
</head>
<body>
<header>
  <h1>Revisión de imágenes</h1>
  <span class="muted">${data.length} países · ${totalPool} de país${WITH_PLAYERS ? ` · ${totalPlayers} de jugador` : ""}</span>
  <input id="filter" type="search" placeholder="Filtrar país…">
  <span style="flex:1"></span>
  <span class="muted">descartes: <b id="badCount">0</b></span>
  <button class="secondary" onclick="resetMarks()">Limpiar</button>
  <button onclick="doExport()">Exportar descartes</button>
</header>
<textarea id="exportBox" readonly placeholder="JSON de descartes…"></textarea>
<main id="main"></main>
<dialog id="zoom" onclick="this.close()"><img id="zoomImg" alt=""></dialog>

<script>
const DATA = ${JSON.stringify(data)};
const KEY = "zm-image-discards";
let bad = JSON.parse(localStorage.getItem(KEY) || "{}"); // { slug: [url,...] }

function isBad(slug,url){ return (bad[slug]||[]).includes(url); }
function toggle(slug,url,el){
  bad[slug] = bad[slug] || [];
  const i = bad[slug].indexOf(url);
  if (i>=0){ bad[slug].splice(i,1); el.classList.remove("bad"); }
  else { bad[slug].push(url); el.classList.add("bad"); }
  if (bad[slug].length===0) delete bad[slug];
  localStorage.setItem(KEY, JSON.stringify(bad));
  updateCount();
}
function updateCount(){
  document.getElementById("badCount").textContent =
    Object.values(bad).reduce((n,a)=>n+a.length,0);
}
function cell(slug,url){
  const d = document.createElement("div");
  d.className = "cell" + (isBad(slug,url) ? " bad" : "");
  const name = decodeURIComponent(url.split("/").pop()||"");
  d.innerHTML =
    '<div class="mark">✕ descartar</div>' +
    '<img loading="lazy" src="'+url+'" alt="">' +
    '<div class="cap">'+name+'</div>';
  d.querySelector(".mark").onclick = ()=>toggle(slug,url,d);
  d.querySelector("img").onclick = ()=>{ const z=document.getElementById("zoom");
    document.getElementById("zoomImg").src=url; z.showModal(); };
  return d;
}
function render(){
  const main = document.getElementById("main");
  main.innerHTML = "";
  for (const t of DATA){
    const sec = document.createElement("section");
    sec.dataset.name = t.name.toLowerCase();
    const h = document.createElement("h2");
    h.innerHTML = t.name + ' <span class="count">('+t.pool.length+' país'+
      (t.players.length? ' · '+t.players.length+' jugadores':'')+')</span>';
    sec.appendChild(h);
    const grid = document.createElement("div"); grid.className="grid";
    for (const url of t.pool) grid.appendChild(cell(t.slug,url));
    sec.appendChild(grid);
    for (const p of t.players){
      const ph = document.createElement("div"); ph.className="player";
      const t3 = document.createElement("h3"); t3.textContent = p.name; ph.appendChild(t3);
      const g2 = document.createElement("div"); g2.className="grid";
      for (const url of p.photos) g2.appendChild(cell(t.slug,url));
      ph.appendChild(g2); sec.appendChild(ph);
    }
    main.appendChild(sec);
  }
  updateCount();
}
function resetMarks(){ if(!confirm("¿Borrar todos los descartes marcados?"))return;
  bad={}; localStorage.removeItem(KEY); render(); }
function doExport(){
  const box=document.getElementById("exportBox");
  box.style.display="block";
  box.value=JSON.stringify(bad,null,2);
  box.select();
  try{ navigator.clipboard.writeText(box.value); }catch(e){}
}
document.getElementById("filter").addEventListener("input",e=>{
  const q=e.target.value.toLowerCase();
  for (const s of document.querySelectorAll("section"))
    s.style.display = s.dataset.name.includes(q) ? "" : "none";
});
render();
</script>
</body>
</html>`;

fs.writeFileSync(OUT, html, "utf8");
console.log(`Visor escrito → ${OUT}`);
console.log(`  ${data.length} países · ${totalPool} imágenes de país` + (WITH_PLAYERS ? ` · ${totalPlayers} de jugador` : ""));
console.log(`  Ábrelo con doble clic. Marca las malas y pulsa "Exportar descartes".`);
console.log(`  Luego: pega el JSON en scripts/discards.json y corre:`);
console.log(`    node scripts/prune-images.cjs --from=scripts/discards.json --apply`);
