/**
 * Histo14Bus - Fleet Management & Rendering Engine with Multi-Network Support
 * Vehicle Detailed Specifications, Equipments, History Timeline & Editing Integration
 */

let fleetData = [];
let activeFilters = {
  search: '',
  status: 'all',
  type: 'all',
  energy: 'all',
  network: 'all',
  series: 'all'
};
let viewMode = 'naotc'; // 'naotc', 'grid', or 'table'
let currentVehicleIndex = -1;

async function initFleet() {
  try {
    const FLEET_VERSION = "2026_v4_naotc";
    const storedVersion = localStorage.getItem('histo14_fleet_version');
    if (storedVersion !== FLEET_VERSION) {
      localStorage.removeItem('histo14_fleet_data');
      localStorage.setItem('histo14_fleet_version', FLEET_VERSION);
      fleetData = [];
    } else {
      const localFleet = localStorage.getItem('histo14_fleet_data');
      if (localFleet) {
        try {
          fleetData = JSON.parse(localFleet);
        } catch (e) {
          console.warn('Erreur lecture localFleet:', e);
        }
      }
    }

    if (!fleetData || fleetData.length < 50) {
      const response = await fetch('data/fleet.json?t=' + Date.now());
      fleetData = await response.json();
      localStorage.setItem('histo14_fleet_data', JSON.stringify(fleetData));
    }


    updateFleetStats();
    updateNetworkCardCounts();
    populateSeriesDropdown();
    renderFleet();

    // Check URL parameters for direct vehicle deep-linking (e.g. ?bus=5220 or ?network=Twisto)
    const urlParams = new URLSearchParams(window.location.search);
    const networkParam = urlParams.get('network');
    if (networkParam) {
      selectNetworkFilter(networkParam);
    }

    const busParam = urlParams.get('bus') || window.location.hash.replace('#bus-', '');
    if (busParam && !['fleet', 'lines', 'movements', 'news', 'gallery', 'about'].includes(busParam)) {
      const targetVehicle = fleetData.find(v => v.number === busParam || v.id === busParam);
      if (targetVehicle) {
        openVehicleModal(targetVehicle.id);
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement du parc:', error);
    document.getElementById('fleet-container').innerHTML = `
      <div class="col-span-full text-center py-12 text-red-500">
        <i data-lucide="alert-triangle" class="w-10 h-10 mx-auto mb-2"></i>
        <p class="text-lg font-semibold">Impossible de charger les données du parc.</p>
        <p class="text-sm opacity-80">Vérifiez que le fichier data/fleet.json est bien accessible.</p>
      </div>
    `;
    lucide.createIcons();
  }
}

function updateFleetStats() {
  const total = fleetData.length;
  const active = fleetData.filter(v => v.status === 'Actuel').length;
  const reformed = fleetData.filter(v => v.status && v.status.includes('Réformé')).length;
  const trams = fleetData.filter(v => v.type && v.type.includes('Tramway')).length;
  const greenEnergy = fleetData.filter(v => v.energy && (v.energy.includes('GNV') || v.energy.includes('Électrique') || v.energy.includes('Hybride'))).length;
  const greenPercent = total > 0 ? Math.round((greenEnergy / total) * 100) : 0;

  animateValue('stat-total', 0, total, 800);
  animateValue('stat-active', 0, active, 800);
  animateValue('stat-reformed', 0, reformed, 800);
  animateValue('stat-tram', 0, trams, 800);
  animateValue('stat-green', 0, greenPercent, 800, '%');
}

function updateNetworkCardCounts() {
  const countAll = fleetData.length;
  const countTwisto = fleetData.filter(v => v.network && v.network.includes('Twisto')).length;
  const countAstuce = fleetData.filter(v => v.network && v.network.includes('Astuce')).length;
  const countLia = fleetData.filter(v => v.network && v.network.includes('LiA')).length;
  const countNomad = fleetData.filter(v => v.network && v.network.includes('Nomad')).length;

  const elAll = document.getElementById('count-net-all');
  if (elAll) elAll.textContent = `${countAll} bus`;

  const elTwisto = document.getElementById('count-net-twisto');
  if (elTwisto) elTwisto.textContent = `${countTwisto} bus`;

  const elAstuce = document.getElementById('count-net-astuce');
  if (elAstuce) elAstuce.textContent = `${countAstuce} bus`;

  const elLia = document.getElementById('count-net-lia');
  if (elLia) elLia.textContent = `${countLia} bus`;

  const elNomad = document.getElementById('count-net-nomad');
  if (elNomad) elNomad.textContent = `${countNomad} bus`;
}

function selectNetworkFilter(network, triggerElement) {
  activeFilters.network = network;

  document.querySelectorAll('.network-card').forEach(card => {
    card.classList.remove('border-emerald-600', 'border-blue-600', 'border-sky-600', 'border-amber-600', 'shadow-md', 'scale-[1.02]');
    card.classList.add('border-slate-200', 'dark:border-slate-700');
  });

  document.querySelectorAll('.net-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.value === network) {
      btn.classList.add('active');
    }
  });

  if (triggerElement && triggerElement.classList.contains('network-card')) {
    triggerElement.classList.add('border-emerald-600', 'shadow-md', 'scale-[1.02]');
    triggerElement.classList.remove('border-slate-200', 'dark:border-slate-700');
  }

  renderFleet();
}

