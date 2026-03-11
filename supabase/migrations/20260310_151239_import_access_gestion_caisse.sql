-- Migration de la base Access : Gestion_Caisse
-- ImportÃ©e le : 2026-03-10 15:12:36

CREATE TABLE IF NOT EXISTS "AV_REPORT" (
  id BIGSERIAL PRIMARY KEY,
  "REC" TEXT,
  "DEP" TEXT,
  "Date_Mvt" TIMESTAMP,
  "Date_Mvt1" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AV_REPORT_Old" (
  id BIGSERIAL PRIMARY KEY,
  "Date_Mvt" TIMESTAMP,
  "Date_Mvt1" TIMESTAMP,
  "MT_Chiffre_Mvt_R" TEXT,
  "MT_Chiffre_Mvt_D" TEXT
);

CREATE TABLE IF NOT EXISTS "CATCAISSE" (
  id BIGSERIAL PRIMARY KEY,
  "CODE" TEXT,
  "LIBCATEG" TEXT,
  "Categorie" TEXT,
  "NUM" TEXT
);

CREATE TABLE IF NOT EXISTS "CATDEP" (
  id BIGSERIAL PRIMARY KEY,
  "CODE" TEXT,
  "LIBCATEG" TEXT,
  "Categorie" TEXT,
  "NUM" TEXT
);

CREATE TABLE IF NOT EXISTS "CATDEPTEST" (
  id BIGSERIAL PRIMARY KEY,
  "CODE" TEXT,
  "LIBCATEG" TEXT,
  "Categorie" TEXT
);

CREATE TABLE IF NOT EXISTS "CATEGDEP" (
  id BIGSERIAL PRIMARY KEY,
  "Categorie" TEXT
);

CREATE TABLE IF NOT EXISTS "Categorie" (
  id BIGSERIAL PRIMARY KEY,
  "Categorie" TEXT
);

CREATE TABLE IF NOT EXISTS "CONTENTIEUX" (
  id BIGSERIAL PRIMARY KEY,
  "COD" TEXT,
  "LIB" TEXT,
  "CODE" TEXT,
  "MT" TEXT,
  "NUM" TEXT
);

CREATE TABLE IF NOT EXISTS "Copie de Mouvements" (
  id BIGSERIAL PRIMARY KEY,
  "Num_Auto_Mvt" TEXT,
  "Num_Mvt" TEXT,
  "Mvt" TEXT,
  "MT_Chiffre_Mvt_R" TEXT,
  "MT_Chiffre_Mvt_D" TEXT,
  "MT_Lttre_Mvt" TEXT,
  "Motif_Mvt" TEXT,
  "Date_Mvt" TIMESTAMP,
  "Date_Mvt1" TIMESTAMP,
  "Code_Service" TEXT,
  "Service_Mvt" TEXT,
  "Solde_Av_Mvt" TEXT,
  "Solde_Av_Mvt1" DECIMAL(15,2),
  "Solde_Ap_Mvt" TEXT,
  "Solde_Ap_Mvt1" DECIMAL(15,2),
  "Heure_Mvt" TEXT,
  "Benef_Mvt" TEXT,
  "Code_Rubrique" TEXT,
  "Rubrique_Mvt" TEXT,
  "MODIF" TEXT
);

CREATE TABLE IF NOT EXISTS "Depenses" (
  id BIGSERIAL PRIMARY KEY,
  "Num_Auto_Bc" TEXT,
  "Num_BS_Caisse" TEXT,
  "Motif_Bs" TEXT,
  "MT_Chiffre_BS" TEXT,
  "MT_Lttre_BS" TEXT,
  "Date_Sortie" TIMESTAMP,
  "Date_Sortie1" TIMESTAMP,
  "Code_Service" TEXT,
  "Heure_s" TEXT,
  "Benef" TEXT,
  "Code_Rubrique" TEXT,
  "COD" TEXT,
  "SUPPRIM" TEXT,
  "NBEO" TEXT
);

CREATE TABLE IF NOT EXISTS "Depenses1" (
  id BIGSERIAL PRIMARY KEY,
  "Num_Auto_Bc" TEXT,
  "Num_BS_Caisse" TEXT,
  "Motif_Bs" TEXT,
  "MT_Chiffre_BS" TEXT,
  "MT_Lttre_BS" TEXT,
  "Date_Sortie" TIMESTAMP,
  "Date_Sortie1" TIMESTAMP,
  "Code_Service" TEXT,
  "Heure_s" TEXT,
  "Benef" TEXT,
  "Code_Rubrique" TEXT
);

