INSERT INTO rubriques (id, code, libelle, categorie, imp, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'DEP-000000-10', 'Service extérieur',           'Dépense', '000000', true, now(), now()),
  (gen_random_uuid(), 'DEP-000000-11', 'Salubrité',                   'Dépense', '000000', true, now(), now()),
  (gen_random_uuid(), 'DEP-000000-12', 'Plomberie',                   'Dépense', '000000', true, now(), now()),
  (gen_random_uuid(), 'DEP-000000-13', 'Manutention',                 'Dépense', '000000', true, now(), now()),
  (gen_random_uuid(), 'DEP-000000-14', 'Prêt accordé',                'Dépense', '000000', true, now(), now()),
  (gen_random_uuid(), 'DEP-000000-15', 'Achat serrure, pendule',      'Dépense', '000000', true, now(), now()),
  (gen_random_uuid(), 'DEP-000000-16', 'Prime STDA',                  'Dépense', '000000', true, now(), now()),
  (gen_random_uuid(), 'DEP-000000-17', 'Prime Bralima',               'Dépense', '000000', true, now(), now()),
  (gen_random_uuid(), 'DEP-000000-18', 'Prime Bracongo',              'Dépense', '000000', true, now(), now()),
  (gen_random_uuid(), 'DEP-000000-19', 'Motivation aux aviseurs',     'Dépense', '000000', true, now(), now()),
  (gen_random_uuid(), 'DEP-000000-20', 'Elaboration rapport de paie', 'Dépense', '000000', true, now(), now());

SELECT 'Total rubriques:' as info, COUNT(*) as nb FROM rubriques;
SELECT imp, COUNT(*) as nb FROM rubriques GROUP BY imp ORDER BY imp;
