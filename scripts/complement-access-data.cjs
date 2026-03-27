/**
 * Script de COMPLÉMENT de données depuis Gestion1_Caisse -06_10_16.mdb
 * Importe uniquement les données NOUVELLES (absentes de la base)
 * 
 * Stratégie de dédoublonnage :
 *   - Recettes : comparaison par (numero_bon, date_transaction, montant)
 *   - Dépenses : comparaison par (numero_bon, date_transaction, montant)  
 *   - Programmations : comparaison par (mois, annee, designation)
 *   - Feuilles de caisse : comparaison par date (clé unique)
 *   - Rubriques : ON CONFLICT (code)
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const CSV_DIR = path.join(__dirname, '..', 'access-exports-new');

// --- Utilitaires CSV ---
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function readCSV(filename) {
  const filepath = path.join(CSV_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.log(`  ⚠ Fichier ${filename} introuvable`);
    return { headers: [], rows: [] };
  }
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((h, idx) => { row[h] = values[idx]; });
      rows.push(row);
    }
  }
  return { headers, rows };
}

function parseAccessDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  const s = dateStr.trim();
  let match = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  match = s.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  return null;
}

function parseAccessTime(timeStr) {
  if (!timeStr || timeStr.trim() === '') return null;
  const match = timeStr.trim().match(/(\d{2}):(\d{2}):(\d{2})/);
  if (match) return `${match[1]}:${match[2]}:${match[3]}`;
  return null;
}

function parseAccessAmount(amountStr) {
  if (!amountStr || amountStr.trim() === '') return null;
  return parseFloat(amountStr.replace(/\s/g, '').replace(',', '.')) || 0;
}

function clean(val) {
  if (val === undefined || val === null || val.trim() === '') return null;
  return val.trim();
}

// --- Import Rubriques (avec Rubriques25 pour les nouvelles) ---
async function importRubriques(client) {
  console.log('\n📦 Mise à jour RUBRIQUES...');
  
  // Rubriques originales
  const { rows: rubs } = readCSV('Rubriques.csv');
  // Rubriques25 (nouvelles rubriques 2025)
  const { rows: rubs25 } = readCSV('Rubriques25.csv');
  
  let count = 0;
  for (const row of rubs) {
    const code = clean(row['Code_Rubrique']);
    const libelle = clean(row['Rubrique']);
    const categorie = clean(row['Type']);
    const imp = clean(row['Imputation']);
    if (!code) continue;
    
    try {
      await client.query(
        `INSERT INTO rubriques (code, libelle, categorie, imp, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (code) DO UPDATE SET libelle = EXCLUDED.libelle, categorie = EXCLUDED.categorie, imp = EXCLUDED.imp`,
        [code, libelle, categorie, imp]
      );
      count++;
    } catch (e) {
      // Ignore duplicates
    }
  }
  
  // Ajouter rubriques25 avec un préfixe pour éviter les conflits de code
  for (const row of rubs25) {
    const code = clean(row['Code_Rubrique']);
    const libelle = clean(row['Rubrique']);
    const categorie = clean(row['Type']);
    const imp = clean(row['Imputation']);
    if (!code) continue;
    
    const newCode = `R25-${code}`;
    try {
      await client.query(
        `INSERT INTO rubriques (code, libelle, categorie, imp, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (code) DO UPDATE SET libelle = EXCLUDED.libelle, categorie = EXCLUDED.categorie`,
        [newCode, libelle, categorie, imp]
      );
      count++;
    } catch (e) {
      // Ignore
    }
  }
  console.log(`  ✅ ${count} rubriques mises à jour`);
}

// --- Import Recettes (complément) ---
async function importRecettes(client) {
  console.log('\n📦 Complément RECETTES...');
  const { rows } = readCSV('RecettesF.csv');
  if (rows.length === 0) return;
  
  // Récupérer les recettes existantes pour dédoublonnage
  const existing = await client.query(
    `SELECT numero_bon, date_transaction, montant FROM recettes`
  );
  const existingSet = new Set(
    existing.rows.map(r => `${r.numero_bon}|${r.date_transaction}|${parseFloat(r.montant)}`)
  );
  
  console.log(`  📊 ${existing.rows.length} recettes existantes en base`);
  
  const colResult = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='recettes'`
  );
  const existingCols = new Set(colResult.rows.map(r => r.column_name));
  
  let count = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const row of rows) {
    if (row['SUPPRIM'] && row['SUPPRIM'].toUpperCase() === 'OUI') continue;
    
    const numeroBon = parseInt(row['Num_BE_Caisse']) || null;
    const dateTransaction = parseAccessDate(row['Date_Entree']) || parseAccessDate(row['Date_Entree1']);
    const heure = parseAccessTime(row['Heure_e']) || '00:00:00';
    const motif = clean(row['Motif_BE']);
    const montant = parseAccessAmount(row['MT_Chiffre_BE']);
    const montantLettre = clean(row['MT_Lttre_BE']);
    const provenance = clean(row['Recu_De']);
    const codeRubrique = clean(row['Code_Rubrique']);
    
    if (!dateTransaction && !motif) continue;
    
    // Vérifier doublon
    const key = `${numeroBon}|${dateTransaction}|${montant}`;
    if (existingSet.has(key)) {
      skipped++;
      continue;
    }
    
    // Colonnes de base - utiliser date_transaction (la colonne renommée)
    const columns = ['numero_bon', 'date_transaction', 'heure', 'motif', 'montant', 'montant_lettre', 'provenance'];
    const values = [numeroBon, dateTransaction, heure, motif, montant, montantLettre, provenance];
    
    if (existingCols.has('libelle')) {
      columns.push('libelle');
      values.push(motif);
    }
    if (existingCols.has('observation')) {
      columns.push('observation');
      values.push(null);
    }
    
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const colNames = columns.map(c => `"${c}"`).join(', ');
    
    try {
      await client.query(
        `INSERT INTO recettes (${colNames}) VALUES (${placeholders})`,
        values
      );
      count++;
      existingSet.add(key); // Marquer comme importé
    } catch (e) {
      errors++;
      if (errors <= 5) console.log(`  ⚠ Recette #${numeroBon} ${dateTransaction}: ${e.message.substring(0, 100)}`);
    }
  }
  console.log(`  ✅ ${count} nouvelles recettes importées, ${skipped} doublons ignorés, ${errors} erreurs`);
}

// --- Import Dépenses (complément) ---
async function importDepenses(client) {
  console.log('\n📦 Complément DEPENSES...');
  const { rows } = readCSV('DepensesF.csv');
  if (rows.length === 0) return;
  
  // Récupérer les dépenses existantes
  const existing = await client.query(
    `SELECT numero_bon, date_transaction, montant FROM depenses`
  );
  const existingSet = new Set(
    existing.rows.map(r => `${r.numero_bon}|${r.date_transaction}|${parseFloat(r.montant)}`)
  );
  
  console.log(`  📊 ${existing.rows.length} dépenses existantes en base`);
  
  // Carte des rubriques
  const rubRes = await client.query('SELECT id, code FROM rubriques');
  const rubriqueMap = {};
  rubRes.rows.forEach(r => { rubriqueMap[r.code] = r.id; });
  
  const colResult = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='depenses'`
  );
  const existingCols = new Set(colResult.rows.map(r => r.column_name));
  
  let count = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const row of rows) {
    if (row['SUPPRIM'] && row['SUPPRIM'].toUpperCase() === 'OUI') continue;
    
    const numeroBon = parseInt(row['Num_BS_Caisse']) || null;
    const dateTransaction = parseAccessDate(row['Date_Sortie']) || parseAccessDate(row['Date_Sortie1']);
    const heure = parseAccessTime(row['Heure_s']) || '00:00:00';
    const motif = clean(row['Motif_Bs']);
    const montant = parseAccessAmount(row['MT_Chiffre_BS']);
    const montantLettre = clean(row['MT_Lttre_BS']);
    const beneficiaire = clean(row['Benef']);
    const codeRubrique = clean(row['Code_Rubrique']);
    const rubriqueId = codeRubrique ? (rubriqueMap[codeRubrique] || null) : null;
    const nbeo = clean(row['NBEO']);
    
    if (!dateTransaction && !motif) continue;
    
    // Vérifier doublon
    const key = `${numeroBon}|${dateTransaction}|${montant}`;
    if (existingSet.has(key)) {
      skipped++;
      continue;
    }
    
    const columns = ['numero_bon', 'date_transaction', 'heure', 'motif', 'montant', 'montant_lettre', 'beneficiaire'];
    const values = [numeroBon, dateTransaction, heure, motif, montant, montantLettre, beneficiaire];
    
    if (rubriqueId && existingCols.has('rubrique_id')) {
      columns.push('rubrique_id');
      values.push(rubriqueId);
    }
    if (existingCols.has('libelle')) {
      columns.push('libelle');
      values.push(motif);
    }
    if (existingCols.has('no_beo') && nbeo) {
      columns.push('no_beo');
      values.push(nbeo);
    }
    
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const colNames = columns.map(c => `"${c}"`).join(', ');
    
    try {
      await client.query(
        `INSERT INTO depenses (${colNames}) VALUES (${placeholders})`,
        values
      );
      count++;
      existingSet.add(key);
    } catch (e) {
      errors++;
      if (errors <= 5) console.log(`  ⚠ Dépense #${numeroBon} ${dateTransaction}: ${e.message.substring(0, 100)}`);
    }
  }
  console.log(`  ✅ ${count} nouvelles dépenses importées, ${skipped} doublons ignorés, ${errors} erreurs`);
}

// --- Import Programmations (complément) ---
async function importProgrammations(client) {
  console.log('\n📦 Complément PROGRAMMATIONS...');
  const { rows } = readCSV('DETPGM.csv');
  if (rows.length === 0) return;
  
  const rubRes = await client.query('SELECT id, code FROM rubriques');
  const rubriqueMap = {};
  rubRes.rows.forEach(r => { rubriqueMap[r.code] = r.id; });
  
  // Récupérer existants
  const existing = await client.query(
    `SELECT mois, annee, designation FROM programmations`
  );
  const existingSet = new Set(
    existing.rows.map(r => `${r.mois}|${r.annee}|${r.designation}`)
  );
  
  console.log(`  📊 ${existing.rows.length} programmations existantes en base`);
  
  const colResult = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='programmations'`
  );
  const existingCols = new Set(colResult.rows.map(r => r.column_name));
  
  const moisMap = {
    'JANVIER': 1, 'FEVRIER': 2, 'FÉVRIER': 2, 'MARS': 3, 'AVRIL': 4,
    'MAI': 5, 'JUIN': 6, 'JUILLET': 7, 'AOUT': 8, 'AOÛT': 8,
    'SEPTEMBRE': 9, 'OCTOBRE': 10, 'NOVEMBRE': 11, 'DECEMBRE': 12, 'DÉCEMBRE': 12
  };
  
  let count = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const row of rows) {
    const moisStr = clean(row['MOIS']);
    const anneeStr = clean(row['ANNE']);
    const montant = parseAccessAmount(row['MT']);
    const designation = clean(row['LIB']);
    const codeRubrique = clean(row['Code_Rubrique']);
    const rubriqueId = codeRubrique ? (rubriqueMap[codeRubrique] || null) : null;
    
    const mois = moisStr ? (moisMap[moisStr.toUpperCase()] || parseInt(moisStr) || null) : null;
    const annee = anneeStr ? parseInt(anneeStr) : null;
    
    if (!mois || !annee) continue;
    
    // Dédoublonnage
    const key = `${mois}|${annee}|${designation}`;
    if (existingSet.has(key)) {
      skipped++;
      continue;
    }
    
    const columns = ['mois', 'annee', 'montant_prevu'];
    const values = [mois, annee, montant || 0];
    
    if (existingCols.has('designation') && designation) {
      columns.push('designation');
      values.push(designation);
    }
    if (existingCols.has('rubrique_id') && rubriqueId) {
      columns.push('rubrique_id');
      values.push(rubriqueId);
    }
    if (existingCols.has('user_id')) {
      columns.push('user_id');
      values.push('00000000-0000-0000-0000-000000000000');
    }
    
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const colNames = columns.map(c => `"${c}"`).join(', ');
    
    try {
      await client.query(
        `INSERT INTO programmations (${colNames}) VALUES (${placeholders})`,
        values
      );
      count++;
      existingSet.add(key);
    } catch (e) {
      errors++;
      if (errors <= 5) console.log(`  ⚠ Prog ${mois}/${annee}: ${e.message.substring(0, 100)}`);
    }
  }
  console.log(`  ✅ ${count} nouvelles programmations importées, ${skipped} doublons ignorés, ${errors} erreurs`);
}

// --- Import Feuilles de caisse (complément) ---
async function importFeuilleCaisse(client) {
  console.log('\n📦 Complément FEUILLES DE CAISSE...');
  const { rows } = readCSV('REPORTCAISSE.csv');
  if (rows.length === 0) return;
  
  // Récupérer dates existantes (date est clé unique)
  const existing = await client.query(`SELECT date FROM feuilles_caisse`);
  const existingDates = new Set(existing.rows.map(r => r.date.toISOString().split('T')[0]));
  
  console.log(`  📊 ${existing.rows.length} feuilles existantes en base`);
  
  let count = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const row of rows) {
    const date = parseAccessDate(row['DAT']);
    const montant = parseAccessAmount(row['MT']);
    
    if (!date) continue;
    
    if (existingDates.has(date)) {
      skipped++;
      continue;
    }
    
    try {
      await client.query(
        `INSERT INTO feuilles_caisse (date, solde_initial, total_recettes, total_depenses, is_closed, user_id)
         VALUES ($1, $2, 0, 0, false, '00000000-0000-0000-0000-000000000000')`,
        [date, montant || 0]
      );
      count++;
      existingDates.add(date);
    } catch (e) {
      errors++;
      if (errors <= 5) console.log(`  ⚠ Feuille ${date}: ${e.message.substring(0, 100)}`);
    }
  }
  console.log(`  ✅ ${count} nouvelles feuilles importées, ${skipped} doublons ignorés, ${errors} erreurs`);
}

// --- Programme principal ---
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   COMPLÉMENT DE DONNÉES ACCESS → SUPABASE');
  console.log('   Source : Gestion1_Caisse -06_10_16.mdb');
  console.log('   Données : septembre 2022 → mars 2026');
  console.log('═══════════════════════════════════════════════════════');
  
  const client = new Client({
    host: '127.0.0.1',
    port: 45322,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  });
  
  try {
    await client.connect();
    console.log('✅ Connexion Supabase établie');
    
    // Désactiver RLS
    const tables = ['rubriques', 'recettes', 'depenses', 'programmations', 'feuilles_caisse'];
    for (const t of tables) {
      try { await client.query(`ALTER TABLE "${t}" DISABLE ROW LEVEL SECURITY`); } catch(e) {}
    }
    console.log('✅ RLS désactivé pour l\'import');
    
    // 1. Rubriques d'abord (nécessaires pour les dépenses)
    await importRubriques(client);
    
    // 2. Recettes
    await importRecettes(client);
    
    // 3. Dépenses
    await importDepenses(client);
    
    // 4. Programmations
    await importProgrammations(client);
    
    // 5. Feuilles de caisse
    await importFeuilleCaisse(client);
    
    // Réactiver RLS
    for (const t of tables) {
      try { await client.query(`ALTER TABLE "${t}" ENABLE ROW LEVEL SECURITY`); } catch(e) {}
    }
    
    // Vérification finale
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('   VÉRIFICATION FINALE');
    console.log('═══════════════════════════════════════════════════════');
    
    const counts = await client.query(`
      SELECT 'recettes' as t, COUNT(*) as c, MIN(date_transaction) as min_d, MAX(date_transaction) as max_d FROM recettes
      UNION ALL
      SELECT 'depenses', COUNT(*), MIN(date_transaction), MAX(date_transaction) FROM depenses
      UNION ALL
      SELECT 'programmations', COUNT(*), NULL, NULL FROM programmations
      UNION ALL
      SELECT 'feuilles_caisse', COUNT(*), NULL, NULL FROM feuilles_caisse
      UNION ALL
      SELECT 'rubriques', COUNT(*), NULL, NULL FROM rubriques
    `);
    
    for (const row of counts.rows) {
      const dates = row.min_d && row.max_d ? ` (${row.min_d} → ${row.max_d})` : '';
      console.log(`  📊 ${row.t}: ${row.c} enregistrements${dates}`);
    }
    
    console.log('\n✅ Complément de données terminé !');
    
  } catch (err) {
    console.error('❌ Erreur:', err.message);
  } finally {
    await client.end();
  }
}

main();
