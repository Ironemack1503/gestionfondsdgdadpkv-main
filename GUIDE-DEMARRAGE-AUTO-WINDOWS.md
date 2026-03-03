# 🚀 GUIDE COMPLET - DÉMARRAGE AUTOMATIQUE AU DÉMARRAGE DE WINDOWS

## Vue d'ensemble

Ce guide explique comment configurer l'application pour qu'elle démarre automatiquement au démarrage de Windows, avec tous les services nécessaires :

1. **Supabase** (Base de données et API)
2. **Serveur Vite** (Application web sur le port 8081)
3. **Ouverture automatique du navigateur** (vers http://localhost:8081)

---

## 📋 Deux méthodes disponibles

### Méthode 1 : Tâche Planifiée Windows (RECOMMANDÉE)

**✅ Avantages :**
- Démarrage après 30 secondes (laisse le système se stabiliser)
- Redémarrage automatique en cas d'échec
- Attend que le réseau soit disponible
- Gestion centralisée dans Windows
- Configure automatiquement le pare-feu

**❌ Inconvénients :**
- Nécessite des droits administrateur pour l'installation

**📝 Installation :**

1. **Faites un clic droit** sur le fichier :
   ```
   installer-demarrage-auto.ps1
   ```

2. **Sélectionnez :** "Exécuter avec PowerShell" (ou "Exécuter en tant qu'administrateur")

3. **Suivez les instructions** à l'écran

4. **C'est tout !** L'application démarrera au prochain redémarrage.

**🧪 Pour tester immédiatement :**
```powershell
.\demarrage-auto-windows.ps1
```

---

### Méthode 2 : Raccourci dans le Dossier Démarrage

**✅ Avantages :**
- Installation simple sans droits administrateur
- Démarrage immédiat à l'ouverture de session
- Facile à activer/désactiver

**❌ Inconvénients :**
- Démarre dès l'ouverture de session (peut être trop tôt)
- Pas de redémarrage automatique en cas d'échec
- Configuration du pare-feu séparée

**📝 Installation :**

1. **Exécutez le script** (pas besoin d'admin) :
   ```powershell
   .\installer-raccourci-demarrage.ps1
   ```

2. **Configurez le pare-feu** EN TANT QU'ADMINISTRATEUR :
   ```powershell
   .\autoriser-ports-reseau.ps1
   ```

3. **C'est tout !** L'application démarrera au prochain login.

**📂 Emplacement du raccourci :**
```
%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
```

Pour désactiver, supprimez simplement le raccourci de ce dossier.

---

## 🔧 Que fait le démarrage automatique ?

### Étape 1 : Attente de stabilisation (30 secondes)
- Permet au réseau de démarrer
- Laisse les services Windows s'initialiser

### Étape 2 : Démarrage de Supabase
- Vérifie si Supabase est déjà démarré
- Si non, lance `npx supabase start`
- Attend que le port 54321 soit accessible
- Lance en arrière-plan (fenêtre minimisée)

### Étape 3 : Démarrage du serveur Vite
- Vérifie si le serveur est déjà démarré
- Si non, lance `npm run dev`
- Attend que le port 8081 soit accessible
- Lance en arrière-plan (fenêtre minimisée)

### Étape 4 : Ouverture du navigateur
- Attend 5 secondes supplémentaires (pour la stabilité)
- Ouvre automatiquement http://localhost:8081
- Utilise le navigateur par défaut

### Étape 5 : Enregistrement des logs
- Tous les événements sont enregistrés dans : `demarrage-auto.log`
- Permet de diagnostiquer les problèmes

---

## 📊 Fichiers créés

| Fichier | Description |
|---------|-------------|
| `demarrage-auto-windows.ps1` | Script principal de démarrage automatique |
| `installer-demarrage-auto.ps1` | Installateur de tâche planifiée (ADMIN requis) |
| `desinstaller-demarrage-auto.ps1` | Désinstallateur de tâche planifiée (ADMIN requis) |
| `installer-raccourci-demarrage.ps1` | Installateur de raccourci (pas d'ADMIN) |
| `demarrage-auto.bat` | Fichier batch pour méthode alternative |
| `demarrage-auto.log` | Fichier log (créé automatiquement) |

---

## 🔍 Diagnostic et dépannage

### Vérifier si le démarrage automatique est actif

**Pour la méthode 1 (Tâche planifiée) :**

1. Ouvrez **Planificateur de tâches** Windows
2. Cherchez la tâche : `GestionFondsDGDA_DemarrageAuto`
3. Vérifiez son statut et son historique

**Ou en PowerShell :**
```powershell
Get-ScheduledTask -TaskName "GestionFondsDGDA_DemarrageAuto"
```

**Pour la méthode 2 (Raccourci) :**

1. Appuyez sur `Windows + R`
2. Tapez : `shell:startup`
3. Vérifiez la présence du raccourci `GestionFondsDGDA.lnk`

---

### Consulter les logs

Les logs de démarrage sont enregistrés dans :
```
demarrage-auto.log
```

**Pour voir les dernières lignes :**
```powershell
Get-Content .\demarrage-auto.log -Tail 50
```

---

### Les services ne démarrent pas

**1. Vérifiez les processus en cours :**
```powershell
# Vérifier si Supabase écoute
Test-NetConnection -ComputerName localhost -Port 54321

# Vérifier si Vite écoute
Test-NetConnection -ComputerName localhost -Port 8081
```

**2. Vérifiez les logs :**
```powershell
Get-Content .\demarrage-auto.log
```

**3. Testez manuellement :**
```powershell
.\demarrage-auto-windows.ps1
```

---

### Le navigateur ne s'ouvre pas automatiquement

**Causes possibles :**
- Le serveur Vite a mis plus de temps à démarrer
- Le navigateur par défaut n'est pas configuré

**Solution :**

Ouvrez manuellement : http://localhost:8081

---

### Les autres PC ne peuvent pas accéder à l'application

**Vérifiez les règles de pare-feu :**

```powershell
Get-NetFirewallRule -DisplayName "*Vite*", "*Supabase*"
```

**Reconfigurez si nécessaire (ADMIN) :**
```powershell
.\autoriser-ports-reseau.ps1
```

---

## 🛑 Désinstallation

### Méthode 1 : Tâche planifiée

**Exécutez EN TANT QU'ADMINISTRATEUR :**
```powershell
.\desinstaller-demarrage-auto.ps1
```

Le script vous demandera si vous voulez aussi supprimer les règles de pare-feu.

### Méthode 2 : Raccourci

**Supprimez simplement le raccourci :**

1. Appuyez sur `Windows + R`
2. Tapez : `shell:startup`
3. Supprimez le raccourci `GestionFondsDGDA.lnk`

---

## 🎯 Commandes utiles

### Tester le démarrage manuel
```powershell
.\demarrage-auto-windows.ps1
```

### Voir l'état des services
```powershell
npx supabase status
```

### Arrêter tous les services
```powershell
npx supabase stop
```

### Vérifier les ports utilisés
```powershell
netstat -ano | findstr "8081 54321 54322"
```

### Consulter les tâches planifiées
```powershell
Get-ScheduledTask | Where-Object {$_.TaskName -like "*DGDA*"}
```

---

## 🔐 Sécurité et pare-feu

### Règles créées automatiquement

| Port | Service | Description |
|------|---------|-------------|
| 8081 | Vite Dev Server | Application web |
| 54321 | Supabase API | API REST et Auth |
| 54322 | PostgreSQL | Base de données |

### Profils de pare-feu

Les règles sont créées pour **tous les profils** :
- Domaine
- Privé
- Public

Cela permet l'accès depuis n'importe quel réseau.

---

## 📱 Accès depuis d'autres PC

Une fois le démarrage automatique configuré, les autres PC du réseau local peuvent accéder à l'application :

**URL à utiliser :**
```
http://192.168.0.32:8081
```

**Prérequis :**
- Les règles de pare-feu doivent être configurées
- Les PC doivent être sur le même réseau local

---

## 🔄 Mise à jour du projet

Si vous déplacez le projet vers un autre emplacement :

### Méthode 1 (Tâche planifiée)
1. Désinstallez : `.\desinstaller-demarrage-auto.ps1`
2. Déplacez le projet
3. Réinstallez : `.\installer-demarrage-auto.ps1`

### Méthode 2 (Raccourci)
1. Supprimez l'ancien raccourci dans le dossier Démarrage
2. Déplacez le projet
3. Réexécutez : `.\installer-raccourci-demarrage.ps1`

---

## ❓ FAQ

### Q: Puis-je utiliser les deux méthodes en même temps ?
**R:** Non, c'est déconseillé. Choisissez une seule méthode pour éviter les doublons.

### Q: L'application va-t-elle redémarrer après un crash ?
**R:** Oui, avec la méthode 1 (tâche planifiée). La méthode 2 ne le fait pas automatiquement.

### Q: Combien de temps faut-il pour que l'application démarre ?
**R:** Environ 1-2 minutes après le démarrage de Windows (incluant l'attente de 30 secondes).

### Q: Puis-je modifier le délai d'attente ?
**R:** Oui, éditez le script et modifiez la valeur `$trigger.Delay = "PT30S"` (format ISO 8601).

### Q: L'application démarre-t-elle même si je ne me connecte pas ?
**R:** 
- **Méthode 1 :** Oui, au démarrage de Windows
- **Méthode 2 :** Non, seulement à l'ouverture de session

### Q: Comment désactiver temporairement le démarrage automatique ?
**R:** 
- **Méthode 1 :** Ouvrez le Planificateur de tâches et désactivez la tâche
- **Méthode 2 :** Supprimez temporairement le raccourci du dossier Démarrage

### Q: Les fenêtres Supabase et Vite restent-elles ouvertes ?
**R:** Oui, mais elles sont minimisées. Vous pouvez les fermer quand vous arrêtez l'application.

---

## 📞 Support

En cas de problème :

1. **Consultez les logs** : `demarrage-auto.log`
2. **Testez manuellement** : `.\demarrage-auto-windows.ps1`
3. **Vérifiez les ports** : `netstat -ano | findstr "8081 54321"`
4. **Vérifiez le pare-feu** : Exécutez `.\autoriser-ports-reseau.ps1`

---

## ✅ Checklist de configuration

- [ ] Choix de la méthode (1 ou 2)
- [ ] Installation du démarrage automatique
- [ ] Configuration du pare-feu (si nécessaire)
- [ ] Test du démarrage manuel
- [ ] Vérification des logs
- [ ] Test de l'accès depuis un autre PC (optionnel)
- [ ] Redémarrage de l'ordinateur pour tester

---

**Bonne utilisation de l'application ! 🎉**