CREATE TABLE IF NOT EXISTS "Depenses2" (
  id BIGSERIAL PRIMARY KEY,
  "Num_Auto_Bc" TEXT,
  "Num_BS_Caisse" TEXT,
  "Motif_Bs" TEXT,
  "MT_Chiffre_BS" TEXT,
  "MT_Lttre_BS" TEXT,
  "Date_Sortie" TIMESTAMP,
  "Date_Sortie1" TIMESTAMP,
  "Code_Service" TEXT,
  "Heure_s" TEXT,
  "Benef" TEXT,
  "Code_Rubrique" TEXT
);

CREATE TABLE IF NOT EXISTS "DepensesF" (
  id BIGSERIAL PRIMARY KEY,
  "Num_Auto_Bc" TEXT,
  "Num_BS_Caisse" TEXT,
  "Motif_Bs" TEXT,
  "MT_Chiffre_BS" TEXT,
  "MT_Lttre_BS" TEXT,
  "Date_Sortie" TIMESTAMP,
  "Date_Sortie1" TIMESTAMP,
  "Code_Service" TEXT,
  "Heure_s" TEXT,
  "Benef" TEXT,
  "Code_Rubrique" TEXT,
  "COD" TEXT,
  "SUPPRIM" TEXT,
  "NBEO" TEXT
);

CREATE TABLE IF NOT EXISTS "DEPT" (
  id BIGSERIAL PRIMARY KEY,
  "COD" TEXT,
  "LIB" TEXT
);

CREATE TABLE IF NOT EXISTS "DESPGM" (
  id BIGSERIAL PRIMARY KEY,
  "RUB" TEXT,
  "NUM" TEXT
);

CREATE TABLE IF NOT EXISTS "DETPGM" (
  id BIGSERIAL PRIMARY KEY,
  "NUMERO" TEXT,
  "Code_Rubrique" TEXT,
  "NP" TEXT,
  "LIB" TEXT,
  "MT" TEXT,
  "MOIS" TEXT,
  "ANNE" TEXT,
  "MOISAN" TEXT,
  "JRS" TEXT,
  "PER" TEXT,
  "PER2" DECIMAL(15,2),
  "DAT" TEXT,
  "DAT1" DECIMAL(15,2),
  "ML" TEXT,
  "COMPT" TEXT,
  "DAF" TEXT,
  "DP" TEXT,
  "GRAD" TEXT,
  "GRADCOMPT" TEXT,
  "GRADAF" TEXT,
  "CODE" TEXT,
  "DATF" TEXT
);

CREATE TABLE IF NOT EXISTS "Mouvement" (
  id BIGSERIAL PRIMARY KEY,
  "Num_Auto_Mvt" TEXT,
  "Num_Mvt" TEXT,
  "Mvt" TEXT,
  "MT_Chiffre_Mvt_R" TEXT,
  "MT_Chiffre_Mvt_D" TEXT,
  "MT_Lttre_Mvt" TEXT,
  "Motif_Mvt" TEXT,
  "Date_Mvt" TIMESTAMP,
  "Date_Mvt1" TIMESTAMP,
  "Code_Service" TEXT,
  "Service_Mvt" TEXT,
  "Solde_Av_Mvt" TEXT,
  "Solde_Av_Mvt1" DECIMAL(15,2),
  "Solde_Ap_Mvt" TEXT,
  "Solde_Ap_Mvt1" DECIMAL(15,2),
  "Heure_Mvt" TEXT,
  "Benef_Mvt" TEXT,
  "Code_Rubrique" TEXT,
  "Rubrique_Mvt" TEXT,
  "REP" TEXT
);

CREATE TABLE IF NOT EXISTS "Mouvements1" (
  id BIGSERIAL PRIMARY KEY,
  "Num_Auto_Mvt" TEXT,
  "Num_Mvt" TEXT,
  "Mvt" TEXT,
  "MT_Chiffre_Mvt_R" TEXT,
  "MT_Chiffre_Mvt_D" TEXT,
  "MT_Lttre_Mvt" TEXT,
  "Motif_Mvt" TEXT,
  "Date_Mvt" TIMESTAMP,
  "Date_Mvt1" TIMESTAMP,
  "Code_Service" TEXT,
  "Service_Mvt" TEXT,
  "Solde_Av_Mvt" TEXT,
  "Solde_Av_Mvt1" DECIMAL(15,2),
  "Solde_Ap_Mvt" TEXT,
  "Solde_Ap_Mvt1" DECIMAL(15,2),
  "Heure_Mvt" TEXT,
  "Benef_Mvt" TEXT,
  "Code_Rubrique" TEXT,
  "Rubrique_Mvt" TEXT
);

