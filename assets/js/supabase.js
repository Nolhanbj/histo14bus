/**
 * Histo14Bus - Intégration Supabase (PostgreSQL & API Temps Réel)
 * URL: https://ovtldavqzacgjtjcjarv.supabase.co
 */

const SUPABASE_CONFIG = {
  url: 'https://ovtldavqzacgjtjcjarv.supabase.co',
  anonKey: 'sb_publishable_VGkYNWrb6YOeGK3B0SydEw_AUViiYf9'
};

let _supabaseClient = null;

function getSupabase() {
  if (!_supabaseClient && window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      _supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    } catch (e) {
      console.warn('[Supabase] Erreur initialisation client:', e);
    }
  }
  return _supabaseClient;
}

// Exposer globalement
window.getSupabase = getSupabase;

/* =========================================================================
   1. CHARGEMENT DES DONNÉES (FETCH AVEC RETOUR EN CAS DE SUCCÈS)
   ========================================================================= */

async function fetchFleetFromSupabase() {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('vehicles')
      .select('*')
      .range(0, 9999);
    if (error) {
      console.warn('[Supabase] fetchFleet error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[Supabase] fetchFleet exception:', err);
    return null;
  }
}

async function fetchLinesFromSupabase() {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('lines')
      .select('*')
      .range(0, 9999);
    if (error) {
      console.warn('[Supabase] fetchLines error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[Supabase] fetchLines exception:', err);
    return null;
  }
}

async function fetchNewsFromSupabase() {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('news')
      .select('*')
      .order('date', { ascending: false });
    if (error) {
      console.warn('[Supabase] fetchNews error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[Supabase] fetchNews exception:', err);
    return null;
  }
}

async function fetchMovementsFromSupabase() {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('movements')
      .select('*')
      .order('date', { ascending: false });
    if (error) {
      console.warn('[Supabase] fetchMovements error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[Supabase] fetchMovements exception:', err);
    return null;
  }
}

async function fetchGalleryFromSupabase() {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('gallery')
      .select('*')
      .order('date', { ascending: false });
    if (error) {
      console.warn('[Supabase] fetchGallery error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[Supabase] fetchGallery exception:', err);
    return null;
  }
}

/* =========================================================================
   2. SAUVEGARDE & SYNCHRONISATION (ÉCRITURE SUPABASE)
   ========================================================================= */

function sanitizeVehicleForSupabase(v) {
  if (!v) return null;
  const parsedDoors = typeof v.doors === 'number'
    ? v.doors
    : (v.doors ? parseInt(String(v.doors), 10) : null);
  return {
    id: String(v.id || `bus_${v.number}`),
    number: String(v.number || ''),
    brand: v.brand || null,
    model: v.model || null,
    type: v.type || null,
    gabarit: v.gabarit || null,
    network: v.network || null,
    operator: v.operator || null,
    depot: v.depot || null,
    energy: v.energy || null,
    status: v.status || 'Actuel',
    plate: v.plate || v.registration || null,
    registration: v.registration || v.plate || null,
    deliveryDate: v.deliveryDate || null,
    inServiceDate: v.inServiceDate || v.serviceDate || null,
    serviceDate: v.serviceDate || v.inServiceDate || null,
    capacity: v.capacity || null,
    doors: Number.isFinite(parsedDoors) ? parsedDoors : null,
    length: v.length || null,
    livery: v.livery || null,
    lines: Array.isArray(v.lines) ? v.lines : [],
    equipments: Array.isArray(v.equipments) ? v.equipments : (Array.isArray(v.features) ? v.features : []),
    photo: v.photo || null,
    history: Array.isArray(v.history) ? v.history : [],
    notes: v.notes || null,
    updated_at: new Date().toISOString()
  };
}

