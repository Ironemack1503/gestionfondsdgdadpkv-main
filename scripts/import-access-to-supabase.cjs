/**
 * Script d'importation de la base Access (Gestion_Caisse) vers Supabase
 * 
 * Mapping Access → Supabase :
 *   Rubriques.csv → rubriques (code, libelle, categorie, imp)
 *   Service.csv → services (code, libelle)
 *   SIGNATAIRE.csv → signataires (matricule, nom, grade)
 *   CONTENTIEUX.csv → contentieux (code, libelle, montant)
 *   CATCAISSE.csv + CATDEP.csv → categories (code, libelle, type)
 *   RecettesF.csv → recettes
 *   DepensesF.csv → depenses
 *   DETPGM.csv → programmations
 *   REPORTCAISSE.csv → feuilles_caisse
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const CSV_DIR = path.join(__dirname, '..', 'access-exports');

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
    console.log(`  ⚠ Fichier ${filename} introuvable, ignoré`);
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

// --- Conversion dates ---
function parseAccessDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  // Format "20/07/2023 00:00:00" ou "2023/07/20"
  const s = dateStr.trim();
  let match = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  match = s.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  return null;
}

function parseAccessTime(timeStr) {
  if (!timeStr || timeStr.trim() === '') return null;
  // Format "30/12/1899 12:18:51"
  const match = timeStr.trim().match(/(\d{2}):(\d{2}):(\d{2})/);
  if (match) return `${match[1]}:${match[2]}:${match[3]}`;
  return null;
}

function parseAccessAmount(amountStr) {
  if (!amountStr || amountStr.trim() === '') return null;
  // Remplacer les virgules décimales par des points
  return parseFloat(amountStr.replace(/\s/g, '').replace(',', '.')) || 0;
}

function clean(val) {
  if (val === undefined || val === null || val.trim() === '') return null;
  return val.trim();
}

// --- Fonctions d'insertion ---

async function importRubriques(client) {
  console.log('\n📦 Import des RUBRIQUES...');
  const { rows } = readCSV('Rubriques.csv');
  if (rows.length === 0) return;
  
  let count = 0;
  for (const row of rows) {
    const code = clean(row['Code_Rubrique']);
    const libelle = clean(row['Rubrique']);
    const categorie = clean(row['Type']); // Recettes ou Dépenses
    const imp = clean(row['Imputation']);
    if (!code) continue;
    
    try {
      await client.query(
        `INSERT INTO rubriques (code, libelle, categorie, imp, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (code) DO UPDATE SET libelle = $2, categorie = $3, imp = $4`,
        [code, libelle, categorie, imp]
      );
      count++;
    } catch (e) {
      // Si contrainte unique n'existe pas, essayons un INSERT direct
      try {
        await client.query(
          `INSERT INTO rubriques (code, libelle, categorie, imp, is_active)
           VALUES ($1, $2, $3, $4, true)`,
          [code, libelle, categorie, imp]
        );
        count++;
      } catch (e2) {
        console.log(`  ⚠ Rubrique ${code}: ${e2.message.substring(0, 80)}`);
      }
    }
  }
  console.log(`  ✅ ${count}/${rows.length} rubriques importées`);
}

async function importServices(client) {
  console.log('\n📦 Import des SERVICES...');
  const { rows } = readCSV('Service.csv');
  if (rows.length === 0) return;
  
  let count = 0;
  for (const row of rows) {
    const code = clean(row['Code_Service']);
    const libelle = clean(row['Service']);
    if (!code) continue;
    
    try {
      await client.query(
        `INSERT INTO services (code, libelle, is_active) VALUES ($1, $2, true)
         ON CONFLICT DO NOTHING`,
        [code, libelle]
      );
      count++;
    } catch (e) {
      try {
        await client.query(
          `INSERT INTO services (code, libelle, is_active) VALUES ($1, $2, true)`,
          [code, libelle]
        );
        count++;
      } catch (e2) {
        console.log(`  ⚠ Service ${code}: ${e2.message.substring(0, 80)}`);
      }
    }
  }
  console.log(`  ✅ ${count}/${rows.length} services importés`);
}

async function importSignataires(client) {
  console.log('\n📦 Import des SIGNATAIRES...');
  const { rows } = readCSV('SIGNATAIRE.csv');
  if (rows.length === 0) return;
  
  // Vérifier si la table signataires existe
  const check = await client.query(
    `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='signataires')`
  );
  if (!check.rows[0].exists) {
    console.log('  ⚠ Table signataires inexistante, création...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS signataires (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        matricule TEXT,
        nom TEXT NOT NULL,
        fonction TEXT,
        grade TEXT,
        type_signature TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `);
  }
  
  let count = 0;
  for (const row of rows) {
    const matricule = clean(row['MAT']);
    const nom = clean(row['NOM']);
    const grade = clean(row['GRAD']);
    if (!nom) continue;
    
    try {
      await client.query(
        `INSERT INTO signataires (matricule, nom, grade, is_active) VALUES ($1, $2, $3, true)`,
        [matricule, nom, grade]
      );
      count++;
    } catch (e) {
      console.log(`  ⚠ Signataire ${nom}: ${e.message.substring(0, 80)}`);
    }
  }
  console.log(`  ✅ ${count}/${rows.length} signataires importés`);
}

async function importCategories(client) {
  console.log('\n📦 Import des CATEGORIES...');
  
  // Vérifier si la table existe  
  const check = await client.query(
    `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='categories')`
  );
  if (!check.rows[0].exists) {
    console.log('  ⚠ Table categories inexistante, création...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT,
        libelle TEXT NOT NULL,
        type TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `);
  }
  
  let count = 0;
  // Catégories de caisse (recettes)
  const { rows: catCaisse } = readCSV('CATCAISSE.csv');
  for (const row of catCaisse) {
    const code = clean(row['CODE']);
    const libelle = clean(row['LIBCATEG']);
    const type = clean(row['Categorie']);
    if (!libelle) continue;
    try {
      await client.query(
        `INSERT INTO categories (code, libelle, type, is_active) VALUES ($1, $2, $3, true)`,
        [code, libelle, type]
      );
      count++;
    } catch (e) {
      console.log(`  ⚠ Cat ${code}: ${e.message.substring(0, 80)}`);
    }
  }
  
  // Catégories de dépenses
  const { rows: catDep } = readCSV('CATDEP.csv');
  for (const row of catDep) {
    const code = clean(row['CODE']);
    const libelle = clean(row['LIBCATEG']);
    const type = clean(row['Categorie']);
    if (!libelle) continue;
    try {
      await client.query(
        `INSERT INTO categories (code, libelle, type, is_active) VALUES ($1, $2, $3, true)`,
        [code, libelle, type]
      );
      count++;
    } catch (e) {
      console.log(`  ⚠ Cat ${code}: ${e.message.substring(0, 80)}`);
    }
  }
  console.log(`  ✅ ${count} catégories importées`);
}

async function importContentieux(client) {
  console.log('\n📦 Import des CONTENTIEUX...');
  const { rows } = readCSV('CONTENTIEUX.csv');
  if (rows.length === 0) return;

  const check = await client.query(
    `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='contentieux')`
  );
  if (!check.rows[0].exists) {
    console.log('  ⚠ Table contentieux inexistante, création...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS contentieux (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT,
        libelle TEXT NOT NULL,
        montant NUMERIC(15,2) DEFAULT 0,
        rubrique_id UUID,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `);
  }
  
  let count = 0;
  for (const row of rows) {
    const code = clean(row['COD']);
    const libelle = clean(row['LIB']);
    const montant = parseAccessAmount(row['MT']) || 0;
    if (!libelle) continue;
    try {
      await client.query(
        `INSERT INTO contentieux (code, libelle, montant, is_active) VALUES ($1, $2, $3, true)`,
        [code, libelle, montant]
      );
      count++;
    } catch (e) {
      console.log(`  ⚠ Contentieux ${code}: ${e.message.substring(0, 80)}`);
    }
  }
  console.log(`  ✅ ${count}/${rows.length} contentieux importés`);
}

async function getRubriqueMap(client) {
  const res = await client.query('SELECT id, code FROM rubriques');
  const map = {};
  res.rows.forEach(r => { map[r.code] = r.id; });
  return map;
}

async function importRecettes(client) {
  console.log('\n📦 Import des RECETTES (RecettesF.csv)...');
  const { rows } = readCSV('RecettesF.csv');
  if (rows.length === 0) return;
  
  const rubriqueMap = await getRubriqueMap(client);
  
  // Obtenir les colonnes existantes de la table recettes
  const colResult = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='recettes'`
  );
  const existingCols = new Set(colResult.rows.map(r => r.column_name));
  
  let count = 0;
  let errors = 0;
  for (const row of rows) {
    // Ignorer les entrées supprimées
    if (row['SUPPRIM'] && row['SUPPRIM'].toUpperCase() === 'OUI') continue;
    
    const numeroBon = parseInt(row['Num_BE_Caisse']) || null;
    const dateTransaction = parseAccessDate(row['Date_Entree']);
    const heure = parseAccessTime(row['Heure_e']);
    const motif = clean(row['Motif_BE']);
    const montant = parseAccessAmount(row['MT_Chiffre_BE']);
    const montantLettre = clean(row['MT_Lttre_BE']);
    const provenance = clean(row['Recu_De']);
    const codeRubrique = clean(row['Code_Rubrique']);
    const numeroBeo = clean(row['Num_BE_Caisse']);
    
    if (!dateTransaction && !motif) continue;
    
    const columns = ['numero_bon', 'date', 'motif', 'montant', 'montant_lettre', 'provenance'];
    const values = [numeroBon, dateTransaction, motif, montant, montantLettre, provenance];
    let paramIdx = columns.length + 1;
    
    if (existingCols.has('heure') && heure) {
      columns.push('heure');
      values.push(heure);
    }
    if (existingCols.has('libelle')) {
      columns.push('libelle');
      values.push(motif);
    }
    if (existingCols.has('observation')) {
      columns.push('observation');
      values.push(null);
    }
    if (existingCols.has('Num_BE_Caisse')) {
      columns.push('"Num_BE_Caisse"');
      values.push(numeroBeo);
    }
    if (existingCols.has('Code_Rubrique')) {
      columns.push('"Code_Rubrique"');
      values.push(codeRubrique);
    }
    
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const colNames = columns.map(c => c.startsWith('"') ? c : `"${c}"`).join(', ');
    
    try {
      await client.query(
        `INSERT INTO recettes (${colNames}) VALUES (${placeholders})`,
        values
      );
      count++;
    } catch (e) {
      errors++;
      if (errors <= 3) console.log(`  ⚠ Recette #${numeroBon}: ${e.message.substring(0, 100)}`);
    }
  }
  if (errors > 3) console.log(`  ⚠ ... et ${errors - 3} autres erreurs`);
  console.log(`  ✅ ${count}/${rows.length} recettes importées (${errors} erreurs)`);
}

async function importDepenses(client) {
  console.log('\n📦 Import des DEPENSES (DepensesF.csv)...');
  const { rows } = readCSV('DepensesF.csv');
  if (rows.length === 0) return;
  
  const rubriqueMap = await getRubriqueMap(client);
  
  const colResult = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='depenses'`
  );
  const existingCols = new Set(colResult.rows.map(r => r.column_name));
  
  let count = 0;
  let errors = 0;
  for (const row of rows) {
    if (row['SUPPRIM'] && row['SUPPRIM'].toUpperCase() === 'OUI') continue;
    
    const numeroBon = parseInt(row['Num_BS_Caisse']) || null;
    const dateTransaction = parseAccessDate(row['Date_Sortie']);
    const heure = parseAccessTime(row['Heure_s']);
    const motif = clean(row['Motif_Bs']);
    const montant = parseAccessAmount(row['MT_Chiffre_BS']);
    const montantLettre = clean(row['MT_Lttre_BS']);
    const beneficiaire = clean(row['Benef']);
    const codeRubrique = clean(row['Code_Rubrique']);
    const rubriqueId = codeRubrique ? (rubriqueMap[codeRubrique] || null) : null;
    const nbeo = clean(row['NBEO']);
    
    if (!dateTransaction && !motif) continue;
    
    const columns = ['numero_bon', 'date', 'motif', 'montant', 'montant_lettre', 'beneficiaire'];
    const values = [numeroBon, dateTransaction, motif, montant, montantLettre, beneficiaire];
    
    if (rubriqueId && existingCols.has('rubrique_id')) {
      columns.push('rubrique_id');
      values.push(rubriqueId);
    }
    if (existingCols.has('heure') && heure) {
      columns.push('heure');
      values.push(heure);
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
    } catch (e) {
      errors++;
      if (errors <= 3) console.log(`  ⚠ Dépense #${numeroBon}: ${e.message.substring(0, 100)}`);
    }
  }
  if (errors > 3) console.log(`  ⚠ ... et ${errors - 3} autres erreurs`);
  console.log(`  ✅ ${count}/${rows.length} dépenses importées (${errors} erreurs)`);
}

async function importProgrammations(client) {
  console.log('\n📦 Import des PROGRAMMATIONS (DETPGM.csv)...');
  const { rows } = readCSV('DETPGM.csv');
  if (rows.length === 0) return;
  
  const rubriqueMap = await getRubriqueMap(client);
  
  const colResult = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='programmations'`
  );
  const existingCols = new Set(colResult.rows.map(r => r.column_name));
  
  // Mapper les mois en français vers des numéros
  const moisMap = {
    'JANVIER': 1, 'FEVRIER': 2, 'MARS': 3, 'AVRIL': 4,
    'MAI': 5, 'JUIN': 6, 'JUILLET': 7, 'AOUT': 8,
    'SEPTEMBRE': 9, 'OCTOBRE': 10, 'NOVEMBRE': 11, 'DECEMBRE': 12,
    'FÉVRIER': 2, 'AOÛT': 8
  };
  
  let count = 0;
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
    // Certaines tables ont user_id NOT NULL: utiliser un UUID par défaut
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
    } catch (e) {
      errors++;
      if (errors <= 3) console.log(`  ⚠ Prog: ${e.message.substring(0, 100)}`);
    }
  }
  if (errors > 3) console.log(`  ⚠ ... et ${errors - 3} autres erreurs`);
  console.log(`  ✅ ${count}/${rows.length} programmations importées (${errors} erreurs)`);
}

async function importFeuilleCaisse(client) {
  console.log('\n📦 Import des FEUILLES DE CAISSE (REPORTCAISSE.csv)...');
  const { rows } = readCSV('REPORTCAISSE.csv');
  if (rows.length === 0) return;
  
  let count = 0;
  let errors = 0;
  for (const row of rows) {
    const date = parseAccessDate(row['DAT']);
    const montant = parseAccessAmount(row['MT']);
    
    if (!date) continue;
    
    try {
      await client.query(
        `INSERT INTO feuilles_caisse (date, solde_initial, total_recettes, total_depenses, is_closed, user_id)
         VALUES ($1, $2, 0, 0, false, '00000000-0000-0000-0000-000000000000')`,
        [date, montant || 0]
      );
      count++;
    } catch (e) {
      errors++;
      if (errors <= 3) console.log(`  ⚠ Feuille ${date}: ${e.message.substring(0, 100)}`);
    }
  }
  if (errors > 3) console.log(`  ⚠ ... et ${errors - 3} autres erreurs`);
  console.log(`  ✅ ${count}/${rows.length} feuilles de caisse importées (${errors} erreurs)`);
}

// --- Programme principal ---
async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('   IMPORTATION BASE ACCESS → SUPABASE');
  console.log('   Base : Gestion_Caisse -06_10_16.mdb');
  console.log('═══════════════════════════════════════════════');
  
  const client = new Client({
    host: '127.0.0.1',
    port: 45322,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  });
  
  try {
    await client.connect();
    console.log('✅ Connexion à Supabase établie');
    
    // Désactiver RLS temporairement pour l'import
    const rlsTables = ['rubriques', 'services', 'signataires', 'categories', 'contentieux', 'recettes', 'depenses', 'programmations', 'feuilles_caisse'];
    for (const t of rlsTables) {
      try { await client.query(`ALTER TABLE "${t}" DISABLE ROW LEVEL SECURITY`); } catch(e) {}
    }
    console.log('✅ RLS désactivé pour l\'import');
    
    // Vider les tables existantes avant import
    console.log('\n🗑️  Nettoyage des anciennes données...');
    const tablesToClean = ['programmations', 'feuilles_caisse', 'depenses', 'recettes', 'contentieux', 'categories', 'signataires', 'services', 'rubriques'];
    for (const table of tablesToClean) {
      try {
        await client.query(`DELETE FROM "${table}"`);
        console.log(`  🧹 Table ${table} vidée`);
      } catch (e) {
        // Table n'existe peut-être pas
      }
    }
    
    // Importer dans l'ordre (dépendances d'abord)
    await importRubriques(client);
    await importServices(client);
    await importSignataires(client);
    await importCategories(client);
    await importContentieux(client);
    await importRecettes(client);
    await importDepenses(client);
    await importProgrammations(client);
    await importFeuilleCaisse(client);
    
    // Réactiver RLS
    for (const t of rlsTables) {
      try { await client.query(`ALTER TABLE "${t}" ENABLE ROW LEVEL SECURITY`); } catch(e) {}
    }
    
    // Statistiques finales
    console.log('\n═══════════════════════════════════════════════');
    console.log('   RÉSUMÉ DE L\'IMPORTATION');
    console.log('═══════════════════════════════════════════════');
    const stats = ['rubriques', 'services', 'signataires', 'categories', 'contentieux', 'recettes', 'depenses', 'programmations', 'feuilles_caisse'];
    for (const table of stats) {
      try {
        const res = await client.query(`SELECT COUNT(*) as c FROM "${table}"`);
        console.log(`  📊 ${table}: ${res.rows[0].c} enregistrements`);
      } catch (e) {
        // Ignore
      }
    }
    console.log('\n✅ Importation terminée avec succès !');
    
  } catch (err) {
    console.error('❌ Erreur:', err.message);
  } finally {
    await client.end();
  }
}

main();