CREATE TABLE IF NOT EXISTS "Mouvements2" (
  id BIGSERIAL PRIMARY KEY,
  "Num_Auto_Mvt" TEXT,
  "Num_Mvt" TEXT,
  "Mvt" TEXT,
  "MT_Chiffre_Mvt_R" TEXT,
  "MT_Chiffre_Mvt_D" TEXT,
  "MT_Lttre_Mvt" TEXT,
  "Motif_Mvt" TEXT,
  "Date_Mvt" TIMESTAMP,
  "Date_Mvt1" TIMESTAMP,
  "Code_Service" TEXT,
  "Service_Mvt" TEXT,
  "Solde_Av_Mvt" TEXT,
  "Solde_Av_Mvt1" DECIMAL(15,2),
  "Solde_Ap_Mvt" TEXT,
  "Solde_Ap_Mvt1" DECIMAL(15,2),
  "Heure_Mvt" TEXT,
  "Benef_Mvt" TEXT,
  "Code_Rubrique" TEXT,
  "Rubrique_Mvt" TEXT,
  "MODIF" TEXT
);

CREATE TABLE IF NOT EXISTS "Mouvements5" (
  id BIGSERIAL PRIMARY KEY,
  "Num_Auto_Mvt" TEXT,
  "Num_Mvt" TEXT,
  "Mvt" TEXT,
  "MT_Chiffre_Mvt_R" TEXT,
  "MT_Chiffre_Mvt_D" TEXT,
  "MT_Lttre_Mvt" TEXT,
  "Motif_Mvt" TEXT,
  "Date_Mvt" TIMESTAMP,
  "Date_Mvt1" TIMESTAMP,
  "Code_Service" TEXT,
  "Service_Mvt" TEXT,
  "Solde_Av_Mvt" TEXT,
  "Solde_Av_Mvt1" DECIMAL(15,2),
  "Solde_Ap_Mvt" TEXT,
  "Solde_Ap_Mvt1" DECIMAL(15,2),
  "Heure_Mvt" TEXT,
  "Benef_Mvt" TEXT,
  "Code_Rubrique" TEXT,
  "Rubrique_Mvt" TEXT,
  "REP" TEXT
);

CREATE TABLE IF NOT EXISTS "MouvementsF" (
  id BIGSERIAL PRIMARY KEY,
  "Num_Auto_Mvt" TEXT,
  "Num_Mvt" TEXT,
  "Mvt" TEXT,
  "Categorie" TEXT,
  "Categdep" TEXT,
  "MT_Chiffre_Mvt_R" TEXT,
  "MT_Chiffre_Mvt_D" TEXT,
  "TYPE" TEXT,
  "DESIGN" TEXT,
  "MOISAN" TEXT,
  "MT_Lttre_Mvt" TEXT,
  "Motif_Mvt" TEXT,
  "Date_Mvt" TIMESTAMP,
  "Date_Mvt1" TIMESTAMP,
  "NORD" TEXT,
  "DATBEO" TEXT,
  "Code_Service" TEXT,
  "Service_Mvt" TEXT,
  "COMPT" TEXT,
  "DAF" TEXT,
  "DP" TEXT,
  "GDP" TEXT,
  "Solde_Av_Mvt" TEXT,
  "Solde_Av_Mvt1" DECIMAL(15,2),
  "Solde_Ap_Mvt" TEXT,
  "Solde_Ap_Mvt1" DECIMAL(15,2),
  "Heure_Mvt" TEXT,
  "Benef_Mvt" TEXT,
  "Code_Rubrique" TEXT,
  "Rubrique_Mvt" TEXT,
  "REP" TEXT,
  "CODE" TEXT,
  "MOIS" TEXT,
  "ANNE" TEXT,
  "MOISAN2" DECIMAL(15,2),
  "NBEO" TEXT,
  "MLMOIS" TEXT,
  "DATF" TEXT,
  "TITRE" TEXT,
  "COD" TEXT
);

