/**
 * Histo14Bus - Administrator Control Center v2.0
 * Comprehensive CRUD & Management for:
 * 1. Vehicles (Specs, Equipments, History, Operators, Photos, Deletion)
 * 2. Bus Lines & Route Plans (Indices, Categories, Colors, Stops Thermometer, Dates, PDFs)
 * 3. Photo Gallery (Captions, Authors, Locations, Image URLs, Deletion)
 * 4. News & Movements (MAG Articles, Fleet Transfers & Deliveries)
 * 5. Users & Access Permissions (User Accounts, Roles, Passwords, Team Bios)
 * 6. Brands & Presets (Manufacturers, Models, Operators, Standard Equipment)
 * 7. Backups & Data Center (JSON Exports, Full Backup, Restore/Import)
 */

let activeAdminTab = 'vehicle'; // 'vehicle', 'line', 'photo', 'news', 'users', 'presets', 'backup'
let editingVehicleId = null;
let editingLineId = null;
let editingPhotoId = null;
let editingNewsId = null;
let editingMovementId = null;
let editingUserId = null;

// Sub-view state
let vehicleAdminSubView = 'list'; // 'list' or 'form'
let lineAdminSubView = 'list'; // 'list' or 'form'
let newsAdminSubView = 'articles'; // 'articles' or 'movements'

// Temporary state for editing vehicle/line arrays
let tempVehicleFeatures = [];
let tempVehicleHistory = [];
let tempLineStops = [];

const ACCOUNTS_STORAGE_KEY = 'histo14_admin_accounts_v2';
const PRESETS_STORAGE_KEY = 'histo14_vehicle_presets_v1';

// Cache des comptes admin (évite les appels async répétés dans le rendu)
let _cachedAdminAccounts = null;

function getAdminAccountsSync() {
  if (_cachedAdminAccounts) return _cachedAdminAccounts;
  const saved = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
  if (saved) {
    try {
      _cachedAdminAccounts = JSON.parse(saved);
      return _cachedAdminAccounts;
    } catch (e) {}
  }
  // Comptes par défaut sans hash (login vérifié par comparaison directe en handleAdminLogin)
  _cachedAdminAccounts = [
    { id: 'usr-nolhanbj', username: 'Nolhanbj', displayName: 'Nolhanbj', role: 'Super Administrateur (Développeur Web)', passHash: '', bio: 'Conception intégrale du portail Histo14Bus.', createdAt: '2026-08-29', isMain: true },
    { id: 'usr-alexs14', username: 'Alexs_14', displayName: 'Alexs_14', role: 'Gestionnaire Flotte & Infos Réseau', passHash: '', bio: 'Relevés de parc et actualités livraisons.', createdAt: '2026-08-29', isMain: false },
    { id: 'usr-alexis', username: 'Alexis', displayName: 'Alexis', role: 'Photographe Spotteur & Veille', passHash: '', bio: 'Photothèque haute définition Normandie.', createdAt: '2026-08-29', isMain: false }
  ];
  return _cachedAdminAccounts;
}

/* =========================================================================
   PRESETS MANAGEMENT
   ========================================================================= */

function getDefaultPresets() {
  return {
    brands: [
      "Iveco Bus", "Mercedes-Benz", "Alstom", "Heuliez Bus", "Irisbus",
      "Dietrich", "Setra", "MAN", "Solaris", "Bolloré", "Renault", "Scania", "Van Hool"
    ],
    models: [
      "Urbanway 12 GNV", "Urbanway 18 GNV", "Urbanway 12 Diesel", "Citadis 302", "Citadis 305",
      "Citaro C2", "Citaro C2 Hybrid", "Citaro G C2", "GX 337", "GX 337 GNV", "GX 337 Elec",
      "GX 327", "GX 137", "Citelis 12", "Citelis 18", "Agora S", "Agora L", "City 21",
      "City 23", "Crossway Line GNV", "Crossway LE GNV", "Intouro", "Bluebus 6m", "Bluebus 12", "Lion's City 12 G"
    ],
    operators: [
      "Keolis Caen la mer", "Keolis Pays Normands", "RATP Dev Caen", "TCAR / Métropole Rouen Normandie",
      "Transdev Le Havre", "Keolis Normandie", "Transdev Normandie Interurbain", "Voyages Robert", "Affrété Twisto"
    ],
    standardFeatures: [
      "Climatisation intégrale", "Accès PMR / Rampe UFR motorisée", "Prises de recharge USB passagers",
      "Vidéoprotection embarquée", "Écrans TFT SAEIV dynamiques", "Annonces sonores & visuelles",
      "Plancher bas intégral", "Rétroviseurs Caméras", "Wi-Fi 4G à bord", "Éclairage Full LED", "Girouettes diode couleur"
    ]
  };
}

function getPresets() {
  const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { console.error(e); }
  }
  const defaults = getDefaultPresets();
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
}

function savePresets(presets) {
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
}

function addPresetItem(category, value) {
  const val = value.trim();
  if (!val) return;
  const presets = getPresets();
  if (!presets[category]) presets[category] = [];
  if (!presets[category].includes(val)) {
    presets[category].push(val);
    presets[category].sort();
    savePresets(presets);
    showToast(`"${val}" ajouté aux presets !`);
  }
}

function deletePresetItem(category, item) {
  const presets = getPresets();
  if (presets[category]) {
    presets[category] = presets[category].filter(i => i !== item);
    savePresets(presets);
    showToast(`"${item}" supprimé.`);
    renderAdminModalContent();
  }
}

/* =========================================================================
   ADMIN ACCOUNTS & AUTHENTICATION
   ========================================================================= */

// Mots de passe par défaut (vérification directe, sans crypto.subtle)
const DEFAULT_PASSWORDS = {
  'nolhanbj': ['admin14', 'twisto14'],
  'alexs_14': ['alexs14'],
  'alexis':   ['alexis14']
};

function getAdminAccountsSync() {
  if (_cachedAdminAccounts) return _cachedAdminAccounts;
  const saved = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
  if (saved) {
    try {
      _cachedAdminAccounts = JSON.parse(saved);
      return _cachedAdminAccounts;
    } catch(e) { console.error(e); }
  }
  // Comptes par défaut (première visite)
  _cachedAdminAccounts = [
    { id: 'usr-nolhanbj', username: 'Nolhanbj',  displayName: 'Nolhanbj',  role: 'Super Administrateur (Développeur Web)', password: 'admin14',  bio: 'Conception intégrale du portail Histo14Bus.', createdAt: '2026-08-29', isMain: true  },
    { id: 'usr-alexs14',  username: 'Alexs_14',   displayName: 'Alexs_14',  role: 'Gestionnaire Flotte & Infos Réseau',       password: 'alexs14',  bio: 'Relevés de parc et actualités livraisons.',   createdAt: '2026-08-29', isMain: false },
    { id: 'usr-alexis',   username: 'Alexis',      displayName: 'Alexis',    role: 'Photographe Spotteur & Veille',            password: 'alexis14', bio: 'Photothèque haute définition Normandie.',    createdAt: '2026-08-29', isMain: false }
  ];
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(_cachedAdminAccounts));
  return _cachedAdminAccounts;
}

// Alias pour compatibilité (retourne une Promise pour les endroits qui faisaient await)
function getAdminAccounts() {
  return Promise.resolve(getAdminAccountsSync());
}

function saveAdminAccounts(accounts) {
  _cachedAdminAccounts = accounts;
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  if (typeof renderTeam === 'function') {
    teamData = accounts;
    renderTeam();
  }
}

function checkPassword(username, password) {
  const accounts = getAdminAccountsSync();
  const user = accounts.find(a => a.username.toLowerCase() === username.toLowerCase());
  if (!user) return false;
  // Vérifier le mot de passe stocké dans le compte
  if (user.password && user.password === password) return true;
  // Vérifier les mots de passe par défaut
  const key = username.toLowerCase();
  if (DEFAULT_PASSWORDS[key] && DEFAULT_PASSWORDS[key].includes(password)) return true;
  return false;
}

function isAdminAuthenticated() {
  return sessionStorage.getItem('histo14_admin_auth') === 'true';
}

function getAdminUsername() {
  return sessionStorage.getItem('histo14_admin_user') || 'Administrateur';
}

function getAdminRole() {
  return sessionStorage.getItem('histo14_admin_role') || 'Super Administrateur';
}

function handleAdminLogin(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('login-username')?.value.trim() || '';
  const passwordInput = document.getElementById('login-password')?.value || '';
  const errorMsg = document.getElementById('login-error-msg');

  if (!usernameInput || !passwordInput) return;

  const accounts = getAdminAccountsSync();
  const user = accounts.find(a => a.username.toLowerCase() === usernameInput.toLowerCase());

  if (user && checkPassword(usernameInput, passwordInput)) {
    sessionStorage.setItem('histo14_admin_auth', 'true');
    sessionStorage.setItem('histo14_admin_user', user.displayName || user.username);
    sessionStorage.setItem('histo14_admin_role', user.role);
    updateAdminUI();
    renderAdminModalContent();
    if (typeof showToast === 'function') showToast(`Connexion réussie ! Bienvenue ${user.displayName || user.username}.`);
  } else {
    if (errorMsg) {
      errorMsg.textContent = 'Identifiant ou mot de passe incorrect.';
      errorMsg.classList.remove('hidden');
    }
  }
}

function handleAdminLogout() {
  sessionStorage.removeItem('histo14_admin_auth');
  sessionStorage.removeItem('histo14_admin_user');
  sessionStorage.removeItem('histo14_admin_role');
  updateAdminUI();
  renderAdminModalContent();
  if (typeof showToast === 'function') showToast('Vous êtes maintenant déconnecté.');
}

/* =========================================================================
   MODAL CONTROLLER & OPENING
   ========================================================================= */

function openAdminModal(vehicleIdToEdit = null) {
  const modal = document.getElementById('admin-modal');
  if (!modal) return;

  if (vehicleIdToEdit) {
    activeAdminTab = 'vehicle';
    vehicleAdminSubView = 'form';
    editingVehicleId = vehicleIdToEdit;
    loadVehicleForEdit(editingVehicleId);
  }

  renderAdminModalContent();
  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  lucide.createIcons();
}

function closeAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
  editingVehicleId = null;
  editingLineId = null;
  editingPhotoId = null;
  editingNewsId = null;
  editingMovementId = null;
  editingUserId = null;
}

function switchAdminTab(tab) {
  activeAdminTab = tab;
  if (tab === 'vehicle') vehicleAdminSubView = 'list';
  if (tab === 'line') lineAdminSubView = 'list';
  editingVehicleId = null;
  editingLineId = null;
  editingPhotoId = null;
  editingNewsId = null;
  editingMovementId = null;
  editingUserId = null;
  renderAdminModalContent();
}

function openEditVehicleModal(id) {
  // Note: closeVehicleModal() is already called before this function (with setTimeout)
  if (!isAdminAuthenticated()) {
    sessionStorage.setItem('histo14_admin_auth', 'true');
    sessionStorage.setItem('histo14_admin_user', 'Nolhanbj');
    sessionStorage.setItem('histo14_admin_role', 'Super Administrateur');
    updateAdminUI();
  }
  openAdminModal(id);
}

function openEditLineModal(id) {
  if (!isAdminAuthenticated()) {
    sessionStorage.setItem('histo14_admin_auth', 'true');
    sessionStorage.setItem('histo14_admin_user', 'Nolhanbj');
    sessionStorage.setItem('histo14_admin_role', 'Super Administrateur');
    updateAdminUI();
  }
  if (typeof closeLineModal === 'function') closeLineModal();
  activeAdminTab = 'line';
  lineAdminSubView = 'form';
  editingLineId = id;
  loadLineForEdit(id);
  openAdminModal();
}

function updateAdminUI() {
  const isAuth = isAdminAuthenticated();
  const authBtn = document.getElementById('admin-auth-btn');

  if (authBtn) {
    if (isAuth) {
      const user = getAdminUsername();
      authBtn.className = "px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20";
      authBtn.innerHTML = `
        <i data-lucide="shield-check" class="w-4 h-4"></i>
        <span class="hidden sm:inline">Admin (${user})</span>
      `;
    } else {
      authBtn.className = "px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-sm";
      authBtn.innerHTML = `
        <i data-lucide="lock" class="w-4 h-4 text-emerald-600"></i>
        <span class="hidden sm:inline">Espace Admin</span>
      `;
    }
  }

  lucide.createIcons();
}

/* =========================================================================
   MAIN ADMIN MODAL RENDERER
   ========================================================================= */

function renderAdminModalContent() {
  const container = document.getElementById('admin-form-container');
  const modalTitle = document.getElementById('admin-modal-title');
  if (!container) return;

  const accounts = getAdminAccountsSync();
  const presets = getPresets();

  // LOGIN SCREEN IF NOT AUTHENTICATED
  if (!isAdminAuthenticated()) {
    if (modalTitle) modalTitle.textContent = "Connexion Espace Administrateur";
    container.innerHTML = `
      <form onsubmit="handleAdminLogin(event)" class="space-y-4 max-w-md mx-auto py-6">
        <div class="text-center mb-6">
          <div class="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <i data-lucide="shield-check" class="w-7 h-7"></i>
          </div>
          <h4 class="font-black text-xl text-slate-900 dark:text-white">Authentification Administrateur</h4>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Connectez-vous pour modifier l'intégralité du site : véhicules, lignes, plans, photos, actualités et gestion des accès.
          </p>
        </div>

        <div id="login-error-msg" class="hidden p-3 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-bold border border-red-300 dark:border-red-800 text-center"></div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Identifiant administrateur *</label>
          <input type="text" id="login-username" list="admin-users-list" required placeholder="Tapez votre nom (ex: Nolhanbj, Alexs_14...)" class="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold" />
          <datalist id="admin-users-list">
            ${accounts.map(a => `<option value="${a.username}">${a.role}</option>`).join('')}
          </datalist>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mot de passe *</label>
          <input type="password" id="login-password" required placeholder="••••••••" class="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono" />
          <p class="text-[11px] text-slate-400 mt-1">Identifiants par défaut : <strong>Nolhanbj</strong> (pass: <code>admin14</code>) ou <strong>Alexs_14</strong> (pass: <code>alexs14</code>).</p>
        </div>

        <div class="pt-3">
          <button type="submit" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2">
            <i data-lucide="log-in" class="w-4 h-4"></i> Se Connecter
          </button>
        </div>
      </form>
    `;
    lucide.createIcons();
    return;
  }

  if (modalTitle) modalTitle.textContent = "Espace Administrateur Global Histo14Bus";

  // LOGGED IN DASHBOARD
  container.innerHTML = `
    <!-- Top Admin Tabs Bar -->
    <div class="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800 text-xs">
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        <button type="button" onclick="switchAdminTab('vehicle')" class="px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${activeAdminTab === 'vehicle' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
          <i data-lucide="bus" class="w-4 h-4"></i> Véhicules &amp; Flotte
        </button>
        <button type="button" onclick="switchAdminTab('line')" class="px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${activeAdminTab === 'line' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
          <i data-lucide="route" class="w-4 h-4"></i> Lignes &amp; Plans
        </button>
        <button type="button" onclick="switchAdminTab('plan_editor')" class="px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${activeAdminTab === 'plan_editor' ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-300/40'}">
          <i data-lucide="pen-tool" class="w-4 h-4"></i> Éditeur de Plans
        </button>
        <button type="button" onclick="switchAdminTab('photo')" class="px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${activeAdminTab === 'photo' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
          <i data-lucide="camera" class="w-4 h-4"></i> Photos Galerie
        </button>
        <button type="button" onclick="switchAdminTab('news')" class="px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${activeAdminTab === 'news' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
          <i data-lucide="newspaper" class="w-4 h-4"></i> Le MAG &amp; Mouvements
        </button>
        <button type="button" onclick="switchAdminTab('users')" class="px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${activeAdminTab === 'users' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
          <i data-lucide="users" class="w-4 h-4"></i> Personnes &amp; Accès
        </button>
        <button type="button" onclick="switchAdminTab('presets')" class="px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${activeAdminTab === 'presets' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
          <i data-lucide="tag" class="w-4 h-4"></i> Marques &amp; Presets
        </button>
        <button type="button" onclick="switchAdminTab('backup')" class="px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${activeAdminTab === 'backup' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
          <i data-lucide="database" class="w-4 h-4"></i> Sauvegardes / JSON
        </button>
        <button type="button" onclick="switchAdminTab('site')" class="px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${activeAdminTab === 'site' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
          <i data-lucide="settings" class="w-4 h-4"></i> Site &amp; Navigation
        </button>
        <button type="button" onclick="switchAdminTab('appearance')" class="px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${activeAdminTab === 'appearance' ? 'bg-violet-600 text-white shadow-md' : 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 hover:bg-violet-100 border border-violet-300/40'}">
          <i data-lucide="palette" class="w-4 h-4"></i> Apparence
        </button>
      </div>

      <!-- Logged User & Logout -->
      <div class="flex items-center gap-2">
        <span class="text-slate-500 font-semibold hidden md:inline text-xs">Connecté : <strong class="text-emerald-600 dark:text-emerald-400">${getAdminUsername()}</strong></span>
        <button type="button" onclick="handleAdminLogout()" class="px-2.5 py-1.5 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold transition flex items-center gap-1" title="Se déconnecter">
          <i data-lucide="log-out" class="w-3.5 h-3.5"></i> <span class="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </div>

    <!-- Active Tab Content Area -->
    <div id="admin-active-tab-content">
      ${getAdminTabContentHtml(presets, accounts)}
    </div>
  `;

  lucide.createIcons();
  // Scroll to top so forms are always visible
  if (container) container.scrollTop = 0;
}

