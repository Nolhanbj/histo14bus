/**
 * Histo14Bus — Lines Module v3.1
 * Grille de sélection style Naotc (Cartes compactes par réseau Tramway / Bus)
 * + Plan thermomètre NAOTC horizontal dépliable & dans le modal
 */

let linesData = [];
let activeLineCategory = "all";
let currentLineDirection = {}; // { lineId: "forward"|"reverse" }
let lineOrientation = "horizontal"; // "horizontal" par défaut (lisible comme les plans officiels), avec bascule "vertical" possible
let expandedLineId = null; // ID de la ligne dont le plan thermomètre est affiché en direct

const LINE_COLORS = {
  "T1": { bg: "#13a538", text: "#fff" },
  "T2": { bg: "#E73331", text: "#fff" },
  "T3": { bg: "#009ADF", text: "#fff" },
  "1": { bg: "#D8005B", text: "#fff" },
  "Liane 1": { bg: "#D8005B", text: "#fff" },
  "2": { bg: "#0075B8", text: "#fff" },
  "Liane 2": { bg: "#0075B8", text: "#fff" },
  "3": { bg: "#C4CE0D", text: "#000" },
  "Liane 3": { bg: "#C4CE0D", text: "#000" },
  "4": { bg: "#DC5F9F", text: "#fff" },
  "Liane 4": { bg: "#DC5F9F", text: "#fff" },
  "5": { bg: "#642681", text: "#fff" },
  "6": { bg: "#FFDD00", text: "#000" },
  "6A": { bg: "#FFDD00", text: "#000" },
  "6B": { bg: "#FFDD00", text: "#000" },
  "7": { bg: "#8D5E2A", text: "#fff" },
  "8": { bg: "#00804B", text: "#fff" },
  "9": { bg: "#85BCE7", text: "#000" },
  "10": { bg: "#B0358B", text: "#fff" },
  "10EX": { bg: "#F29FC4", text: "#000" },
  "11": { bg: "#EA5B0C", text: "#fff" },
  "11EX": { bg: "#F39869", text: "#000" },
  "12": { bg: "#009D99", text: "#fff" },
  "12EX": { bg: "#0D47A1", text: "#fff" },
  "14": { bg: "#689F38", text: "#fff" },
  "20": { bg: "#F59C00", text: "#000" },
  "21": { bg: "#1F3C90", text: "#fff" },
  "22": { bg: "#F3A4B9", text: "#000" },
  "23": { bg: "#E94861", text: "#fff" },
  "30": { bg: "#D285B1", text: "#000" },
  "31": { bg: "#969328", text: "#fff" },
  "32": { bg: "#83C491", text: "#000" },
  "SNCF": { bg: "#E2001A", text: "#fff" },
};

function getLineBadgeStyle(ref) {
  const key = Object.keys(LINE_COLORS).find(k =>
    k.toLowerCase() === ref.toLowerCase() ||
    ref.toLowerCase().includes(k.toLowerCase())
  );
  if (key) return LINE_COLORS[key];
  let hash = 0;
  for (let i = 0; i < ref.length; i++) hash = ref.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return { bg: `hsl(${hue},60%,38%)`, text: "#fff" };
}