CREATE TABLE IF NOT EXISTS "MouvementsF2023" (
  id BIGSERIAL PRIMARY KEY,
  "Num_Auto_Mvt" TEXT,
  "Num_Mvt" TEXT,
  "Mvt" TEXT,
  "Categorie" TEXT,
  "Categdep" TEXT,
  "MT_Chiffre_Mvt_R" TEXT,
  "MT_Chiffre_Mvt_D" TEXT,
  "TYPE" TEXT,
  "DESIGN" TEXT,
  "MOISAN" TEXT,
  "MT_Lttre_Mvt" TEXT,
  "Motif_Mvt" TEXT,
  "Date_Mvt" TIMESTAMP,
  "Date_Mvt1" TIMESTAMP,
  "NORD" TEXT,
  "DATBEO" TEXT,
  "Code_Service" TEXT,
  "Service_Mvt" TEXT,
  "COMPT" TEXT,
  "DAF" TEXT,
  "DP" TEXT,
  "GDP" TEXT,
  "Solde_Av_Mvt" TEXT,
  "Solde_Av_Mvt1" DECIMAL(15,2),
  "Solde_Ap_Mvt" TEXT,
  "Solde_Ap_Mvt1" DECIMAL(15,2),
  "Heure_Mvt" TEXT,
  "Benef_Mvt" TEXT,
  "Code_Rubrique" TEXT,
  "Rubrique_Mvt" TEXT,
  "REP" TEXT,
  "CODE" TEXT,
  "MOIS" TEXT,
  "ANNE" TEXT,
  "MOISAN2" DECIMAL(15,2),
  "NBEO" TEXT,
  "MLMOIS" TEXT,
  "DATF" TEXT,
  "TITRE" TEXT,
  "COD" TEXT
);

CREATE TABLE IF NOT EXISTS "MouvementsFavant" (
  id BIGSERIAL PRIMARY KEY,
  "Num_Auto_Mvt" TEXT,
  "Num_Mvt" TEXT,
  "Mvt" TEXT,
  "Categorie" TEXT,
  "Categdep" TEXT,
  "MT_Chiffre_Mvt_R" TEXT,
  "MT_Chiffre_Mvt_D" TEXT,
  "MT_Lttre_Mvt" TEXT,
  "Motif_Mvt" TEXT,
  "Date_Mvt" TIMESTAMP,
  "Date_Mvt1" TIMESTAMP,
  "DATBEO" TEXT,
  "TYPE" TEXT,
  "DESIGN" TEXT,
  "Code_Service" TEXT,
  "Service_Mvt" TEXT,
  "COMPT" TEXT,
  "DAF" TEXT,
  "DP" TEXT,
  "Solde_Av_Mvt" TEXT,
  "Solde_Av_Mvt1" DECIMAL(15,2),
  "Solde_Ap_Mvt" TEXT,
  "Solde_Ap_Mvt1" DECIMAL(15,2),
  "Heure_Mvt" TEXT,
  "Benef_Mvt" TEXT,
  "Code_Rubrique" TEXT,
  "Rubrique_Mvt" TEXT,
  "REP" TEXT,
  "CODE" TEXT,
  "MOIS" TEXT,
  "ANNE" TEXT,
  "MOISAN" TEXT,
  "MOISAN2" DECIMAL(15,2),
  "NBEO" TEXT,
  "MLMOIS" TEXT,
  "DATF" TEXT,
  "TITRE" TEXT,
  "COD" TEXT
);

CREATE TABLE IF NOT EXISTS "NUMERO" (
  id BIGSERIAL PRIMARY KEY,
  "COD" TEXT
);

CREATE TABLE IF NOT EXISTS "NUMERO2" (
  id BIGSERIAL PRIMARY KEY,
  "CD" TEXT,
  "LIB" TEXT
);

CREATE TABLE IF NOT EXISTS "PROGRAMME" (
  id BIGSERIAL PRIMARY KEY,
  "NP" TEXT,
  "DAT" TEXT,
  "DAT1" DECIMAL(15,2)
);

CREATE TABLE IF NOT EXISTS "Recettes" (
  id BIGSERIAL PRIMARY KEY,
  "Num_Auto_BE" TEXT,
  "Num_BE_Caisse" TEXT,
  "Motif_BE" TEXT,
  "MT_Chiffre_BE" TEXT,
  "MT_Lttre_BE" TEXT,
  "Date_Entree" TIMESTAMP,
  "Date_Entree1" TIMESTAMP,
  "Code_Service" TEXT,
  "Heure_e" TEXT,
  "Recu_De" TEXT,
  "Code_Rubrique" TEXT,
  "SUPPRIM" TEXT
);

