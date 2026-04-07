-- Réorganisation des rubriques selon la liste officielle DGDA
-- Suppression des anciennes rubriques (pas de FK dep car rubrique_id = 0 partout)
BEGIN;

DELETE FROM rubriques;

-- =====================
-- RECETTES (IMP 707820)
-- =====================
INSERT INTO rubriques (id, code, libelle, categorie, imp, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'REC-707820-01', 'Solde du mois antérieur',          'Recette', '707820', true, now(), now()),
  (gen_random_uuid(), 'REC-707820-02', 'DG, Prime de surveillance SEP',     'Recette', '707820', true, now(), now()),
  (gen_random_uuid(), 'REC-707820-03', 'KV, Fonctionnement Raw Bank',       'Recette', '707820', true, now(), now()),
  (gen_random_uuid(), 'REC-707820-04', 'KV, Fonctionnement BCDC',           'Recette', '707820', true, now(), now()),
  (gen_random_uuid(), 'REC-707820-05', 'KA, PV Contentieux',                'Recette', '707820', true, now(), now()),
  (gen_random_uuid(), 'REC-707820-06', 'KV, PV Contentieux',                'Recette', '707820', true, now(), now()),
  (gen_random_uuid(), 'REC-707820-07', 'KV, Prime surveillance Bracongo',   'Recette', '707820', true, now(), now()),
  (gen_random_uuid(), 'REC-707820-08', 'KV, Prime surveillance Bralima',    'Recette', '707820', true, now(), now()),
  (gen_random_uuid(), 'REC-707820-09', 'KV, Prime STDA',                    'Recette', '707820', true, now(), now()),
  (gen_random_uuid(), 'REC-707820-10', 'KV, Allocation décès',              'Recette', '707820', true, now(), now()),
  (gen_random_uuid(), 'REC-707820-11', 'DG, Fonctionnement',                'Recette', '707820', true, now(), now());

-- =====================
-- DÉPENSES
-- =====================
INSERT INTO rubriques (id, code, libelle, categorie, imp, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'DEP-604130', 'Articles alimentaires',                               'Dépense', '604130', true, now(), now()),
  (gen_random_uuid(), 'DEP-604210', 'Carburant et lubrifiant',                             'Dépense', '604210', true, now(), now()),
  (gen_random_uuid(), 'DEP-604300', 'Produits d''entretien',                               'Dépense', '604300', true, now(), now()),
  (gen_random_uuid(), 'DEP-604710', 'Fournitures de bureau',                               'Dépense', '604710', true, now(), now()),
  (gen_random_uuid(), 'DEP-604720', 'Consommables informatiques',                          'Dépense', '604720', true, now(), now()),
  (gen_random_uuid(), 'DEP-605100', 'Eau',                                                 'Dépense', '605100', true, now(), now()),
  (gen_random_uuid(), 'DEP-605200', 'Electricité',                                         'Dépense', '605200', true, now(), now()),
  (gen_random_uuid(), 'DEP-618120', 'Déplacement',                                         'Dépense', '618120', true, now(), now()),
  (gen_random_uuid(), 'DEP-622210', 'Loyers locaux et bureaux de service',                 'Dépense', '622210', true, now(), now()),
  (gen_random_uuid(), 'DEP-624000', 'Entretien, réparations et maintenance',               'Dépense', '624000', true, now(), now()),
  (gen_random_uuid(), 'DEP-626530', 'Abonnements',                                         'Dépense', '626530', true, now(), now()),
  (gen_random_uuid(), 'DEP-628100', 'Frais de communications et télécommunications',       'Dépense', '628100', true, now(), now()),
  (gen_random_uuid(), 'DEP-631000', 'Frais bancaire',                                      'Dépense', '631000', true, now(), now()),
  (gen_random_uuid(), 'DEP-632530', 'Frais de justice',                                    'Dépense', '632530', true, now(), now()),
  (gen_random_uuid(), 'DEP-632540', 'Paiement prime contentieuse',                         'Dépense', '632540', true, now(), now()),
  (gen_random_uuid(), 'DEP-632831', 'Frais médicaux',                                      'Dépense', '632831', true, now(), now()),
  (gen_random_uuid(), 'DEP-632840', 'Frais de gardiennage et sécurité',                    'Dépense', '632840', true, now(), now()),
  (gen_random_uuid(), 'DEP-632860', 'Frais d''impression, reproduction et reliure',        'Dépense', '632860', true, now(), now()),
  (gen_random_uuid(), 'DEP-638410', 'Frais de mission intérieur',                          'Dépense', '638410', true, now(), now()),
  (gen_random_uuid(), 'DEP-659800', 'Autres charges',                                      'Dépense', '659800', true, now(), now()),
  (gen_random_uuid(), 'DEP-661257', 'Prime du comptable',                                  'Dépense', '661257', true, now(), now()),
  (gen_random_uuid(), 'DEP-661272', 'Prime de surveillance SEP',                           'Dépense', '661272', true, now(), now()),
  (gen_random_uuid(), 'DEP-661273', 'Prime amendes transactionnelles',                     'Dépense', '661273', true, now(), now()),
  (gen_random_uuid(), 'DEP-663841', 'Collations',                                          'Dépense', '663841', true, now(), now()),
  (gen_random_uuid(), 'DEP-668340', 'Frais funéraires et assistance deuil',                'Dépense', '668340', true, now(), now()),
  (gen_random_uuid(), 'DEP-668360', 'Aide & secours',                                      'Dépense', '668360', true, now(), now()),
  (gen_random_uuid(), 'DEP-000000-01', 'Fonctionnement SEP',                               'Dépense', '000000', true, now(), now()),
  (gen_random_uuid(), 'DEP-000000-02', 'Fonctionnement secr DP',                           'Dépense', '000000', true, now(), now()),
  (gen_random_uuid(), 'DEP-000000-03', 'Fonctionnement unité genre',                       'Dépense', '000000', true, now(), now()),
  (gen_random_uuid(), 'DEP-000000-04', 'Fonctionnement Zone économique',                   'Dépense', '000000', true, now(), now()),
  (gen_random_uuid(), 'DEP-000000-05', 'Fonctionnement Beach Ngobila',                     'Dépense', '000000', true, now(), now()),
  (gen_random_uuid(), 'DEP-000000-06', 'Fonctionnement Nocafex',                           'Dépense', '000000', true, now(), now()),
  (gen_random_uuid(), 'DEP-000000-07', 'Fonctionnement Lerexcom',                          'Dépense', '000000', true, now(), now()),
  (gen_random_uuid(), 'DEP-000000-08', 'Fonctionnement GU',                                'Dépense', '000000', true, now(), now()),
  (gen_random_uuid(), 'DEP-000000-09', 'Fonctionnement Délégation syndicale',              'Dépense', '000000', true, now(), now());

SELECT categorie, COUNT(*) as nb FROM rubriques GROUP BY categorie ORDER BY categorie;
SELECT 'Total rubriques:' as info, COUNT(*) as nb FROM rubriques;

COMMIT;