function sanitizeLineForSupabase(l) {
  if (!l) return null;
  const stockStr = Array.isArray(l.rollingStock)
    ? l.rollingStock.join(', ')
    : (l.rollingStock || null);
  return {
    id: String(l.id || l.number),
    number: String(l.number || ''),
    name: l.name || null,
    type: l.type || null,
    category: l.category || null,
    color: l.color || null,
    textColor: l.textColor || '#FFFFFF',
    terminusA: l.terminusA || null,
    terminusB: l.terminusB || null,
    stationsCount: typeof l.stationsCount === 'number' ? l.stationsCount : (Array.isArray(l.stops) ? l.stops.length : null),
    stopsCount: typeof l.stopsCount === 'number' ? l.stopsCount : (Array.isArray(l.stops) ? l.stops.length : null),
    frequency: l.frequency || null,
    validFrom: l.validFrom || null,
    validUntil: l.validUntil || null,
    planDate: l.planDate || null,
    planUrl: l.planUrl || null,
    schedulePdfUrl: l.schedulePdfUrl || null,
    connections: (l.connections && typeof l.connections === 'object') ? l.connections : {},
    accessibility: Array.isArray(l.accessibility) ? l.accessibility : [],
    stops: Array.isArray(l.stops) ? l.stops : [],
    description: l.description || null,
    rollingStock: stockStr,
    keyConnections: l.keyConnections || [],
    history: typeof l.history === 'string' ? l.history : (l.history ? JSON.stringify(l.history) : null),
    updated_at: new Date().toISOString()
  };
}

async function saveVehicleToSupabase(vehicle) {
  const sb = getSupabase();
  if (!sb || !vehicle) return false;
  try {
    const payload = sanitizeVehicleForSupabase(vehicle);
    const { error } = await sb.from('vehicles').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] saveVehicle error:', error);
      return false;
    }
    console.log(`[Supabase] Véhicule n°${vehicle.number} synchronisé.`);
    return true;
  } catch (e) {
    console.error('[Supabase] saveVehicle exception:', e);
    return false;
  }
}

async function deleteVehicleFromSupabase(vehicleId) {
  const sb = getSupabase();
  if (!sb || !vehicleId) return false;
  try {
    const { error } = await sb.from('vehicles').delete().or(`id.eq.${vehicleId},number.eq.${vehicleId}`);
    if (error) {
      console.error('[Supabase] deleteVehicle error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Supabase] deleteVehicle exception:', e);
    return false;
  }
}

async function saveLineToSupabase(line) {
  const sb = getSupabase();
  if (!sb || !line) return false;
  try {
    const payload = sanitizeLineForSupabase(line);
    const { error } = await sb.from('lines').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] saveLine error:', error);
      return false;
    }
    console.log(`[Supabase] Ligne ${line.number} synchronisée.`);
    return true;
  } catch (e) {
    console.error('[Supabase] saveLine exception:', e);
    return false;
  }
}

async function deleteLineFromSupabase(lineId) {
  const sb = getSupabase();
  if (!sb || !lineId) return false;
  try {
    const { error } = await sb.from('lines').delete().or(`id.eq.${lineId},number.eq.${lineId}`);
    if (error) {
      console.error('[Supabase] deleteLine error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Supabase] deleteLine exception:', e);
    return false;
  }
}

async function saveNewsToSupabase(newsItem) {
  const sb = getSupabase();
  if (!sb || !newsItem) return false;
  try {
    const payload = { ...newsItem, updated_at: new Date().toISOString() };
    const { error } = await sb.from('news').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] saveNews error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Supabase] saveNews exception:', e);
    return false;
  }
}

async function deleteNewsFromSupabase(newsId) {
  const sb = getSupabase();
  if (!sb || !newsId) return false;
  try {
    const { error } = await sb.from('news').delete().eq('id', newsId);
    if (error) {
      console.error('[Supabase] deleteNews error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Supabase] deleteNews exception:', e);
    return false;
  }
}

async function saveMovementToSupabase(movement) {
  const sb = getSupabase();
  if (!sb || !movement) return false;
  try {
    const payload = { ...movement, updated_at: new Date().toISOString() };
    const { error } = await sb.from('movements').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] saveMovement error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Supabase] saveMovement exception:', e);
    return false;
  }
}

