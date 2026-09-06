/**
 * Histo14Bus - Main Application Logic & UI Router
 */

let movementsData = [];
let newsData = [];
let galleryData = [];
let teamData = [];

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  initGlobalSearch();
  initKeyboardShortcuts();
  loadMovements();
  loadNews();
  loadGallery();
  loadTeam();
  lucide.createIcons();
});

/* --- THEME (DARK / LIGHT MODE) --- */
function initTheme() {
  const isDark = localStorage.getItem('histo14_theme') === 'dark' || 
    (!localStorage.getItem('histo14_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  updateThemeIcon();
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('histo14_theme', isDark ? 'dark' : 'light');
  updateThemeIcon();
}

function updateThemeIcon() {
  const isDark = document.documentElement.classList.contains('dark');
  const icon = document.getElementById('theme-toggle-icon');
  if (icon) {
    icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    lucide.createIcons();
  }
}

/* --- NAVIGATION & TAB ROUTING --- */
function initNavigation() {
  // Check hash on load
  const hash = window.location.hash.replace('#', '') || 'fleet';
  if (['fleet', 'lines', 'movements', 'news', 'gallery', 'about'].includes(hash)) {
    switchTab(hash, false);
  }
}

function switchTab(tabId, updateHash = true) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.add('hidden');
  });

  // Remove active state on nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('text-emerald-500', 'border-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-950/50', 'text-slate-900', 'dark:text-white', 'font-bold');
    link.classList.add('text-slate-600', 'dark:text-slate-400');
  });

  // Show active tab
  const target = document.getElementById(`tab-${tabId}`);
  if (target) {
    target.classList.remove('hidden');
  }

  // Set active state on current nav links
  document.querySelectorAll(`.nav-link[data-tab="${tabId}"]`).forEach(link => {
    link.classList.remove('text-slate-600', 'dark:text-slate-400');
    link.classList.add('text-emerald-600', 'dark:text-emerald-400', 'font-bold');
  });

  if (updateHash) {
    window.location.hash = tabId;
  }

  // Scroll to top of content smoothly
  window.scrollTo({ top: 0, behavior: 'smooth' });
  lucide.createIcons();
}

/* --- GLOBAL UNIVERSAL SEARCH (CTRL+K) --- */
function initGlobalSearch() {
  const globalInput = document.getElementById('global-search-input');
  const resultsContainer = document.getElementById('global-search-results');
  
  if (!globalInput || !resultsContainer) return;

  globalInput.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) {
      resultsContainer.classList.add('hidden');
      return;
    }

    const matchesVehicles = (typeof fleetData !== 'undefined' ? fleetData : []).filter(v => 
      v.number.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      (v.registration && v.registration.toLowerCase().includes(q))
    ).slice(0, 5);

    const matchesLines = (typeof linesData !== 'undefined' ? linesData : []).filter(l =>
      l.number.toLowerCase().includes(q) ||
      l.name.toLowerCase().includes(q) ||
      l.terminusA.toLowerCase().includes(q) ||
      l.terminusB.toLowerCase().includes(q)
    ).slice(0, 3);

    if (matchesVehicles.length === 0 && matchesLines.length === 0) {
      resultsContainer.innerHTML = `
        <div class="p-4 text-center text-xs text-slate-400">
          Aucun résultat pour "${q}"
        </div>
      `;
      resultsContainer.classList.remove('hidden');
      return;
    }

    resultsContainer.innerHTML = `
      <div class="p-2 space-y-2 max-h-80 overflow-y-auto">
        ${matchesVehicles.length > 0 ? `
          <div class="text-[11px] font-bold text-slate-400 uppercase px-3 py-1">Véhicules (${matchesVehicles.length})</div>
          ${matchesVehicles.map(v => `
            <div onclick="selectSearchResult('vehicle', '${v.id}')" class="p-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer flex items-center justify-between transition">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                  ${v.number}
                </span>
                <div>
                  <div class="font-bold text-xs text-slate-800 dark:text-slate-100">${v.model}</div>
                  <div class="text-[10px] text-slate-400">${v.registration || '-'} • ${v.status}</div>
                </div>
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400"></i>
            </div>
          `).join('')}
        ` : ''}

        ${matchesLines.length > 0 ? `
          <div class="text-[11px] font-bold text-slate-400 uppercase px-3 py-1 mt-2">Lignes (${matchesLines.length})</div>
          ${matchesLines.map(l => `
            <div onclick="selectSearchResult('line', '${l.id}')" class="p-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer flex items-center justify-between transition">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center shadow-sm" style="background-color: ${l.color}; color: ${l.textColor};">
                  ${l.number}
                </span>
                <div>
                  <div class="font-bold text-xs text-slate-800 dark:text-slate-100">${l.name}</div>
                  <div class="text-[10px] text-slate-400 truncate">${l.terminusA} ↔ ${l.terminusB}</div>
                </div>
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400"></i>
            </div>
          `).join('')}
        ` : ''}
      </div>
    `;

    resultsContainer.classList.remove('hidden');
    lucide.createIcons();
  });

  // Close search dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!globalInput.contains(e.target) && !resultsContainer.contains(e.target)) {
      resultsContainer.classList.add('hidden');
    }
  });
}