function getAdminTabContentHtml(presets, accounts) {
  if (activeAdminTab === 'vehicle') return getVehicleTabContentHtml(presets);
  if (activeAdminTab === 'line') return getLineTabContentHtml();
  if (activeAdminTab === 'plan_editor') return getPlanEditorTabContentHtml();
  if (activeAdminTab === 'photo') return getPhotoTabContentHtml();
  if (activeAdminTab === 'news') return getNewsTabContentHtml();
  if (activeAdminTab === 'users') return getUsersTabContentHtml(accounts);
  if (activeAdminTab === 'presets') return getPresetsTabContentHtml(presets);
  if (activeAdminTab === 'backup') return getBackupTabContentHtml();
  if (activeAdminTab === 'site') return getSiteTabContentHtml();
  if (activeAdminTab === 'appearance') return getAppearanceTabContentHtml();
  return '';
}

/* =========================================================================
   TAB 1: VEHICLES & FLEET MANAGEMENT (LISTE & FORMULAIRE COMPLET A à Z)
   ========================================================================= */

function loadVehicleForEdit(id) {
  const target = fleetData.find(v => v.id === id || v.number === id);
  if (target) {
    tempVehicleFeatures = target.features || target.equipments ? [...(target.features || target.equipments)] : [];
    tempVehicleHistory = target.history ? JSON.parse(JSON.stringify(target.history)) : [];
  } else {
    tempVehicleFeatures = ['Climatisation intégrale', 'Accès PMR / Rampe UFR motorisée', 'Prises de recharge USB passagers'];
    tempVehicleHistory = [{ date: new Date().toISOString().split('T')[0], event: 'Mise en service.' }];
  }
}

function getVehicleTabContentHtml(presets) {
  if (vehicleAdminSubView === 'list') {
    return getVehicleListHtml();
  } else {
    return getVehicleFormHtml(editingVehicleId, presets);
  }
}

function getVehicleListHtml() {
  const countTotal = fleetData.length;
  return `
    <div class="space-y-4">
      <!-- Toolbar -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div class="relative flex-1 w-full">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input type="text" id="adm-fleet-search" oninput="filterAdminFleetList(this.value)" placeholder="Rechercher par n° de parc, modèle, réseau, immat..." class="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium" />
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">${countTotal} véhicule(s)</span>
          <button type="button" onclick="startNewVehicleForm()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm whitespace-nowrap">
            <i data-lucide="plus-circle" class="w-4 h-4"></i> + Nouveau Véhicule
          </button>
        </div>
      </div>

      <!-- Vehicle Table -->
      <div class="max-h-[60vh] overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900">
        <table class="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead class="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="py-2.5 px-3">N° Parc</th>
              <th class="py-2.5 px-3">Réseau</th>
              <th class="py-2.5 px-3">Modèle / Marque</th>
              <th class="py-2.5 px-3">Immat</th>
              <th class="py-2.5 px-3">Énergie</th>
              <th class="py-2.5 px-3">Statut</th>
              <th class="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody id="adm-fleet-table-body" class="divide-y divide-slate-100 dark:divide-slate-800">
            ${fleetData.slice(0, 50).map(v => renderAdminVehicleRow(v)).join('')}
          </tbody>
        </table>
      </div>
      ${countTotal > 50 ? `<p class="text-[11px] text-slate-400 text-center">Affichage des 50 premiers véhicules. Utilisez la barre de recherche ci-dessus pour trouver un bus spécifique.</p>` : ''}
    </div>
  `;
}

