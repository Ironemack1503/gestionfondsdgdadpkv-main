# 🚀 DÉMARRAGE AUTOMATIQUE - GUIDE RAPIDE

## Installation en 2 étapes

### Option 1 : Installation Complète (RECOMMANDÉE)

**Avantage :** Configuration automatique de tout (services + pare-feu)

1. **Clic droit** sur `installer-demarrage-auto.ps1`
2. **"Exécuter avec PowerShell"** (accepter les droits admin)
3. ✅ **Terminé !**

### Option 2 : Installation Simple

**Avantage :** Pas besoin de droits admin

1. **Double-cliquez** sur `installer-raccourci-demarrage.ps1`
2. **Exécutez ensuite (en admin)** : `autoriser-ports-reseau.ps1`
3. ✅ **Terminé !**

---

## Test immédiat

Pour tester sans redémarrer Windows :

```powershell
.\demarrage-auto-windows.ps1
```

---

## Services démarrés automatiquement

- ✅ **Supabase** (Base de données + API)
- ✅ **Serveur Vite** (Application web sur port 8081)
- ✅ **Navigateur** (Ouverture automatique)

---

## Accès à l'application

**Sur cet ordinateur :**
- http://localhost:8081

**Depuis d'autres PC du réseau :**
- http://192.168.0.32:8081

---

## Désinstallation

```powershell
.\desinstaller-demarrage-auto.ps1
```

---

## Documentation complète

Consultez [GUIDE-DEMARRAGE-AUTO-WINDOWS.md](GUIDE-DEMARRAGE-AUTO-WINDOWS.md) pour :
- Diagnostic des problèmes
- Configuration avancée
- FAQ complète

---

## Fichiers log

Les événements sont enregistrés dans :
```
demarrage-auto.log
```

---

**Questions ? Consultez le guide complet !**
