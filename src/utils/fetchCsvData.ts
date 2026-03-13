// Utilitaire pour charger un CSV depuis le dossier public et le parser en JSON
// Nécessite d'installer papaparse : npm install papaparse
import Papa from 'papaparse';

export async function fetchCsvData(fileName) {
  return new Promise((resolve, reject) => {
    fetch(`/${fileName}`)
      .then((response) => {
        if (!response.ok) throw new Error('Fichier non trouvé');
        return response.text();
      })
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results.data),
          error: (err) => reject(err),
        });
      })
      .catch(reject);
  });
}
