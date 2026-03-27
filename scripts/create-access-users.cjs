/**
 * Script pour créer les utilisateurs de la base Access dans local_users
 * Compatible avec le hachage de la Edge Function local-auth
 */
const crypto = require('crypto');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Hash compatible avec la Edge Function local-auth
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const passwordData = Buffer.from(password, 'utf-8');
  
  const combined = Buffer.concat([salt, passwordData]);
  const hash = crypto.createHash('sha256').update(combined).digest();
  
  const result = Buffer.concat([salt, hash]);
  return result.toString('base64');
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('   CRÉATION DES UTILISATEURS ACCESS');
  console.log('═══════════════════════════════════════════');

  // Les utilisateurs de la base Access
  const CSV_DIR = path.join(__dirname, '..', 'access-exports');
  const content = fs.readFileSync(path.join(CSV_DIR, 'User.csv'), 'utf-8');
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  
  const users = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].match(/"([^"]*)"/g);
    if (parts && parts.length >= 3) {
      const compte = parts[0].replace(/"/g, '');
      const pwd = parts[1].replace(/"/g, '');
      const categorie = parts[2].replace(/"/g, '');
      users.push({ compte, pwd, categorie });
    }
  }

  console.log(`\n📋 ${users.length} utilisateurs trouvés dans User.csv :`);
  users.forEach(u => console.log(`  - ${u.compte} (${u.categorie})`));

  const client = new Client({
    host: '127.0.0.1',
    port: 45322,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  });

  try {
    await client.connect();
    
    // Vérifier les colonnes de local_users
    const colResult = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='local_users' ORDER BY ordinal_position`
    );
    const cols = colResult.rows.map(r => r.column_name);
    console.log(`\n📊 Colonnes de local_users: ${cols.join(', ')}`);

    for (const user of users) {
      const username = user.compte.toLowerCase();
      const passwordHash = hashPassword(user.pwd);
      const role = user.categorie === 'Administrateur' ? 'admin' : 'instructeur';
      const fullName = user.compte;

      try {
        // Vérifier si l'utilisateur existe déjà
        const existing = await client.query(
          'SELECT id FROM local_users WHERE username = $1', [username]
        );
        
        if (existing.rows.length > 0) {
          // Mettre à jour le mot de passe
          await client.query(
            `UPDATE local_users SET password_hash = $1, role = $2, is_active = true, 
             failed_attempts = 0, locked_until = NULL WHERE username = $3`,
            [passwordHash, role, username]
          );
          console.log(`  🔄 Utilisateur ${username} mis à jour`);
        } else {
          // Créer l'utilisateur
          await client.query(
            `INSERT INTO local_users (username, password_hash, full_name, role, is_active, failed_attempts)
             VALUES ($1, $2, $3, $4, true, 0)`,
            [username, passwordHash, fullName, role]
          );
          console.log(`  ✅ Utilisateur ${username} créé (role: ${role})`);
        }
      } catch (e) {
        console.log(`  ⚠ Erreur pour ${username}: ${e.message}`);
      }
    }

    // Vérification
    const result = await client.query('SELECT username, role, is_active FROM local_users ORDER BY username');
    console.log('\n📊 Utilisateurs dans la base :');
    result.rows.forEach(r => console.log(`  - ${r.username} (${r.role}, actif: ${r.is_active})`));

    console.log('\n═══════════════════════════════════════════');
    console.log('   IDENTIFIANTS DE CONNEXION');
    console.log('═══════════════════════════════════════════');
    users.forEach(u => {
      console.log(`  👤 ${u.compte.toLowerCase()} / ${u.pwd}`);
    });

  } catch (err) {
    console.error('❌ Erreur:', err.message);
  } finally {
    await client.end();
  }
}

main();
