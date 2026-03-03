# 🏗️ Architecture du Système de Rapports Par Défaut

## 📐 Vue d'ensemble de l'architecture

Le système de rapports par défaut est conçu pour centraliser la gestion des trois rapports officiels DGDA et garantir leur conformité à travers toute l'application.

### Principes de conception

1. **Centralisation** : Une source unique de vérité pour les rapports officiels
2. **Type-safety** : Utilisation de TypeScript pour éviter les erreurs
3. **Réutilisabilité** : Composants et hooks partagés
4. **Flexibilité** : Configuration ajustable selon les besoins
5. **Maintenabilité** : Code modulaire et bien documenté

---

## 📁 Structure des fichiers

```
src/
├── config/
│   └── defaultReports.ts          # Configuration centralisée des rapports
├── hooks/
│   └── useDefaultReports.ts       # Hook pour accéder aux rapports
├── components/
│   └── shared/
│       ├── ExportButtons.tsx      # Boutons d'export avec sélection de rapport
│       └── DefaultReportSelector.tsx  # Composants de sélection de rapport
└── pages/
    ├── DefaultReportsPage.tsx     # Page de gestion des rapports
    └── reports/
        ├── FeuilleCaisseReportPage.tsx
        ├── SommaireReportPage.tsx
        └── ProgrammationReportPage.tsx
```

---

## 🔧 Configuration : `defaultReports.ts`

### Types

```typescript
export type ReportType = 'feuille-caisse' | 'sommaire' | 'programmation';

export interface DefaultReport {
  id: ReportType;
  name: string;
  description: string;
  path: string;
  icon: string;
  isDefault: true;
  exportFormats: ('pdf' | 'excel' | 'word')[];
  category: 'official';
}
```

### Constantes exportées

#### `DEFAULT_REPORTS`
Objet Record contenant les trois rapports officiels avec tous leurs détails.

```typescript
const report = DEFAULT_REPORTS['feuille-caisse'];
console.log(report.name); // "Feuille de Caisse"
```

#### `EXPORT_CONFIG`
Configuration globale de l'export.

```typescript
EXPORT_CONFIG.restrictToDefaultReports // boolean
EXPORT_CONFIG.restrictionMessage       // string
EXPORT_CONFIG.allowedFormats          // readonly array
EXPORT_CONFIG.defaultSelectedReport    // ReportType
```

### Fonctions utilitaires

#### `getDefaultReports(): DefaultReport[]`
Retourne le tableau de tous les rapports par défaut.

#### `isDefaultReport(reportId: string): reportId is ReportType`
Type guard pour vérifier si un ID est un rapport valide.

#### `getDefaultReportById(reportId: ReportType): DefaultReport | undefined`
Récupère un rapport spécifique par son ID.

#### `getAvailableExportFormats(reportId: ReportType): Format[]`
Retourne les formats d'export disponibles pour un rapport.

---

## 🪝 Hook : `useDefaultReports.ts`

### Interface de retour

```typescript
interface UseDefaultReportsReturn {
  reports: DefaultReport[];              // Liste complète
  selectedReport: ReportType;            // Rapport sélectionné
  setSelectedReport: (id: ReportType) => void;  // Changer la sélection
  getReport: (id: ReportType) => DefaultReport | undefined;
  canExport: (id?: string) => boolean;   // Vérifier autorisation
  availableFormats: Format[];            // Formats disponibles
  exportConfig: typeof EXPORT_CONFIG;    // Config globale
  showRestrictionMessage: () => void;    // Afficher message
}
```

### Utilisation de base

```typescript
import { useDefaultReports } from '@/hooks/useDefaultReports';

function MyComponent() {
  const { 
    reports, 
    selectedReport, 
    setSelectedReport,
    canExport 
  } = useDefaultReports();

  // Lister les rapports
  reports.forEach(report => {
    console.log(report.name);
  });

  // Changer la sélection
  setSelectedReport('sommaire');

  // Vérifier l'autorisation d'export
  if (canExport('feuille-caisse')) {
    // Procéder à l'export
  }
}
```

### Hooks simplifiés

#### `useReportsList()`
Retourne uniquement la liste des rapports sans état.

```typescript
const reports = useReportsList();
```

