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

async function saveVehicleToSupabase(vehicle) {
  const sb = getSupabase();
  if (!sb || !vehicle) return false;
  try {
    // On n'envoie QUE les colonnes qui existent dans la table Supabase
    // (évite l'erreur "Could not find column X in schema cache")
    const payload = {
      updated_at: new Date().toISOString()
    };
    const ALLOWED = [
      'id','number','brand','model','type','gabarit','network','operator','depot',
      'energy','status','plate','registration','vin','deliveryDate','inServiceDate','serviceDate',
      'capacity','doors','length','livery','lines','equipments','features','photo','history','notes'
    ];
    ALLOWED.forEach(k => { if (vehicle[k] !== undefined) payload[k] = vehicle[k]; });
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
    const payload = { ...line, updated_at: new Date().toISOString() };
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

  // Purge du cache localStorage pour repartir de données propres
  localStorage.removeItem('histo14_fleet_data');
  localStorage.removeItem('histo14_lines_data');

  // 1. Transfert Véhicules (par lots de 50 pour éviter les timeouts)
  // On recharge fleet.json propre pour éviter les champs parasites du cache
  let vehiclesToTransfer = [];
  try {
    const r = await fetch('data/fleet.json?t=' + Date.now());
    vehiclesToTransfer = await r.json();
  } catch(e) {
    vehiclesToTransfer = (typeof fleetData !== 'undefined' && Array.isArray(fleetData)) ? fleetData : [];
  }

  if (vehiclesToTransfer.length > 0) {
    const chunkSize = 50;
    // Colonnes EXACTES de la table Supabase (schéma SQL)
    const VEHICLE_COLS = [
      'id','number','brand','model','type','gabarit','network','operator','depot',
      'energy','status','plate','registration','vin','deliveryDate','inServiceDate','serviceDate',
      'capacity','doors','length','livery','lines','equipments','features','photo','history','notes','updated_at'
    ];
    const cleanVehicle = v => {
      const c = {};
      VEHICLE_COLS.forEach(k => {
        if (v[k] !== undefined) c[k] = v[k];
      });
      // Mapper features → equipments si equipments absent
      if (!c.equipments && v.features) c.equipments = v.features;
      return c;
    };
    for (let i = 0; i < vehiclesToTransfer.length; i += chunkSize) {
      const chunk = vehiclesToTransfer.slice(i, i + chunkSize).map(cleanVehicle);
      const { error } = await sb.from('vehicles').upsert(chunk, { onConflict: 'id' });
      if (error) throw new Error("Erreur insertion flotte: " + error.message);
      report.vehicles += chunk.length;
      if (typeof onProgress === 'function') {
        const pct = 10 + Math.round((i / vehiclesToTransfer.length) * 40);
        onProgress(`Flotte: ${report.vehicles}/${vehiclesToTransfer.length} véhicules...`, pct);
      }
    }
  }

  // 2. Transfert Lignes
  if (typeof onProgress === 'function') onProgress("Transfert des lignes & plans...", 55);
  if (typeof linesData !== 'undefined' && Array.isArray(linesData) && linesData.length > 0) {
    const { error } = await sb.from('lines').upsert(linesData, { onConflict: 'id' });
    if (error) throw new Error("Erreur insertion lignes: " + error.message);
    report.lines = linesData.length;
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
