-- Suppression définitive des lignes 270, 271, 272, 273 (doublons du 26/12/2025)
-- IDs confirmés par vérification préalable

BEGIN;

DELETE FROM depenses
WHERE id IN (
  'd2043aee-62f3-45f5-aa56-f9260b3bbb86',  -- N°BEO: 7165 B  | Déplacement ISDEE    | 656 000
  '12379384-655d-44f3-8438-df687a271c84',  -- N°BEO: 7165/B  | Déplacement ISDEE    | 656 000
  '9fb80a09-ad64-494f-afa3-6f5002d9fd99',  -- N°BEO: 7165A   | Frais méd. Fungu Langa | 550 000
  'f9ffa193-fbf9-471b-97c0-d3e9a485b8ed'   -- N°BEO: 7165A   | Frais méd. Fungu Langa | 550 000 (doublon)
);

-- Vérification : ces IDs ne doivent plus exister
SELECT COUNT(*) AS restant FROM depenses
WHERE id IN (
  'd2043aee-62f3-45f5-aa56-f9260b3bbb86',
  '12379384-655d-44f3-8438-df687a271c84',
  '9fb80a09-ad64-494f-afa3-6f5002d9fd99',
  'f9ffa193-fbf9-471b-97c0-d3e9a485b8ed'
);

COMMIT;