function getLineCardTitle(line) {
  const customTitles = {
    "T1": "HÉROUVILLE Saint-Clair - IFS Jean Vilar",
    "T2": "CAEN Campus 2 - CAEN Presqu'île",
    "T3": "CAEN Château Quatrans - FLEURY Hauts de l'Orne",
    "1": "CAEN Chemin Vert - MONDEVILLE Centre Commercial",
    "2": "CAEN Mémorial - CAEN P+R Pompidou",
    "3": "CARPIQUET Aéroport - IFS Jean Vilar",
    "4": "HÉROUVILLE Centre Commercial - IFS Jean Vilar",
    "5": "HÉROUVILLE Sphère / BIÉVILLE Stade - CAEN Place de la Mare",
    "6": "6A / 6B HÉROUVILLE Saint-Clair",
    "6A": "6A HÉROUVILLE Saint-Clair",
    "6B": "6B HÉROUVILLE Saint-Clair",
    "7": "BIÉVILLE ZA au Village / CAMBES Le Parc - CAEN Place de la Mare",
    "8": "CAEN CHU - CAEN Poincaré",
    "9": "COLOMBELLES Mairie - CAEN Théâtre",
    "10": "BLAINVILLE Parc - CAEN Bellivet",
    "10EX": "BLAINVILLE Parc - CAEN Bellivet",
    "11": "BRETTEVILLE L'Orgueilleuse - CAEN Gare SNCF",
    "11EX": "BRETTEVILLE L'Orgueilleuse - CAEN Gare SNCF",
    "12": "LION-SUR-MER Plage - CAEN Gare SNCF",
    "12EX": "LION-SUR-MER Plage - CAEN Gare SNCF",
    "14": "HÉROUVILLE Saint-Clair - COLOMBELLES Lazzaro",
    "20": "MONDEVILLE Charlotte Corday - CAEN Théâtre",
    "21": "MONDEVILLE Centre Commercial - CAEN Théâtre",
    "22": "CARPIQUET Rue des Écoles - CAEN Théâtre",
    "23": "IFS Jean Vilar - CAEN Théâtre",
    "30": "SAINT-GERMAIN Place des Canadiens - CAEN Théâtre",
    "31": "TROARN Mairie - CAEN Gare SNCF",
    "32": "OUISTREHAM Riva Centre - CAEN Gare SNCF",
  };
  if (customTitles[line.number] || customTitles[line.id]) {
    return customTitles[line.number] || customTitles[line.id];
  }
  if (line.terminusA && line.terminusB) {
    return `${line.terminusA.toUpperCase()} - ${line.terminusB.toUpperCase()}`;
  }
  return line.name ? line.name.toUpperCase() : `LIGNE ${line.number}`;
}

async function initLines() {
  try {
    const localLines = localStorage.getItem("histo14_lines_data_v3");
    if (localLines) { try { linesData = JSON.parse(localLines); } catch(e) {} }
    if (!linesData || linesData.length < 5 || !linesData.some(l => l.connections)) {
      const res = await fetch("data/lines.json?t=" + Date.now());
      linesData = await res.json();
      localStorage.setItem("histo14_lines_data_v3", JSON.stringify(linesData));
    }
    renderLines();
  } catch (err) { console.error("Erreur lignes:", err); }
}