function animateValue(id, start, end, duration, suffix = '') {
  const obj = document.getElementById(id);
  if (!obj) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start) + suffix;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

function populateSeriesDropdown() {
  const seriesSelect = document.getElementById('filter-series');
  if (!seriesSelect) return;

  const seriesRanges = [
    { label: 'Toutes les séries', value: 'all' },
    { label: 'Série 1000 (Tramway Citadis 305)', value: '1000' },
    { label: 'Série 5200 (Standards GNV Citaro NGT & Scania)', value: '5200' },
    { label: 'Série 6200 (Articulés GNV Scania LFA II)', value: '6200' },
    { label: 'Série 7200 (Standards GNV Citaro NGT - KPN)', value: '7200' },
    { label: 'Série 8200 (Autocars Intouro / Crossway Scolaires & Périurbains)', value: '8200' },
    { label: 'Série 400 / 450 (Citaro C2 & Citaro G C2)', value: '400' },
    { label: 'Série 330 / 360 / 370 (Citelis 18, Crealis 18, GX 427)', value: '300' },
    { label: 'Série 140 / 170 (GX 327 & Crealis 12)', value: '100' },
    { label: 'Série 50 / 90 / 190 / 3200 (Minibus & Midibus)', value: 'minibus' }
  ];

  seriesSelect.innerHTML = seriesRanges.map(s => `<option value="${s.value}">${s.label}</option>`).join('');
}

function getFilteredFleet() {
  return fleetData.filter(vehicle => {
    // Search query
    if (activeFilters.search) {
      const q = activeFilters.search.toLowerCase().trim();
      const matchNumber = vehicle.number ? vehicle.number.toLowerCase().includes(q) : false;
      const matchModel = vehicle.model ? vehicle.model.toLowerCase().includes(q) : false;
      const matchBrand = vehicle.brand ? vehicle.brand.toLowerCase().includes(q) : false;
      const matchReg = vehicle.plate ? vehicle.plate.toLowerCase().includes(q) : (vehicle.registration ? vehicle.registration.toLowerCase().includes(q) : false);
      const matchLines = vehicle.lines ? vehicle.lines.some(l => l.toLowerCase().includes(q)) : false;
      const matchNetwork = vehicle.network ? vehicle.network.toLowerCase().includes(q) : false;
      const matchOperator = vehicle.operator ? vehicle.operator.toLowerCase().includes(q) : false;
      if (!matchNumber && !matchModel && !matchBrand && !matchReg && !matchLines && !matchNetwork && !matchOperator) {
        return false;
      }
    }

    // Network filter
    if (activeFilters.network !== 'all') {
      if (activeFilters.network === 'Twisto' && (!vehicle.network || !vehicle.network.includes('Twisto'))) return false;
      if (activeFilters.network === 'Astuce (Rouen)' && (!vehicle.network || !vehicle.network.includes('Astuce'))) return false;
      if (activeFilters.network === 'LiA (Le Havre)' && (!vehicle.network || !vehicle.network.includes('LiA'))) return false;
      if (activeFilters.network === 'Nomad Car (Normandie)' && (!vehicle.network || !vehicle.network.includes('Nomad'))) return false;
    }

    // Status filter
    if (activeFilters.status !== 'all' && vehicle.status !== activeFilters.status) {
      return false;
    }

    // Type filter
    if (activeFilters.type !== 'all' && vehicle.type !== activeFilters.type) {
      return false;
    }

    // Energy filter
    if (activeFilters.energy !== 'all') {
      if (!vehicle.energy || !vehicle.energy.toLowerCase().includes(activeFilters.energy.toLowerCase())) {
        return false;
      }
    }

    // Series filter
    if (activeFilters.series !== 'all') {
      const numInt = parseInt(String(vehicle.number).replace(/[^0-9]/g, ''), 10);
      if (activeFilters.series === '1000' && (isNaN(numInt) || numInt < 1000 || numInt > 1099)) return false;
      if (activeFilters.series === '5200' && (isNaN(numInt) || numInt < 5200 || numInt > 5299)) return false;
      if (activeFilters.series === '6200' && (isNaN(numInt) || numInt < 6200 || numInt > 6299)) return false;
      if (activeFilters.series === '7200' && (isNaN(numInt) || numInt < 7200 || numInt > 7299)) return false;
      if (activeFilters.series === '8200' && (isNaN(numInt) || numInt < 8200 || numInt > 8299)) return false;
      if (activeFilters.series === '400' && (isNaN(numInt) || numInt < 400 || numInt > 499)) return false;
      if (activeFilters.series === '300' && (isNaN(numInt) || numInt < 300 || numInt > 399)) return false;
      if (activeFilters.series === '100' && (isNaN(numInt) || numInt < 100 || numInt > 199)) return false;
      if (activeFilters.series === 'minibus' && (isNaN(numInt) || (numInt >= 100 && numInt < 3200 && numInt !== 190 && numInt !== 191 && numInt !== 192 && numInt !== 91 && numInt !== 92 && numInt !== 93 && numInt !== 94 && numInt !== 96 && numInt !== 99))) return false;
    }

    return true;
  });
}