function selectSearchResult(type, id) {
  const resultsContainer = document.getElementById('global-search-results');
  if (resultsContainer) resultsContainer.classList.add('hidden');

  if (type === 'vehicle') {
    switchTab('fleet', false);
    if (typeof openVehicleModal === 'function') {
      openVehicleModal(id);
    }
  } else if (type === 'line') {
    switchTab('lines', false);
    if (typeof openLineModal === 'function') {
      openLineModal(id);
    }
  }
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Open global search with Ctrl+K or Cmd+K
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const input = document.getElementById('global-search-input');
      if (input) {
        input.focus();
        input.select();
      }
    }

    // Escape closes modals
    if (e.key === 'Escape') {
      if (typeof closeVehicleModal === 'function') closeVehicleModal();
      if (typeof closeLineModal === 'function') closeLineModal();
      if (typeof closeAdminModal === 'function') closeAdminModal();
      if (typeof closeLightbox === 'function') closeLightbox();
    }
  });
}

/* --- MOVEMENTS MODULE --- */
async function loadMovements() {
  try {
    const saved = localStorage.getItem('histo14_movements_data');
    if (saved) {
      movementsData = JSON.parse(saved);
      renderMovements();
      return;
    }

    const res = await fetch('data/movements.json');
    movementsData = await res.json();
    localStorage.setItem('histo14_movements_data', JSON.stringify(movementsData));
    renderMovements();
  } catch (e) {
    console.error('Erreur chargement mouvements:', e);
  }
}

function renderMovements() {
  const container = document.getElementById('movements-container');
  if (!container) return;

  if (movementsData.length === 0) {
    container.innerHTML = `<div class="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">Aucun mouvement de parc enregistré pour le moment.</div>`;
    return;
  }

  container.innerHTML = movementsData.map(m => {
    let typeBadge = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
    let icon = 'plus-circle';
    if (m.type && m.type.includes('Réforme')) {
      typeBadge = 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
      icon = 'trash-2';
    } else if (m.type && (m.type.includes('Transfert') || m.type.includes('Mutation'))) {
      typeBadge = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
      icon = 'repeat';
    } else if (m.type && m.type.includes('Rénovation')) {
      typeBadge = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      icon = 'wrench';
    }

    return `
      <div class="transit-card bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200 font-black text-sm flex-shrink-0">
            N°${m.vehicleNumber}
          </div>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2.5 py-0.5 rounded-md text-xs font-bold ${typeBadge} flex items-center gap-1">
                <i data-lucide="${icon}" class="w-3 h-3"></i> ${m.type || 'Mouvement'}
              </span>
              <span class="text-xs font-semibold text-slate-400">${formatDate(m.date)}</span>
            </div>
            <h4 class="font-bold text-slate-900 dark:text-white text-base">${m.model}</h4>
            <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">${m.details}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-900/60 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 self-stretch sm:self-auto justify-between sm:justify-start">
          <span>${m.origin || 'Origine'}</span>
          <i data-lucide="arrow-right" class="w-4 h-4 text-emerald-500"></i>
          <span class="text-slate-900 dark:text-white">${m.destination || 'Destination'}</span>
        </div>
      </div>
    `;
  }).join('');
  lucide.createIcons();
}

/* --- NEWS & LE MAG MODULE --- */
async function loadNews() {
  try {
    const saved = localStorage.getItem('histo14_news_data');
    if (saved) {
      newsData = JSON.parse(saved);
      renderNews();
      return;
    }

    const res = await fetch('data/news.json');
    newsData = await res.json();
    localStorage.setItem('histo14_news_data', JSON.stringify(newsData));
    renderNews();
  } catch (e) {
    console.error('Erreur chargement actualités:', e);
  }
}