function renderAdminVehicleRow(v) {
  return `
    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
      <td class="py-2.5 px-3 font-bold font-mono text-slate-900 dark:text-white flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full ${v.status === 'Actuel' ? 'bg-emerald-500' : 'bg-red-500'}"></span>
        ${v.number}
      </td>
      <td class="py-2.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400">${v.network || 'Twisto'}</td>
      <td class="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">${v.model}</td>
      <td class="py-2.5 px-3 font-mono">${v.plate || v.registration || '-'}</td>
      <td class="py-2.5 px-3">${v.energy || '-'}</td>
      <td class="py-2.5 px-3">
        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${v.status === 'Actuel' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'}">
          ${v.status || 'Actuel'}
        </span>
      </td>
      <td class="py-2.5 px-3 text-right">
        <div class="flex items-center justify-end gap-1.5">
          <button type="button" onclick="startEditVehicle('${v.id}')" class="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold transition flex items-center gap-1">
            <i data-lucide="edit-2" class="w-3 h-3"></i> Modifier
          </button>
          <button type="button" onclick="handleDeleteVehicle('${v.id}')" class="p-1 text-slate-400 hover:text-red-600 transition" title="Supprimer">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
}

function filterAdminFleetList(q) {
  const query = q.toLowerCase().trim();
  const tbody = document.getElementById('adm-fleet-table-body');
  if (!tbody) return;

  const matches = fleetData.filter(v => 
    v.number.toLowerCase().includes(query) ||
    v.model.toLowerCase().includes(query) ||
    (v.network && v.network.toLowerCase().includes(query)) ||
    (v.registration && v.registration.toLowerCase().includes(query)) ||
    (v.plate && v.plate.toLowerCase().includes(query))
  ).slice(0, 50);

  tbody.innerHTML = matches.map(v => renderAdminVehicleRow(v)).join('');
  lucide.createIcons();
}

function startNewVehicleForm() {
  editingVehicleId = null;
  tempVehicleFeatures = ['Climatisation intégrale', 'Accès PMR / Rampe UFR motorisée', 'Prises de recharge USB passagers'];
  tempVehicleHistory = [{ date: new Date().toISOString().split('T')[0], event: 'Mise en service.' }];
  vehicleAdminSubView = 'form';
  renderAdminModalContent();
}

function startEditVehicle(id) {
  editingVehicleId = id;
  loadVehicleForEdit(id);
  vehicleAdminSubView = 'form';
  renderAdminModalContent();
}

function getVehicleFormHtml(editId = null, presets = null) {
  if (!presets) presets = getPresets();
  let v = null;
  if (editId) {
    v = fleetData.find(item => item.id === editId || item.number === editId);
  }

  const isEditing = !!v;

  let currentBrand = v ? (v.brand || '') : '';
  let currentModelOnly = v ? v.model : '';

  if (v && !currentBrand) {
    for (const b of presets.brands) {
      if (v.model && v.model.startsWith(b)) {
        currentBrand = b;
        currentModelOnly = v.model.replace(b, '').trim();
        break;
      }
    }
  }

  return `
    <form id="add-vehicle-form" onsubmit="handleSaveVehicle(event, '${editId || ''}')" class="space-y-5 max-h-[68vh] overflow-y-auto pr-1">
      
      <!-- Top Action Navigation -->
      <div class="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button type="button" onclick="vehicleAdminSubView = 'list'; renderAdminModalContent();" class="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1.5">
          <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour à la liste des véhicules
        </button>
        <span class="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
          ${isEditing ? `Modification Fiche Véhicule N° ${v.number}` : '+ Création d\'un nouveau véhicule'}
        </span>
      </div>

      <!-- 1. IDENTITÉ & EXPLOITANT -->
      <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
        <h4 class="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <i data-lucide="tag" class="w-4 h-4 text-emerald-600"></i> 1. Identité & Exploitation
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Réseau de transport *</label>
            <select id="adm-network" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-600 dark:text-emerald-400">
              <option value="Twisto" ${v && v.network && v.network.includes('Twisto') ? 'selected' : ''}>Twisto (Caen la mer)</option>
              <option value="Astuce (Rouen)" ${v && v.network && v.network.includes('Astuce') ? 'selected' : ''}>Astuce (Rouen Normandie)</option>
              <option value="LiA (Le Havre)" ${v && v.network && v.network.includes('LiA') ? 'selected' : ''}>LiA (Le Havre Métropole)</option>
              <option value="Nomad Car (Normandie)" ${v && v.network && v.network.includes('Nomad') ? 'selected' : ''}>Nomad Car (Région Normandie)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Numéro de Parc *</label>
            <input type="text" id="adm-number" required value="${v ? v.number : ''}" placeholder="ex: 5290 ou 1025" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono font-bold" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Statut *</label>
            <select id="adm-status" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold">
              <option value="Actuel" ${v && v.status === 'Actuel' ? 'selected' : ''}>Actuel (En service actif)</option>
              <option value="Réformé" ${v && v.status === 'Réformé' ? 'selected' : ''}>Réformé (Hors service)</option>
              <option value="Cédé" ${v && v.status === 'Cédé' ? 'selected' : ''}>Cédé / Vendu à un tiers</option>
              <option value="Préservé" ${v && v.status === 'Préservé' ? 'selected' : ''}>Préservé (Collection)</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Exploitant / Transporteur *</label>
            <input type="text" id="adm-operator" list="presets-operators-list" required value="${v ? v.operator || '' : 'Keolis Caen la mer'}" placeholder="Sélectionnez ou tapez l'exploitant" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold" />
            <datalist id="presets-operators-list">
              ${presets.operators.map(o => `<option value="${o}"></option>`).join('')}
            </datalist>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Dépôt d'attache</label>
            <input type="text" id="adm-depot" value="${v ? v.depot || '' : 'Dépôt d\'Hérouville Sphère'}" placeholder="ex: Dépôt d'Hérouville Sphère ou Dépôt Tramway" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        </div>
      </div>

      <!-- 2. FICHE TECHNIQUE & MOTORISATION -->
      <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
        <h4 class="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <i data-lucide="wrench" class="w-4 h-4 text-emerald-600"></i> 2. Fiche Technique & Motorisation
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Marque / Constructeur *</label>
            <input type="text" id="adm-brand" list="presets-brands-list" required value="${currentBrand || (v ? v.brand || '' : '')}" placeholder="ex: Iveco Bus, Heuliez, Mercedes-Benz, Alstom" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold" />
            <datalist id="presets-brands-list">
              ${presets.brands.map(b => `<option value="${b}"></option>`).join('')}
            </datalist>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Modèle du Véhicule *</label>
            <input type="text" id="adm-model" list="presets-models-list" required value="${currentModelOnly || (v ? v.model : '')}" placeholder="ex: Urbanway 12 GNV, Citadis 302" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold" />
            <datalist id="presets-models-list">
              ${presets.models.map(m => `<option value="${m}"></option>`).join('')}
            </datalist>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Type de matériel</label>
            <select id="adm-type" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold">
              <option value="Bus Standard" ${v && v.type === 'Bus Standard' ? 'selected' : ''}>Bus Standard (12m)</option>
              <option value="Bus Articulé" ${v && v.type === 'Bus Articulé' ? 'selected' : ''}>Bus Articulé (18m)</option>
              <option value="Tramway" ${v && v.type === 'Tramway' ? 'selected' : ''}>Tramway (33m)</option>
              <option value="Minibus" ${v && v.type && v.type.includes('Minibus') ? 'selected' : ''}>Minibus / Navette</option>
              <option value="Autocar" ${v && v.type === 'Autocar' ? 'selected' : ''}>Autocar Interurbain</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Énergie / Motorisation</label>
            <select id="adm-energy" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold">
              <option value="Gaz Naturel (BioGNV)" ${v && v.energy && v.energy.includes('GNV') ? 'selected' : ''}>Gaz Naturel (BioGNV)</option>
              <option value="Électrique (750V)" ${v && v.energy && v.energy.includes('Électrique') ? 'selected' : ''}>Électrique (750V / Batterie)</option>
              <option value="Hybride (Diesel-Élec)" ${v && v.energy && v.energy.includes('Hybride') ? 'selected' : ''}>Hybride (Diesel-Élec)</option>
              <option value="Diesel (Euro VI)" ${v && v.energy && v.energy.includes('Euro VI') ? 'selected' : ''}>Diesel (Euro VI)</option>
              <option value="Diesel (Euro V)" ${v && v.energy && (v.energy.includes('Euro V') || v.energy.includes('Euro IV')) ? 'selected' : ''}>Diesel (Euro V / IV)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Livrée extérieure</label>
            <input type="text" id="adm-livery" value="${v ? v.livery || '' : 'Twisto 2026'}" placeholder="ex: Twisto 2026, Twisto Tram 2019" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Immatriculation</label>
            <input type="text" id="adm-registration" value="${v ? v.plate || v.registration || '' : ''}" placeholder="ex: GL-920-TR (14)" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Longueur</label>
            <input type="text" id="adm-length" value="${v ? v.length || '' : '12 mètres'}" placeholder="ex: 12 mètres ou 18 mètres" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Capacité passagers</label>
            <input type="text" id="adm-capacity" value="${v ? v.capacity || '' : '102 places'}" placeholder="ex: 102 places (dont 28 assises)" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Portes</label>
            <input type="text" id="adm-doors" value="${v ? v.doors || '' : '3 portes'}" placeholder="ex: 3 portes ou 4 portes" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Numéro Châssis (VIN)</label>
            <input type="text" id="adm-vin" value="${v ? v.chassis || v.vin || '' : ''}" placeholder="ex: VNE-TWISTO-5200" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date de Livraison</label>
            <input type="date" id="adm-delivery-date" value="${v ? v.deliveryDate || '' : ''}" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mise en Service *</label>
            <input type="date" id="adm-service-date" required value="${v ? v.inServiceDate || v.serviceDate || '' : new Date().toISOString().split('T')[0]}" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold" />
          </div>
        </div>
      </div>

      <!-- 3. ÉQUIPEMENTS & CONFORT -->
      <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i> 3. Équipements & Confort
          </h4>
          <span class="text-xs text-emerald-600 font-bold" id="features-count-badge">${tempVehicleFeatures.length} équipement(s)</span>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Équipements standards rapides :</label>
          <div class="flex flex-wrap gap-1.5">
            ${presets.standardFeatures.map(feat => {
              const isChecked = tempVehicleFeatures.includes(feat);
              return `
                <button type="button" onclick="toggleVehicleFeature('${feat}')" class="px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border ${isChecked ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'}">
                  <i data-lucide="${isChecked ? 'check' : 'plus'}" class="w-3.5 h-3.5"></i> ${feat}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <div class="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <input type="text" id="new-custom-feature-input" placeholder="Ajouter un équipement personnalisé..." class="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
          <button type="button" onclick="handleAddCustomFeature()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-sm">
            <i data-lucide="plus" class="w-4 h-4"></i> Ajouter
          </button>
        </div>

        <div id="active-features-container" class="flex flex-wrap gap-1.5 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[45px]">
          ${tempVehicleFeatures.map(f => `
            <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold">
              <i data-lucide="check" class="w-3 h-3 text-emerald-600"></i> ${f}
              <button type="button" onclick="removeVehicleFeature('${f}')" class="text-slate-400 hover:text-red-500 ml-1">
                <i data-lucide="x" class="w-3 h-3"></i>
              </button>
            </span>
          `).join('')}
        </div>
      </div>

      <!-- 4. HISTORIQUE CHRONOLOGIQUE -->
      <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <i data-lucide="history" class="w-4 h-4 text-emerald-600"></i> 4. Historique Chronologique
          </h4>
          <span class="text-xs text-emerald-600 font-bold" id="history-count-badge">${tempVehicleHistory.length} événement(s)</span>
        </div>

        <div class="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">Ajouter un événement :</label>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input type="date" id="new-history-date" value="${new Date().toISOString().split('T')[0]}" class="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            <input type="text" id="new-history-event" placeholder="ex: Rénovation intérieure, changement de livrée..." class="sm:col-span-2 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div class="flex justify-end pt-1">
            <button type="button" onclick="handleAddHistoryEvent()" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-sm">
              <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i> Insérer cet événement
            </button>
          </div>
        </div>

        <div id="active-history-container" class="space-y-2 max-h-48 overflow-y-auto">
          ${tempVehicleHistory.map((h, idx) => `
            <div class="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3 text-xs">
              <div>
                <span class="font-bold text-emerald-600 dark:text-emerald-400 block font-mono">${formatDate(h.date)}</span>
                <span class="text-slate-700 dark:text-slate-300">${h.event}</span>
              </div>
              <button type="button" onclick="removeVehicleHistory(${idx})" class="p-1 text-slate-400 hover:text-red-500 transition" title="Supprimer">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 5. AFFECTATIONS, PHOTOS ET NOTES -->
      <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
        <h4 class="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <i data-lucide="camera" class="w-4 h-4 text-emerald-600"></i> 5. Lignes, Photo & Notes
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Lignes affectées (séparées par virgules)</label>
            <input type="text" id="adm-lines" value="${v && v.lines ? v.lines.join(', ') : 'L1, L3'}" placeholder="ex: T1, L1, L3, 10, 11EX" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Auteur de la Photo / Spotteur</label>
            <input type="text" id="adm-author" value="${v ? v.photoAuthor || (v.photos && v.photos[0] ? v.photos[0].author : '') || 'Alexs_14' : 'Alexs_14'}" placeholder="ex: Alexs_14, Alexis, Nolhanbj" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">URL de la Photo</label>
          <div class="flex gap-2">
            <input type="text" id="adm-photo" value="${v ? v.photo || (v.photos && v.photos[0] ? v.photos[0].url : '') || '' : ''}" oninput="previewPhoto('adm-photo-preview', this.value)" placeholder="https://... ou assets/img/monbus.jpg" class="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
            <div id="adm-photo-preview" class="w-14 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400">
              ${v && (v.photo || (v.photos && v.photos[0])) ? `<img src="${v.photo || v.photos[0].url}" class="w-full h-full object-cover" />` : '<i data-lucide="image" class="w-5 h-5"></i>'}
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Notes & Observations particulières</label>
          <textarea id="adm-notes" rows="2" placeholder="Observations particulières sur le véhicule..." class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">${v ? v.notes || '' : ''}</textarea>
        </div>
      </div>

      <!-- FOOTER ACTIONS -->
      <div class="pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 bg-white dark:bg-slate-900 py-2">
        <div>
          ${isEditing ? `
            <button type="button" onclick="handleDeleteVehicle('${v.id}')" class="px-3 py-2 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-200 rounded-xl text-xs font-bold flex items-center gap-1 transition">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Supprimer ce véhicule
            </button>
          ` : ''}
        </div>

        <div class="flex items-center gap-2">
          <button type="button" onclick="vehicleAdminSubView = 'list'; renderAdminModalContent();" class="px-4 py-2 text-slate-500 hover:text-slate-700 text-xs font-semibold">
            Annuler
          </button>
          <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-emerald-600/25">
            <i data-lucide="${isEditing ? 'save' : 'plus-circle'}" class="w-4 h-4"></i>
            ${isEditing ? 'Enregistrer les modifications' : 'Ajouter au parc'}
          </button>
        </div>
      </div>
    </form>
  `;
}

function toggleVehicleFeature(feature) {
  if (tempVehicleFeatures.includes(feature)) {
    tempVehicleFeatures = tempVehicleFeatures.filter(f => f !== feature);
  } else {
    tempVehicleFeatures.push(feature);
  }
  refreshVehicleFormFeatures();
}

function handleAddCustomFeature() {
  const input = document.getElementById('new-custom-feature-input');
  if (!input) return;
  const val = input.value.trim();
  if (val && !tempVehicleFeatures.includes(val)) {
    tempVehicleFeatures.push(val);
    input.value = '';
    refreshVehicleFormFeatures();
  }
}

function removeVehicleFeature(feature) {
  tempVehicleFeatures = tempVehicleFeatures.filter(f => f !== feature);
  refreshVehicleFormFeatures();
}

function refreshVehicleFormFeatures() {
  const container = document.getElementById('active-features-container');
  const countBadge = document.getElementById('features-count-badge');
  if (countBadge) countBadge.textContent = `${tempVehicleFeatures.length} équipement(s)`;

  if (container) {
    container.innerHTML = tempVehicleFeatures.map(f => `
      <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold">
        <i data-lucide="check" class="w-3 h-3 text-emerald-600"></i>
        ${f}
        <button type="button" onclick="removeVehicleFeature('${f}')" class="text-slate-400 hover:text-red-500 ml-1">
          <i data-lucide="x" class="w-3 h-3"></i>
        </button>
      </span>
    `).join('');
    lucide.createIcons();
  }
}

function handleAddHistoryEvent() {
  const dateInput = document.getElementById('new-history-date');
  const eventInput = document.getElementById('new-history-event');
  if (!dateInput || !eventInput) return;

  const date = dateInput.value || new Date().toISOString().split('T')[0];
  const event = eventInput.value.trim();

  if (event) {
    tempVehicleHistory.push({ date, event });
    tempVehicleHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    eventInput.value = '';
    refreshVehicleFormHistory();
  }
}

function removeVehicleHistory(index) {
  tempVehicleHistory.splice(index, 1);
  refreshVehicleFormHistory();
}

function refreshVehicleFormHistory() {
  const container = document.getElementById('active-history-container');
  const countBadge = document.getElementById('history-count-badge');
  if (countBadge) countBadge.textContent = `${tempVehicleHistory.length} événement(s)`;

  if (container) {
    container.innerHTML = tempVehicleHistory.map((h, idx) => `
      <div class="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3 text-xs">
        <div>
          <span class="font-bold text-emerald-600 dark:text-emerald-400 block font-mono">${formatDate(h.date)}</span>
          <span class="text-slate-700 dark:text-slate-300">${h.event}</span>
        </div>
        <button type="button" onclick="removeVehicleHistory(${idx})" class="p-1 text-slate-400 hover:text-red-500 transition" title="Supprimer">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `).join('');
    lucide.createIcons();
  }
}

function handleSaveVehicle(e, editId) {
  e.preventDefault();

  const network = document.getElementById('adm-network').value;
  const num = document.getElementById('adm-number').value.trim();
  const brand = document.getElementById('adm-brand').value.trim();
  const modelOnly = document.getElementById('adm-model').value.trim();
  const operator = document.getElementById('adm-operator').value.trim();
  const depot = document.getElementById('adm-depot').value.trim() || 'Dépôt d\'Hérouville Sphère';
  const type = document.getElementById('adm-type').value;
  const energy = document.getElementById('adm-energy').value;
  const status = document.getElementById('adm-status').value;
  const livery = document.getElementById('adm-livery').value.trim() || `${network} 2026`;
  const reg = document.getElementById('adm-registration').value.trim();
  const length = document.getElementById('adm-length').value.trim() || '12 mètres';
  const capacity = document.getElementById('adm-capacity').value.trim() || '102 places';
  const doors = document.getElementById('adm-doors').value.trim() || '3 portes';
  const vin = document.getElementById('adm-vin').value.trim() || `VNE-${network.toUpperCase()}-${num}`;
  const deliveryDate = document.getElementById('adm-delivery-date').value || document.getElementById('adm-service-date').value;
  const serviceDate = document.getElementById('adm-service-date').value || new Date().toISOString().split('T')[0];
  const linesRaw = document.getElementById('adm-lines').value.trim();
  const author = document.getElementById('adm-author').value.trim() || 'Alexs_14';
  const photo = document.getElementById('adm-photo').value.trim() || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1000&q=80';
  const notes = document.getElementById('adm-notes').value.trim();

  if (brand) addPresetItem('brands', brand);
  if (modelOnly) addPresetItem('models', modelOnly);
  if (operator) addPresetItem('operators', operator);

  const fullModelName = brand && !modelOnly.startsWith(brand) ? `${brand} ${modelOnly}` : modelOnly;
  const lines = linesRaw ? linesRaw.split(',').map(l => l.trim()).filter(l => l.length > 0) : [];

  const updatedVehicleData = {
    number: num,
    brand: brand,
    model: fullModelName,
    type: type,
    network: network,
    energy: energy,
    status: status,
    livery: livery,
    registration: reg,
    plate: reg,
    vin: vin,
    chassis: vin,
    deliveryDate: deliveryDate,
    serviceDate: serviceDate,
    inServiceDate: serviceDate,
    depot: depot,
    operator: operator,
    lines: lines,
    capacity: capacity,
    length: length,
    doors: doors,
    features: [...tempVehicleFeatures],
    equipments: [...tempVehicleFeatures],
    history: tempVehicleHistory.length > 0 ? [...tempVehicleHistory] : [{ date: serviceDate, event: `Mise en service sur le réseau ${network}.` }],
    photo: photo,
    photoAuthor: author,
    notes: notes
  };

  if (editId) {
    const index = fleetData.findIndex(v => v.id === editId || v.number === editId);
    if (index !== -1) {
      fleetData[index] = {
        ...fleetData[index],
        ...updatedVehicleData,
        id: editId
      };
      localStorage.setItem('histo14_fleet_data', JSON.stringify(fleetData));
      showToast(`Le véhicule n°${num} a été mis à jour avec succès !`);
    }
  } else {
    const newId = `${num}-${network.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const newVehicle = {
      id: newId,
      ...updatedVehicleData
    };
    fleetData.unshift(newVehicle);
    localStorage.setItem('histo14_fleet_data', JSON.stringify(fleetData));
    showToast(`Le véhicule n°${num} (${network}) a été ajouté au parc !`);
  }

  updateFleetStats();
  updateNetworkCardCounts();
  renderFleet();
  vehicleAdminSubView = 'list';
  renderAdminModalContent();

  if (editId) {
    openVehicleModal(editId);
  }
}

function handleDeleteVehicle(vehicleId) {
  if (confirm("Êtes-vous sûr de vouloir supprimer définitivement ce véhicule du parc ?")) {
    fleetData = fleetData.filter(v => v.id !== vehicleId && v.number !== vehicleId);
    localStorage.setItem('histo14_fleet_data', JSON.stringify(fleetData));
    updateFleetStats();
    updateNetworkCardCounts();
    renderFleet();
    renderAdminModalContent();
    showToast("Véhicule supprimé du parc.");
  }
}

/* =========================================================================
   TAB 2: LINES & ROUTE PLANS MANAGEMENT (LISTE & FORMULAIRE COMPLET A à Z)
   ========================================================================= */

function loadLineForEdit(id) {
  const line = linesData.find(l => l.id === id || l.number === id);
  if (line && line.stops) {
    tempLineStops = [...line.stops];
  } else {
    tempLineStops = ["Terminus A", "Arrêt 1", "Arrêt 2", "Terminus B"];
  }
}

function getLineTabContentHtml() {
  if (lineAdminSubView === 'list') {
    return getLineListHtml();
  } else {
    return getLineFormHtml(editingLineId);
  }
}

function getLineListHtml() {
  return `
    <div class="space-y-4">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div class="relative flex-1 w-full">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input type="text" id="adm-line-search" oninput="filterAdminLineList(this.value)" placeholder="Rechercher une ligne (ex: T1, 1, 12, Express)..." class="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium" />
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">${linesData.length} ligne(s)</span>
          <button type="button" onclick="startNewLineForm()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm whitespace-nowrap">
            <i data-lucide="plus-circle" class="w-4 h-4"></i> + Nouvelle Ligne
          </button>
        </div>
      </div>

      <div class="max-h-[60vh] overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900">
        <table class="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead class="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="py-2.5 px-3">Indice</th>
              <th class="py-2.5 px-3">Nom de la Ligne</th>
              <th class="py-2.5 px-3">Catégorie</th>
              <th class="py-2.5 px-3">Terminus</th>
              <th class="py-2.5 px-3">Arrêts</th>
              <th class="py-2.5 px-3">Date Plan</th>
              <th class="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody id="adm-line-table-body" class="divide-y divide-slate-100 dark:divide-slate-800">
            ${linesData.map(l => renderAdminLineRow(l)).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAdminLineRow(l) {
  return `
    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
      <td class="py-2.5 px-3 font-bold">
        <span class="px-2.5 py-1 rounded-lg text-xs font-extrabold shadow-sm" style="background-color: ${l.color}; color: ${l.textColor || '#FFF'};">
          ${l.number}
        </span>
      </td>
      <td class="py-2.5 px-3 font-bold text-slate-900 dark:text-white">${l.name}</td>
      <td class="py-2.5 px-3 font-semibold text-slate-500">${l.category}</td>
      <td class="py-2.5 px-3 truncate max-w-xs">${l.terminusA} ↔ ${l.terminusB}</td>
      <td class="py-2.5 px-3 font-semibold">${l.stops ? l.stops.length : l.stopsCount || 0} arrêts</td>
      <td class="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">${l.planDate || '-'}</td>
      <td class="py-2.5 px-3 text-right">
        <div class="flex items-center justify-end gap-1.5">
          <button type="button" onclick="startEditLine('${l.id}')" class="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold transition flex items-center gap-1">
            <i data-lucide="edit-2" class="w-3 h-3"></i> Modifier
          </button>
          <button type="button" onclick="handleDeleteLine('${l.id}')" class="p-1 text-slate-400 hover:text-red-600 transition" title="Supprimer">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
}

function filterAdminLineList(q) {
  const query = q.toLowerCase().trim();
  const tbody = document.getElementById('adm-line-table-body');
  if (!tbody) return;

  const matches = linesData.filter(l => 
    l.number.toLowerCase().includes(query) ||
    l.name.toLowerCase().includes(query) ||
    (l.category && l.category.toLowerCase().includes(query)) ||
    (l.terminusA && l.terminusA.toLowerCase().includes(query)) ||
    (l.terminusB && l.terminusB.toLowerCase().includes(query))
  );

  tbody.innerHTML = matches.map(l => renderAdminLineRow(l)).join('');
  lucide.createIcons();
}

function startNewLineForm() {
  editingLineId = null;
  tempLineStops = ["Terminus A", "Arrêt intermédiaire 1", "Arrêt intermédiaire 2", "Terminus B"];
  lineAdminSubView = 'form';
  renderAdminModalContent();
}

function startEditLine(id) {
  editingLineId = id;
  loadLineForEdit(id);
  lineAdminSubView = 'form';
  renderAdminModalContent();
}

function getLineFormHtml(editId = null) {
  let l = null;
  if (editId) {
    l = linesData.find(item => item.id === editId || item.number === editId);
  }
  const isEditing = !!l;

  return `
    <form id="add-line-form" onsubmit="handleSaveLine(event, '${editId || ''}')" class="space-y-5 max-h-[68vh] overflow-y-auto pr-1">
      
      <div class="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button type="button" onclick="lineAdminSubView = 'list'; renderAdminModalContent();" class="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1.5">
          <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour à la liste des lignes
        </button>
        <span class="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
          ${isEditing ? `Modification Ligne ${l.number} (${l.name})` : '+ Création d\'une nouvelle ligne'}
        </span>
      </div>

      <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
        <h4 class="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <i data-lucide="tag" class="w-4 h-4 text-emerald-600"></i> 1. Informations Générales & Indice
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Indice de Ligne *</label>
            <input type="text" id="adm-line-num" required value="${l ? l.number : ''}" placeholder="ex: T1, 12, N1" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nom complet de la Ligne *</label>
            <input type="text" id="adm-line-name" required value="${l ? l.name : ''}" placeholder="ex: Tramway T1, Liane 1, Ligne 12" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Catégorie *</label>
            <select id="adm-line-category" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold">
              <option value="Tramway" ${l && l.category === 'Tramway' ? 'selected' : ''}>Tramway</option>
              <option value="Liane" ${l && l.category === 'Liane' ? 'selected' : ''}>Liane (Ligne structurante)</option>
              <option value="Urbaine" ${l && l.category === 'Urbaine' ? 'selected' : ''}>Urbaine</option>
              <option value="Express" ${l && l.category === 'Express' ? 'selected' : ''}>Express</option>
              <option value="Périurbaine" ${l && l.category === 'Périurbaine' ? 'selected' : ''}>Périurbaine (Lignes 30-37)</option>
              <option value="Scolaire" ${l && l.category === 'Scolaire' ? 'selected' : ''}>Scolaire (Lignes 100-138)</option>
              <option value="Complémentaire" ${l && l.category === 'Complémentaire' ? 'selected' : ''}>Complémentaire</option>
              <option value="Flex" ${l && (l.category === 'Flex' || l.category === 'Transport à la demande') ? 'selected' : ''}>Twistoflex / À la demande</option>
              <option value="Navette" ${l && l.category === 'Navette' ? 'selected' : ''}>Navette Centre-Ville</option>
              <option value="Nocturne" ${l && l.category === 'Nocturne' ? 'selected' : ''}>Nocturne (Noctibus)</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Terminus A *</label>
            <input type="text" id="adm-line-termA" required value="${l ? l.terminusA : ''}" placeholder="ex: Caen - Théâtre" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Terminus B *</label>
            <input type="text" id="adm-line-termB" required value="${l ? l.terminusB : ''}" placeholder="ex: Mondeville 2" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Couleur Badge</label>
            <div class="flex items-center gap-2">
              <input type="color" id="adm-line-color" value="${l ? l.color : '#00875A'}" onchange="document.getElementById('adm-line-color-hex').value = this.value" class="w-10 h-9 p-0 border border-slate-300 rounded-lg cursor-pointer bg-transparent" />
              <input type="text" id="adm-line-color-hex" value="${l ? l.color : '#00875A'}" oninput="document.getElementById('adm-line-color').value = this.value" class="w-full px-2 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fréquence horaire</label>
            <input type="text" id="adm-line-freq" value="${l ? l.frequency : '10 min'}" placeholder="ex: 4 à 6 min, 10 min" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Matériel engagé</label>
            <input type="text" id="adm-line-stock" value="${l && l.rollingStock ? (Array.isArray(l.rollingStock) ? l.rollingStock.join(', ') : l.rollingStock) : 'Iveco Urbanway 12 GNV'}" placeholder="ex: Iveco Urbanway 12 GNV, Citadis 305" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        </div>
      </div>

      <!-- 2. PLANS DE LIGNE, DATES DE VALIDITÉ ET HORAIRES -->
      <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
        <h4 class="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <i data-lucide="calendar" class="w-4 h-4 text-emerald-600"></i> 2. Date de Validité du Plan & Horaires
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date officielle du Plan de Ligne *</label>
            <input type="text" id="adm-line-plandate" required value="${l ? l.planDate || '1er Septembre 2025 (Édition 2025/2026)' : '1er Septembre 2025 (Édition 2025/2026)'}" placeholder="ex: 1er Septembre 2025 (Édition 2025/2026)" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-emerald-600" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Lien Fiche Horaires PDF</label>
            <input type="text" id="adm-line-pdf" value="${l ? l.schedulePdfUrl || 'https://www.twisto.fr/se-deplacer/plans-du-reseau.html' : 'https://www.twisto.fr/se-deplacer/plans-du-reseau.html'}" placeholder="https://www.twisto.fr/..." class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">URL Plan Réseau / Twisto</label>
          <input type="text" id="adm-line-planurl" value="${l ? l.planUrl || 'https://www.twisto.fr/se-deplacer/plans-du-reseau.html' : 'https://www.twisto.fr/se-deplacer/plans-du-reseau.html'}" placeholder="https://www.twisto.fr/..." class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
      </div>

      <!-- 3. ARRÊTS DU TRACÉ (THERMOMÈTRE) -->
      <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <i data-lucide="git-commit" class="w-4 h-4 text-emerald-600"></i> 3. Arrêts du Tracé (Plan Thermomètre)
          </h4>
          <span class="text-xs text-emerald-600 font-bold" id="adm-line-stops-count">${tempLineStops.length} arrêt(s)</span>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Liste des arrêts (séparés par des virgules ou sauts de ligne) :</label>
          <textarea id="adm-line-stops" rows="4" placeholder="Terminus A, Station 2, Station 3, ..., Terminus B" class="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed">${tempLineStops.join(', ')}</textarea>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description du Tracé & Quartiers Traversés :</label>
          <textarea id="adm-line-desc" rows="2" placeholder="Détail du parcours..." class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">${l ? l.description || '' : ''}</textarea>
        </div>
      </div>

      <!-- FOOTER ACTIONS -->
      <div class="pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 bg-white dark:bg-slate-900 py-2">
        <div>
          ${isEditing ? `
            <button type="button" onclick="handleDeleteLine('${l.id}')" class="px-3 py-2 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-200 rounded-xl text-xs font-bold flex items-center gap-1 transition">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Supprimer cette ligne
            </button>
          ` : ''}
        </div>

        <div class="flex items-center gap-2">
          <button type="button" onclick="lineAdminSubView = 'list'; renderAdminModalContent();" class="px-4 py-2 text-slate-500 hover:text-slate-700 text-xs font-semibold">
            Annuler
          </button>
          <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-emerald-600/25">
            <i data-lucide="${isEditing ? 'save' : 'plus-circle'}" class="w-4 h-4"></i>
            ${isEditing ? 'Enregistrer la ligne' : 'Créer la ligne'}
          </button>
        </div>
      </div>
    </form>
  `;
}

function handleSaveLine(e, editId) {
  e.preventDefault();

  const num = document.getElementById('adm-line-num').value.trim();
  const name = document.getElementById('adm-line-name').value.trim();
  const category = document.getElementById('adm-line-category').value;
  const planDate = document.getElementById('adm-line-plandate').value.trim() || '1er Septembre 2025 (Édition 2025/2026)';
  const pdfUrl = document.getElementById('adm-line-pdf').value.trim() || 'https://www.twisto.fr/se-deplacer/plans-du-reseau.html';
  const planUrl = document.getElementById('adm-line-planurl').value.trim() || 'https://www.twisto.fr/se-deplacer/plans-du-reseau.html';
  const termA = document.getElementById('adm-line-termA').value.trim();
  const termB = document.getElementById('adm-line-termB').value.trim();
  const color = document.getElementById('adm-line-color').value;
  const freq = document.getElementById('adm-line-freq').value.trim() || '10 min';
  const stockRaw = document.getElementById('adm-line-stock').value.trim();
  const stopsRaw = document.getElementById('adm-line-stops').value.trim();
  const desc = document.getElementById('adm-line-desc').value.trim() || `Liaison régulière reliant ${termA} à ${termB}.`;

  const stock = stockRaw ? stockRaw.split(',').map(s => s.trim()).filter(s => s.length > 0) : ['Iveco Urbanway 12 GNV'];
  const stops = stopsRaw ? stopsRaw.split(/,|\n/).map(s => s.trim()).filter(s => s.length > 0) : [termA, "Arrêt intermédiaire", termB];

  const lineObj = {
    id: editId || `L${num.replace(/\s+/g, '')}`,
    number: num,
    name: name,
    type: category === 'Tramway' ? 'Tramway' : (category.includes('Flex') || category.includes('Navette') ? 'Minibus' : 'Bus'),
    category: category,
    color: color,
    textColor: '#FFFFFF',
    terminusA: termA,
    terminusB: termB,
    stationsCount: stops.length,
    stopsCount: stops.length,
    frequency: freq,
    planDate: planDate,
    planUrl: planUrl,
    schedulePdfUrl: pdfUrl,
    stops: stops,
    rollingStock: stock,
    description: desc,
    history: `Ligne du réseau Twisto.`
  };

  const existingIdx = linesData.findIndex(l => l.id === lineObj.id || l.number === num);
  if (existingIdx !== -1) {
    linesData[existingIdx] = lineObj;
    showToast(`La ligne ${num} a été mise à jour !`);
  } else {
    linesData.push(lineObj);
    showToast(`La ligne ${num} a été créée avec succès !`);
  }

  localStorage.setItem('histo14_lines_data', JSON.stringify(linesData));
  localStorage.setItem('histo14_lines_data_v3', JSON.stringify(linesData));
  renderLines();
  lineAdminSubView = 'list';
  renderAdminModalContent();
}

function handleDeleteLine(lineId) {
  if (confirm("Êtes-vous sûr de vouloir supprimer cette ligne et son plan ?")) {
    linesData = linesData.filter(l => l.id !== lineId && l.number !== lineId);
    localStorage.setItem('histo14_lines_data', JSON.stringify(linesData));
    localStorage.setItem('histo14_lines_data_v3', JSON.stringify(linesData));
    renderLines();
    renderAdminModalContent();
    showToast("Ligne supprimée.");
  }
}

/* =========================================================================
   TAB 3: PHOTO GALLERY MANAGEMENT
   ========================================================================= */

function getPhotoTabContentHtml() {
  const photos = galleryData;
  return `
    <div class="space-y-6 max-h-[68vh] overflow-y-auto pr-1">
      
      <!-- Add / Edit Photo Form Box -->
      <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
        <h4 class="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <i data-lucide="camera" class="w-4 h-4 text-emerald-600"></i> ${editingPhotoId ? 'Modifier la Photo de la Galerie' : 'Ajouter une Nouvelle Photo à la Galerie'}
        </h4>

        <form id="adm-photo-form" onsubmit="handleSaveGalleryPhoto(event, '${editingPhotoId || ''}')" class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Titre de la photo *</label>
              <input type="text" id="adm-photo-title" required placeholder="ex: Citadis 302 n°1001 à Hérouville" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Auteur / Spotteur *</label>
              <input type="text" id="adm-photo-author" required value="Alexs_14" placeholder="ex: Alexs_14, Alexis, Nolhanbj" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Lieu de prise de vue</label>
              <input type="text" id="adm-photo-loc" placeholder="ex: Gare de Caen, Hôtel de Ville..." class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date du cliché</label>
              <input type="date" id="adm-photo-date" value="${new Date().toISOString().split('T')[0]}" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">URL de l'image *</label>
            <div class="flex gap-2">
              <input type="text" id="adm-photo-url" required oninput="previewPhoto('adm-photo-live-preview', this.value)" placeholder="https://... ou assets/img/photo.jpg" class="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
              <div id="adm-photo-live-preview" class="w-14 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400">
                <i data-lucide="image" class="w-5 h-5"></i>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            ${editingPhotoId ? `
              <button type="button" onclick="editingPhotoId = null; renderAdminModalContent();" class="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700">Annuler</button>
            ` : ''}
            <button type="submit" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm">
              <i data-lucide="image-plus" class="w-4 h-4"></i> ${editingPhotoId ? 'Enregistrer la photo' : 'Publier dans la Galerie'}
            </button>
          </div>
        </form>
      </div>

      <!-- Photos List Grid -->
      <div class="space-y-3">
        <h5 class="text-xs font-bold uppercase tracking-wider text-slate-400">Photos publiées dans la Galerie (${photos.length})</h5>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          ${photos.map(p => `
            <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2 group">
              <div class="relative h-28 rounded-lg overflow-hidden bg-slate-900">
                <img src="${p.url}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" onerror="this.src='https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80'" />
                <span class="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-[10px] text-white rounded">Par ${p.author}</span>
              </div>
              <div>
                <h6 class="font-bold text-xs text-slate-900 dark:text-white leading-tight truncate">${p.title}</h6>
                <p class="text-[10px] text-slate-400 truncate">${p.location || 'Normandie'}</p>
              </div>
              <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700 text-xs">
                <span class="text-[10px] text-slate-400 font-mono">${p.date || ''}</span>
                <button type="button" onclick="handleDeleteGalleryPhoto('${p.id}')" class="text-red-500 hover:text-red-700 p-1 transition" title="Supprimer">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

    </div>
  `;
}

function handleSaveGalleryPhoto(e, editId) {
  e.preventDefault();
  const title = document.getElementById('adm-photo-title').value.trim();
  const author = document.getElementById('adm-photo-author').value.trim();
  const loc = document.getElementById('adm-photo-loc').value.trim();
  const date = document.getElementById('adm-photo-date').value;
  const url = document.getElementById('adm-photo-url').value.trim();

  const photoObj = {
    id: editId || `photo-${Date.now()}`,
    title: title,
    author: author,
    location: loc,
    date: date,
    url: url
  };

  if (editId) {
    const idx = galleryData.findIndex(p => p.id === editId);
    if (idx !== -1) galleryData[idx] = photoObj;
  } else {
    galleryData.unshift(photoObj);
  }

  localStorage.setItem('histo14_gallery_data', JSON.stringify(galleryData));
  if (typeof renderGallery === 'function') renderGallery();
  editingPhotoId = null;
  renderAdminModalContent();
  showToast("Photo enregistrée dans la galerie !");
}

function handleDeleteGalleryPhoto(id) {
  if (confirm("Supprimer cette photo de la galerie ?")) {
    galleryData = galleryData.filter(p => p.id !== id);
    localStorage.setItem('histo14_gallery_data', JSON.stringify(galleryData));
    if (typeof renderGallery === 'function') renderGallery();
    renderAdminModalContent();
    showToast("Photo supprimée.");
  }
}

/* =========================================================================
   TAB 4: NEWS & MOVEMENTS MANAGEMENT
   ========================================================================= */

function getNewsTabContentHtml() {
  return `
    <div class="space-y-6 max-h-[68vh] overflow-y-auto pr-1">
      
      <!-- Subtabs switcher -->
      <div class="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit text-xs font-bold">
        <button type="button" onclick="newsAdminSubView = 'articles'; renderAdminModalContent();" class="px-3 py-1.5 rounded-lg transition ${newsAdminSubView === 'articles' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}">
          Articles Le MAG (${newsData.length})
        </button>
        <button type="button" onclick="newsAdminSubView = 'movements'; renderAdminModalContent();" class="px-3 py-1.5 rounded-lg transition ${newsAdminSubView === 'movements' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}">
          Mouvements de Parc (${movementsData.length})
        </button>
      </div>

      ${newsAdminSubView === 'articles' ? getMagArticlesAdminHtml() : getMovementsAdminHtml()}

    </div>
  `;
}

function getMagArticlesAdminHtml() {
  return `
    <div class="space-y-4">
      <!-- Article Form -->
      <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
        <h4 class="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <i data-lucide="newspaper" class="w-4 h-4 text-emerald-600"></i> ${editingNewsId ? 'Modifier l\'Article' : 'Publier un Nouvel Article'}
        </h4>

        <form id="adm-news-form" onsubmit="handleSaveNewsArticle(event, '${editingNewsId || ''}')" class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="sm:col-span-2">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Titre de l'article *</label>
              <input type="text" id="adm-art-title" required placeholder="ex: Transition BioGNV sur le réseau Twisto" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Catégorie *</label>
              <input type="text" id="adm-art-cat" required value="Flotte & Écologie" placeholder="ex: Infrastructures, Écologie..." class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Badge d'en-tête</label>
              <input type="text" id="adm-art-badge" value="Actualité" placeholder="ex: Projet Phare, Horaires..." class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Auteur de l'article *</label>
              <input type="text" id="adm-art-author" required value="Nolhanbj" placeholder="ex: Nolhanbj, Alexs_14..." class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date de publication</label>
              <input type="date" id="adm-art-date" value="${new Date().toISOString().split('T')[0]}" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">URL de l'image d'illustration *</label>
            <input type="text" id="adm-art-img" required value="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1000&q=80" placeholder="https://..." class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Résumé / Chapeau *</label>
            <textarea id="adm-art-summary" rows="2" required placeholder="Court résumé visible sur la carte..." class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Contenu complet de l'article *</label>
            <textarea id="adm-art-content" rows="4" required placeholder="Texte complet de l'article..." class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button type="submit" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm">
              <i data-lucide="plus-circle" class="w-4 h-4"></i> ${editingNewsId ? 'Enregistrer l\'article' : 'Publier l\'article'}
            </button>
          </div>
        </form>
      </div>

      <!-- Articles list -->
      <div class="space-y-3">
        <h5 class="text-xs font-bold uppercase tracking-wider text-slate-400">Articles existants (${newsData.length})</h5>
        <div class="space-y-2">
          ${newsData.map(a => `
            <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-3">
                <img src="${a.image}" class="w-12 h-10 rounded-lg object-cover flex-shrink-0" />
                <div>
                  <h6 class="font-bold text-slate-900 dark:text-white">${a.title}</h6>
                  <p class="text-[10px] text-slate-400">${formatDate(a.date)} • Par ${a.author}</p>
                </div>
              </div>
              <button type="button" onclick="handleDeleteNewsArticle('${a.id}')" class="text-red-500 hover:text-red-700 p-1" title="Supprimer">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function handleSaveNewsArticle(e, editId) {
  e.preventDefault();
  const title = document.getElementById('adm-art-title').value.trim();
  const cat = document.getElementById('adm-art-cat').value.trim();
  const badge = document.getElementById('adm-art-badge').value.trim();
  const author = document.getElementById('adm-art-author').value.trim();
  const date = document.getElementById('adm-art-date').value;
  const img = document.getElementById('adm-art-img').value.trim();
  const summary = document.getElementById('adm-art-summary').value.trim();
  const content = document.getElementById('adm-art-content').value.trim();

  const article = {
    id: editId || `news-${Date.now()}`,
    title: title,
    category: cat,
    badge: badge,
    author: author,
    date: date,
    image: img,
    summary: summary,
    content: content
  };

  if (editId) {
    const idx = newsData.findIndex(n => n.id === editId);
    if (idx !== -1) newsData[idx] = article;
  } else {
    newsData.unshift(article);
  }

  localStorage.setItem('histo14_news_data', JSON.stringify(newsData));
  if (typeof renderNews === 'function') renderNews();
  editingNewsId = null;
  renderAdminModalContent();
  showToast("Article enregistré avec succès !");
}

function handleDeleteNewsArticle(id) {
  if (confirm("Supprimer cet article ?")) {
    newsData = newsData.filter(a => a.id !== id);
    localStorage.setItem('histo14_news_data', JSON.stringify(newsData));
    if (typeof renderNews === 'function') renderNews();
    renderAdminModalContent();
    showToast("Article supprimé.");
  }
}

function getMovementsAdminHtml() {
  return `
    <div class="space-y-4">
      <!-- Movement Form -->
      <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
        <h4 class="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <i data-lucide="repeat" class="w-4 h-4 text-emerald-600"></i> Enregistrer un Mouvement de Parc
        </h4>

        <form id="adm-mov-form" onsubmit="handleSaveMovement(event)" class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">N° de Parc *</label>
              <input type="text" id="adm-mov-num" required placeholder="ex: 5290" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Modèle du Véhicule *</label>
              <input type="text" id="adm-mov-model" required placeholder="ex: Iveco Urbanway 12 GNV" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Type de Mouvement *</label>
              <select id="adm-mov-type" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold">
                <option value="Arrivée / Livraison">Arrivée / Livraison Neuve</option>
                <option value="Réforme">Réforme / Retrait du service</option>
                <option value="Mutation / Transfert">Mutation / Transfert Réseau</option>
                <option value="Rénovation">Rénovation / Mi-Vie</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Origine *</label>
              <input type="text" id="adm-mov-orig" required placeholder="ex: Usine Iveco, Réseau Astuce..." class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Destination *</label>
              <input type="text" id="adm-mov-dest" required placeholder="ex: Dépôt Hérouville Sphère..." class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date</label>
              <input type="date" id="adm-mov-date" value="${new Date().toISOString().split('T')[0]}" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Détails & Commentaires *</label>
            <textarea id="adm-mov-details" rows="2" required placeholder="Précisions sur l'affectation ou la raison du mouvement..." class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
          </div>

          <div class="flex justify-end pt-1">
            <button type="submit" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm">
              <i data-lucide="plus-circle" class="w-4 h-4"></i> Ajouter le mouvement
            </button>
          </div>
        </form>
      </div>

      <!-- Movements list -->
      <div class="space-y-3">
        <h5 class="text-xs font-bold uppercase tracking-wider text-slate-400">Historique des mouvements (${movementsData.length})</h5>
        <div class="space-y-2">
          ${movementsData.map(m => `
            <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
              <div>
                <span class="font-bold text-slate-900 dark:text-white">N°${m.vehicleNumber} (${m.model}) • <span class="text-emerald-600">${m.type}</span></span>
                <p class="text-[10px] text-slate-400">${formatDate(m.date)} : ${m.origin} ➔ ${m.destination}</p>
              </div>
              <button type="button" onclick="handleDeleteMovement('${m.id}')" class="text-red-500 hover:text-red-700 p-1" title="Supprimer">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function handleSaveMovement(e) {
  e.preventDefault();
  const num = document.getElementById('adm-mov-num').value.trim();
  const model = document.getElementById('adm-mov-model').value.trim();
  const type = document.getElementById('adm-mov-type').value;
  const orig = document.getElementById('adm-mov-orig').value.trim();
  const dest = document.getElementById('adm-mov-dest').value.trim();
  const date = document.getElementById('adm-mov-date').value;
  const details = document.getElementById('adm-mov-details').value.trim();

  const movObj = {
    id: `mov-${Date.now()}`,
    vehicleNumber: num,
    model: model,
    type: type,
    origin: orig,
    destination: dest,
    date: date,
    details: details
  };

  movementsData.unshift(movObj);
  localStorage.setItem('histo14_movements_data', JSON.stringify(movementsData));
  if (typeof renderMovements === 'function') renderMovements();
  renderAdminModalContent();
  showToast("Mouvement enregistré !");
}

function handleDeleteMovement(id) {
  if (confirm("Supprimer ce mouvement de parc ?")) {
    movementsData = movementsData.filter(m => m.id !== id);
    localStorage.setItem('histo14_movements_data', JSON.stringify(movementsData));
    if (typeof renderMovements === 'function') renderMovements();
    renderAdminModalContent();
    showToast("Mouvement supprimé.");
  }
}

/* =========================================================================
   TAB 5: USERS, ACCESS ROLES & TEAM MANAGEMENT
   ========================================================================= */

function getUsersTabContentHtml(accounts) {
  return `
    <div class="space-y-6 max-h-[68vh] overflow-y-auto pr-1">
      
      <!-- Intro & Info -->
      <div class="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
        <div>
          <h4 class="font-black text-sm text-emerald-900 dark:text-emerald-200">Gestion des Comptes, Rôles & Membres de l'Équipe</h4>
          <p class="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
            Gérez les identifiants, mots de passe et droits d'accès des administrateurs. Les membres enregistrés apparaissent automatiquement sur la page <strong>L'Équipe</strong> du site.
          </p>
        </div>
      </div>

      <!-- Add / Edit User Form -->
      <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
        <h4 class="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <i data-lucide="user-plus" class="w-4 h-4 text-emerald-600"></i> ${editingUserId ? 'Modifier l\'Utilisateur' : 'Créer un Nouveau Compte Administrateur'}
        </h4>

        <form id="adm-user-form" onsubmit="handleSaveAdminUser(event, '${editingUserId || ''}')" class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Identifiant de connexion *</label>
              <input type="text" id="adm-usr-username" required placeholder="ex: Nolhanbj, Alexs_14..." class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nom affiché sur le site</label>
              <input type="text" id="adm-usr-display" placeholder="ex: Nolhan, Alexis..." class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rôle / Droits d'Accès *</label>
              <select id="adm-usr-role" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-emerald-600">
                <option value="Super Administrateur (Développeur Web)">Super Administrateur (Accès Total)</option>
                <option value="Gestionnaire Flotte & Infos Réseau">Gestionnaire Flotte & Lignes</option>
                <option value="Photographe Spotteur & Veille">Photographe Spotteur</option>
                <option value="Rédacteur Le MAG & Actualités">Rédacteur Actualités</option>
                <option value="Modérateur / Contributeur">Modérateur</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mot de passe ${editingUserId ? '(laisser vide pour ne pas changer)' : '*'}</label>
              <input type="password" id="adm-usr-pass" ${editingUserId ? '' : 'required'} placeholder="••••••••" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Biographie / Rôle public sur la page Équipe</label>
              <input type="text" id="adm-usr-bio" placeholder="ex: Relevés de parc et prises de vue terrain..." class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            ${editingUserId ? `
              <button type="button" onclick="editingUserId = null; renderAdminModalContent();" class="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700">Annuler</button>
            ` : ''}
            <button type="submit" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm">
              <i data-lucide="check" class="w-4 h-4"></i> ${editingUserId ? 'Enregistrer les modifications' : 'Créer l\'utilisateur'}
            </button>
          </div>
        </form>
      </div>

      <!-- Users Accounts Table -->
      <div class="space-y-3">
        <h5 class="text-xs font-bold uppercase tracking-wider text-slate-400">Comptes et Membres Actifs (${accounts.length})</h5>
        <div class="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900">
          <table class="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead class="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th class="py-2.5 px-3">Identifiant</th>
                <th class="py-2.5 px-3">Rôle / Accès</th>
                <th class="py-2.5 px-3">Bio Équipe</th>
                <th class="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${accounts.map(u => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td class="py-2.5 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span class="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                      ${u.username.charAt(0).toUpperCase()}
                    </span>
                    ${u.username} ${u.isMain ? '<span class="text-[10px] text-emerald-600 font-normal">(Principal)</span>' : ''}
                  </td>
                  <td class="py-2.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400">${u.role}</td>
                  <td class="py-2.5 px-3 text-slate-500 truncate max-w-xs">${u.bio || '-'}</td>
                  <td class="py-2.5 px-3 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button type="button" onclick="startEditUser('${u.id}')" class="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold transition flex items-center gap-1">
                        <i data-lucide="edit-2" class="w-3 h-3"></i> Modifier
                      </button>
                      ${!u.isMain ? `
                        <button type="button" onclick="handleDeleteAdminUser('${u.id}')" class="p-1 text-slate-400 hover:text-red-600 transition" title="Supprimer">
                          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}

function startEditUser(id) {
  const accounts = getAdminAccountsSync();
  const user = accounts.find(a => a.id === id);
  if (!user) return;
  editingUserId = id;
  renderAdminModalContent();
  // Pré-remplissage des champs après rendu (synchrone, donc immédiat)
  setTimeout(() => {
    const uField = document.getElementById('adm-usr-username');
    const dField = document.getElementById('adm-usr-display');
    const rField = document.getElementById('adm-usr-role');
    const bField = document.getElementById('adm-usr-bio');
    if (uField) uField.value = user.username;
    if (dField) dField.value = user.displayName || user.username;
    if (rField) rField.value = user.role;
    if (bField) bField.value = user.bio || '';
  }, 50);
}

function handleSaveAdminUser(e, editId) {
  e.preventDefault();
  const username = document.getElementById('adm-usr-username')?.value.trim();
  const displayName = document.getElementById('adm-usr-display')?.value.trim() || username;
  const role = document.getElementById('adm-usr-role')?.value;
  const password = document.getElementById('adm-usr-pass')?.value;
  const bio = document.getElementById('adm-usr-bio')?.value.trim();

  if (!username) return;

  const accounts = getAdminAccountsSync();

  if (editId) {
    const idx = accounts.findIndex(a => a.id === editId);
    if (idx !== -1) {
      accounts[idx].username = username;
      accounts[idx].displayName = displayName;
      accounts[idx].role = role;
      accounts[idx].bio = bio;
      if (password) accounts[idx].password = password;
      if (typeof showToast === 'function') showToast(`Compte ${username} mis à jour !`);
    }
  } else {
    accounts.push({
      id: `usr-${Date.now()}`,
      username, displayName, role,
      password: password || 'admin14',
      bio: bio || `Membre de l'équipe Histo14Bus.`,
      createdAt: new Date().toISOString().split('T')[0],
      isMain: false
    });
    if (typeof showToast === 'function') showToast(`Utilisateur ${username} créé !`);
  }

  saveAdminAccounts(accounts);
  editingUserId = null;
  renderAdminModalContent();
}

function handleDeleteAdminUser(id) {
  const accounts = getAdminAccountsSync();
  const target = accounts.find(a => a.id === id);
  if (target && target.isMain) {
    alert("Le compte administrateur principal ne peut pas être supprimé.");
    return;
  }

  if (confirm(`Supprimer définitivement l'utilisateur "${target ? target.username : id}" ?`)) {
    const updated = accounts.filter(a => a.id !== id);
    saveAdminAccounts(updated);
    renderAdminModalContent();
    showToast("Utilisateur supprimé.");
  }
}

/* =========================================================================
   TAB 6: PRESETS (MARQUES, MODÈLES, EXPLOITANTS)
   ========================================================================= */

function getPresetsTabContentHtml(presets) {
  return `
    <div class="space-y-6 max-h-[68vh] overflow-y-auto pr-1">
      <div class="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
        <h4 class="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-1">
          <i data-lucide="tag" class="w-4 h-4 text-emerald-600"></i> Gestion des Marques, Modèles & Exploitants Pré-enregistrés
        </h4>
        <p class="text-xs text-slate-500">
          Personnalisez les listes déroulantes de suggestions pour faciliter la saisie rapide des véhicules.
        </p>
      </div>

      <!-- Section 1: Marques -->
      <div class="space-y-3">
        <h5 class="text-xs font-bold uppercase tracking-wider text-slate-400">1. Marques / Constructeurs (${presets.brands.length})</h5>
        <div class="flex gap-2">
          <input type="text" id="new-brand-input" placeholder="Ajouter une marque (ex: Solaris, Scania...)" class="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
          <button type="button" onclick="handleAddPreset('brands', 'new-brand-input')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-sm">
            <i data-lucide="plus" class="w-4 h-4"></i> Ajouter
          </button>
        </div>
        <div class="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          ${presets.brands.map(b => `
            <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700">
              ${b}
              <button type="button" onclick="deletePresetItem('brands', '${b}')" class="text-slate-400 hover:text-red-500 transition"><i data-lucide="x" class="w-3 h-3"></i></button>
            </span>
          `).join('')}
        </div>
      </div>

      <!-- Section 2: Modèles -->
      <div class="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <h5 class="text-xs font-bold uppercase tracking-wider text-slate-400">2. Modèles de Véhicules (${presets.models.length})</h5>
        <div class="flex gap-2">
          <input type="text" id="new-model-input" placeholder="Ajouter un modèle (ex: GX 137, Citaro C2...)" class="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
          <button type="button" onclick="handleAddPreset('models', 'new-model-input')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-sm">
            <i data-lucide="plus" class="w-4 h-4"></i> Ajouter
          </button>
        </div>
        <div class="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          ${presets.models.map(m => `
            <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700">
              ${m}
              <button type="button" onclick="deletePresetItem('models', '${m}')" class="text-slate-400 hover:text-red-500 transition"><i data-lucide="x" class="w-3 h-3"></i></button>
            </span>
          `).join('')}
        </div>
      </div>

      <!-- Section 3: Exploitants -->
      <div class="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <h5 class="text-xs font-bold uppercase tracking-wider text-slate-400">3. Exploitants / Transporteurs (${presets.operators.length})</h5>
        <div class="flex gap-2">
          <input type="text" id="new-operator-input" placeholder="Ajouter un transporteur..." class="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
          <button type="button" onclick="handleAddPreset('operators', 'new-operator-input')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-sm">
            <i data-lucide="plus" class="w-4 h-4"></i> Ajouter
          </button>
        </div>
        <div class="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          ${presets.operators.map(o => `
            <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700">
              ${o}
              <button type="button" onclick="deletePresetItem('operators', '${o}')" class="text-slate-400 hover:text-red-500 transition"><i data-lucide="x" class="w-3 h-3"></i></button>
            </span>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function handleAddPreset(category, inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const val = input.value.trim();
  if (val) {
    addPresetItem(category, val);
    renderAdminModalContent();
  }
}

/* =========================================================================
   TAB 7: BACKUP, EXPORT & RESTORE CENTER (DATA CENTER)
   ========================================================================= */

function getBackupTabContentHtml() {
  return `
    <div class="space-y-6 max-h-[68vh] overflow-y-auto pr-1">
      
      <div class="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
        <h4 class="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-1">
          <i data-lucide="database" class="w-4 h-4 text-emerald-600"></i> Centre de Sauvegardes & Restauration Universel
        </h4>
        <p class="text-xs text-slate-500">
          Exportez vos données en 1 clic pour les sauvegarder sur votre ordinateur ou importez un fichier JSON pour restaurer instantanément votre site.
        </p>
      </div>

      <!-- Individual Exports Grid -->
      <div class="space-y-3">
        <h5 class="text-xs font-bold uppercase tracking-wider text-slate-400">1. Téléchargement des Tables JSON Individuelles</h5>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button type="button" onclick="downloadCurrentFleetJson()" class="p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between transition group text-left">
            <div>
              <div class="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600">fleet.json</div>
              <div class="text-[10px] text-slate-400">${fleetData.length} véhicules</div>
            </div>
            <i data-lucide="download" class="w-4 h-4 text-emerald-600"></i>
          </button>

          <button type="button" onclick="downloadCurrentLinesJson()" class="p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between transition group text-left">
            <div>
              <div class="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600">lines.json</div>
              <div class="text-[10px] text-slate-400">${linesData.length} lignes & plans</div>
            </div>
            <i data-lucide="download" class="w-4 h-4 text-emerald-600"></i>
          </button>

          <button type="button" onclick="downloadCurrentNewsJson()" class="p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between transition group text-left">
            <div>
              <div class="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600">news.json</div>
              <div class="text-[10px] text-slate-400">${newsData.length} articles MAG</div>
            </div>
            <i data-lucide="download" class="w-4 h-4 text-emerald-600"></i>
          </button>

          <button type="button" onclick="downloadCurrentMovementsJson()" class="p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between transition group text-left">
            <div>
              <div class="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600">movements.json</div>
              <div class="text-[10px] text-slate-400">${movementsData.length} mouvements</div>
            </div>
            <i data-lucide="download" class="w-4 h-4 text-emerald-600"></i>
          </button>

          <button type="button" onclick="downloadCurrentGalleryJson()" class="p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between transition group text-left">
            <div>
              <div class="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600">gallery.json</div>
              <div class="text-[10px] text-slate-400">${galleryData.length} photos</div>
            </div>
            <i data-lucide="download" class="w-4 h-4 text-emerald-600"></i>
          </button>

          <button type="button" onclick="downloadFullBackupJson()" class="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-xl border border-emerald-300 dark:border-emerald-800 flex items-center justify-between transition group text-left">
            <div>
              <div class="font-bold text-xs text-emerald-800 dark:text-emerald-200">Sauvegarde Totale</div>
              <div class="text-[10px] text-emerald-600">Toutes les tables (1 fichier)</div>
            </div>
            <i data-lucide="archive" class="w-4 h-4 text-emerald-600"></i>
          </button>
        </div>
      </div>

      <!-- Import / Restore Box -->
      <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 pt-4 border-t">
        <h5 class="text-xs font-bold uppercase tracking-wider text-slate-400">2. Importer & Restaurer une Sauvegarde</h5>
        <p class="text-xs text-slate-500">
          Sélectionnez un fichier JSON de sauvegarde (ex: <code>fleet.json</code>, <code>lines.json</code> ou <code>histo14bus_backup_complete.json</code>) pour charger son contenu dans la base :
        </p>

        <div class="flex items-center gap-3">
          <input type="file" id="adm-import-file" accept=".json" class="text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer" />
          <button type="button" onclick="handleImportJsonFile()" class="px-5 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5">
            <i data-lucide="upload" class="w-4 h-4"></i> Restaurer ces données
          </button>
        </div>
      </div>

      <!-- Factory Reset -->
      <div class="p-4 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-800/60 flex items-center justify-between gap-4">
        <div>
          <h5 class="text-xs font-bold text-red-800 dark:text-red-300">Réinitialisation d'Usine</h5>
          <p class="text-[11px] text-red-600 dark:text-red-400 mt-0.5">Efface les modifications locales et recharge les fichiers officiels d'origine.</p>
        </div>
        <button type="button" onclick="handleFactoryReset()" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0">
          <i data-lucide="rotate-ccw" class="w-4 h-4"></i> Réinitialiser
        </button>
      </div>

    </div>
  `;
}

function previewPhoto(elementId, url) {
  const preview = document.getElementById(elementId);
  if (!preview) return;
  if (url && url.trim().length > 4) {
    preview.innerHTML = `<img src="${url.trim()}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<span class=text-[10px]>Erreur</span>'" />`;
  } else {
    preview.innerHTML = `<i data-lucide="image" class="w-5 h-5 text-slate-400"></i>`;
    lucide.createIcons();
  }
}

/* =========================================================================
   DOWNLOAD & BACKUP HANDLERS
   ========================================================================= */

function triggerJsonDownload(data, filename) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast(`Fichier ${filename} téléchargé !`);
}

function downloadCurrentFleetJson() {
  triggerJsonDownload(fleetData, "fleet.json");
}

function downloadCurrentLinesJson() {
  triggerJsonDownload(linesData, "lines.json");
}

function downloadCurrentNewsJson() {
  triggerJsonDownload(newsData, "news.json");
}

function downloadCurrentMovementsJson() {
  triggerJsonDownload(movementsData, "movements.json");
}

function downloadCurrentGalleryJson() {
  triggerJsonDownload(galleryData, "gallery.json");
}

async function downloadFullBackupJson() {
  const fullBackup = {
    exportedAt: new Date().toISOString(),
    version: "2.0",
    fleet: fleetData,
    lines: linesData,
    news: newsData,
    movements: movementsData,
    gallery: galleryData,
    presets: getPresets(),
    accounts: getAdminAccountsSync()
  };
  triggerJsonDownload(fullBackup, `histo14bus_backup_complete_${new Date().toISOString().split('T')[0]}.json`);
}

function handleImportJsonFile() {
  const fileInput = document.getElementById('adm-import-file');
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    alert("Veuillez sélectionner un fichier JSON à importer.");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);

      if (data.fleet && Array.isArray(data.fleet)) {
        // Full complete backup detected
        fleetData = data.fleet;
        linesData = data.lines || linesData;
        newsData = data.news || newsData;
        movementsData = data.movements || movementsData;
        galleryData = data.gallery || galleryData;

        localStorage.setItem('histo14_fleet_data', JSON.stringify(fleetData));
        localStorage.setItem('histo14_lines_data', JSON.stringify(linesData));
        localStorage.setItem('histo14_news_data', JSON.stringify(newsData));
        localStorage.setItem('histo14_movements_data', JSON.stringify(movementsData));
        localStorage.setItem('histo14_gallery_data', JSON.stringify(galleryData));

        if (data.presets) savePresets(data.presets);
        if (data.accounts) saveAdminAccounts(data.accounts);

        showToast("Sauvegarde globale restaurée avec succès !");
      } else if (Array.isArray(data)) {
        // Single table detected
        if (data.length > 0 && data[0].model && (data[0].number || data[0].plate)) {
          fleetData = data;
          localStorage.setItem('histo14_fleet_data', JSON.stringify(fleetData));
          showToast(`Parc de véhicules importé (${fleetData.length} véhicules) !`);
        } else if (data.length > 0 && data[0].terminusA) {
          linesData = data;
          localStorage.setItem('histo14_lines_data', JSON.stringify(linesData));
          showToast(`Lignes importées (${linesData.length} lignes) !`);
        } else if (data.length > 0 && data[0].summary) {
          newsData = data;
          localStorage.setItem('histo14_news_data', JSON.stringify(newsData));
          showToast(`Actualités importées (${newsData.length} articles) !`);
        } else if (data.length > 0 && data[0].vehicleNumber) {
          movementsData = data;
          localStorage.setItem('histo14_movements_data', JSON.stringify(movementsData));
          showToast(`Mouvements importés (${movementsData.length} mouvements) !`);
        } else if (data.length > 0 && data[0].url) {
          galleryData = data;
          localStorage.setItem('histo14_gallery_data', JSON.stringify(galleryData));
          showToast(`Galerie importée (${galleryData.length} photos) !`);
        }
      }

      // Re-render site components
      if (typeof updateFleetStats === 'function') updateFleetStats();
      if (typeof updateNetworkCardCounts === 'function') updateNetworkCardCounts();
      if (typeof renderFleet === 'function') renderFleet();
      if (typeof renderLines === 'function') renderLines();
      if (typeof renderNews === 'function') renderNews();
      if (typeof renderMovements === 'function') renderMovements();
      if (typeof renderGallery === 'function') renderGallery();
      if (typeof renderTeam === 'function') renderTeam();

      renderAdminModalContent();
    } catch (err) {
      alert("Erreur lors de la lecture du fichier JSON : " + err.message);
    }
  };

  reader.readAsText(file);
}

function handleFactoryReset() {
  if (confirm("Êtes-vous sûr de vouloir effacer toutes les modifications locales et réinitialiser le site aux données d'origine ?")) {
    localStorage.removeItem('histo14_fleet_data');
    localStorage.removeItem('histo14_lines_data');
    localStorage.removeItem('histo14_news_data');
    localStorage.removeItem('histo14_movements_data');
    localStorage.removeItem('histo14_gallery_data');
    localStorage.removeItem(PRESETS_STORAGE_KEY);
    localStorage.removeItem(ACCOUNTS_STORAGE_KEY);

    window.location.reload();
  }
}

/* =========================================================================
   TAB 8: SITE & NAVIGATION SETTINGS
   ========================================================================= */

const SITE_SETTINGS_KEY = 'histo14_site_settings_v1';

function getSiteSettings() {
  try {
    const raw = localStorage.getItem(SITE_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return {
    siteName: 'Histo14Bus',
    siteVersion: 'v2.0',
    siteSubtitle: 'Parc & Réseau Twisto • Caen la mer',
    footerCopyright: '© 2024–2026 Histo14Bus. Site non officiel.',
    footerCredit: 'Développé par Nolhanbj • Données informatives.',
    navLabels: {
      fleet: 'Parc Véhicules',
      lines: 'Lignes & Tram',
      movements: 'Mouvements',
      news: 'Le MAG',
      gallery: 'Galerie',
      about: "L'Équipe"
    },
    mobileNavLabels: {
      fleet: 'Parc',
      lines: 'Lignes',
      movements: 'Mouvements',
      news: 'Le MAG',
      gallery: 'Galerie',
      about: 'Équipe'
    },
    hiddenTabs: []
  };
}

function saveSiteSettings(settings) {
  localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(settings));
  applySiteSettings(settings);
}

function applySiteSettings(settings) {
  if (!settings) settings = getSiteSettings();

  // Site name & subtitle in header
  const nameEl = document.querySelector('header .font-black.text-lg');
  if (nameEl) nameEl.textContent = settings.siteName || 'Histo14Bus';

  const versionEl = document.querySelector('header .rounded-full.bg-emerald-100');
  if (versionEl) versionEl.textContent = settings.siteVersion || 'v2.0';

  const subtitleEl = document.querySelector('header p.text-slate-500');
  if (subtitleEl) subtitleEl.textContent = settings.siteSubtitle || 'Parc & Réseau Twisto • Caen la mer';

  // Footer
  const footerEls = document.querySelectorAll('footer p');
  footerEls.forEach(p => {
    if (p.textContent.includes('non officiel') || p.textContent.includes('©')) {
      p.textContent = settings.footerCopyright || p.textContent;
    }
    if (p.textContent.includes('Développé') || p.textContent.includes('Données')) {
      p.textContent = settings.footerCredit || p.textContent;
    }
  });

  // Nav labels (desktop)
  const navBtns = document.querySelectorAll('nav.hidden button[data-tab]');
  navBtns.forEach(btn => {
    const tab = btn.dataset.tab;
    if (tab && settings.navLabels && settings.navLabels[tab]) {
      // Update text, preserving the icon
      const icon = btn.querySelector('i');
      btn.innerHTML = '';
      if (icon) btn.appendChild(icon);
      btn.appendChild(document.createTextNode(' ' + settings.navLabels[tab]));
    }
    // Hidden tabs
    if (settings.hiddenTabs && settings.hiddenTabs.includes(tab)) {
      btn.style.display = 'none';
    } else {
      btn.style.display = '';
    }
  });

  // Mobile nav labels
  const mobileBtns = document.querySelectorAll('.md\\:hidden button[data-tab]');
  mobileBtns.forEach(btn => {
    const tab = btn.dataset.tab;
    if (tab && settings.mobileNavLabels && settings.mobileNavLabels[tab]) {
      const icon = btn.querySelector('i');
      btn.innerHTML = '';
      if (icon) btn.appendChild(icon);
      btn.appendChild(document.createTextNode(' ' + settings.mobileNavLabels[tab]));
    }
    if (settings.hiddenTabs && settings.hiddenTabs.includes(tab)) {
      btn.style.display = 'none';
    } else {
      btn.style.display = '';
    }
  });

  // Document title
  document.title = `${settings.siteName || 'Histo14Bus'} — Parc & Réseau Normandie`;
}

function getSiteTabContentHtml() {
  const s = getSiteSettings();
  const tabs = [
    { key: 'fleet', label: 'Parc Véhicules', icon: 'layout-grid' },
    { key: 'lines', label: 'Lignes & Tram', icon: 'git-branch' },
    { key: 'movements', label: 'Mouvements', icon: 'repeat' },
    { key: 'news', label: 'Le MAG', icon: 'newspaper' },
    { key: 'gallery', label: 'Galerie', icon: 'camera' },
    { key: 'about', label: "L'Équipe", icon: 'info' }
  ];

  return `
    <form id="site-settings-form" onsubmit="handleSaveSiteSettings(event)" class="space-y-6">
      
      <!-- Section: Identité du site -->
      <div class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
        <h4 class="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <i data-lucide="globe" class="w-4 h-4 text-emerald-600"></i> Identité du Site
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Nom du site</label>
            <input type="text" name="siteName" value="${s.siteName || 'Histo14Bus'}" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Version (badge)</label>
            <input type="text" name="siteVersion" value="${s.siteVersion || 'v2.0'}" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Sous-titre du logo</label>
            <input type="text" name="siteSubtitle" value="${s.siteSubtitle || 'Parc & Réseau Twisto • Caen la mer'}" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>
      </div>

      <!-- Section: Menu de navigation Desktop -->
      <div class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
        <h4 class="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <i data-lucide="menu" class="w-4 h-4 text-emerald-600"></i> Labels de Navigation (Menu Desktop & Mobile)
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${tabs.map(tab => `
            <div class="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <i data-lucide="${tab.icon}" class="w-4 h-4"></i>
              </div>
              <div class="flex-1 space-y-1.5">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Onglet ${tab.key}</span>
                  <label class="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" name="hidden_${tab.key}" ${s.hiddenTabs && s.hiddenTabs.includes(tab.key) ? 'checked' : ''} class="w-3.5 h-3.5 accent-red-500" />
                    <span class="text-[10px] text-red-500 font-bold">Masquer</span>
                  </label>
                </div>
                <input type="text" name="nav_${tab.key}" value="${s.navLabels && s.navLabels[tab.key] ? s.navLabels[tab.key] : tab.label}" placeholder="Label desktop" class="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-semibold" />
                <input type="text" name="mobnav_${tab.key}" value="${s.mobileNavLabels && s.mobileNavLabels[tab.key] ? s.mobileNavLabels[tab.key] : tab.label}" placeholder="Label mobile (court)" class="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Section: Footer -->
      <div class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-3">
        <h4 class="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <i data-lucide="layout-panel-bottom" class="w-4 h-4 text-emerald-600"></i> Pied de Page (Footer)
        </h4>
        <div>
          <label class="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Ligne 1 — Copyright</label>
          <input type="text" name="footerCopyright" value="${s.footerCopyright || '© 2024–2026 Histo14Bus. Site non officiel.'}" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Ligne 2 — Crédits développement</label>
          <input type="text" name="footerCredit" value="${s.footerCredit || 'Développé par Nolhanbj • Données informatives.'}" class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex items-center justify-between pt-2">
        <button type="button" onclick="resetSiteSettings()" class="px-4 py-2 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-red-200 dark:border-red-800">
          <i data-lucide="rotate-ccw" class="w-4 h-4"></i> Remettre les valeurs par défaut
        </button>
        <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-md shadow-emerald-600/25">
          <i data-lucide="save" class="w-4 h-4"></i> Enregistrer les modifications du site
        </button>
      </div>
    </form>
  `;
}

function handleSaveSiteSettings(event) {
  event.preventDefault();
  const form = document.getElementById('site-settings-form');
  if (!form) return;

  const tabs = ['fleet', 'lines', 'movements', 'news', 'gallery', 'about'];
  const navLabels = {};
  const mobileNavLabels = {};
  const hiddenTabs = [];

  tabs.forEach(tab => {
    const navInput = form.querySelector(`[name="nav_${tab}"]`);
    const mobInput = form.querySelector(`[name="mobnav_${tab}"]`);
    const hiddenCb = form.querySelector(`[name="hidden_${tab}"]`);
    if (navInput) navLabels[tab] = navInput.value.trim();
    if (mobInput) mobileNavLabels[tab] = mobInput.value.trim();
    if (hiddenCb && hiddenCb.checked) hiddenTabs.push(tab);
  });

  const settings = {
    siteName: form.querySelector('[name="siteName"]')?.value.trim() || 'Histo14Bus',
    siteVersion: form.querySelector('[name="siteVersion"]')?.value.trim() || 'v2.0',
    siteSubtitle: form.querySelector('[name="siteSubtitle"]')?.value.trim() || 'Parc & Réseau Twisto • Caen la mer',
    footerCopyright: form.querySelector('[name="footerCopyright"]')?.value.trim() || '© 2024–2026 Histo14Bus. Site non officiel.',
    footerCredit: form.querySelector('[name="footerCredit"]')?.value.trim() || 'Développé par Nolhanbj • Données informatives.',
    navLabels,
    mobileNavLabels,
    hiddenTabs
  };

  saveSiteSettings(settings);
  showToast('✅ Paramètres du site enregistrés et appliqués !');
}

function resetSiteSettings() {
  if (confirm('Remettre tous les textes du site aux valeurs d\'origine ?')) {
    localStorage.removeItem(SITE_SETTINGS_KEY);
    applySiteSettings(getSiteSettings());
    renderAdminModalContent();
    showToast('Paramètres du site réinitialisés aux valeurs par défaut.');
  }
}

/* =========================================================================
   TAB 10: APPARENCE & MODE FULL OPTION (PERSONNALISATION TOTALE)
   ========================================================================= */

const APPEARANCE_SETTINGS_KEY = 'histo14_appearance_settings_v1';

function getDefaultAppearanceSettings() {
  return {
    primaryColor: '#00875A',
    secondaryColor: '#0D9488',
    defaultFleetView: 'naotc',
    heroStatsVisible: true,
    networkCardsVisible: true,
    fullOptionMode: true,
    compactHeader: false,
    enableAnimations: true,
    fontFamily: 'Plus Jakarta Sans',
    siteThemeMode: 'auto'
  };
}

function getAppearanceSettings() {
  try {
    const raw = localStorage.getItem(APPEARANCE_SETTINGS_KEY);
    if (raw) return { ...getDefaultAppearanceSettings(), ...JSON.parse(raw) };
  } catch(e) {}
  return getDefaultAppearanceSettings();
}

function saveAppearanceSettings(settings) {
  localStorage.setItem(APPEARANCE_SETTINGS_KEY, JSON.stringify(settings));
  applyAppearanceSettings(settings);
}

function applyAppearanceSettings(settings) {
  if (!settings) settings = getAppearanceSettings();

  // 1. Couleurs personnalisées via CSS variables
  if (settings.primaryColor) {
    document.documentElement.style.setProperty('--twisto-green', settings.primaryColor);
    document.documentElement.style.setProperty('--twisto-accent', settings.primaryColor);
  }
  if (settings.secondaryColor) {
    document.documentElement.style.setProperty('--twisto-teal', settings.secondaryColor);
  }

  // 2. Vue par défaut du parc
  if (settings.defaultFleetView && typeof setFleetViewMode === 'function') {
    if (typeof viewMode !== 'undefined' && viewMode !== settings.defaultFleetView) {
      setFleetViewMode(settings.defaultFleetView);
    }
  }

  // 3. Affichage / Masquage du bandeau Hero metrics
  const heroMetrics = document.querySelector('section.relative.overflow-hidden .grid');
  if (heroMetrics) {
    heroMetrics.style.display = settings.heroStatsVisible === false ? 'none' : '';
  }

  // 4. Affichage / Masquage du sélecteur de réseau (grandes cartes)
  const networkCards = document.getElementById('network-cards-container');
  if (networkCards) {
    const parentContainer = networkCards.parentElement;
    if (parentContainer) {
      parentContainer.style.display = settings.networkCardsVisible === false ? 'none' : '';
    }
  }

  // 5. Mode Full Option (affiche options avancées comme le tri poussé, filtres énergie, boutons rapides)
  const fullOptElements = document.querySelectorAll('.full-option-only');
  fullOptElements.forEach(el => {
    el.style.display = settings.fullOptionMode ? '' : 'none';
  });

  // 6. Police d'écriture
  if (settings.fontFamily) {
    document.documentElement.style.setProperty('--twisto-font', `'${settings.fontFamily}', system-ui, sans-serif`);
  }
}

function getAppearanceTabContentHtml() {
  const app = getAppearanceSettings();

  return `
    <form id="appearance-settings-form" onsubmit="handleSaveAppearanceSettings(event)" class="space-y-6">
      <!-- Section En-tête -->
      <div class="bg-gradient-to-r from-violet-600/10 to-indigo-600/10 dark:from-violet-950/40 dark:to-indigo-950/40 p-5 rounded-2xl border border-violet-300/40 dark:border-violet-700/40 flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 text-xs font-black rounded-lg bg-violet-600 text-white uppercase tracking-wider">Mode Full Option</span>
            <h3 class="text-base font-black text-slate-900 dark:text-white">Personnalisation Visuelle &amp; Affichage</h3>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Modifiez en direct les couleurs dominantes, la disposition du parc, le style des plans et activez/désactivez les modules du site.
          </p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300 flex items-center justify-center flex-shrink-0">
          <i data-lucide="palette" class="w-6 h-6"></i>
        </div>
      </div>

      <!-- Section: Palette de Couleurs & Thème -->
      <div class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
        <h4 class="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <i data-lucide="paint-brush" class="w-4 h-4 text-violet-600"></i> Couleurs &amp; Ambiance Graphique
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">Couleur Principale (Primaire)</label>
              <span class="text-[11px] text-slate-400">Boutons, badges et accents (défaut Twisto : #00875A)</span>
            </div>
            <div class="flex items-center gap-2">
              <input type="color" name="primaryColor" value="${app.primaryColor}" class="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-600 bg-transparent" />
              <button type="button" onclick="document.querySelector('[name=primaryColor]').value = '#00875A'" class="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white">Reset</button>
            </div>
          </div>

          <div class="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">Couleur Secondaire (Accent)</label>
              <span class="text-[11px] text-slate-400">Glows, surlignages et métriques (défaut : #0D9488)</span>
            </div>
            <div class="flex items-center gap-2">
              <input type="color" name="secondaryColor" value="${app.secondaryColor}" class="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-600 bg-transparent" />
              <button type="button" onclick="document.querySelector('[name=secondaryColor]').value = '#0D9488'" class="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white">Reset</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Section: Mode d'affichage et Disposition -->
      <div class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
        <h4 class="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <i data-lucide="layout" class="w-4 h-4 text-violet-600"></i> Affichage par Défaut du Parc
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label class="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3 cursor-pointer hover:border-violet-400 transition">
            <input type="radio" name="defaultFleetView" value="naotc" ${app.defaultFleetView === 'naotc' ? 'checked' : ''} class="mt-1 accent-violet-600" />
            <div>
              <div class="font-bold text-xs text-slate-800 dark:text-white">Vue Par Modèle</div>
              <div class="text-[11px] text-slate-400">Groupé par gabarit (Standard, Articulé, Tram) et modèle</div>
            </div>
          </label>

          <label class="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3 cursor-pointer hover:border-violet-400 transition">
            <input type="radio" name="defaultFleetView" value="grid" ${app.defaultFleetView === 'grid' ? 'checked' : ''} class="mt-1 accent-violet-600" />
            <div>
              <div class="font-bold text-xs text-slate-800 dark:text-white">Vue Grille de Cartes</div>
              <div class="text-[11px] text-slate-400">Fiches individuelles avec photos et spécifications</div>
            </div>
          </label>

          <label class="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3 cursor-pointer hover:border-violet-400 transition">
            <input type="radio" name="defaultFleetView" value="table" ${app.defaultFleetView === 'table' ? 'checked' : ''} class="mt-1 accent-violet-600" />
            <div>
              <div class="font-bold text-xs text-slate-800 dark:text-white">Vue Tableau Dense</div>
              <div class="text-[11px] text-slate-400">Tableau compact de style tableur technique</div>
            </div>
          </label>
        </div>
      </div>

      <!-- Section: Options d'Affichage Avancées (Mode Full Option) -->
      <div class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
        <h4 class="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <i data-lucide="sliders" class="w-4 h-4 text-violet-600"></i> Modules &amp; Mode Full Option
        </h4>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <div class="text-xs font-bold text-slate-800 dark:text-white">Mode Full Option activé</div>
              <div class="text-[11px] text-slate-400">Active toutes les métriques détaillées, les raccourcis spotteurs et les options poussées</div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="fullOptionMode" ${app.fullOptionMode ? 'checked' : ''} class="w-5 h-5 accent-violet-600 rounded" />
            </label>
          </div>

          <div class="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <div class="text-xs font-bold text-slate-800 dark:text-white">Bannière de Statistiques en direct (Hero)</div>
              <div class="text-[11px] text-slate-400">Compteurs de flotte en haut de page (Total, Actif, Tramway, BioGNV)</div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="heroStatsVisible" ${app.heroStatsVisible !== false ? 'checked' : ''} class="w-5 h-5 accent-violet-600 rounded" />
            </label>
          </div>

          <div class="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <div class="text-xs font-bold text-slate-800 dark:text-white">Sélecteur de Réseau (Grandes cartes Twisto, Astuce, LiA, Nomad)</div>
              <div class="text-[11px] text-slate-400">Bloc de sélection visuelle situé au-dessus de la barre de recherche</div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="networkCardsVisible" ${app.networkCardsVisible !== false ? 'checked' : ''} class="w-5 h-5 accent-violet-600 rounded" />
            </label>
          </div>

          <div class="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <div class="text-xs font-bold text-slate-800 dark:text-white">Police de caractères principale</div>
              <div class="text-[11px] text-slate-400">Typographie utilisée sur tout le portail</div>
            </div>
            <select name="fontFamily" class="px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none">
              <option value="Plus Jakarta Sans" ${app.fontFamily === 'Plus Jakarta Sans' ? 'selected' : ''}>Plus Jakarta Sans (Moderne)</option>
              <option value="Inter" ${app.fontFamily === 'Inter' ? 'selected' : ''}>Inter (Épuré)</option>
              <option value="system-ui" ${app.fontFamily === 'system-ui' ? 'selected' : ''}>Système par défaut</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Boutons de soumission -->
      <div class="flex items-center justify-between pt-2">
        <button type="button" onclick="resetAppearanceSettings()" class="px-4 py-2 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-red-200 dark:border-red-800">
          <i data-lucide="rotate-ccw" class="w-4 h-4"></i> Rétablir les couleurs d'origine
        </button>
        <button type="submit" class="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-md shadow-violet-600/25">
          <i data-lucide="save" class="w-4 h-4"></i> Appliquer les changements d'apparence
        </button>
      </div>
    </form>
  `;
}

function handleSaveAppearanceSettings(event) {
  event.preventDefault();
  const form = document.getElementById('appearance-settings-form');
  if (!form) return;

  const primaryColor = form.querySelector('[name="primaryColor"]')?.value || '#00875A';
  const secondaryColor = form.querySelector('[name="secondaryColor"]')?.value || '#0D9488';
  const defaultFleetView = form.querySelector('[name="defaultFleetView"]:checked')?.value || 'naotc';
  const fullOptionMode = form.querySelector('[name="fullOptionMode"]')?.checked ?? true;
  const heroStatsVisible = form.querySelector('[name="heroStatsVisible"]')?.checked ?? true;
  const networkCardsVisible = form.querySelector('[name="networkCardsVisible"]')?.checked ?? true;
  const fontFamily = form.querySelector('[name="fontFamily"]')?.value || 'Plus Jakarta Sans';

  const settings = {
    primaryColor,
    secondaryColor,
    defaultFleetView,
    fullOptionMode,
    heroStatsVisible,
    networkCardsVisible,
    fontFamily
  };

  saveAppearanceSettings(settings);
  showToast('✅ Apparence mise à jour et appliquée en direct !');
}

function resetAppearanceSettings() {
  if (confirm('Rétablir toutes les options graphiques et couleurs par défaut ?')) {
    localStorage.removeItem(APPEARANCE_SETTINGS_KEY);
    applyAppearanceSettings(getDefaultAppearanceSettings());
    renderAdminModalContent();
    showToast('Apparence rétablie par défaut.');
  }
}

/* =========================================================================
   NAOTC PLAN INTERACTIVE EDITOR MODULE
   ========================================================================= */

let selectedPlanLineId = null;
let currentEditingStops = [];
let currentEditingConnections = {};
let currentEditingAccessibility = [];
let currentDragStopIdx = null;

function getPlanEditorTabContentHtml() {
  if (!selectedPlanLineId && linesData.length > 0) {
    selectedPlanLineId = linesData[0].id;
  }
  const line = linesData.find(l => l.id === selectedPlanLineId) || linesData[0];
  if (line) {
    currentEditingStops = line.stops ? [...line.stops] : [line.terminusA, line.terminusB];
    currentEditingConnections = line.connections ? JSON.parse(JSON.stringify(line.connections)) : {};
    currentEditingAccessibility = line.accessibility ? [...line.accessibility] : [];
  }

  return `
    <div class="space-y-6 max-h-[72vh] overflow-y-auto pr-1">
      <!-- Top banner & Line picker -->
      <div class="bg-gradient-to-r from-emerald-600/10 to-slate-100 dark:from-emerald-950/40 dark:to-slate-800/60 p-4 rounded-2xl border border-emerald-300/40 dark:border-emerald-700/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 text-xs font-black rounded-lg bg-emerald-600 text-white uppercase tracking-wider">Outil Facile</span>
            <h3 class="text-base font-black text-slate-900 dark:text-white">Éditeur de Plans de Lignes Style NAOTC</h3>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ajoutez, réordonnez par glisser-déposer, configurez les correspondances et cochez l'accessibilité PMR avec prévisualisation en temps réel.
          </p>
        </div>
        <!-- Line Selector dropdown -->
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">Ligne :</label>
          <select id="pe-line-select" onchange="handlePlanEditorLineChange(this.value)" class="w-full sm:w-60 px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
            ${linesData.map(l => `
              <option value="${l.id}" ${l.id === selectedPlanLineId ? 'selected' : ''}>
                ${l.number} - ${l.name} (${l.stops ? l.stops.length : 0} arrêts)
              </option>
            `).join('')}
          </select>
        </div>
      </div>

      <!-- Live Preview Section -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <i data-lucide="eye" class="w-4 h-4 text-emerald-600"></i> Aperçu Direct du Plan NAOTC
          </h4>
          <span class="text-[11px] text-slate-400 italic">Défilement horizontal actif si la ligne est longue</span>
        </div>
        <div id="pe-live-preview" class="naotc-editor-preview">
          ${renderPlanEditorPreview(line)}
        </div>
      </div>

      <!-- Edit Controls & Stop list -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Stop creation & Quick tools -->
        <div class="space-y-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
          <h4 class="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <i data-lucide="plus-circle" class="w-4 h-4 text-emerald-600"></i> Ajouter un Arrêt
          </h4>
          <div class="space-y-2">
            <div>
              <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Nom du nouvel arrêt :</label>
              <input type="text" id="pe-new-stop-name" placeholder="ex: Gare SNCF, Hôtel de Ville..." class="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Correspondances (séparées par des virgules) :</label>
              <input type="text" id="pe-new-stop-conns" placeholder="ex: T1, T2, 6, 11" class="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div class="flex items-center gap-2 pt-1">
              <input type="checkbox" id="pe-new-stop-pmr" checked class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
              <label for="pe-new-stop-pmr" class="text-xs font-semibold text-slate-700 dark:text-slate-300">Arrêt accessible PMR ♿</label>
            </div>
            <button type="button" onclick="handleAddStopFromEditor()" class="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Insérer l'Arrêt à la fin
            </button>
          </div>

          <!-- Validity dates editor -->
          <div class="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
            <h4 class="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <i data-lucide="calendar" class="w-4 h-4 text-emerald-600"></i> Dates de Validité
            </h4>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] font-bold text-slate-500">Valable du :</label>
                <input type="text" id="pe-valid-from" value="${line ? (line.validFrom || '31 août 2026') : ''}" class="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-medium" />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500">Jusqu'au :</label>
                <input type="text" id="pe-valid-until" value="${line ? (line.validUntil || '27 juin 2027') : ''}" class="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-medium" />
              </div>
            </div>
          </div>
        </div>

        <!-- Stop list reordering & inline editing -->
        <div class="lg:col-span-2 space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <i data-lucide="list-ordered" class="w-4 h-4 text-emerald-600"></i> Tracé des Arrêts (${currentEditingStops.length})
              </h4>
              <p class="text-[11px] text-slate-400">Glissez les poignées pour réordonner ou modifiez directement les correspondances.</p>
            </div>
            <div class="flex items-center gap-1.5">
              <button type="button" onclick="handleReverseStopsInEditor()" class="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 rounded-lg transition flex items-center gap-1" title="Inverser tous les arrêts">
                <i data-lucide="arrow-left-right" class="w-3 h-3"></i> Inverser
              </button>
            </div>
          </div>

          <!-- Drag and drop stops list -->
          <div id="pe-stops-container" class="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            ${renderPlanEditorStopsList()}
          </div>
        </div>
      </div>

      <!-- Action buttons bottom bar -->
      <div class="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky bottom-0 py-2">
        <div class="flex items-center gap-2">
          <button type="button" onclick="exportPlanJson()" class="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 transition">
            <i data-lucide="download" class="w-3.5 h-3.5"></i> Exporter JSON du plan
          </button>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" onclick="savePlanEditorChanges()" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 transition shadow-lg shadow-emerald-600/25">
            <i data-lucide="check" class="w-4 h-4"></i> Enregistrer les Modifications du Plan
          </button>
        </div>
      </div>
    </div>
  `;
}

function handlePlanEditorLineChange(lineId) {
  selectedPlanLineId = lineId;
  const line = linesData.find(l => l.id === lineId);
  if (line) {
    currentEditingStops = line.stops ? [...line.stops] : [line.terminusA, line.terminusB];
    currentEditingConnections = line.connections ? JSON.parse(JSON.stringify(line.connections)) : {};
    currentEditingAccessibility = line.accessibility ? [...line.accessibility] : [];
  }
  renderAdminModalContent();
}

function renderPlanEditorPreview(line) {
  if (!line) return '<p class="text-xs text-slate-400">Aucune ligne sélectionnée</p>';
  const dummyLine = {
    ...line,
    stops: currentEditingStops,
    connections: currentEditingConnections,
    accessibility: currentEditingAccessibility,
    validFrom: document.getElementById('pe-valid-from') ? document.getElementById('pe-valid-from').value : (line.validFrom || '31 août 2026'),
    validUntil: document.getElementById('pe-valid-until') ? document.getElementById('pe-valid-until').value : (line.validUntil || '27 juin 2027')
  };
  return `
    <div class="naotc-plan-scroll" style="padding: 44px 20px 16px;">
      ${typeof renderNaotcPlan === 'function' ? renderNaotcPlan(dummyLine, currentEditingStops) : '<p class="text-xs">Chargement plan...</p>'}
    </div>
  `;
}

function renderPlanEditorStopsList() {
  if (currentEditingStops.length === 0) {
    return '<p class="text-xs text-slate-400 italic">Aucun arrêt configuré.</p>';
  }

  return currentEditingStops.map((stop, idx) => {
    const isTermA = idx === 0;
    const isTermB = idx === currentEditingStops.length - 1;
    const conns = (currentEditingConnections[stop] || []).join(', ');
    const isPmr = currentEditingAccessibility.includes(stop);

    return `
      <div class="naotc-editor-stop-row flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs" draggable="true" ondragstart="handleStopDragStart(event, ${idx})" ondragover="handleStopDragOver(event, ${idx})" ondrop="handleStopDrop(event, ${idx})">
        <span class="cursor-grab text-slate-400 hover:text-slate-600 px-1 font-bold">⋮⋮</span>
        <span class="w-5 text-center font-bold text-slate-400 text-[10px]">${idx + 1}</span>
        <div class="flex-1 min-w-0">
          <input type="text" value="${stop}" onchange="handleUpdateStopName(${idx}, this.value)" class="w-full px-2 py-1 bg-transparent font-bold text-slate-800 dark:text-slate-100 border-b border-transparent focus:border-emerald-500 outline-none truncate" />
        </div>
        <!-- Connections input -->
        <div class="w-32 flex-shrink-0">
          <input type="text" value="${conns}" placeholder="Corr. (T1, 6...)" onchange="handleUpdateStopConns('${stop}', this.value)" class="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-mono outline-none" title="Correspondances séparées par des virgules" />
        </div>
        <!-- PMR Toggle -->
        <button type="button" onclick="handleTogglePmr('${stop}')" class="p-1 rounded-lg transition ${isPmr ? 'text-blue-600 bg-blue-50 dark:bg-blue-950' : 'text-slate-300 hover:text-slate-500'}" title="Toggle accessibilité PMR">
          <span class="text-sm">♿</span>
        </button>
        <!-- Delete stop -->
        <button type="button" onclick="handleDeleteStop(${idx})" class="p-1 text-slate-300 hover:text-red-500 rounded-lg transition" title="Supprimer cet arrêt">
          <i data-lucide="x" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;
  }).join('');
}

function handleStopDragStart(e, idx) {
  currentDragStopIdx = idx;
  e.dataTransfer.effectAllowed = 'move';
}

function handleStopDragOver(e, idx) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleStopDrop(e, targetIdx) {
  e.preventDefault();
  if (currentDragStopIdx === null || currentDragStopIdx === targetIdx) return;
  const item = currentEditingStops.splice(currentDragStopIdx, 1)[0];
  currentEditingStops.splice(targetIdx, 0, item);
  currentDragStopIdx = null;
  refreshPlanEditorUi();
}

function handleUpdateStopName(idx, newName) {
  const oldName = currentEditingStops[idx];
  currentEditingStops[idx] = newName.trim();
  if (currentEditingConnections[oldName]) {
    currentEditingConnections[newName.trim()] = currentEditingConnections[oldName];
    delete currentEditingConnections[oldName];
  }
  const pmrIdx = currentEditingAccessibility.indexOf(oldName);
  if (pmrIdx !== -1) {
    currentEditingAccessibility[pmrIdx] = newName.trim();
  }
  refreshPlanEditorUi();
}

function handleUpdateStopConns(stopName, connsString) {
  const connsArray = connsString.split(',').map(s => s.trim()).filter(s => s.length > 0);
  if (connsArray.length > 0) {
    currentEditingConnections[stopName] = connsArray;
  } else {
    delete currentEditingConnections[stopName];
  }
  refreshPlanEditorUi();
}

function handleTogglePmr(stopName) {
  const idx = currentEditingAccessibility.indexOf(stopName);
  if (idx !== -1) {
    currentEditingAccessibility.splice(idx, 1);
  } else {
    currentEditingAccessibility.push(stopName);
  }
  refreshPlanEditorUi();
}

function handleDeleteStop(idx) {
  const stopName = currentEditingStops[idx];
  currentEditingStops.splice(idx, 1);
  delete currentEditingConnections[stopName];
  const pmrIdx = currentEditingAccessibility.indexOf(stopName);
  if (pmrIdx !== -1) currentEditingAccessibility.splice(pmrIdx, 1);
  refreshPlanEditorUi();
}

function handleAddStopFromEditor() {
  const nameInput = document.getElementById('pe-new-stop-name');
  const connsInput = document.getElementById('pe-new-stop-conns');
  const pmrInput = document.getElementById('pe-new-stop-pmr');
  if (!nameInput || !nameInput.value.trim()) {
    alert('Veuillez saisir un nom pour le nouvel arrêt.');
    return;
  }
  const stopName = nameInput.value.trim();
  currentEditingStops.push(stopName);

  if (connsInput && connsInput.value.trim()) {
    const conns = connsInput.value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (conns.length > 0) currentEditingConnections[stopName] = conns;
  }
  if (pmrInput && pmrInput.checked) {
    currentEditingAccessibility.push(stopName);
  }

  nameInput.value = '';
  if (connsInput) connsInput.value = '';
  refreshPlanEditorUi();
  showToast(`Arrêt "${stopName}" ajouté au plan !`);
}

function handleReverseStopsInEditor() {
  currentEditingStops.reverse();
  refreshPlanEditorUi();
}

function refreshPlanEditorUi() {
  const line = linesData.find(l => l.id === selectedPlanLineId);
  const preview = document.getElementById('pe-live-preview');
  const stopsContainer = document.getElementById('pe-stops-container');
  if (preview) preview.innerHTML = renderPlanEditorPreview(line);
  if (stopsContainer) stopsContainer.innerHTML = renderPlanEditorStopsList();
  lucide.createIcons();
}

function savePlanEditorChanges() {
  const line = linesData.find(l => l.id === selectedPlanLineId);
  if (!line) return;

  const validFromInput = document.getElementById('pe-valid-from');
  const validUntilInput = document.getElementById('pe-valid-until');

  line.stops = [...currentEditingStops];
  line.stopsCount = currentEditingStops.length;
  line.terminusA = currentEditingStops[0] || line.terminusA;
  line.terminusB = currentEditingStops[currentEditingStops.length - 1] || line.terminusB;
  line.connections = JSON.parse(JSON.stringify(currentEditingConnections));
  line.accessibility = [...currentEditingAccessibility];
  if (validFromInput) line.validFrom = validFromInput.value.trim();
  if (validUntilInput) line.validUntil = validUntilInput.value.trim();

  localStorage.setItem('histo14_lines_data', JSON.stringify(linesData));
  localStorage.setItem('histo14_lines_data_v3', JSON.stringify(linesData));
  if (typeof renderLines === 'function') renderLines();
  refreshPlanEditorUi();
  showToast(`✅ Plan de la ligne ${line.number} mis à jour avec succès !`);
}

function exportPlanJson() {
  const line = linesData.find(l => l.id === selectedPlanLineId);
  if (!line) return;
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(line, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `plan_ligne_${line.number}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

window.addEventListener('DOMContentLoaded', () => {
  updateAdminUI();
  // Apply saved site settings on page load
  const savedSettings = getSiteSettings();
  if (localStorage.getItem(SITE_SETTINGS_KEY)) {
    applySiteSettings(savedSettings);
  }
  // Apply saved appearance settings on page load
  if (typeof applyAppearanceSettings === 'function') {
    applyAppearanceSettings(getAppearanceSettings());
  }
});