CREATE TABLE IF NOT EXISTS "Recettes1" (
  id BIGSERIAL PRIMARY KEY,
  "Num_Auto_BE" TEXT,
  "Num_BE_Caisse" TEXT,
  "Motif_BE" TEXT,
  "MT_Chiffre_BE" TEXT,
  "MT_Lttre_BE" TEXT,
  "Date_Entree" TIMESTAMP,
  "Date_Entree1" TIMESTAMP,
  "Code_Service" TEXT,
  "Heure_e" TEXT,
  "Recu_De" TEXT,
  "Code_Rubrique" TEXT
);

CREATE TABLE IF NOT EXISTS "Recettes2" (
  id BIGSERIAL PRIMARY KEY,
  "Num_Auto_BE" TEXT,
  "Num_BE_Caisse" TEXT,
  "Motif_BE" TEXT,
  "MT_Chiffre_BE" TEXT,
  "MT_Lttre_BE" TEXT,
  "Date_Entree" TIMESTAMP,
  "Date_Entree1" TIMESTAMP,
  "Code_Service" TEXT,
  "Heure_e" TEXT,
  "Recu_De" TEXT,
  "Code_Rubrique" TEXT
);

CREATE TABLE IF NOT EXISTS "RecettesF" (
  id BIGSERIAL PRIMARY KEY,
  "Num_Auto_BE" TEXT,
  "Num_BE_Caisse" TEXT,
  "Motif_BE" TEXT,
  "MT_Chiffre_BE" TEXT,
  "MT_Lttre_BE" TEXT,
  "Date_Entree" TIMESTAMP,
  "Date_Entree1" TIMESTAMP,
  "Code_Service" TEXT,
  "Heure_e" TEXT,
  "Recu_De" TEXT,
  "Code_Rubrique" TEXT,
  "SUPPRIM" TEXT
);

CREATE TABLE IF NOT EXISTS "REPORTCAISSE" (
  id BIGSERIAL PRIMARY KEY,
  "DAT" TEXT,
  "MT" TEXT,
  "CODE_SERVICE" TEXT
);

CREATE TABLE IF NOT EXISTS "REPORTCAISSE2" (
  id BIGSERIAL PRIMARY KEY,
  "DAT" TEXT,
  "MT" TEXT
);

CREATE TABLE IF NOT EXISTS "RESULTAT" (
  id BIGSERIAL PRIMARY KEY,
  "NUMERO" TEXT,
  "CODE" TEXT,
  "LIB" TEXT,
  "MT" TEXT,
  "MDEP" TEXT,
  "MOISAN" TEXT,
  "ANNE" TEXT,
  "NUM" TEXT,
  "Categorie" TEXT,
  "Categdep" TEXT,
  "ML" TEXT,
  "COMPT" TEXT,
  "DAF" TEXT,
  "DP" TEXT,
  "DATF" TEXT,
  "TITRE" TEXT,
  "COD" TEXT
);

CREATE TABLE IF NOT EXISTS "RESULTATANNUEL" (
  id BIGSERIAL PRIMARY KEY,
  "NUMER" TEXT,
  "COD" TEXT,
  "LIB" TEXT,
  "MR" TEXT,
  "MD" TEXT,
  "ML" TEXT,
  "ANNEE" TEXT,
  "DATF" TEXT,
  "COMPT" TEXT
);

CREATE TABLE IF NOT EXISTS "RUBRIQUEPGM" (
  id BIGSERIAL PRIMARY KEY,
  "CODRUB" TEXT,
  "LIB" TEXT
);

CREATE TABLE IF NOT EXISTS "Rubriques" (
  id BIGSERIAL PRIMARY KEY,
  "Code_Rubrique" TEXT,
  "Rubrique" TEXT,
  "Type" TEXT,
  "Imputation" TEXT
);

CREATE TABLE IF NOT EXISTS "Rubriques25" (
  id BIGSERIAL PRIMARY KEY,
  "Code_Rubrique" TEXT,
  "Rubrique" TEXT,
  "Type" TEXT,
  "Imputation" TEXT
);

CREATE TABLE IF NOT EXISTS "Rubriques_av" (
  id BIGSERIAL PRIMARY KEY,
  "Code_Rubrique" TEXT,
  "Rubrique" TEXT,
  "Type" TEXT,
  "Imputation" TEXT
);

