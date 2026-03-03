# Guide d'Édition des Rapports Officiels DGDA

## Vue d'ensemble

L'application dispose maintenant d'un système complet de personnalisation des rapports officiels DGDA. Vous pouvez modifier textuellement tous les éléments de mise en forme des 3 rapports officiels :

- **Programmation des Dépenses**
- **Feuille de Caisse**  
- **Sommaire Mensuel**

## Accès à l'éditeur

1. Utilisez le menu latéral pour naviguer : **Rapports → Configuration des Rapports Par Défaut**
2. Dans la page, cliquez sur l'onglet **"Éditer les rapports"**
3. Sélectionnez le rapport que vous souhaitez personnaliser

## Éléments personnalisables

### 1. En-tête
- **Ligne 1** : République Démocratique du Congo
- **Ligne 2** : Ministère des Finances
- **Ligne 3** : Direction Générale des Douanes et Accises
- **Ligne 4** : Province du Kongo Central

### 2. Logo
- **Afficher/Masquer** : Activer ou désactiver l'affichage du logo
- **Taille** : Régler la taille entre 48px et 200px (recommandé : 96px)

### 3. Contenu
- **Référence** : Préfixe de la référence (ex: `DGDA/1400/DP/KV/SDAF/`)
- **Titre** : Modèle de titre avec variables disponibles :
  - `{MOIS}` - Nom du mois
  - `{ANNEE}` - Année
  - Exemple : `PROGRAMMATION DES DEPENSES MOIS DE {MOIS}/{ANNEE}`
- **Format de page** : A4 ou Letter
- **Orientation** : Portrait ou Paysage

### 4. Signatures
- **Premier signataire**
  - Fonction : Sous-directeur
  - Nom complet : KABOMBO BADIABIABO
- **Deuxième signataire**
  - Fonction : Directeur Provincial
  - Nom complet : KALALA MASIMANGO

### 5. Pied de page
- **Ligne 1** : Direction Générale des Douanes et Accises
- **Ligne 2** : Téléphone, Email
- **Ligne 3** : Site web
- **Ligne 4** : Adresse

## Utilisation

### Modification d'un élément

1. Naviguez vers l'onglet correspondant (En-tête, Logo, Contenu, Signatures, ou Pied de page)
2. Modifiez les champs textuels selon vos besoins
3. Les modifications sont marquées par un indicateur d'avertissement
4. Cliquez sur **"Sauvegarder"** pour enregistrer vos changements

### Aperçu en temps réel

- Cliquez sur le bouton **"Aperçu"** pour voir le rapport avec vos modifications
- Les changements sont appliqués immédiatement dans tous les rapports de ce type

### Réinitialisation

- Cliquez sur **"Réinitialiser"** pour restaurer les valeurs par défaut DGDA
- Une confirmation vous sera demandée avant la réinitialisation

## Sauvegarde et persistance

- Les configurations sont automatiquement sauvegardées dans le navigateur (localStorage)
- Vos personnalisations persistent entre les sessions
- Chaque rapport a sa propre configuration indépendante

## Formats d'export supportés

Les rapports personnalisés sont exportables dans les formats suivants :
- **PDF** : Pour l'archivage et l'impression
- **Excel** : Pour l'analyse de données
- **Word** : Pour l'édition avancée

## Exemples de personnalisation

### Exemple 1 : Changer la province

Si vous êtes dans une autre province :
1. Allez dans l'onglet **"En-tête"**
2. Modifiez la **Ligne 4** : `Province du Nord-Kivu`
3. Sauvegardez

### Exemple 2 : Modifier les signataires

Pour changer les noms des responsables :
1. Allez dans l'onglet **"Signatures"**
2. Modifiez les champs **Fonction** et **Nom complet**
3. Sauvegardez

### Exemple 3 : Personnaliser le titre

Pour un titre différent :
1. Allez dans l'onglet **"Contenu"**
2. Modifiez le **Modèle de titre**
3. Utilisez les variables `{MOIS}` et `{ANNEE}` pour l'insertion dynamique
4. Sauvegardez

## Support technique

Pour toute question ou problème :
- Contactez l'équipe de développement
- Consultez la documentation technique dans le code source :
  - `src/hooks/useOfficialReportsConfig.ts`
  - `src/components/reports/OfficialReportEditor.tsx`
  - `src/components/reports/ProgrammationOfficielReport.tsx`

## Fichiers techniques

### Hook de configuration
**Fichier** : `src/hooks/useOfficialReportsConfig.ts`

Export des fonctions :
- `getConfig(type)` : Récupère la configuration d'un rapport
- `updateConfig(type, updates)` : Met à jour la configuration
- `resetConfig(type)` : Réinitialise un rapport
- `exportConfig()` : Exporte la configuration en JSON
- `importConfig(json)` : Importe une configuration

### Composant d'édition
**Fichier** : `src/components/reports/OfficialReportEditor.tsx`

Onglets disponibles :
- En-tête
- Logo
- Contenu
- Signatures
- Pied de page

### Composants de rapports
- **Programmation** : `src/components/reports/ProgrammationOfficielReport.tsx`
- **Feuille de Caisse** : À créer
- **Sommaire** : À créer

## Prochaines étapes

Les fonctionnalités suivantes sont prévues :
- [ ] Import/Export de configurations entre postes
- [ ] Templates prédéfinis par province
- [ ] Prévisualisation en temps réel pendant l'édition
- [ ] Création des rapports officiels pour Feuille de Caisse et Sommaire