function renderNews() {
  const container = document.getElementById('news-container');
  if (!container) return;

  if (newsData.length === 0) {
    container.innerHTML = `<div class="col-span-full p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">Aucun article dans Le MAG pour le moment.</div>`;
    return;
  }

  container.innerHTML = newsData.map(article => `
    <article class="transit-card bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col group">
      <div class="relative h-56 w-full overflow-hidden bg-slate-900">
        <img src="${article.image || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1000&q=80'}" alt="${article.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
        <span class="absolute top-4 left-4 px-3 py-1 bg-emerald-600/90 backdrop-blur-md text-white font-bold text-xs rounded-lg shadow">
          ${article.badge || 'Info'}
        </span>
        <span class="absolute bottom-4 left-4 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <i data-lucide="calendar" class="w-3.5 h-3.5"></i> ${formatDate(article.date)}
        </span>
      </div>
      <div class="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">${article.category || 'Actualité'}</span>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-snug group-hover:text-emerald-600 transition-colors">
            ${article.title}
          </h3>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
            ${article.summary}
          </p>
        </div>
        <div class="pt-4 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-500">
          <span class="flex items-center gap-1">
            <i data-lucide="user" class="w-3.5 h-3.5"></i> Par ${article.author || 'Équipe'}
          </span>
          <button onclick="readArticleFull('${article.id}')" class="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline">
            Lire l'article <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    </article>
  `).join('');
  lucide.createIcons();
}

