# Structure des données - Cyber View

## Architecture de normalisation des données

Les données de risques ont été restructurées pour utiliser une architecture de **lookup tables** avec références par identifiants.

### Fichiers de données

#### 1. **risks.json** (données principales)
Contient la liste des risques avec références par IDs au lieu de libellés textuels.

**Exemple de structure :**
```json
{
  "generic-id": "R01",
  "generic-long-label": "Risque R01 - Fonction de reconnaissance faciale",
  "generic-short-label": "R01 - Reconnaissance faciale",
  "generic-technical-id": "rf_r01",
  "description": "Disparition de la fonction de reconnaissance faciale",
  "risk-scenario": {
    "risk-source-id": "RS_001",          // ← ID vers risk-sources.json
    "target-objective": "...",
    "strategic-scenario": "...",
    "kill-chain": "...",
    "likelihood-id": "LH_002"             // ← ID vers likelihood-levels.json
  },
  "feared-event": {
    "security-criteria-id": "SC_003",    // ← ID vers security-criteria.json
    "business-asset-id": "BA_001",       // ← ID vers business-assets.json
    "severity-id": "SEV_002"             // ← ID vers severity-levels.json
  }
}
```

#### 2. **risk-sources.json**
Lookup table des sources de risque (acteurs, menaces)

```json
[
  { "id": "RS_001", "label": "Crime organisé (extorsion)" },
  { "id": "RS_002", "label": "Acteur étatique / concurrent (sabotage ou manipulation)" },
  ...
]
```

#### 3. **business-assets.json**
Lookup table des actifs métier impactés

```json
[
  { "id": "BA_001", "label": "Fonction de reconnaissance faciale" },
  { "id": "BA_002", "label": "Données d'entraînement" },
  { "id": "BA_003", "label": "Empreintes biométriques" },
  ...
]
```

#### 4. **security-criteria.json**
Lookup table des critères de sécurité (CIA Triad)

```json
[
  { "id": "SC_001", "label": "Confidentialité" },
  { "id": "SC_002", "label": "Intégrité" },
  { "id": "SC_003", "label": "Disponibilité" }
]
```

#### 5. **severity-levels.json**
Lookup table des niveaux de gravité

```json
[
  { "id": "SEV_001", "label": "1. Minimale", "value": 1 },
  { "id": "SEV_002", "label": "2. Limitée", "value": 2 },
  { "id": "SEV_003", "label": "3. Importante", "value": 3 },
  { "id": "SEV_004", "label": "4. Maximale", "value": 4 }
]
```

#### 6. **likelihood-levels.json**
Lookup table des niveaux de vraisemblance

```json
[
  { "id": "LH_001", "label": "1. Minimale", "value": 1 },
  { "id": "LH_002", "label": "2. Limitée", "value": 2 },
  { "id": "LH_003", "label": "3. Importante", "value": 3 },
  { "id": "LH_004", "label": "4. Maximale", "value": 4 }
]
```

---

## Avantages de cette approche

### 1. **Normalisation des données**
- Elimination de la duplication textuelle
- Une seule source de vérité par concept

### 2. **Intégrité référentielle**
- Les modifications d'un libellé s'appliquent automatiquement partout
- Cohérence garantie

### 3. **Maintenabilité**
- Facile de modifier un libellé : une seule place
- Prévention des incohérences d'orthographe

### 4. **Performance**
- Les IDs sont plus légers que les textes
- Meilleure compression des données
- Plus efficace pour les jointures/filtres

### 5. **Extensibilité**
- Facile d'ajouter de nouvelles propriétés aux lookup tables
- Par exemple : descriptions, couleurs, icônes, traductions

---

## Utilisation dans app.js

### Fonction de résolution d'ID
```javascript
function resolveId(id, dataType) {
    if (!id || !referenceData[dataType]) return null;
    const item = referenceData[dataType].find(d => d.id === id);
    return item ? item.label : id;
}
```

### Exemple d'utilisation
```javascript
const severityLabel = resolveId("SEV_002", "severityLevels");  
// Retourne : "2. Limitée"

const businessAsset = resolveId("BA_001", "businessAssets");   
// Retourne : "Fonction de reconnaissance faciale"
```

### Chargement parallèle
Tous les fichiers sont chargés en parallèle avec `Promise.all()` pour optimiser les performances.

---

## Évolution future

Cette structure permet facilement d'ajouter :
- **Traductions multilingues** : ajouter des propriétés `label_en`, `label_es`, etc.
- **Metadata additionnelle** : descriptions, icônes, couleurs, scores
- **Relations entre entités** : créer des liens 1-N entre actifs et critères
- **Historique** : versioning des changements
- **Validation** : contraintes et règles de business

