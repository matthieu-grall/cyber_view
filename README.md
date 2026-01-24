# cyber_view

[![CC BY 4.0][cc-by-shield]][cc-by]

Those documents are licensed under a 
[Creative Commons Attribution 4.0 International License][cc-by].

[![CC BY 4.0][cc-by-image]][cc-by]

[cc-by]: http://creativecommons.org/licenses/by/4.0/
[cc-by-image]: https://i.creativecommons.org/l/by/4.0/88x31.png
[cc-by-shield]: https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg

## Table of Contents

- [Objective](#objective)
- [User Features](#user-features)
  - [Graph Visualization](#graph-visualization)
  - [User Interactions](#user-interactions)
  - [Data Filtering](#data-filtering)
  - [Internationalization](#internationalization)
  - [Dynamic Legend](#dynamic-legend)
- [Installation and Usage](#installation-and-usage)
  - [Requirements](#requirements)
  - [Quick Start](#quick-start)
  - [First Use](#first-use)
- [Documentation](#documentation)
- [Requirements](#requirements-1)
- [Epics](#epics)
- [User Stories](#user-stories)
- [Backlog and History](#backlog-and-history)

---

## Objective

The objective of cyber_view is to **enable the visualization of data used in the cyber scope**.

The general idea would be to simulate a structured data lake, which will expand progressively, with new data from different cyber use cases, and to offer different visualizations of this data.

This should also allow to:
- **demonstrate the value of data visualization**, for example to carry out risk studies (e.g., realizing that objects have already been created and reusing them, identifying inconsistencies and managing them, acting on the various components of risks and not only on vulnerabilities, etc.);
- **highlight the [cyber_ontology](https://github.com/matthieu-grall/cyber_ontology) and the [methodological tools for artificial intelligence (AI)](https://github.com/matthieu-grall/ai)**;
- **carry out numerous study or research projects**.

---

## User Features

### Graph Visualization

- **Force-Directed Graph**: Interactive visualization of cybersecurity risks with automatic layout based on D3.js physics
- **Zoom and Pan**: Scroll to zoom, click-drag to navigate the graph
- **Proportional Nodes**: Node size increases with the number of connections
- **Color Coding**: Nodes are colored by type (risk, source, asset, etc.) and by severity

### User Interactions

- **Node Hover**: Displays tooltip with name, type, severity, and number of connections
- **Link Hover**: Displays relationship type between nodes
- **Node Click**: Shows details panel with:
  - Complete node information
  - List of connected nodes and relationship types
  - Number of connections
  - Additional properties
- **Drag Nodes**: Manually move nodes on the graph
- **Empty Click**: Closes the details panel

### Data Filtering

- **Filter by Severity**: Display only risks of a specific severity level (Minimal, Limited, Important, Maximum)
- **Filter by Type**: Display only nodes of a specific type (risk, source, asset, criteria, etc.)
- **Combined Filtering**: Both filters work together (AND logic)
- **Dynamic Update**: The graph reorganizes automatically when filtering

### Internationalization

- **French/English**: Switch between FR and EN via flags in the header
- **Complete Translations**: All interface texts are translated
- **Persistence**: Language is saved in the browser

### Dynamic Legend

- **Node Legend**: Displays semantic definitions for each node type
- **Multilingual Update**: Legend changes language when switching FR/EN

---

## Installation and Usage

### Requirements

- Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- No installation needed (static web application)

### Quick Start

```bash
# Option 1: Direct opening
open index.html

# Option 2: Local server (recommended for development)
python -m http.server 8000
# Then open: http://localhost:8000
```

### First Use

1. Open `index.html` in a browser
2. Observe the risk graph appear
3. Try the interactions:
   - Hover over nodes → see tooltips
   - Click a node → see details panel
   - Use filters → filter risks
   - Scroll/drag → zoom and navigate
4. Switch language (FR/EN flags)

---

## Documentation

For detailed information about code architecture, development guide, configuration, and troubleshooting, see [TECHNICAL.md](TECHNICAL.md).

---

The generic requirements are the following:
- cyber_view is a **web application**;
- cyber_view is **innovative, ergonomic, aesthetic and attractive**;
- cyber_view is **interactive**: it allows, for example, moving nodes using the mouse and obtaining more information when hovering and/or clicking on objects;
- cyber_view is **dynamic**: it updates in real-time when data changes;
- cyber_view stores data (objects, properties and relationships) that are **structured in accordance with the [cyber_ontology](https://github.com/matthieu-grall/cyber_ontology)** (they can come from different sources, extracted, transformed and loaded beforehand);
- cyber_view strives towards a **state-of-the-art** application in terms of development (file structure, naming of files and variables, file splitting, clean development, security, etc.);
- cyber_view includes numerous **comments**.

## Epics
The currently identified epics are as follows:
1. User interface (UI);
1. Risk management network graph;
1. Ontology network graph;
1. <many instances> Other risk management visualizations;
1. <many instances> Other cyber use cases.

## User stories

[in progress...]

The currently identified user stories are as follows (in order of priority):
| <center>**Epic**</center> | <center>**User story**</center> | <center>**Contribution**</center> | <center>**Difficulty**</center> | <center>**Progress**</center> |
| --- | --- | --- | --- | --- |
| Risk management network graph | **Visualize something**: I wish to be able to visualize some data related to an AI risk study in the form of a relational/network graph, in 2D or 3D, which represents objects in the form of nodes and their links in the form of edges, visually distinguishing objects (e.g.: shapes, images, colors). | <center>🟦</center> | <center>🔸</center> | <center>✅</center> |
| UI | **Template**: as a user, I wish to get a consistent DATA VISIONS template. | <center>🔹</center> | <center>⬜</center> | <center>✅</center> |
| UI | **Multilingual**: as a user, I wish to be able to change the UI language, and at least in French (FR) and English (EN). | <center>🟦</center> | <center>🔸</center> | <center>🔄</center> |
| Risk management network graph | **Visualize some data from AI scenarios**: as a participant in an AI risk study, I wish to be able to visualize the main data related to the study by scenarios (risks, business values, feared events, consequences, severities, strategic scenarios, attack chains, likelihoods) in the form of a graph, in order to quickly understand the study and verify the consistency of the data. | <center>🟦</center> | <center>🔶</center> | <center>🔄</center> |
| Risk management network graph | **Expand/Collapse**: allows expanding and collapsing nodes. | <center>🔷</center> | <center>⬜</center> | <center>⭕</center> |
| Risk management network graph | **Visualize all data from a risk management study**: visualization of all data from the risk management methodology. | <center>🟦</center> | <center>🔶</center> | <center>⭕</center> |
| Risk management network graph | **Visualize data from different risk studies**: visualization of data from several risk studies that may share common elements. | <center>🔷</center> | <center>🟧</center> | <center>⭕</center> |
| UI | **Choose visualization**: Be able to choose one's visualization. | <center>🟦</center> | <center>🔸</center> | <center>⭕</center> |
| UI | **Load dataset**: Load a particular dataset. | <center>🔷</center> | <center>⬜</center> | <center>⭕</center> |
| Risk management network graph | **Modify data**: allows modifying data (creation, modification, deletion, etc.). | <center>🔷</center> | <center>🟧</center> | <center>⭕</center> |
| <many instances> Other risk management visualizations | **TBD**: offers different visualizations according to user stories (represent the system by cyberspace layers, assess compliance with best practices, assess risk treatment through measures, assess residual risks to decide their acceptability, etc.). | <center>🟦</center> | <center>🟧</center> | <center>⭕</center> |
| <many instances> Other cyber use cases | **TBD**: visualization of data from other use cases than "Risk Management" that may share common elements. | <center>🟦</center> | <center>🟧</center> | <center>⭕</center> |

**Contribution scale**:
⬜ Minimal
🔹 Low
🔷 High
🟦 Maximal

**Difficulty scale**:
⬜ Minimal
🔸 Low
🔶 High
🟧 Maximal

**Progress Scale** :
⭕ Not started
🔄 In progress
✅ Completed

## Backlog and history

[in progress...]

The backlog is the following:
| <center>**User story**</center> | <center>**Action**</center> | <center>**Progress**</center> |
| --- | --- | --- |
| Visualize something | Create data (csv) | <center>✅</center> |
| Visualize something | Create code to visualize data | <center>✅</center> |
| Template | Adopt the DATA VISIONS template | <center>✅</center> |
| Visualize some data from AI scenarios | Scale the size of nodes proportionally to the number of adjacent edges | <center>⭕</center> |
| Visualize some data from AI scenarios | Reference the [cyber_ontology](https://github.com/matthieu-grall/cyber_ontology) for each object (class, properties or relationship) | <center>⭕</center> |
| Multilingual | Automatically retrieve the FR and EN labels from the [cyber_ontology](https://github.com/matthieu-grall/cyber_ontology) when they exist | <center>⭕</center> |
|  |  |  |  | <center>⭕</center> |
|  |  |  |  | <center>⭕</center> |
|  |  |  |  | <center>⭕</center> |
|  |  |  |  | <center>⭕</center> |

**Progress scale**:
⭕ Not started
🔄 In progress
✅ Completed

