# Visualisation - Améliorations D3.js

## Problèmes corrigés

### 1. **Liens invisibles ou non affichés**
**Cause** : Les liens ont besoin d'être dessinés AVANT les nœuds dans le SVG sinon ces derniers les cachent.
**Solution** : Réordonner l'ordre d'ajout des éléments SVG.

### 2. **Force simulation inefficace**
**Problème** : 
- Distance trop grande (150 → 100)
- Force de charge trop aggressive (-500 → -300)
- Pas de collision entre nœuds

**Solution** :
```javascript
d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links)
        .id(d => d.id)
        .distance(100)           // Réduit
        .strength(0.5))          // Ajouté
    .force("charge", d3.forceManyBody().strength(-300))  // Réduit
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide().radius(40))     // Ajouté
```

---

## Améliorations visuelles

### Types de nœuds différenciés
- **Risques** (bleu) : Taille 12, stroke=2px
- **Événements redoutés** (rose) : Taille 8, stroke=1.5px  
- **Scénarios de risque** (cyan) : Taille 8, stroke=1.5px

### Types de liens distincts
- **Liens vers événements** : Tirets rouges (#ff6b6b) - 5,5
- **Liens vers scénarios** : Tirets cyan (#4ecdc4) - 3,3

### Légende interactive
Affiche les symboles et couleurs avec explications dans le HTML.

---

## Filtrage amélioré

**Ancien système** : `display: block/none` (peut poser des problèmes de rendu)
**Nouveau système** : `opacity: 1/0.1/0.05` (plus fluide, transitions meilleures)

L'opacité baisse progressivement pour améliorer l'UX.

---

## Structure des nœuds enrichie

Chaque nœud inclut maintenant :
- `id` : Identifiant unique
- `label` : Texte principal (résolu des IDs)
- `type` : "risk" | "feared-event" | "risk-scenario"
- `severity` : Gravité résolue (ex: "2. Limitée")
- `subLabel` : Label secondaire (ex: actif métier, vraisemblance)

**Tooltip au survol** : Affiche `label + subLabel`

---

## Données liées correctement

Les IDs sont utilisés pour :
1. Créer les liaisons `source → target` dans la simulation
2. Associer les nœuds aux références (business-assets, severity, etc.)
3. Identifier les nœuds lors des opérations de filtrage

```javascript
// Les IDs DOIVENT correspondre aux nœuds
d3.forceLink(links).id(d => d.id)
```

---

## Points importants pour le debugging

1. **Console** : Affiche le nombre de nœuds et liens créés
2. **Info panel** : Affiche les compteurs en temps réel
3. **Légende** : Aide l'utilisateur à comprendre la visualisation
4. **Zoom/Pan** : Toujours actifs pour explorer le graphe
5. **Drag** : Permet de repositionner les nœuds manuellement
