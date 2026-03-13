// Script d'extraction des tables recettes, depenses et rubriques depuis Supabase vers CSV
// Prérequis : npm install @supabase/supabase-js json2csv

const { createObjectCsvWriter } = require('json2csv');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// À personnaliser :
const SUPABASE_URL = 'VOTRE_SUPABASE_URL'; // Exemple : https://xxxx.supabase.co
const SUPABASE_KEY = 'VOTRE_SUPABASE_KEY'; // Clé service role ou publishable

const TABLES = ['recettes', 'depenses', 'rubriques'];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function exportTableToCSV(table) {
  const { data, error } = await supabase.from(table).select('*');
  if (error) {
    console.error(`Erreur lors de l'extraction de ${table}:`, error.message);
    return;
  }
  if (!data || data.length === 0) {
    console.log(`Aucune donnée trouvée pour la table ${table}`);
    return;
  }
  const csvWriter = createObjectCsvWriter({
    path: `${table}.csv`,
    header: Object.keys(data[0]).map((key) => ({ id: key, title: key })),
    alwaysQuote: true,
  });
  await csvWriter.writeRecords(data);
  console.log(`Table ${table} exportée dans ${table}.csv`);
}

(async () => {
  for (const table of TABLES) {
    await exportTableToCSV(table);
  }
  console.log('Export terminé.');
})();
