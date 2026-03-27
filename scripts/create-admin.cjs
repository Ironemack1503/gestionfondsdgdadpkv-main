const crypto = require('crypto');
const { Client } = require('pg');

const salt = crypto.randomBytes(16);
const pwd = Buffer.from('admin1503', 'utf8');
const combined = Buffer.concat([salt, pwd]);
const digest = crypto.createHash('sha256').update(combined).digest();
const hash = Buffer.concat([salt, digest]).toString('base64');

const client = new Client({
  host: '127.0.0.1',
  port: 45322,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres'
});

(async () => {
  await client.connect();
  await client.query("DELETE FROM public.local_users WHERE username = 'admin'");
  const res = await client.query(
    "INSERT INTO public.local_users (id, username, password_hash, full_name, role, is_active, is_protected, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, true, true, now(), now()) RETURNING id, username, role",
    ['admin', hash, 'Administrateur', 'admin']
  );
  console.log('Utilisateur créé:', res.rows[0]);
  await client.end();
})();