#### `useIsDefaultReport(reportId?: string): boolean`
Vérifie si un ID est un rapport par défaut.

```typescript
const isValid = useIsDefaultReport('feuille-caisse'); // true
const isInvalid = useIsDefaultReport('custom-report'); // false
```

---

## 🎨 Composants

### `ExportButtons`

Composant de boutons d'export avec support des rapports par défaut.

#### Props étendues

```typescript
interface ExportButtonsProps {
  onExportPDF: (settings?: PDFExportSettings) => void;
  onExportExcel: (settings?: PDFExportSettings) => void;
  disabled?: boolean;
  previewTitle?: string;
  previewSubtitle?: string;
  previewColumns?: ExportColumn[];
  previewData?: Record<string, any>[];
  
  // Nouvelles props
  showDefaultReportSelector?: boolean;    // Afficher le sélecteur
  restrictToDefaultReports?: boolean;     // Forcer restriction
}
```

#### Utilisation

```tsx
<ExportButtons
  onExportPDF={handlePDF}
  onExportExcel={handleExcel}
  showDefaultReportSelector={true}
  restrictToDefaultReports={true}
/>
```

#### Comportement

- Si `restrictToDefaultReports` est `true`, les exports sont bloqués si le rapport n'est pas officiel
- Si `showDefaultReportSelector` est `true`, affiche un menu de sélection de rapport dans le dropdown

---

### `DefaultReportSelector`

Composant pour sélectionner un rapport parmi les trois officiels.

#### Props

```typescript
interface DefaultReportSelectorProps {
  onSelectReport?: (reportId: ReportType) => void;
  compact?: boolean;           // Mode compact (boutons)
  className?: string;
}
```

#### Variantes

**1. Mode grille (par défaut)**
```tsx
<DefaultReportSelector 
  onSelectReport={(id) => console.log(id)} 
/>
```

**2. Mode compact**
```tsx
<DefaultReportSelector 
  compact={true}
  onSelectReport={(id) => navigate(`/rapports/${id}`)} 
/>
```

**3. Mode liste**
```tsx
<DefaultReportSelectorList 
  onSelectReport={(id) => console.log(id)} 
/>
```

---

## 📄 Pages

### `DefaultReportsPage`

Page de gestion et configuration des rapports par défaut.

#### Fonctionnalités

1. **Affichage des trois rapports** avec cartes cliquables
2. **Configuration de la restriction** avec toggle
3. **Détails du rapport sélectionné** avec accès rapide
4. **Liste des formats d'export** disponibles
5. **Documentation intégrée**

#### Structure

```tsx
<PageHeader />
<Alert /> {/* Info sur les rapports officiels */}
<Card>Configuration des exports</Card>
<Card>Sélecteur de rapport</Card>
<Card>Détails du rapport sélectionné</Card>
<Card>Accès rapide</Card>
<Card>Documentation</Card>
```

---

## 🔄 Flux de données

### Sélection d'un rapport

```
User Click
    ↓
DefaultReportSelector
    ↓
useDefaultReports.setSelectedReport()
    ↓
React State Update
    ↓
Components Re-render
    ↓
Updated UI
```

### Vérification d'export

```
Export Request
    ↓
canExport(reportId)
    ↓
Check EXPORT_CONFIG.restrictToDefaultReports
    ↓
  ├─ false → Allow export
  └─ true → Check isDefaultReport(reportId)
            ├─ true → Allow export
            └─ false → Deny + showRestrictionMessage()
```

---

## 🧪 Tests

### Tester la configuration

```typescript
import { 
  getDefaultReports, 
  isDefaultReport,
  EXPORT_CONFIG 
} from '@/config/defaultReports';

describe('Default Reports Config', () => {
  it('should have exactly 3 reports', () => {
    const reports = getDefaultReports();
    expect(reports).toHaveLength(3);
  });

  it('should validate report IDs', () => {
    expect(isDefaultReport('feuille-caisse')).toBe(true);
    expect(isDefaultReport('invalid')).toBe(false);
  });

  it('should have correct export config', () => {
    expect(EXPORT_CONFIG.allowedFormats).toContain('pdf');
    expect(EXPORT_CONFIG.allowedFormats).toContain('excel');
  });
});
```

