// Script Node.js pour insérer les données CSV dans PostgreSQL
// Prérequis : npm install pg papaparse

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { Client } = require('pg');

// À personnaliser selon votre configuration Docker/Postgres
const client = new Client({
  host: 'localhost', // ou l'adresse de votre conteneur Docker
  port: 54322,        // port par défaut de Postgres
  user: 'postgres',  // utilisateur
  password: 'postgres', // <-- MODIFIEZ ICI avec votre mot de passe
  database: 'postgres', // <-- MODIFIEZ ICI avec le nom de votre base
});

const TABLES = [
  { name: 'recettes', file: 'recettes.csv' },
  { name: 'depenses', file: 'depenses.csv' },
  { name: 'rubriques', file: 'rubriques.csv' },
];

async function importCsvToTable(table, file) {
  const csvPath = path.join(__dirname, '..', 'public', file);
  if (!fs.existsSync(csvPath)) {
    console.error(`Fichier non trouvé : ${csvPath}`);
    return;
  }
  const csvData = fs.readFileSync(csvPath, 'utf8');
  const { data } = Papa.parse(csvData, { header: true, skipEmptyLines: true });
  if (!data.length) {
    console.log(`Aucune donnée à insérer pour ${table}`);
    return;
  }
  // Générer la requête d'insertion dynamique avec respect de la casse
  const columns = Object.keys(data[0]);
  const values = data.map(row => columns.map(col => row[col] || null));
  const placeholders = values.map((row, i) => `(${row.map((_, j) => `$${i * columns.length + j + 1}`).join(',')})`).join(',');
  const flatValues = values.flat();
  // Utiliser les noms de colonnes du CSV entre guillemets pour respecter la casse
  const query = `INSERT INTO ${table} (${columns.map(col => '"' + col + '"').join(',')}) VALUES ${placeholders}`;
  try {
    await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
    await client.query(query, flatValues);
    console.log(`Import de ${file} terminé dans la table ${table}`);
  } catch (err) {
    console.error(`Erreur lors de l'import dans ${table} :`, err.message);
  }
}

(async () => {
  try {
    await client.connect();
    for (const { name, file } of TABLES) {
      await importCsvToTable(name, file);
    }
    await client.end();
    console.log('Import terminé.');
  } catch (err) {
    console.error('Erreur de connexion à la base :', err.message);
  }
})();