function readArticleFull(id) {
  const article = newsData.find(a => a.id === id);
  if (!article) return;

  const modal = document.getElementById('vehicle-modal');
  const modalContent = document.getElementById('vehicle-modal-content');
  if (!modal || !modalContent) return;

  modalContent.innerHTML = `
    <div class="relative h-64 w-full overflow-hidden bg-slate-950 rounded-t-3xl">
      <img src="${article.image || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1000&q=80'}" alt="${article.title}" class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
      <button onclick="closeVehicleModal()" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 text-white hover:bg-black/80 flex items-center justify-center transition">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
      <div class="absolute bottom-6 left-6 right-6 text-white">
        <span class="px-3 py-1 bg-emerald-600 text-xs font-bold rounded-md uppercase tracking-wider">${article.category || 'Actualité'}</span>
        <h2 class="text-2xl sm:text-3xl font-extrabold mt-2 leading-tight">${article.title}</h2>
        <p class="text-xs text-slate-300 mt-1">Publié le ${formatDate(article.date)} par ${article.author || 'Équipe'}</p>
      </div>
    </div>
    <div class="p-6 sm:p-8 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-b-3xl space-y-4">
      <p class="text-base font-semibold leading-relaxed text-slate-900 dark:text-white">${article.summary}</p>
      <p class="text-sm leading-relaxed text-slate-600 dark:text-slate-300">${article.content || ''}</p>
      <div class="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <button onclick="closeVehicleModal()" class="px-5 py-2 bg-slate-100 dark:bg-slate-800 font-bold text-xs rounded-xl hover:bg-slate-200 transition">
          Fermer
        </button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  lucide.createIcons();
}

/* --- GALLERY MODULE --- */
function getDefaultGallery() {
  return [
    {
      id: "photo-1",
      title: "Alstom Citadis 302 • Rame 1001",
      author: "Alexs_14",
      location: "Terminus Hérouville Saint-Clair",
      url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=85",
      date: "2026-01-15"
    },
    {
      id: "photo-2",
      title: "Iveco Urbanway 12 GNV • N°5220",
      author: "Alexis",
      location: "En circulation sur la Liane 1 (Chemin Vert)",
      url: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=85",
      date: "2025-11-20"
    },
    {
      id: "photo-3",
      title: "Iveco Urbanway 18 GNV • N°7204",
      author: "Nolhanbj",
      location: "Gare SNCF de Caen",
      url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=85",
      date: "2025-09-08"
    },
    {
      id: "photo-4",
      title: "Mercedes Citaro C2 Hybrid • N°8258",
      author: "Alexis",
      location: "Ligne 11 Express à Carpiquet",
      url: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=85",
      date: "2025-06-12"
    },
    {
      id: "photo-5",
      title: "Heuliez GX 337 GNV • N°802 Astuce",
      author: "Alexs_14",
      location: "Rouen Théâtre des Arts",
      url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=85",
      date: "2025-05-18"
    },
    {
      id: "photo-6",
      title: "Mercedes Citaro G C2 • N°002 LiA",
      author: "Alexis",
      location: "Le Havre Hôtel de Ville",
      url: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=85",
      date: "2025-04-02"
    }
  ];
}

function loadGallery() {
  const saved = localStorage.getItem('histo14_gallery_data');
  if (saved) {
    try {
      galleryData = JSON.parse(saved);
    } catch (e) {
      console.warn("Erreur lecture galerie:", e);
      galleryData = getDefaultGallery();
    }
  } else {
    galleryData = getDefaultGallery();
    localStorage.setItem('histo14_gallery_data', JSON.stringify(galleryData));
  }
  renderGallery();
}

function renderGallery() {
  const container = document.getElementById('gallery-container');
  if (!container) return;

  if (galleryData.length === 0) {
    container.innerHTML = `<div class="col-span-full p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">Aucune photo dans la galerie.</div>`;
    return;
  }

  container.innerHTML = galleryData.map(photo => `
    <div class="group relative rounded-2xl overflow-hidden bg-slate-900 h-64 cursor-pointer shadow-md" onclick="openLightbox('${photo.url}', '${photo.title} — ${photo.location || ''} • Photo : ${photo.author || 'Inconnu'}')">
      <img src="${photo.url}" alt="${photo.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
        <span class="text-xs font-bold text-emerald-400 leading-snug drop-shadow">${photo.title}</span>
        <p class="text-[11px] opacity-80 mt-0.5">${photo.location ? photo.location + ' • ' : ''}Photo par ${photo.author}</p>
      </div>
    </div>
  `).join('');
  lucide.createIcons();
}

/* --- TEAM & USERS DYNAMIC SYNC MODULE --- */
async function loadTeam() {
  if (typeof getAdminAccounts === 'function') {
    teamData = await getAdminAccounts();
  } else {
    const saved = localStorage.getItem('histo14_admin_accounts_v2');
    if (saved) {
      try {
        teamData = JSON.parse(saved);
      } catch (e) {
        teamData = [];
      }
    }
  }
  renderTeam();
}

function renderTeam() {
  const container = document.getElementById('team-container');
  const countEl = document.getElementById('team-members-count');
  if (!container) return;

  if (!teamData || teamData.length === 0) {
    teamData = [
      { username: 'Nolhanbj', role: 'Super Administrateur & Développeur Web', bio: 'Conception intégrale du portail Histo14Bus, architecture technique et intégration.' },
      { username: 'Alexs_14', role: 'Gestionnaire Flotte & Infos Réseau', bio: 'Relevés d\'état de parc, actualités des livraisons et prises de vue terrain.' },
      { username: 'Alexis', role: 'Photographe Spotteur & Veille', bio: 'Photothèque haute définition et suivi des affectations de bus en Normandie.' }
    ];
  }

  if (countEl) {
    countEl.textContent = `${teamData.length} membre${teamData.length > 1 ? 's' : ''} actif${teamData.length > 1 ? 's' : ''}`;
  }

  const colors = [
    'from-emerald-600 to-teal-500',
    'from-blue-600 to-cyan-500',
    'from-sky-600 to-indigo-500',
    'from-amber-600 to-orange-500',
    'from-purple-600 to-pink-500'
  ];

  container.innerHTML = teamData.map((member, idx) => {
    const colorGradient = colors[idx % colors.length];
    const initial = member.displayName ? member.displayName.charAt(0).toUpperCase() : member.username.charAt(0).toUpperCase();
    const displayName = member.displayName || member.username;
    const bio = member.bio || `Membre de l'équipe d'administration et de gestion du site Histo14Bus.`;

    return `
      <div class="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/80 text-center space-y-2.5 transition hover:shadow-md">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr ${colorGradient} text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
          ${initial}
        </div>
        <div>
          <h4 class="font-bold text-slate-900 dark:text-white text-base">${displayName}</h4>
          <span class="inline-block px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold rounded-lg mt-1 border border-emerald-300/30">
            ${member.role || 'Membre Équipe'}
          </span>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">${bio}</p>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

/* --- LIGHTBOX PHOTO VIEWER --- */
function openLightbox(src, caption) {
  const lightbox = document.getElementById('lightbox-modal');
  const img = document.getElementById('lightbox-image');
  const cap = document.getElementById('lightbox-caption');
  if (!lightbox || !img) return;

  img.src = src;
  if (cap) cap.textContent = caption || '';
  lightbox.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox-modal');
  if (lightbox) lightbox.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

/* --- SHORTCUT HELPERS FOR ADMIN --- */
function openAdminModalPhoto() {
  if (typeof openAdminModal === 'function') {
    openAdminModal();
    if (typeof switchAdminTab === 'function') {
      switchAdminTab('photo');
    }
  }
}

function openAdminModalNews() {
  if (typeof openAdminModal === 'function') {
    openAdminModal();
    if (typeof switchAdminTab === 'function') {
      switchAdminTab('news');
    }
  }
}

/* --- TOAST NOTIFICATIONS --- */
function showToast(message) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'fixed bottom-6 right-6 z-50 px-5 py-3 bg-slate-900/95 text-white dark:bg-emerald-600 text-sm font-semibold rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2 transform translate-y-20 opacity-0 transition-all duration-300 border border-white/10';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-400"></i> ${message}`;
  lucide.createIcons();

  toast.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3500);
}