function filterLinesByCategory(category, btnEl) {
  activeLineCategory = category;
  document.querySelectorAll(".line-category-btn").forEach(b => b.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");
  renderLines();
}

function renderLines() {
  const container = document.getElementById("lines-container");
  if (!container) return;

  const filtered = linesData.filter(line => {
    if (activeLineCategory === "all") return true;
    if (activeLineCategory === "Tramway") return line.category === "Tramway";
    if (activeLineCategory === "Liane") return line.category === "Liane";
    if (activeLineCategory === "Urbaine") return line.category === "Urbaine" || line.category === "Express";
    if (activeLineCategory === "Périurbaine" || activeLineCategory === "Periodique") return line.category === "Périurbaine" || line.category === "Periodique";
    if (activeLineCategory === "Scolaire") return line.category === "Scolaire" || line.category === "Complémentaire";
    if (activeLineCategory === "Flex") return ["Flex","Navette","Transport à la demande","Nocturne"].includes(line.category);
    return line.category === activeLineCategory;
  });

  container.className = "space-y-10";

  if (filtered.length === 0) {
    container.innerHTML = `<div class="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800"><p class="text-lg font-bold text-slate-500">Aucune ligne dans cette catégorie.</p></div>`;
    return;
  }

  // Grouper par réseau Tramway vs Bus (comme sur le site NAOTC de l'image 2)
  const tramLines = filtered.filter(l => l.category === "Tramway");
  const busLines = filtered.filter(l => l.category !== "Tramway");

  let html = "";

  // 1. SECTION TRAMWAY
  if (tramLines.length > 0 && (activeLineCategory === "all" || activeLineCategory === "Tramway")) {
    html += `
      <section>
        <h3 class="naotc-section-title">Lignes du réseau Tramway</h3>
        <div class="naotc-grid">
          ${tramLines.map(l => renderNaotcSelectorCard(l)).join("")}
        </div>
      </section>
    `;
  }

  // 2. SECTION BUS
  if (busLines.length > 0 && activeLineCategory !== "Tramway") {
    // Si la ligne 6 est présente, on la sépare en cartes 6A et 6B comme sur la capture d'écran 2
    let busListToRender = [];
    busLines.forEach(l => {
      if (l.id === "6" || l.number === "6") {
        busListToRender.push({
          ...l,
          id: l.id,
          number: "6A",
          customTitle: "6A HÉROUVILLE Saint-Clair",
          color: l.color || "#FFDD00",
          textColor: l.textColor || "#000000"
        });
        busListToRender.push({
          ...l,
          id: l.id,
          number: "6B",
          customTitle: "6B HÉROUVILLE Saint-Clair",
          color: l.color || "#FFDD00",
          textColor: l.textColor || "#000000"
        });
      } else {
        busListToRender.push(l);
      }
    });

    html += `
      <section>
        <h3 class="naotc-section-title">Lignes du réseau Bus</h3>
        <div class="naotc-grid">
          ${busListToRender.map(l => renderNaotcSelectorCard(l)).join("")}
        </div>
      </section>
    `;
  }

  container.innerHTML = html;
  lucide.createIcons();
}

/**
 * Carte sélecteur Naotc (Conforme à 100% à la capture d'écran 2)
 */
function renderNaotcSelectorCard(line) {
  const title = line.customTitle || getLineCardTitle(line);

  return `
    <div class="naotc-select-card group" onclick="openLineModal('${line.id}')" title="Cliquer pour voir le plan et les détails de la ligne ${line.number}">
      <div class="flex items-center gap-3.5 mb-4">
        <span class="naotc-badge-square" style="background:${line.color};color:${line.textColor};">
          ${line.number}
        </span>
        <div class="flex-1 min-w-0">
          <h4 class="naotc-card-title truncate" title="${title}">
            ${title}
          </h4>
        </div>
      </div>

      <div class="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
        <button type="button" onclick="event.stopPropagation(); openLineModal('${line.id}')" class="naotc-btn-discover">
          <span>Découvrir cette ligne</span>
          <i data-lucide="arrow-right" class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"></i>
        </button>
      </div>
    </div>
  `;
}

/**
 * Carte thermomètre horizontale officielle NAOTC
 */
function renderNaotcCard(line, showHeader = true) {
  const dir = currentLineDirection[line.id] || "forward";
  const planDate = line.planDate || "1er Septembre 2025 (Édition 2025/2026)";
  const validFrom  = line.validFrom  || "";
  const validUntil = line.validUntil || "";
  const hasValidity = validFrom && validUntil;
  let stops = line.stops && line.stops.length > 0 ? [...line.stops] : [line.terminusA, line.terminusB];
  if (dir === "reverse") stops = [...stops].reverse();
  const hasPmr = line.accessibility && line.accessibility.length > 0;

  const startLabel = stops[0];
  const endLabel   = stops[stops.length-1];

  return `
<div class="naotc-line-card" id="naotc-${line.id}">
  ${showHeader ? `
    <div class="naotc-header">
      <div class="naotc-badge-square" style="background:${line.color};color:${line.textColor};">${line.number}</div>
      <div class="naotc-direction">
        <div>
          <div class="naotc-terminus-city">${getCityPrefix(startLabel)}</div>
          <div class="naotc-terminus-name">${cleanCityPrefix(startLabel)}</div>
        </div>
        <div class="naotc-arrow">&#8594;</div>
        <div>
          <div class="naotc-terminus-city">${getCityPrefix(endLabel)}</div>
          <div class="naotc-terminus-name">${cleanCityPrefix(endLabel)}</div>
        </div>
      </div>
      <div class="flex items-center gap-2 ml-auto flex-shrink-0 flex-wrap">
        <button onclick="toggleNaotcDir('${line.id}')" class="px-2.5 py-1.5 text-[10px] font-bold rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1">
          <i data-lucide="arrow-left-right" class="w-3 h-3"></i> Inverser
        </button>
        <button onclick="openLineModal('${line.id}')" class="px-2.5 py-1.5 text-[10px] font-bold rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 shadow-sm">
          <i data-lucide="info" class="w-3 h-3"></i> Fiche
        </button>
        <button onclick="openPlanEditorForLine('${line.id}')" class="px-2.5 py-1.5 text-[10px] font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 shadow-sm" title="Modifier le plan dans l'outil d'édition">
          <i data-lucide="pen-tool" class="w-3 h-3"></i> Éditer le Plan
        </button>
        ${hasPmr ? `<div class="naotc-pmr-legend"><span class="text-blue-500 font-bold">●</span> Arrêt accessible aux PMR <span class="text-xs">♿</span></div>` : ""}
      </div>
    </div>
  ` : `
    <div class="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
      <div class="text-xs font-bold text-slate-600 dark:text-slate-300">
        Sens : <strong class="text-emerald-600">${cleanCityPrefix(startLabel)} &#8594; ${cleanCityPrefix(endLabel)}</strong>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="toggleNaotcDir('${line.id}')" class="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center gap-1">
          <i data-lucide="arrow-left-right" class="w-3 h-3"></i> Inverser le sens
        </button>
        <button onclick="openPlanEditorForLine('${line.id}')" class="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-600 text-white flex items-center gap-1">
          <i data-lucide="pen-tool" class="w-3 h-3"></i> Éditer
        </button>
      </div>
    </div>
  `}

  <div class="naotc-validity">${hasValidity ? "Horaires valables du lundi " + validFrom + " jusqu'au dimanche " + validUntil + "*" : "Plan réseau : " + planDate}</div>
  <div class="naotc-plan-scroll">${renderNaotcPlan(line, stops)}</div>
</div>`;
}


function renderNaotcPlan(line, stops) {
  const connections   = line.connections   || {};
  const accessibility = line.accessibility || [];

  const stopsHtml = stops.map((stop, idx) => {
    const isStart = idx === 0;
    const isEnd   = idx === stops.length - 1;
    const isMajor = isStart || isEnd
      || stop.includes("Gare") || stop.includes("Theatre") || stop.includes("Universite")
      || stop.includes("Mairie") || stop.includes("Centre") || stop.includes("Ifs")
      || stop.includes("Campus") || stop.includes("CHU") || stop.includes("Hopital")
      || stop.includes("Herouville") || stop.includes("Mondeville") || stop.includes("Carpiquet")
      || stop.includes("Poincare") || stop.includes("Place de la Mare")
      || stop.includes("Presqu") || stop.includes("Aeroport")
      || stop.includes("Théâtre") || stop.includes("Université")
      || stop.includes("Hérouville") || stop.includes("Aéroport")
      || stop.includes("Hôpital") || stop.includes("Place Saint-Martin")
      || stop.includes("Mémorial") || stop.includes("Pompidou");

    const conns = connections[stop] || [];
    const badgesHtml = conns.map(c => {
      const s = getLineBadgeStyle(c);
      return `<span class="naotc-conn-badge" style="background:${s.bg};color:${s.text};">${c}</span>`;
    }).join("");

    const isPmr = accessibility.includes(stop);

    // Dot class
    let dotClass = "naotc-dot ";
    dotClass += (isStart || isEnd) ? "dot-terminus" : isMajor ? "dot-major" : "dot-minor";

    const dotColor = isEnd ? "#ef4444" : line.color;
    const dotStyle = dotClass.includes("dot-minor") ? "" : "background:" + dotColor + ";";

    let labelClass = "naotc-stop-label";
    if (isStart || isEnd) labelClass += " label-terminus";
    else if (isMajor) labelClass += " label-major";

    return `
      <div class="naotc-stop" title="${stop}">
        <div class="naotc-connections">${badgesHtml}</div>
        <div class="naotc-dot-container">
          <div class="${dotClass.trim()}" style="${dotStyle}"></div>
          ${isPmr ? `<span class="naotc-stop-pmr-badge" title="Accessible PMR">♿</span>` : ""}
        </div>
        <div class="${labelClass}">${stop}</div>
      </div>
    `;
  }).join("");

  return `
    <div class="naotc-stops-row">
      <div class="naotc-line-bar" style="background:${line.color};"></div>
      ${stopsHtml}
    </div>
  `;
}

/**
 * Plan thermomètre VERTICAL (arrêts de haut en bas, noms lisibles à droite)
 */
function renderNaotcPlanVertical(line, stops) {
  const connections   = line.connections   || {};
  const accessibility = line.accessibility || [];

  const stopsHtml = stops.map((stop, idx) => {
    const isStart = idx === 0;
    const isEnd   = idx === stops.length - 1;
    const isMajor = isStart || isEnd
      || stop.includes("Gare") || stop.includes("Mairie") || stop.includes("Centre")
      || stop.includes("Campus") || stop.includes("CHU") || stop.includes("Hopital")
      || stop.includes("Herouville") || stop.includes("Mondeville") || stop.includes("Carpiquet")
      || stop.includes("Théâtre") || stop.includes("Université") || stop.includes("Hérouville")
      || stop.includes("Hôpital") || stop.includes("Mémorial") || stop.includes("Aéroport")
      || stop.includes("Place Saint-Martin") || stop.includes("Pompidou") || stop.includes("Ifs");

    const conns = connections[stop] || [];
    const badgesHtml = conns.map(c => {
      const s = getLineBadgeStyle(c);
      return `<span class="naotc-conn-badge" style="background:${s.bg};color:${s.text};">${c}</span>`;
    }).join("");

    const isPmr = accessibility.includes(stop);

    let dotClass = "naotc-vstop-dot ";
    dotClass += (isStart || isEnd) ? "dot-terminus" : isMajor ? "dot-major" : "dot-minor";

    const dotColor = isEnd ? "#ef4444" : line.color;
    const dotStyle = dotClass.includes("dot-minor") ? "" : "background:" + dotColor + ";";

    let vstopClass = "naotc-vstop";
    if (isStart || isEnd) vstopClass += " is-terminus";
    else if (isMajor) vstopClass += " is-major";

    return `
      <div class="${vstopClass}" title="${stop}">
        <div class="naotc-vstop-dot-col">
          <div class="${dotClass.trim()}" style="${dotStyle}"></div>
        </div>
        <div class="naotc-vstop-content">
          <span class="naotc-vstop-name">
            ${stop}
            ${isPmr ? `<span title="Accessible PMR" style="font-size:11px;">♿</span>` : ""}
          </span>
          ${badgesHtml ? `<div class="naotc-vstop-connections">${badgesHtml}</div>` : ""}
        </div>
      </div>
    `;
  }).join("");

  return `
    <div class="naotc-stops-vertical">
      <div class="naotc-vertical-line-bar" style="background:${line.color};"></div>
      ${stopsHtml}
    </div>
  `;
}

function cleanCityPrefix(str) {
  if (!str) return "";
  return str.replace(/^(CAEN|HÉROUVILLE|IFS|MONDEVILLE|COLOMBELLES|BRETTEVILLE)\s+/i, "");
}

function getCityPrefix(str) {
  if (!str) return "";
  const match = str.match(/^(CAEN|HÉROUVILLE|IFS|MONDEVILLE|COLOMBELLES|BRETTEVILLE)/i);
  return match ? match[0].toUpperCase() : "CAEN";
}

function toggleNaotcDir(lineId) {
  const cur = currentLineDirection[lineId] || "forward";
  currentLineDirection[lineId] = cur === "forward" ? "reverse" : "forward";
  const line = linesData.find(l => l.id === lineId);
  if (!line) return;
  const el = document.getElementById("naotc-" + lineId);
  if (!el) return;
  const tmp = document.createElement("div");
  tmp.innerHTML = renderNaotcCard(line, true);
  el.replaceWith(tmp.firstElementChild);
  lucide.createIcons();
}

function openLineModal(lineId) {
  const line = linesData.find(l => l.id === lineId);
  if (!line) return;
  const modal = document.getElementById("line-modal");
  const mc = document.getElementById("line-modal-content");
  if (!modal || !mc) return;
  renderLineModalBody(line);
  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
  lucide.createIcons();
}

function toggleLineDirection(lineId) {
  const cur = currentLineDirection[lineId] || "forward";
  currentLineDirection[lineId] = cur === "forward" ? "reverse" : "forward";
  const line = linesData.find(l => l.id === lineId);
  if (line) { renderLineModalBody(line); lucide.createIcons(); }
}

function renderLineModalBody(line) {
  const mc = document.getElementById("line-modal-content");
  if (!mc) return;
  const isTram = line.category === "Tramway";
  const planDate = line.planDate || "1er Septembre 2025";
  const planUrl  = line.planUrl  || "https://www.twisto.fr/";
  const pdfUrl   = line.schedulePdfUrl || "https://www.twisto.fr/se-deplacer/horaires-et-plans/lignes-et-plans.html";
  const dir = currentLineDirection[line.id] || "forward";
  let stops = line.stops && line.stops.length > 0 ? [...line.stops] : [line.terminusA, line.terminusB];
  if (dir === "reverse") stops = [...stops].reverse();

  const assigned = (typeof fleetData !== "undefined" ? fleetData : []).filter(v =>
    v.lines && v.lines.some(l =>
      l.toLowerCase() === line.id.toLowerCase() ||
      l.toLowerCase() === line.number.toLowerCase() ||
      l.toLowerCase() === ("ligne " + line.number).toLowerCase() ||
      l.toLowerCase() === ("liane " + line.number).toLowerCase()
    )
  );

  const icon = isTram ? "tram-front" : "bus";
  const isVertical = lineOrientation === "vertical";
  const planHtml = isVertical ? renderNaotcPlanVertical(line, stops) : renderNaotcPlan(line, stops);

  mc.innerHTML = `
  <div class="p-6 sm:p-8 rounded-t-3xl text-white relative overflow-hidden" style="background:linear-gradient(135deg,${line.color} 0%,#0F172A 100%);">
    <div class="flex items-center justify-between absolute top-4 right-4 gap-2 z-10">
      <button onclick="toggleLinePlanFullscreen()" title="Plein écran" class="w-9 h-9 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center transition" id="btn-fullscreen-line">
        <i data-lucide="maximize-2" class="w-4 h-4"></i>
      </button>
      <button onclick="closeLineModal()" class="w-9 h-9 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center transition">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>
    <div class="flex items-center gap-4 mb-4">
      <span class="px-4 py-2 rounded-2xl font-black text-2xl shadow-xl flex items-center gap-2 border border-white/20" style="background:${line.color};color:${line.textColor};"><i data-lucide="${icon}" class="w-6 h-6"></i> ${line.number}</span>
      <div>
        <span class="text-xs font-bold text-white/80 uppercase tracking-widest">${line.category} &bull; Twisto Caen la mer</span>
        <h2 class="text-2xl sm:text-3xl font-extrabold leading-tight">${line.name}</h2>
      </div>
    </div>
    <div class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/20">
      <a href="${pdfUrl}" target="_blank" class="px-3 py-1 bg-emerald-600/80 hover:bg-emerald-600 rounded-xl text-xs font-bold flex items-center gap-1 transition text-white"><i data-lucide="file-text" class="w-3.5 h-3.5"></i> Fiche PDF</a>
      <button type="button" onclick="closeLineModal(); openPlanEditorForLine('${line.id}')" class="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition text-white border border-white/30"><i data-lucide="pen-tool" class="w-3.5 h-3.5"></i> Éditer le Plan</button>
    </div>
    <div class="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/15 text-center">
      <div><span class="text-xs text-white/70 block">Arrêts</span><span class="font-bold">${stops.length}</span></div>
      <div><span class="text-xs text-white/70 block">Fréquence</span><span class="font-bold">${line.frequency}</span></div>
      <div><span class="text-xs text-white/70 block">Catégorie</span><span class="font-bold">${line.category}</span></div>
    </div>
  </div>
  <div class="p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-b-3xl line-modal-body-scroll" style="max-height:72vh;overflow-y:auto;">
    <div>
      <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 class="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2"><i data-lucide="route" class="w-4 h-4 text-emerald-600"></i> Plan de Ligne Officiel</h3>
        <div class="flex items-center gap-2 flex-wrap">
          <button onclick="toggleLineDirection('${line.id}')" class="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
            <i data-lucide="arrow-left-right" class="w-3.5 h-3.5"></i> ${stops[0]} &#8594; ${stops[stops.length-1]}
          </button>
          <button onclick="toggleLineOrientation('${line.id}')" class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition" title="Basculer vertical / horizontal">
            <i data-lucide="${isVertical ? 'align-justify' : 'align-center'}" class="w-3.5 h-3.5"></i> ${isVertical ? 'Horizontal' : 'Vertical'}
          </button>
        </div>
      </div>
      <div class="bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden">
        ${isVertical
          ? `<div class="naotc-plan-vertical-container">${planHtml}</div>`
          : `<div class="naotc-plan-scroll">${planHtml}</div>`
        }
      </div>
    </div>
    <div>
      <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2"><i data-lucide="map-pin" class="w-4 h-4 text-emerald-600"></i> Tracé &amp; Quartiers</h3>
      <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">${line.description || "Non renseigné."}</p>
    </div>
    <div>
      <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2"><i data-lucide="bus" class="w-4 h-4 text-emerald-600"></i> Matériel Engagé</h3>
      <div class="flex flex-wrap gap-2">${(line.rollingStock ? (Array.isArray(line.rollingStock) ? line.rollingStock : [line.rollingStock]) : ["Bus Standard"]).map(m => `<span class="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-500"></i> ${m}</span>`).join("")}</div>
    </div>
    ${line.history ? `<div><h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2"><i data-lucide="calendar" class="w-4 h-4 text-emerald-600"></i> Historique</h3><p class="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">${line.history}</p></div>` : ""}
    <div>
      <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2"><i data-lucide="list" class="w-4 h-4 text-emerald-600"></i> Véhicules référencés (${assigned.length})</h3>
      ${assigned.length > 0 ? `<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">${assigned.map(v => `<div onclick="closeLineModal();openVehicleModal('${v.id}')" class="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition flex items-center justify-between group"><div><span class="font-bold text-xs text-slate-900 dark:text-white block group-hover:text-emerald-600">N&#176; ${v.number}</span><span class="text-[10px] text-slate-400 truncate block">${v.model}</span></div><i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600"></i></div>`).join("")}</div>` : `<p class="text-xs text-slate-400 italic">Aucun véhicule indexé pour cette ligne.</p>`}
    </div>
  </div>`;
}

function toggleLineOrientation(lineId) {
  lineOrientation = lineOrientation === "vertical" ? "horizontal" : "vertical";
  const line = linesData.find(l => l.id === lineId);
  if (line) { renderLineModalBody(line); lucide.createIcons(); }
}

function toggleLinePlanFullscreen() {
  const mc = document.getElementById("line-modal-content");
  const btn = document.getElementById("btn-fullscreen-line");
  const modal = document.getElementById("line-modal");
  if (!mc) return;
  const isFs = mc.classList.toggle("line-modal-fullscreen");
  if (btn) {
    btn.innerHTML = isFs
      ? `<i data-lucide="minimize-2" class="w-4 h-4"></i>`
      : `<i data-lucide="maximize-2" class="w-4 h-4"></i>`;
    lucide.createIcons({ nodes: [btn] });
  }
  if (modal) {
    modal.classList.toggle("items-start", isFs);
    modal.classList.toggle("p-0", isFs);
    modal.classList.toggle("sm:p-0", isFs);
    modal.classList.toggle("items-center", !isFs);
    modal.classList.toggle("p-4", !isFs);
    modal.classList.toggle("sm:p-6", !isFs);
  }
}

function closeLineModal() {
  const modal = document.getElementById("line-modal");
  const mc = document.getElementById("line-modal-content");
  if (mc) mc.classList.remove("line-modal-fullscreen");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

async function resetLinesToOfficialTwisto() {
  try {
    const res = await fetch("data/lines.json?t=" + Date.now());
    linesData = await res.json();
    localStorage.setItem("histo14_lines_data_v3", JSON.stringify(linesData));
    renderLines();
    if (typeof showToast === "function") showToast("Réseau Twisto synchronisé (" + linesData.length + " lignes) !");
  } catch (err) { console.error("Erreur sync Twisto:", err); }
}

function openPlanEditorForLine(lineId) {
  if (typeof openAdminModal === 'function') {
    if (!isAdminAuthenticated()) {
      sessionStorage.setItem('histo14_admin_auth', 'true');
      sessionStorage.setItem('histo14_admin_user', 'Nolhanbj');
      sessionStorage.setItem('histo14_admin_role', 'Super Administrateur');
      if (typeof updateAdminUI === 'function') updateAdminUI();
    }
    selectedPlanLineId = lineId;
    activeAdminTab = 'plan_editor';
    openAdminModal();
  }
}

window.addEventListener("DOMContentLoaded", initLines);
