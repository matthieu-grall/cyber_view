# Technical Documentation - cyber_view

## Table of Contents

- [Code Architecture](#code-architecture)
  - [Modular Organization](#modular-organization)
  - [Module Dependencies](#module-dependencies)
  - [Module Descriptions](#module-descriptions)
- [Development Guide](#development-guide)
  - [How to Extend the Code](#how-to-extend-the-code)
  - [Fix a Bug](#fix-a-bug)
  - [Add a Translation](#add-a-translation)
- [Configuration](#configuration)
  - [Modifying Configuration](#modifying-configuration)
- [Troubleshooting](#troubleshooting)

---

## Code Architecture

### Modular Organization

The application uses a modular architecture with 11 JavaScript files organized by responsibility. The latest cleanup also introduced a lightweight regression smoke check under the tests folder so the core assets and wiring stay consistent as the project evolves:

```
js/
├── config.js                    # Centralized configuration
├── i18n.js                     # Translation system
├── data-loader.js              # Data loading
├── ontology.js                 # Ontology management
├── graph-data.js               # Graph structure creation
├── main.js                     # Application orchestration
├── graph/
│   ├── node-renderer.js        # Node rendering
│   ├── link-renderer.js        # Link rendering
│   └── simulation.js           # D3 physics simulation
├── interactions/
│   ├── filters.js              # Filtering logic
│   └── node-details.js         # Details panel
tests/
└── smoke_check.py              # Regression checks for metadata and expected UI wiring
```
### Module Dependencies

```
main.js (orchestration)
├── config.js (constants)
├── i18n.js (translations)
├── data-loader.js (data)
├── ontology.js (semantics)
├── graph-data.js (structure)
├── graph/node-renderer.js (nodes)
├── graph/link-renderer.js (links)
├── graph/simulation.js (physics)
├── interactions/filters.js (filters)
└── interactions/node-details.js (details)
```

### Module Descriptions

#### `config.js`
Centralized application configuration:
- Color palettes (node types, severity, links)
- Node sizes
- DOM selectors
- D3 simulation parameters
- Data use case and ontology file paths
- Translation file paths

#### `i18n.js`
Multilingual system management:
- Load translations (FR/EN)
- Apply translations to DOM
- Language persistence via localStorage
- Methods: `getLanguage()`, `loadTranslations()`, `getTranslation()`, `applyTranslations()`

#### `data-loader.js`
Unified data loading:
- Load use case payloads (file path or uploaded file)
- Cache current payload metadata
- Methods: `loadAll()`, `loadFromFile()`, `getCurrentUsecase()`, `getCurrentUsecaseRaw()`, `loadOntology()`

#### `ontology.js`
RDF/OWL ontology management:
- Load cyber-ontology.json
- Map node types to ontology classes
- Localized labels and definitions
- Dynamic legend generation
- Methods: `load()`, `getNodeTypeLabel()`, `getNodeTypeDefinition()`, `generateLegend()`

#### `graph-data.js`
Graph structure creation:
- Transform ontology-native payloads to nodes/links
- Keep ontology relation semantics for labels/tooltips
- Split parallel and bidirectional links with curve offsets
- Calculate node degree
- Method: `createGraphData()`

#### `graph/node-renderer.js`
Node rendering:
- Create SVG circles with styling
- Native tooltips (SVG `<title>`)
- Sizes proportional to degree
- Interactions: drag, hover, click
- Visibility filtering
- Methods: `renderNodes()`, `updateNodeLabels()`

#### `graph/link-renderer.js`
Link rendering:
- Create SVG lines
- Relationship tooltips
- Labels for critical relationships
- Update positions (simulation tick)
- Filtering based on node visibility
- Methods: `renderLinks()`, `updateLinkPositions()`, `updateLinkLabels()`

#### `graph/simulation.js`
D3 physics simulation:
- Forces: charge (repulsion), link (attraction), center, collision
- Simulation management (create, reheat, cool)
- Dynamic node/link updates
- Methods: `createSimulation()`, `attachTickHandler()`, `reheat()`, `updateNodes()`, `updateLinks()`

#### `interactions/filters.js`
Filtering logic:
- Type filtering (multi-select)
- Calculate visible nodes/links
- Apply filters to DOM
- Dynamic filter population from ontology labels
- Methods: `initialize()`, `setSeverityFilter()`, `setTypeFilter()`, `populateFilterOptions()`, `clearFilters()`

#### `interactions/node-details.js`
Node details panel:
- Display detailed node information on click
- List connected nodes with relationships
- XSS protection (HTML escaping)
- Multilingual update
- Methods: `displayNodeDetails()`, `clearNodeDetails()`, `updateLabels()`

#### `main.js`
Application orchestration:
- Initialization sequence (config → i18n → data → ontology → graph → interactions)
- File-based data loading for custom use case JSON files
- Main event listeners and graph rendering lifecycle
- Error handling and initialization guardrails
- Auto-initialization on DOMContentLoaded
- Methods: `initialize()`, `displayErrorMessage()`, `isReady()`, `getGraphData()`

---

## Development Guide

### How to Extend the Code

#### Add a New Feature

Example: Add a "Reset Graph" button

1. **Add to HTML** (`index.html`):
```html
<button id="resetButton" data-i18n="menu.reset">Reset</button>
```

2. **Add translation** (`locales/fr.json` and `locales/en.json`):
```json
{"menu": {"reset": "Réinitialiser"}}
{"menu": {"reset": "Reset"}}
```

3. **Add handler** (end of `main.js`):
```javascript
d3.select('#resetButton').on('click', () => {
    SimulationModule.reheat();
    FiltersModule.clearFilters();
});
```

#### Add a New Filter

1. Create function in `filters.js`
2. Add DOM selector to `config.js`
3. Add event handler in `attachEventHandlers()`
4. Update `calculateVisibleNodes()` logic

#### Change Colors

Edit `js/config.js`:
```javascript
AppConfig.colors.nodeType.risk = '#FF0000';  // Red
AppConfig.colors.nodeSeverity['4. Maximale'] = '#8B0000';  // Maroon
```

#### Adjust Physics Simulation

Edit `js/config.js`:
```javascript
GRAPH_CONFIG.NODE_REPULSION = -320;        // Stronger repulsion
GRAPH_CONFIG.DEFAULT_LINK_DISTANCE = 300;  // Longer links
```

### Fix a Bug

1. **Open DevTools** (F12)
2. **Check Console** for JavaScript errors
3. **Check Network** for missing files
4. **Check Sources** for breakpoints
5. **Read** relevant documentation
6. **Identify** responsible module
7. **Modify** module code
8. **Test** in browser
9. **Refresh** (F5) for reload

Useful console commands:
```javascript
CyberViewApplication.isReady()  // App ready?
I18nModule.getLanguage()       // Current language
FiltersModule.getFilterState() // Filter state
CyberViewApplication.getGraphData()  // Graph data
```

Regression checks can be run locally with:
```bash
python tests/smoke_check.py
```

### Add a Translation

1. **Edit** `locales/fr.json` for French
2. **Edit** `locales/en.json` for English
3. **Add key** in nested structure:
```json
{
  "category": {
    "myKey": "Texte français"
  }
}
```

4. **Use in HTML**:
```html
<element data-i18n="category.myKey">Default text</element>
```

5. **Use in JavaScript**:
```javascript
const text = I18nModule.getTranslation('category.myKey');
```

#### Existing Translation Structure

```
{
  "headerLabels": { "logo", "title" },
  "commandsLabels": { "title", "file", "loadedFile", "loadFileButton", "view", "viewIndividuals", "viewOntology", "classFilter" },
  "informationLabels": { "title", "zoomHint", "legend", "selectedIndividual", "classes", "relations", "description", "types" },
  "footerLabels": { "license", "cc", "flags", "flagsAuthor", "flagsSource", "background", "backgroundAuthor", "backgroundSource" }
}
```

---

## Configuration

### Modifying Configuration

All configurable parameters are in `js/config.js`:

#### Colors

```javascript
AppConfig.colors.nodeType.risk = '#a6cee3';
AppConfig.colors.nodeSeverity['2. Limitée'] = '#1f78b4';
AppConfig.colors.linkType['has-criteria'] = '#ff6b6b';
```

#### Node Sizes

```javascript
AppConfig.nodeSizes.baseRadius.risk = 12;  // Base size
AppConfig.nodeSizes.degreeBoost.factor = 0.5;  // Boost per link
```

#### Simulation Forces

```javascript
GRAPH_CONFIG.NODE_REPULSION = -280;
GRAPH_CONFIG.DEFAULT_LINK_DISTANCE = 280;
GRAPH_CONFIG.ONTOLOGY_LINK_DISTANCE = 400;
AppConfig.simulationForces.center.strength = 0.1;
```

#### DOM Selectors

If HTML structure changes:
```javascript
AppConfig.selectors.svgContainer = '#my-container';
AppConfig.selectors.loadedStudyName = '#my-loaded-name';
```

#### File Paths

```javascript
AppConfig.dataFiles.useCase = 'data/usecase-2026-08-05.json';
AppConfig.translationFiles.fr = 'locales/fr.json';
```

---

## Troubleshooting

### Tooltips Don't Display

**Check:**
1. That `node-renderer.js` loads (DevTools → Network)
2. That `<title>` SVG elements exist:
```javascript
d3.selectAll('circle').selectAll('title').size()  // Should be > 0
```

**Solution:**
- Ensure all scripts load in correct order
- Check console for errors

### Translations Don't Change

**Check:**
1. That `locales/fr.json` and `locales/en.json` exist
2. That keys match exactly:
```javascript
// HTML must match JSON
<div data-i18n="menu.actions"></div>
// locales/fr.json: {"menu": {"actions": "..."}}
```

**Solution:**
- Verify key spelling
- Ensure JSON files are valid
- Check console for loading errors

### Graph Doesn't Render

**Check:**
1. That `data/*.json` exist and are valid
2. That SVG container exists (`id="content_graph_container"`)
3. That console has no errors

**Debug commands:**
```javascript
// Check data
CyberViewApplication.getGraphData()

// Check simulation
SimulationModule.getSimulation()

// Check D3
d3.selectAll('circle').size()  // Should be > 0
```

### Filters Don't Work

**Check:**
1. That class filter buttons are present:
```javascript
d3.select('#typeFilterContainer').selectAll('.type-filter__item').size()  // Should be > 0
```

2. That nodes have correct `type`:
```javascript
console.log(CyberViewApplication.getGraphData().nodes)
```

**Solution:**
- Ensure nodes expose `type`
- Verify `filters.js` initializes correctly
- Reload page (clear cache)

### Loading Errors

**Check script order** in `index.html`:
1. config.js
2. i18n.js
3. data-loader.js
4. ontology.js
5. graph-data.js
6. graph/*.js
7. interactions/*.js
8. main.js

**Order is critical!** Modules depend on AppConfig existing before loading.

### Slow Performance

For large graphs (1000+ nodes):
- Reduce absolute node repulsion
- Decrease link distances
- Reduce number of simulation ticks

```javascript
GRAPH_CONFIG.NODE_REPULSION = -180;
GRAPH_CONFIG.DEFAULT_LINK_DISTANCE = 180;
```

---

## Additional Resources

- **D3.js Documentation**: https://d3js.org/
- **SVG Specification**: https://www.w3.org/TR/SVG/
- **Browser Support**: https://caniuse.com/

---

**Last updated:** January 2026  
**Version:** 1.0 Refactored  
**Status:** Production Ready ✅
