# Architecture de visualisation - Graphe relationnel complet

## Nouvelle structure (Janvier 2026)

La visualisation a été restructurée pour afficher un **graphe relationnel complet** où toutes les entités sont des nœuds distincts et connectés par des liens typés.

### Types de nœuds

| Type | Couleur | Taille | Description |
|------|---------|--------|-------------|
| **risk** | Bleu (selon gravité) | 12px | Risques métier (R01-R15) |
| **security-criteria** | Rose (#ffb6c1) | 10px | Critères CIA (Confidentialité, Intégrité, Disponibilité) |
| **business-asset** | Cyan (#87ceeb) | 10px | Actifs métier impactés |
| **risk-source** | Turquoise (#4ecdc4) | 9px | Sources/acteurs de risque |
| **severity-level** | Violet (#9b59b6) | 8px | Niveaux de gravité (1-4) |
| **likelihood-level** | Vert (#2ecc71) | 8px | Niveaux de vraisemblance (1-4) |

### Types de liens

| Type | Couleur | Source → Cible |
|------|---------|---|
| **has-criteria** | Rouge (#ff6b6b) | Risque → Critère sécurité |
| **affects-asset** | Orange (#ffa500) | Risque → Actif métier |
| **from-source** | Turquoise (#4ecdc4) | Risque → Source risque |
| **has-severity** | Violet (#9b59b6) | Risque → Niveau gravité |
| **has-likelihood** | Vert (#2ecc71) | Risque → Vraisemblance |

---

## Avantages de cette approche

### 1. **Visualisation des relations partagées**
- Quand plusieurs risques (R01, R02, R03) affectent le même actif (BA_001), ils pointent tous vers le même nœud
- Les patterns de connexion deviennent visibles
- Exemple : tous les risques avec la même gravité pointent vers le même niveau

### 2. **Structure ontologique claire**
- Chaque entité métier a son propre nœud
- Les relations sont explicites et typées
- Facile d'identifier les points critiques (nœuds hautement connectés)

### 3. **Requêtes et analyses facilitées**
- Quels actifs sont les plus touchés ?
- Quelles sources de risque sont les plus nombreuses ?
- Quels critères de sécurité sont prioritaires ?

### 4. **Scalabilité**
- Ajouter une nouvelle source/actif = un seul nœud
- Pas de duplication
- Maintien automatique de l'intégrité

---

## Exemple de structure

```
        R01 (Risque)
       / | | | \
      /  |  | |  \
    SC₃  BA₁ RS₁ SEV₂ LH₂
    
    R02 (Risque)
   / | | | \
  /  |  | |  \
SC₃ BA₁ RS₂ SEV₃ LH₃
```

Ici, **SC_003** (Disponibilité) et **BA_001** (Fonction faciale) sont partagés entre R01 et R02.

---

## Filtrage amélioré

Le filtre par gravité fonctionne maintenant intelligemment :

1. **Sélectionner une gravité** (ex: "3. Importante")
2. Affiche les risques de cette gravité à 100% d'opacité
3. Affiche les nœuds connectés (critères, actifs, sources) à 100% d'opacité
4. Estompe les nœuds non connectés à 15% d'opacité
5. Estompe les liens des risques cachés à 5% d'opacité

Cela permet de voir le **contexte complet** d'une sélection.

---

## Données liées correctement

### Avant (structure plate)
```json
{
  "risk-source": "Crime organisé (extorsion)",
  "business-asset": "Fonction de reconnaissance faciale",
  "security-criteria": "Disponibilité"
}
```
❌ Duplication textuelle
❌ Incohérences possibles
❌ Pas de relation visible

### Après (structure relationnelle)
```json
{
  "risk-source-id": "RS_001",
  "business-asset-id": "BA_001",
  "security-criteria-id": "SC_003"
}
```
✅ IDs uniques
✅ Liens explicites
✅ Relations visibles dans le graphe

---

## Console de débogage

Ouvrir la console navigateur (F12) pour voir :
- Nombre de nœuds par type
- Nombre de liens par type
- Messages de chargement

```
Données chargées: 15 risques
Références: {
  riskSources: 11,
  businessAssets: 5,
  securityCriteria: 3,
  severityLevels: 4,
  likelihoodLevels: 4
}
Nœuds créés: 42 | Liens créés: 75
```

---

## Interactions disponibles

- **Zoom** : Molette souris
- **Pan** : Clic-glisser sur le graphe
- **Drag nœud** : Clic-glisser sur un nœud
- **Tooltip** : Survol d'un nœud (type et description)
- **Filtre** : Sélecteur de gravité (met en avant/arrière-plan)

---

## Performance

- Simulation physique optimisée avec collision detection
- Distance adaptée selon le type de lien (80px risque-risque, 120px risque-référence)
- Forces équilibrées pour une convergence rapide

