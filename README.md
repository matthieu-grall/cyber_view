# cyber_view

## Objective

The objective of cyber_view is to **enable the visualization of data used in the cyber scope**.

The general idea would be to simulate a structured data lake, which will expand progressively, with new data from different cyber use cases, and to offer different visualizations of this data.

![Screenshot1](img/screenshot1.png)
![Screenshot2](img/screenshot2.png)

This should also allow to:
- **demonstrate the value of data visualization**, for example to carry out risk studies (e.g., realizing that objects have already been created and reusing them, identifying inconsistencies and managing them, acting on the various components of risks and not only on vulnerabilities, etc.);
- **highlight the [cyber_ontology](https://github.com/matthieu-grall/cyber_ontology) and the [methodological tools for artificial intelligence (AI)](https://github.com/matthieu-grall/ai)**;
- **carry out numerous study or research projects**.

---

[![CC BY 4.0][cc-by-shield]][cc-by]

This project is licensed under a 
[Creative Commons Attribution 4.0 International License][cc-by].

[![CC BY 4.0][cc-by-image]][cc-by]

[cc-by]: http://creativecommons.org/licenses/by/4.0/
[cc-by-image]: https://i.creativecommons.org/l/by/4.0/88x31.png
[cc-by-shield]: https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg

---

## Features

- **Interactive force-directed graph** — nodes represent cyber objects, edges represent their relationships; automatic layout powered by D3.js
- **Two views** — *Individuals* (ontology-native use case data) and *Ontology* (cyber_ontology class hierarchy)
- **Node interaction** — hover for a tooltip, click for a details panel, drag to reposition
- **Filtering** — separate multi-select filters by use case and by class, with consistent UI in both views
- **Multilingual** — French and English, switchable at any time, persisted in the browser
- **Load your own data** — import any use case JSON file directly in the browser
- **No installation required** — pure static web application

---

## Architecture status

The project now prepares a **three-layer architecture** to support future visualizations without changing current behavior:

- **Visualizations layer** — rendering engines (currently a shared Network engine)
- **Views layer** — business-oriented views (currently Individuals and Ontology)
- **Data layer** — independent data loading and graph-data preparation

In the current version, **Individuals** and **Ontology** are wired as two view definitions using the same network visualization engine, with no UI or feature change.

---

## Status and roadmap

### ✅ Current version — 2026-08-06

The application is functional: the ontology is consolidated for the first usecase, data is consistent with this ontology, the graph visualization works for both the Individuals and Ontology views, node details and graph interactions are operational, and the multilingual interface is in place. The latest rendering pass simplified self-loop geometry with cleaner non-crossing arcs, one clear arrow direction, and improved relation-label placement around looped links.

### 🔄 Priorities

1. **Add conformance checks for individuals against the ontology**, with explicit highlighting of inconsistencies
1. **Create a favicon**
1. **Consolidate ontology and individuals**

### ⭕ Later!

1. **Study additional dedicated visualizations** for specific use cases, especially regarding visual form
1. **Add a search feature**
1. **Create a .json file editor**
1. **Add more use cases**
1. **Add another visualization**, for example a risk assessment matrix

---

## Quick start

```bash
# Option 1: open directly
open index.html

# Option 2: local server (recommended)
python -m http.server 8000
# Then open: http://localhost:8000
```

Requires a modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+). No build step, no dependencies to install.

---

## Going further

- **[TECHNICAL.md](TECHNICAL.md)** — architecture, file organization, module descriptions, development guide
- **[data/ONTOLOGY.md](data/ONTOLOGY.md)** — ontology design principles, naming conventions, modeling rules
- **[cyber_ontology](https://github.com/matthieu-grall/cyber_ontology)** — the reference ontology this project builds on
- **[AI methodological tools](https://github.com/matthieu-grall/ai)** — related methodological resources