function renderFleet() {
  const container = document.getElementById('fleet-container');
  const countEl = document.getElementById('fleet-results-count');
  if (!container) return;

  const filtered = getFilteredFleet();

  if (countEl) {
    countEl.textContent = `${filtered.length} véhicule${filtered.length > 1 ? 's' : ''} trouvé${filtered.length > 1 ? 's' : ''}`;
  }

  if (filtered.length === 0) {
    container.className = 'col-span-full';
    container.innerHTML = `
      <div class="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div class="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <i data-lucide="bus-front" class="w-8 h-8"></i>
        </div>
        <h4 class="text-lg font-bold text-slate-800 dark:text-slate-200">Aucun véhicule ne correspond aux filtres</h4>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Essayez de modifier votre recherche ou de réinitialiser les filtres pour afficher l'ensemble du parc.</p>
        <button onclick="resetFleetFilters()" class="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition">
          Réinitialiser tous les filtres
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  if (viewMode === 'naotc') {
    container.className = 'col-span-full space-y-6';
    container.innerHTML = renderVehicleNaotc(filtered);
  } else if (viewMode === 'grid') {
    container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    container.innerHTML = filtered.map(v => renderVehicleCard(v)).join('');
  } else {
    container.className = 'col-span-full';
    container.innerHTML = renderVehicleTable(filtered);
  }

  lucide.createIcons();
}

function setFleetViewMode(mode) {
  viewMode = mode;
  ['naotc', 'grid', 'table'].forEach(m => {
    const btn = document.getElementById(`view-mode-${m}`);
    if (btn) {
      if (m === mode) {
        btn.classList.add('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-emerald-600', 'dark:text-emerald-400');
        btn.classList.remove('text-slate-500');
      } else {
        btn.classList.remove('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-emerald-600', 'dark:text-emerald-400');
        btn.classList.add('text-slate-500');
      }
    }
  });
  renderFleet();
}

function calculateAge(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date('2026-09-01');
  let months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years <= 0) return `${rem} mois`;
  return `${years} an${years > 1 ? 's' : ''}${rem > 0 ? ` et ${rem} mois` : ''}`;
}

const collapsedGabarits = {};
const collapsedModels = {};

function toggleGabaritCollapse(key) {
  collapsedGabarits[key] = !collapsedGabarits[key];
  const body = document.getElementById(`body-gab-${key}`);
  const chev = document.getElementById(`chev-gab-${key}`);
  if (body) body.classList.toggle('hidden', collapsedGabarits[key]);
  if (chev) chev.style.transform = collapsedGabarits[key] ? 'rotate(-90deg)' : 'rotate(0deg)';
}

function toggleModelCollapse(key) {
  collapsedModels[key] = !collapsedModels[key];
  const table = document.getElementById(`table-mod-${key}`);
  const chev = document.getElementById(`chev-mod-${key}`);
  if (table) table.classList.toggle('hidden', collapsedModels[key]);
  if (chev) chev.style.transform = collapsedModels[key] ? 'rotate(-90deg)' : 'rotate(0deg)';
}

function renderVehicleNaotc(vehicles) {
  const GABARIT_LIST = [
    { title: "Tramway", icon: "tram-front", matcher: v => v.type === 'Tramway' || (v.gabarit && v.gabarit.includes('Tramway')) },
    { title: "Bus Articulés (18 m)", icon: "bus", matcher: v => (v.type && v.type.includes('Articulé')) || (v.gabarit && v.gabarit.includes('Articulé')) },
    { title: "Bus Standards (12 m)", icon: "bus", matcher: v => (v.type && v.type.includes('Standard')) || (v.gabarit && v.gabarit.includes('Standard')) },
    { title: "Midibus & Minibus", icon: "van", matcher: v => (v.type && (v.type.includes('Mini') || v.type.includes('Midi'))) || (v.gabarit && v.gabarit.includes('Mini')) },
    { title: "Autocars interurbains & scolaires", icon: "shield", matcher: v => (v.type && v.type.includes('Autocar')) || (v.gabarit && v.gabarit.includes('Autocar')) }
  ];

  let html = '';

  GABARIT_LIST.forEach((gab, gIndex) => {
    const matchedVehicles = vehicles.filter(gab.matcher);
    if (matchedVehicles.length === 0) return;

    // Regrouper par Modèle
    const modelGroups = {};
    matchedVehicles.forEach(v => {
      const modelKey = `${v.brand || ''} ${v.model || 'Inconnu'}`.trim();
      if (!modelGroups[modelKey]) modelGroups[modelKey] = [];
      modelGroups[modelKey].push(v);
    });

    const isGabCollapsed = !!collapsedGabarits[gIndex];

    const modelsHtml = Object.keys(modelGroups).sort().map((mKey, mIndex) => {
      const mVehicles = modelGroups[mKey];
      const firstV = mVehicles[0];
      const fullModelKey = `${gIndex}_${mIndex}`;
      const isModCollapsed = !!collapsedModels[fullModelKey];

      let energyBadgeClass = 'badge-diesel';
      if (firstV.energy && firstV.energy.includes('GNV')) energyBadgeClass = 'badge-gnv';
      else if (firstV.energy && firstV.energy.includes('Électrique')) energyBadgeClass = 'badge-electric';
      else if (firstV.energy && firstV.energy.includes('Hybride')) energyBadgeClass = 'badge-hybrid';

      return `
        <div class="naotc-model-card" id="card-mod-${fullModelKey}">
          <div class="naotc-model-head" onclick="toggleModelCollapse('${fullModelKey}')">
            <div class="flex items-center gap-3 flex-wrap">
              <span class="naotc-model-title">${firstV.model}</span>
              <span class="naotc-model-brand">${firstV.brand || ''}</span>
              <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-full ${energyBadgeClass}">
                ${firstV.energy || 'Diesel'}
              </span>
            </div>
            <div class="naotc-model-count">
              ${mVehicles.length} véhicule${mVehicles.length > 1 ? 's' : ''}
            </div>
            <i data-lucide="chevron-down" id="chev-mod-${fullModelKey}" class="w-4 h-4 text-slate-400 transition-transform ml-2" style="transform:${isModCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'}"></i>
          </div>

          <div class="overflow-x-auto ${isModCollapsed ? 'hidden' : ''}" id="table-mod-${fullModelKey}">
            <table class="naotc-vtable">
              <thead>
                <tr>
                  <th>N° Parc</th>
                  <th>Immatriculation</th>
                  <th>Mise en service</th>
                  <th>Exploitant</th>
                  <th>Dépôt</th>
                  <th>Statut</th>
                  <th class="text-right">Fiche</th>
                </tr>
              </thead>
              <tbody>
                ${mVehicles.map(v => `
                  <tr onclick="openVehicleModal('${v.id}')">
                    <td class="font-bold text-slate-900 dark:text-white">
                      <span class="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                        N° ${v.number}
                      </span>
                    </td>
                    <td>${renderLicensePlate(v.plate || v.registration)}</td>
                    <td class="font-medium">${formatDate(v.serviceDate || v.inServiceDate)} <span class="text-[10px] text-slate-400">(${calculateAge(v.serviceDate || v.inServiceDate)})</span></td>
                    <td>${v.operator || '-'}</td>
                    <td>${v.depot || '-'}</td>
                    <td>
                      <span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${v.status === 'Actuel' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'}">
                        ${v.status || 'Actuel'}
                      </span>
                    </td>
                    <td class="text-right">
                      <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">Voir fiche →</span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');

    html += `
      <div class="naotc-gabarit-section">
        <div class="naotc-gabarit-head" onclick="toggleGabaritCollapse('${gIndex}')">
          <div class="naotc-gabarit-title">
            <i data-lucide="${gab.icon}" class="w-5 h-5 text-emerald-600"></i>
            <span>${gab.title}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="naotc-gabarit-badge">${matchedVehicles.length} véhicules</span>
            <i data-lucide="chevron-down" id="chev-gab-${gIndex}" class="w-4 h-4 text-slate-400 transition-transform" style="transform:${isGabCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'}"></i>
          </div>
        </div>

        <div class="naotc-gabarit-body ${isGabCollapsed ? 'hidden' : ''}" id="body-gab-${gIndex}">
          ${modelsHtml}
        </div>
      </div>
    `;
  });

  return html;
}


function renderVehicleCard(v) {
  const isTram = v.type === 'Tramway';
  const isActif = v.status === 'Actuel';
  
  // Badges styling
  let energyBadgeClass = 'badge-diesel';
  if (v.energy && v.energy.includes('GNV')) energyBadgeClass = 'badge-gnv';
  else if (v.energy && v.energy.includes('Électrique')) energyBadgeClass = 'badge-electric';
  else if (v.energy && v.energy.includes('Hybride')) energyBadgeClass = 'badge-hybrid';

  // Network badge color
  let networkBadgeBg = 'bg-slate-900/80 text-slate-200';
  if (v.network && v.network.includes('Twisto')) networkBadgeBg = 'bg-emerald-700/90 text-white';
  else if (v.network && v.network.includes('Astuce')) networkBadgeBg = 'bg-blue-700/90 text-white';
  else if (v.network && v.network.includes('LiA')) networkBadgeBg = 'bg-sky-700/90 text-white';
  else if (v.network && v.network.includes('Nomad')) networkBadgeBg = 'bg-amber-700/90 text-white';

  const linesHtml = v.lines && v.lines.length > 0 
    ? v.lines.slice(0, 4).map(line => `<span class="px-2 py-0.5 text-xs font-bold rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">${line}</span>`).join(' ')
    : '<span class="text-xs text-slate-400">Non spécifié</span>';

  return `
    <div class="transit-card bg-white dark:bg-slate-800/90 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl flex flex-col group cursor-pointer" onclick="openVehicleModal('${v.id}')">
      <!-- Card Image Header -->
      <div class="relative h-48 w-full overflow-hidden bg-slate-900">
        <img src="${v.photo || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'}" alt="${v.model} n°${v.number}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'" />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30"></div>
        
        <!-- Fleet Number Badge -->
        <div class="absolute top-3 left-3 flex items-center gap-2">
          <span class="px-3 py-1 bg-emerald-600/95 backdrop-blur-md text-white font-extrabold text-sm rounded-lg shadow-lg flex items-center gap-1.5 border border-emerald-400/30">
            <i data-lucide="${isTram ? 'tram-front' : 'bus'}" class="w-4 h-4"></i>
            N° ${v.number}
          </span>
          <span class="px-2.5 py-1 text-xs font-semibold rounded-lg backdrop-blur-md ${isActif ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}">
            ${v.status || 'Actuel'}
          </span>
        </div>

        <!-- Network Badge -->
        <div class="absolute top-3 right-3" onclick="event.stopPropagation(); selectNetworkFilter('${v.network}');">
          <span class="px-2.5 py-1 text-xs font-bold rounded-lg backdrop-blur-md ${networkBadgeBg} border border-white/20 hover:scale-105 transition-transform flex items-center gap-1 shadow">
            <i data-lucide="map-pin" class="w-3 h-3"></i> ${v.network || 'Twisto'}
          </span>
        </div>

        <!-- Bottom Image Content: Model -->
        <div class="absolute bottom-3 left-3 right-3 text-white">
          <h4 class="font-bold text-lg leading-tight drop-shadow-md truncate">${v.model}</h4>
          <p class="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
            <i data-lucide="calendar" class="w-3.5 h-3.5"></i> Mise en service : ${formatDate(v.serviceDate)}
          </p>
        </div>
      </div>

      <!-- Card Body -->
      <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
        <!-- License Plate & Energy -->
        <div class="flex items-center justify-between gap-2">
          ${renderLicensePlate(v.registration)}
          <span class="px-2.5 py-1 rounded-full text-xs font-medium ${energyBadgeClass}">
            ${v.energy ? v.energy.split(' ')[0] : 'Diesel'}
          </span>
        </div>

        <!-- Quick Specs Grid -->
        <div class="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          <div>
            <span class="block text-slate-400 dark:text-slate-500 font-medium">Exploitant</span>
            <span class="font-bold text-slate-800 dark:text-slate-200 truncate block">${v.operator || 'Keolis Caen la mer'}</span>
          </div>
          <div>
            <span class="block text-slate-400 dark:text-slate-500 font-medium">Dépôt</span>
            <span class="font-semibold text-slate-700 dark:text-slate-300 truncate block">${v.depot || 'Dépôt de Caen'}</span>
          </div>
        </div>

        <!-- Lines and Action -->
        <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-1.5 overflow-hidden">
            <span class="text-xs font-medium text-slate-400">Lignes :</span>
            <div class="flex items-center gap-1 overflow-x-auto">
              ${linesHtml}
            </div>
          </div>
          <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Détails <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          </span>
        </div>
      </div>
    </div>
  `;
}

function renderVehicleTable(vehicles) {
  return `
    <div class="overflow-x-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <table class="w-full text-left text-sm text-slate-600 dark:text-slate-300">
        <thead class="bg-slate-50 dark:bg-slate-900/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th class="py-3.5 px-4">N° Parc</th>
            <th class="py-3.5 px-4">Réseau</th>
            <th class="py-3.5 px-4">Modèle</th>
            <th class="py-3.5 px-4">Exploitant</th>
            <th class="py-3.5 px-4">Type</th>
            <th class="py-3.5 px-4">Immatriculation</th>
            <th class="py-3.5 px-4">Énergie</th>
            <th class="py-3.5 px-4">Mise en service</th>
            <th class="py-3.5 px-4">Statut</th>
            <th class="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
          ${vehicles.map(v => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition cursor-pointer" onclick="openVehicleModal('${v.id}')">
              <td class="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full ${v.status === 'Actuel' ? 'bg-emerald-500' : 'bg-red-500'}"></span>
                N° ${v.number}
              </td>
              <td class="py-3.5 px-4 font-bold text-xs text-emerald-600 dark:text-emerald-400">${v.network || 'Twisto'}</td>
              <td class="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">${v.model}</td>
              <td class="py-3.5 px-4 text-xs">${v.operator || '-'}</td>
              <td class="py-3.5 px-4">${v.type || 'Bus'}</td>
              <td class="py-3.5 px-4 font-mono text-xs">${v.registration || '-'}</td>
              <td class="py-3.5 px-4">${v.energy || '-'}</td>
              <td class="py-3.5 px-4 text-xs">${formatDate(v.serviceDate)}</td>
              <td class="py-3.5 px-4">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-medium ${v.status === 'Actuel' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'}">
                  ${v.status || 'Actuel'}
                </span>
              </td>
              <td class="py-3.5 px-4 text-right">
                <button class="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition">
                  Voir fiche
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderLicensePlate(plate) {
  if (!plate || plate.includes('Rame')) {
    return `<span class="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-600">${plate || 'Sans immat'}</span>`;
  }

  const cleanPlate = plate.replace(/\s*\(\d+\)/g, '').trim();
  const regMatch = plate.match(/\((\d+)\)/);
  const depNumber = regMatch ? regMatch[1] : '14';

  return `
    <div class="license-plate" title="Immatriculation Région Normandie (${depNumber})">
      <div class="band-f">
        <span>★</span>
        <span>F</span>
      </div>
      <div class="plate-text">${cleanPlate}</div>
      <div class="band-region">
        <span>🏛</span>
        <span>${depNumber}</span>
      </div>
    </div>
  `;
}

function openVehicleModal(id) {
  const filtered = getFilteredFleet();
  currentVehicleIndex = filtered.findIndex(v => v.id === id);
  const vehicle = fleetData.find(v => v.id === id);
  if (!vehicle) return;

  const modal = document.getElementById('vehicle-modal');
  const modalContent = document.getElementById('vehicle-modal-content');
  if (!modal || !modalContent) return;

  // Update URL hash for sharing
  window.history.replaceState(null, '', `?bus=${vehicle.number}`);

  const isTram = vehicle.type === 'Tramway';
  const isActif = vehicle.status === 'Actuel';

  modalContent.innerHTML = `
    <!-- Modal Header with Image -->
    <div class="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-950 rounded-t-3xl">
      <img src="${vehicle.photo || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80'}" alt="${vehicle.model} n°${vehicle.number}" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80'" />
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/60"></div>
      
      <!-- Close Button -->
      <button onclick="closeVehicleModal()" class="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 flex items-center justify-center transition z-10">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>

      <!-- Prev / Next Navigation buttons -->
      <div class="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between pointer-events-none">
        <button onclick="navigateVehicle(-1)" class="pointer-events-auto w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 flex items-center justify-center transition ${currentVehicleIndex <= 0 ? 'opacity-40 cursor-not-allowed' : ''}">
          <i data-lucide="chevron-left" class="w-5 h-5"></i>
        </button>
        <button onclick="navigateVehicle(1)" class="pointer-events-auto w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 flex items-center justify-center transition ${currentVehicleIndex >= filtered.length - 1 ? 'opacity-40 cursor-not-allowed' : ''}">
          <i data-lucide="chevron-right" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Header Vehicle Badges -->
      <div class="absolute top-4 left-4 flex flex-wrap gap-2">
        <span class="px-3.5 py-1.5 bg-emerald-600 text-white font-extrabold text-sm rounded-xl shadow-lg flex items-center gap-1.5">
          <i data-lucide="${isTram ? 'tram-front' : 'bus'}" class="w-4 h-4"></i>
          N° ${vehicle.number}
        </span>
        <span class="px-3 py-1.5 text-xs font-bold rounded-xl backdrop-blur-md bg-blue-600/80 text-white border border-white/20">
          ${vehicle.network || 'Twisto'}
        </span>
        <span class="px-3 py-1.5 text-xs font-semibold rounded-xl backdrop-blur-md ${isActif ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'}">
          ${vehicle.status || 'Actuel'}
        </span>
      </div>

      <!-- Photo Author attribution -->
      ${vehicle.photoAuthor ? `
        <div class="absolute bottom-4 right-4 text-xs text-white/70 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-md flex items-center gap-1">
          <i data-lucide="camera" class="w-3.5 h-3.5"></i> Photo : ${vehicle.photoAuthor}
        </div>
      ` : ''}

      <!-- Bottom Title -->
      <div class="absolute bottom-4 left-4 right-32 text-white">
        <p class="text-xs font-semibold text-emerald-400 tracking-wider uppercase">${vehicle.type || 'Bus'} • ${vehicle.operator || 'Keolis Caen la mer'}</p>
        <h2 class="text-2xl sm:text-3xl font-extrabold drop-shadow-md leading-tight">${vehicle.model}</h2>
      </div>
    </div>

    <!-- Modal Body -->
    <div class="p-6 sm:p-8 space-y-8 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-b-3xl max-h-[70vh] overflow-y-auto">
      
      <!-- Top Action & License Plate Bar -->
      <div class="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-3">
          <span class="text-xs font-semibold text-slate-400 uppercase">Immatriculation :</span>
          ${renderLicensePlate(vehicle.registration)}
        </div>
        <div class="flex items-center gap-2">
          <!-- Direct Full Vehicle Editor Trigger Button -->
          <button onclick="closeVehicleModal(); setTimeout(() => openEditVehicleModal('${vehicle.id}'), 120);" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md shadow-emerald-600/25" title="Modifier la fiche complète de ce véhicule">
            <i data-lucide="edit-3" class="w-4 h-4"></i> 
            <span>Modifier la fiche</span>
          </button>
          <button onclick="shareVehicle('${vehicle.number}', '${vehicle.model}')" class="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition">
            <i data-lucide="share-2" class="w-3.5 h-3.5"></i> Partager
          </button>
        </div>
      </div>

      <!-- 1. Technical Specifications Grid (Fiche Technique & Informations) -->
      <div>
        <h3 class="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <i data-lucide="info" class="w-5 h-5 text-emerald-600"></i> Fiche Technique & Informations
        </h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-xs text-slate-400 block mb-0.5">Réseau de transport</span>
            <span class="font-bold text-sm text-emerald-600 dark:text-emerald-400">${vehicle.network || 'Twisto'}</span>
          </div>
          <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-xs text-slate-400 block mb-0.5">Exploitant / Transporteur</span>
            <span class="font-bold text-sm text-slate-800 dark:text-slate-200">${vehicle.operator || 'Keolis Caen la mer'}</span>
          </div>
          <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-xs text-slate-400 block mb-0.5">Motorisation / Énergie</span>
            <span class="font-bold text-sm text-slate-800 dark:text-slate-200">${vehicle.energy || 'GNV'}</span>
          </div>
          <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-xs text-slate-400 block mb-0.5">Mise en service</span>
            <span class="font-bold text-sm text-slate-800 dark:text-slate-200">${formatDate(vehicle.serviceDate)}</span>
          </div>
          <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-xs text-slate-400 block mb-0.5">Dépôt d'attache</span>
            <span class="font-bold text-sm text-slate-800 dark:text-slate-200">${vehicle.depot || 'Dépôt de Caen'}</span>
          </div>
          <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-xs text-slate-400 block mb-0.5">Capacité passagers</span>
            <span class="font-bold text-sm text-slate-800 dark:text-slate-200">${vehicle.capacity || '102 places'}</span>
          </div>
          <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-xs text-slate-400 block mb-0.5">Longueur du véhicule</span>
            <span class="font-bold text-sm text-slate-800 dark:text-slate-200">${vehicle.length || '12 mètres'}</span>
          </div>
          <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-xs text-slate-400 block mb-0.5">Nombre de portes</span>
            <span class="font-bold text-sm text-slate-800 dark:text-slate-200">${vehicle.doors || '3 portes'}</span>
          </div>
          <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span class="text-xs text-slate-400 block mb-0.5">Livrée actuelle</span>
            <span class="font-bold text-sm text-slate-800 dark:text-slate-200">${vehicle.livery || 'Twisto'}</span>
          </div>
          ${vehicle.vin ? `
            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1">
              <span class="text-xs text-slate-400 block mb-0.5">Numéro de Châssis (VIN)</span>
              <span class="font-mono text-xs text-slate-800 dark:text-slate-200">${vehicle.vin}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- 2. Assigned Lines -->
      ${vehicle.lines && vehicle.lines.length > 0 ? `
        <div>
          <h3 class="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <i data-lucide="route" class="w-5 h-5 text-emerald-600"></i> Lignes Habituellement Affectées
          </h3>
          <div class="flex flex-wrap gap-2">
            ${vehicle.lines.map(l => `
              <span class="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold rounded-xl text-sm shadow-sm flex items-center gap-1">
                <i data-lucide="navigation" class="w-3.5 h-3.5"></i> ${l}
              </span>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- 3. Equipment & Features (Équipements & Confort) -->
      <div>
        <h3 class="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <i data-lucide="check-circle" class="w-5 h-5 text-emerald-600"></i> Équipements & Confort du Véhicule
        </h3>
        ${vehicle.features && vehicle.features.length > 0 ? `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            ${vehicle.features.map(f => `
              <div class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span class="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <i data-lucide="check" class="w-3.5 h-3.5"></i>
                </span>
                <span class="font-medium">${f}</span>
              </div>
            `).join('')}
          </div>
        ` : `
          <p class="text-xs text-slate-400 italic">Aucun équipement spécifié pour le moment.</p>
        `}
      </div>

      <!-- 4. History Timeline (Historique du Véhicule) -->
      <div>
        <h3 class="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <i data-lucide="history" class="w-5 h-5 text-emerald-600"></i> Historique Chronologique du Véhicule
        </h3>
        ${vehicle.history && vehicle.history.length > 0 ? `
          <div class="relative pl-6 border-l-2 border-emerald-500/40 space-y-6 ml-2">
            ${vehicle.history.map(h => `
              <div class="relative group">
                <div class="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white dark:border-slate-900 shadow"></div>
                <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">${formatDate(h.date)}</span>
                <p class="text-sm text-slate-700 dark:text-slate-200 mt-0.5 font-medium">${h.event}</p>
              </div>
            `).join('')}
          </div>
        ` : `
          <p class="text-xs text-slate-400 italic">Historique non renseigné.</p>
        `}
      </div>

      <!-- Observations / Notes -->
      ${vehicle.notes ? `
        <div class="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200/60 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-sm">
          <div class="flex items-center gap-2 font-bold mb-1">
            <i data-lucide="message-square" class="w-4 h-4 text-amber-600"></i> Note d'observation :
          </div>
          <p>${vehicle.notes}</p>
        </div>
      ` : ''}

    </div>
  `;

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  lucide.createIcons();
}

function closeVehicleModal() {
  const modal = document.getElementById('vehicle-modal');
  if (modal) modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
  window.history.replaceState(null, '', window.location.pathname);
}

function navigateVehicle(direction) {
  const filtered = getFilteredFleet();
  const nextIndex = currentVehicleIndex + direction;
  if (nextIndex >= 0 && nextIndex < filtered.length) {
    openVehicleModal(filtered[nextIndex].id);
  }
}

function shareVehicle(number, model) {
  const url = `${window.location.origin}${window.location.pathname}?bus=${number}`;
  if (navigator.share) {
    navigator.share({
      title: `Bus n°${number} (${model})`,
      text: `Découvrez la fiche détaillée du bus n°${number} sur Histo14Bus !`,
      url: url
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url);
    showToast(`Lien du bus n°${number} copié !`);
  }
}

function resetFleetFilters() {
  activeFilters = {
    search: '',
    status: 'all',
    type: 'all',
    energy: 'all',
    network: 'all',
    series: 'all'
  };

  const searchInput = document.getElementById('fleet-search');
  if (searchInput) searchInput.value = '';

  const seriesSelect = document.getElementById('filter-series');
  if (seriesSelect) seriesSelect.value = 'all';

  document.querySelectorAll('.filter-btn').forEach(btn => {
    if (btn.dataset.value === 'all') {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.querySelectorAll('.network-card').forEach(c => {
    c.classList.remove('border-emerald-600', 'shadow-md', 'scale-[1.02]');
    c.classList.add('border-slate-200', 'dark:border-slate-700');
  });

  const allCard = document.querySelector('.network-card[onclick*="all"]');
  if (allCard) {
    allCard.classList.add('border-emerald-600', 'shadow-md', 'scale-[1.02]');
    allCard.classList.remove('border-slate-200', 'dark:border-slate-700');
  }

  renderFleet();
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

window.addEventListener('DOMContentLoaded', initFleet);