async function deleteMovementFromSupabase(movementId) {
  const sb = getSupabase();
  if (!sb || !movementId) return false;
  try {
    const { error } = await sb.from('movements').delete().eq('id', movementId);
    if (error) {
      console.error('[Supabase] deleteMovement error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Supabase] deleteMovement exception:', e);
    return false;
  }
}

async function saveGalleryToSupabase(photo) {
  const sb = getSupabase();
  if (!sb || !photo) return false;
  try {
    const payload = { ...photo, updated_at: new Date().toISOString() };
    const { error } = await sb.from('gallery').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] saveGallery error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Supabase] saveGallery exception:', e);
    return false;
  }
}

async function deleteGalleryFromSupabase(photoId) {
  const sb = getSupabase();
  if (!sb || !photoId) return false;
  try {
    const { error } = await sb.from('gallery').delete().eq('id', photoId);
    if (error) {
      console.error('[Supabase] deleteGallery error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Supabase] deleteGallery exception:', e);
    return false;
  }
}

/* =========================================================================
   3. TRANSFERT TOTAL VERS SUPABASE (BOUTON ESPACE ADMIN)
   ========================================================================= */

async function transferAllDataToSupabase(onProgress) {
  const sb = getSupabase();
  if (!sb) {
    throw new Error("Client Supabase non initialisé. Vérifiez la connexion Internet.");
  }

  const report = {
    vehicles: 0,
    lines: 0,
    news: 0,
    movements: 0,
    gallery: 0
  };

  if (typeof onProgress === 'function') onProgress("Transfert de la flotte de bus...", 10);

  // 1. Transfert Véhicules (par lots de 50 pour éviter les timeouts)
  if (typeof fleetData !== 'undefined' && Array.isArray(fleetData) && fleetData.length > 0) {
    const chunkSize = 50;
    for (let i = 0; i < fleetData.length; i += chunkSize) {
      const chunk = fleetData.slice(i, i + chunkSize).map(sanitizeVehicleForSupabase);
      const { error } = await sb.from('vehicles').upsert(chunk, { onConflict: 'id' });
      if (error) throw new Error("Erreur insertion flotte: " + error.message);
      report.vehicles += chunk.length;
      if (typeof onProgress === 'function') {
        const pct = 10 + Math.round((i / fleetData.length) * 40);
        onProgress(`Flotte: ${report.vehicles}/${fleetData.length} véhicules...`, pct);
      }
    }
  }

  // 2. Transfert Lignes
  if (typeof onProgress === 'function') onProgress("Transfert des lignes & plans...", 55);
  if (typeof linesData !== 'undefined' && Array.isArray(linesData) && linesData.length > 0) {
    const sanitizedLines = linesData.map(sanitizeLineForSupabase);
    const { error } = await sb.from('lines').upsert(sanitizedLines, { onConflict: 'id' });
    if (error) throw new Error("Erreur insertion lignes: " + error.message);
    report.lines = sanitizedLines.length;
  }

  // 3. Transfert News
  if (typeof onProgress === 'function') onProgress("Transfert des actualités...", 75);
  if (typeof newsData !== 'undefined' && Array.isArray(newsData) && newsData.length > 0) {
    const { error } = await sb.from('news').upsert(newsData, { onConflict: 'id' });
    if (error) throw new Error("Erreur insertion news: " + error.message);
    report.news = newsData.length;
  }

  // 4. Transfert Mouvements
  if (typeof onProgress === 'function') onProgress("Transfert des mouvements...", 85);
  if (typeof movementsData !== 'undefined' && Array.isArray(movementsData) && movementsData.length > 0) {
    const { error } = await sb.from('movements').upsert(movementsData, { onConflict: 'id' });
    if (error) throw new Error("Erreur insertion mouvements: " + error.message);
    report.movements = movementsData.length;
  }

  // 5. Transfert Galerie
  if (typeof onProgress === 'function') onProgress("Transfert de la galerie photo...", 95);
  if (typeof galleryData !== 'undefined' && Array.isArray(galleryData) && galleryData.length > 0) {
    const { error } = await sb.from('gallery').upsert(galleryData, { onConflict: 'id' });
    if (error) throw new Error("Erreur insertion galerie: " + error.message);
    report.gallery = galleryData.length;
  }

  if (typeof onProgress === 'function') onProgress("Synchronisation terminée avec succès !", 100);
  return report;
}