CREATE TABLE IF NOT EXISTS "SDepenses" (
  id BIGSERIAL PRIMARY KEY,
  "Num_Auto_Bc" TEXT,
  "Num_BS_Caisse" TEXT,
  "Motif_Bs" TEXT,
  "MT_Chiffre_BS" TEXT,
  "MT_Lttre_BS" TEXT,
  "Date_Sortie" TIMESTAMP,
  "Date_Sortie1" TIMESTAMP,
  "Code_Service" TEXT,
  "Heure_s" TEXT,
  "Benef" TEXT,
  "Code_Rubrique" TEXT,
  "COD" TEXT
);

CREATE TABLE IF NOT EXISTS "Service" (
  id BIGSERIAL PRIMARY KEY,
  "Code_Service" TEXT,
  "Service" TEXT
);

CREATE TABLE IF NOT EXISTS "Service1" (
  id BIGSERIAL PRIMARY KEY,
  "Code_Service" TEXT,
  "Service" TEXT
);

CREATE TABLE IF NOT EXISTS "SIGNATAIRE" (
  id BIGSERIAL PRIMARY KEY,
  "MAT" TEXT,
  "NOM" TEXT,
  "GRAD" TEXT
);

CREATE TABLE IF NOT EXISTS "SMouvements" (
  id BIGSERIAL PRIMARY KEY,
  "Num_Auto_Mvt" TEXT,
  "Num_Mvt" TEXT,
  "Mvt" TEXT,
  "MT_Chiffre_Mvt_R" TEXT,
  "MT_Chiffre_Mvt_D" TEXT,
  "MT_Lttre_Mvt" TEXT,
  "Motif_Mvt" TEXT,
  "Date_Mvt" TIMESTAMP,
  "Date_Mvt1" TIMESTAMP,
  "Code_Service" TEXT,
  "Service_Mvt" TEXT,
  "Solde_Av_Mvt" TEXT,
  "Solde_Av_Mvt1" DECIMAL(15,2),
  "Solde_Ap_Mvt" TEXT,
  "Solde_Ap_Mvt1" DECIMAL(15,2),
  "Heure_Mvt" TEXT,
  "Benef_Mvt" TEXT,
  "Code_Rubrique" TEXT,
  "Rubrique_Mvt" TEXT,
  "REP" TEXT,
  "MTAV" TEXT,
  "COD" TEXT
);

CREATE TABLE IF NOT EXISTS "Table des erreurs" (
  id BIGSERIAL PRIMARY KEY,
  "Code_Rubrique" TEXT,
  "Rubrique" TEXT,
  "Type" TEXT,
  "Imputation" TEXT
);

CREATE TABLE IF NOT EXISTS "User" (
  id BIGSERIAL PRIMARY KEY,
  "COMPTE" TEXT,
  "PWD" TEXT,
  "CATEGORIE" TEXT
);

CREATE TABLE IF NOT EXISTS "~TMPCLP12741" (
  id BIGSERIAL PRIMARY KEY,
  "Num_Auto_Mvt" TEXT,
  "Num_Mvt" TEXT,
  "Mvt" TEXT,
  "Categorie" TEXT,
  "Categdep" TEXT,
  "MT_Chiffre_Mvt_R" TEXT,
  "MT_Chiffre_Mvt_D" TEXT,
  "MT_Lttre_Mvt" TEXT,
  "Motif_Mvt" TEXT,
  "Date_Mvt" TIMESTAMP,
  "Date_Mvt1" TIMESTAMP,
  "DATBEO" TEXT,
  "TYPE" TEXT,
  "DESIGN" TEXT,
  "Code_Service" TEXT,
  "Service_Mvt" TEXT,
  "COMPT" TEXT,
  "DAF" TEXT,
  "DP" TEXT,
  "Solde_Av_Mvt" TEXT,
  "Solde_Av_Mvt1" DECIMAL(15,2),
  "Solde_Ap_Mvt" TEXT,
  "Solde_Ap_Mvt1" DECIMAL(15,2),
  "Heure_Mvt" TEXT,
  "Benef_Mvt" TEXT,
  "Code_Rubrique" TEXT,
  "Rubrique_Mvt" TEXT,
  "REP" TEXT,
  "CODE" TEXT,
  "MOIS" TEXT,
  "ANNE" TEXT,
  "MOISAN" TEXT,
  "MOISAN2" DECIMAL(15,2),
  "NBEO" TEXT,
  "MLMOIS" TEXT,
  "DATF" TEXT,
  "TITRE" TEXT,
  "COD" TEXT
);


