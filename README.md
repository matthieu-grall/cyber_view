# cyber_view


[![CC BY 4.0][cc-by-shield]][cc-by]

Those documents are licensed under a 
[Creative Commons Attribution 4.0 International License][cc-by].

[![CC BY 4.0][cc-by-image]][cc-by]

[cc-by]: http://creativecommons.org/licenses/by/4.0/
[cc-by-image]: https://i.creativecommons.org/l/by/4.0/88x31.png
[cc-by-shield]: https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg

## Objective

The objective of cyber_view is to **enable the visualization of data used in the cyber scope**.

The general idea would be to simulate a structured data lake, which will expand progressively, with new data from different cyber use cases, and to offer different visualizations of this data.

This should also allow to:
- **demonstrate the value of data visualization**, for example to carry out risk studies (e.g., realizing that objects have already been created and reusing them, identifying inconsistencies and managing them, acting on the various components of risks and not only on vulnerabilities, etc.);
- **highlight the [cyber_ontology](https://github.com/matthieu-grall/cyber_ontology) and the [methodological tools for artificial intelligence (AI)](https://github.com/matthieu-grall/ai)**;
- **carry out numerous study or research projects**.

## Requirements

The generic requirements are the following:
- cyber_view is a **web application**.
- cyber_view is **innovative, ergonomic, aesthetic and attractive**.
- cyber_view is **interactive**: it allows, for example, moving nodes using the mouse and obtaining more information when hovering and/or clicking on objects.
- cyber_view is **dynamic**: it updates in real-time when data changes.
- cyber_view stores data (objects, properties and relationships) that are **structured in accordance with the [cyber_ontology](https://github.com/matthieu-grall/cyber_ontology)** (they can come from different sources, extracted, transformed and loaded beforehand).
- cyber_view strives towards a **state-of-the-art** application in terms of development (file structure, naming of files and variables, file splitting, clean development, security, etc.).
- cyber_view includes numerous **comments**.

## User stories

[in progress...]

The currently identified user stories are as follows (in order of priority):
1. ✅ **Network graph - Visualize something**: a user wishes to be able to visualize some data related to the study by scenarios in the form of a relational/network graph, in 2D or 3D, which represents objects in the form of nodes and their links in the form of edges, visually distinguishing objects (e.g.: shapes, images, colors).
1. 🔄 **Risk management - Visualize some data from AI scenarios**: as a participant in an AI risk study, a user wishes to be able to visualize the main data related to the study by scenarios in the form of a graph, in order to quickly understand the study and verify the consistency of the data.
1. 🔄 **Risk management - Visualize some data from AI scenarios**: visualization of the main data from an AI risk study (by scenarios, cf. risk summary table from the methodology): risks, business values, feared events, consequences, severities, strategic scenarios, attack chains, likelihoods).
1. 🔄 **User interface (UI) - Multilingual**: cyber_view is multilingual, and at least in French (FR) and English (EN).
1. ⭕ visualization of all data from the AI risk management methodology.
1. ⭕ visualization of data from several risk studies.
1. ⭕ allows expanding and collapsing nodes.
1. ⭕ allows modifying data (creation, modification, deletion, etc.).
1. ⭕ offers different visualizations according to user stories (represent the system by cyberspace layers, assess compliance with best practices, assess risk treatment through measures, assess residual risks to decide their acceptability, etc.).
1. ⭕ visualization of all data from the "Risk Management" use case.
1. ⭕ visualization of data from other use cases than "Risk Management".
1. ⭕ Be able to choose one's visualization.
1. ⭕ Load a particular dataset.
1. ⭕ Integrate more complete data than that from an AI risk assessment summary.
1. ⭕ Integrate data from several risk studies that may share common elements.
1. ⭕ Integrate data from other use cases than risk management.

**Progress Scale** :
⭕ Not started
🔄 In progress
✅ Completed

## Backlog and history

[in progress...]

The backlog is the following:
| <center>**User story**</center> | <center>**Action**</center> | <center>**Contribution**</center> | <center>**Difficulty**</center> | <center>**Progress**</center> |
| --- | --- | --- | --- | --- |
| Network graph - Visualize something | Create data (csv) | 🟦 | 🔸 | ✅ |
| Network graph - Visualize something | Create code to visualize data | 🟦 | 🔶 | ✅ |
| Risk management - Visualize some data from AI scenarios | Scale the size of nodes proportionally to the number of adjacent edges | 🔷 | 🔸 | ⭕ |
| Risk management - Visualize some data from AI scenarios | Reference the [cyber_ontology](https://github.com/matthieu-grall/cyber_ontology) for each object (class, properties or relationship) | 🔹 | ⬜ | ⭕ |
| UI - Template | Adopt the DATA VISIONS template | 🔷 | 🔸 | ⭕ |
| UI - Multilingual | Automatically retrieve the FR and EN labels from the [cyber_ontology](https://github.com/matthieu-grall/cyber_ontology) when they exist | 🔹 | 🟧 | ⭕ |
|  |  |  |  | ⭕ |
|  |  |  |  | ⭕ |
|  |  |  |  | ⭕ |
|  |  |  |  | ⭕ |
|  |  |  |  | ⭕ |

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

**Progress scale**:
⭕ Not started
🔄 In progress
✅ Completed