### Tester le hook

```typescript
import { renderHook, act } from '@testing-library/react';
import { useDefaultReports } from '@/hooks/useDefaultReports';

describe('useDefaultReports', () => {
  it('should change selected report', () => {
    const { result } = renderHook(() => useDefaultReports());
    
    act(() => {
      result.current.setSelectedReport('sommaire');
    });
    
    expect(result.current.selectedReport).toBe('sommaire');
  });

  it('should validate export permissions', () => {
    const { result } = renderHook(() => useDefaultReports());
    
    expect(result.current.canExport('feuille-caisse')).toBe(true);
    expect(result.current.canExport('invalid-report')).toBe(false);
  });
});
```

---

## 🔐 Sécurité et validation

### Type safety

Tous les IDs de rapport utilisent le type `ReportType`, ce qui empêche l'utilisation de chaînes invalides :

```typescript
// ✅ OK
setSelectedReport('feuille-caisse');

// ❌ Erreur TypeScript
setSelectedReport('invalid-report');
```

### Runtime validation

La fonction `isDefaultReport` effectue une validation au runtime :

```typescript
if (isDefaultReport(unknownId)) {
  // TypeScript sait maintenant que unknownId est de type ReportType
  const report = getDefaultReportById(unknownId);
}
```

---

## 🚀 Extension du système

### Ajouter un nouveau rapport officiel

1. **Mettre à jour le type**
```typescript
export type ReportType = 
  | 'feuille-caisse' 
  | 'sommaire' 
  | 'programmation'
  | 'nouveau-rapport';  // ← Ajouter ici
```

2. **Ajouter dans DEFAULT_REPORTS**
```typescript
'nouveau-rapport': {
  id: 'nouveau-rapport',
  name: 'Nouveau Rapport',
  description: '...',
  path: '/rapports/nouveau',
  icon: 'FileIcon',
  isDefault: true,
  exportFormats: ['pdf', 'excel'],
  category: 'official',
}
```

3. **Créer la page du rapport**
```typescript
// src/pages/reports/NouveauRapportPage.tsx
export default function NouveauRapportPage() {
  // ...
}
```

4. **Ajouter la route**
```typescript
<Route path="/rapports/nouveau" element={<NouveauRapportPage />} />
```

### Ajouter un nouveau format d'export

1. **Mettre à jour EXPORT_CONFIG**
```typescript
allowedFormats: ['pdf', 'excel', 'word', 'csv'] as const
```

2. **Ajouter dans les rapports concernés**
```typescript
exportFormats: ['pdf', 'excel', 'word', 'csv']
```

3. **Implémenter la fonction d'export**
```typescript
// Dans le composant de rapport
const handleExportCSV = () => {
  // Logique d'export CSV
};
```

---

## 📊 Diagramme de l'architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Application                            │
└─────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐   ┌──────────────────┐   ┌──────────────┐
│ Page Rapports│   │ DefaultReportsPage│   │ Report Pages │
└──────────────┘   └──────────────────┘   └──────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │  DefaultReportSelector   │
              └──────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │   useDefaultReports()    │
              └──────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │  defaultReports.ts       │
              │  (Configuration)         │
              └──────────────────────────┘
```

---

## 🐛 Debugging

### Activer les logs

```typescript
// Dans useDefaultReports.ts, ajouter :
useEffect(() => {
  console.log('[DefaultReports] Selected:', selectedReport);
  console.log('[DefaultReports] Config:', exportConfig);
}, [selectedReport]);
```

### Vérifier la configuration

```typescript
// Dans la console du navigateur
import { DEFAULT_REPORTS, EXPORT_CONFIG } from '@/config/defaultReports';

console.table(DEFAULT_REPORTS);
console.log(EXPORT_CONFIG);
```

---

## 📚 Références

- **Code source** : `src/config/defaultReports.ts`
- **Hook** : `src/hooks/useDefaultReports.ts`
- **Composants** : `src/components/shared/DefaultReportSelector.tsx`
- **Guide utilisateur** : `GUIDE-RAPPORTS-PAR-DEFAUT.md`

---

**Auteur :** Équipe développement DGDA  
**Date de création :** 13 février 2026  
**Version :** 1.0
