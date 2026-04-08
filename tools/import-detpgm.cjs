const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:45321',
  'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
);

const MOIS_MAP = {
  'JANVIER': '01', 'FEVRIER': '02', 'MARS': '03', 'AVRIL': '04',
  'MAI': '05', 'JUIN': '06', 'JUILLET': '07', 'AOUT': '08',
  'SEPTEMBRE': '09', 'OCTOBRE': '10', 'NOVEMBRE': '11', 'DECEMBRE': '12'
};

async function main() {
  const raw = fs.readFileSync('./access-exports/DETPGM.csv', 'utf-8');
  // Parse CSV (handle quoted fields with newlines)
  const rows = [];
  let current = '';
  let inQuotes = false;
  for (const ch of raw) {
    if (ch === '"') { inQuotes = !inQuotes; current += ch; }
    else if (ch === '\n' && !inQuotes) { rows.push(current); current = ''; }
    else { current += ch; }
  }
  if (current.trim()) rows.push(current);

  const header = rows[0];
  console.log('Header:', header);
  console.log(`Total data rows: ${rows.length - 1}`);

  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const line = rows[i].trim();
    if (!line) continue;
    // Parse CSV fields
    const fields = [];
    let field = '';
    let q = false;
    for (const c of line) {
      if (c === '"') { q = !q; }
      else if (c === ',' && !q) { fields.push(field.trim()); field = ''; }
      else { field += c; }
    }
    fields.push(field.trim());

    const numero = parseInt(fields[0]) || 0;
    const lib = (fields[3] || '').replace(/[\r\n]+/g, ' ').trim();
    const mt = parseFloat(fields[4]) || 0;
    const mois = (fields[5] || '').trim().toUpperCase();
    const annee = (fields[6] || '').trim();
    const code = (fields[8] || '').trim();
    const comptable = (fields[10] || '').trim();
    const daf = (fields[11] || '').trim();
    const dp = (fields[12] || '').trim();

    if (!lib || !mois || !annee) continue;

    records.push({
      numero,
      libelle: lib,
      montant: mt,
      mois,
      annee,
      code: code || null,
      comptable: comptable || null,
      daf: daf || null,
      dp: dp || null,
    });
  }

  console.log(`Parsed ${records.length} records`);

  // Insert in batches of 500
  let inserted = 0;
  for (let i = 0; i < records.length; i += 500) {
    const batch = records.slice(i, i + 500);
    const { error } = await supabase.from('programmation_depenses').insert(batch);
    if (error) {
      console.error(`Batch ${i}: ${error.message}`);
    } else {
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${records.length}`);
    }
  }
  console.log('Done!');
}

main().catch(console.error);
