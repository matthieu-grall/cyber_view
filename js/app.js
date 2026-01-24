// =============================================
// app.js - Visualisation D3.js des risques
// =============================================

// ===== INTERNATIONALIZATION (i18n) =====
const i18n = {
    currentLang: localStorage.getItem('lang') || 'fr',
    translations: {}
};

// Charger les traductions
async function loadTranslations(lang) {
    try {
        const response = await fetch(`locales/${lang}.json`);
        i18n.translations = await response.json();
        i18n.currentLang = lang;
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;
        applyTranslations();
    } catch (error) {
        console.error('Erreur chargement traductions:', error);
    }
}

// Appliquer les traductions aux éléments DOM
function applyTranslations() {
    // Traductions pour data-i18n (texte interne)
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const text = getTranslation(key);
        if (text) element.textContent = text;
    });
    
    // Traductions pour data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const text = getTranslation(key);
        if (text) element.placeholder = text;
    });
    
    // Régénérer la légende de l'ontologie avec la nouvelle langue
    if (ontologyData) {
        generateOntologyLegend(ontologyData);
    }
    
    // Mettre à jour les labels du filtre type
    updateTypeFilterLabels();
}

// Générer la légende des nœuds à partir de l'ontologie
function generateOntologyLegend(ontologyData) {
    const container = document.getElementById('ontology-nodes');
    if (!container) return;
    
    container.innerHTML = ''; // Effacer le contenu précédent
    
    // Couleurs des nœuds par type
    const nodeColors = {
        'risk': '#a6cee3',
        'feared-event': '#ffb6c1',
        'business-asset': '#87ceeb',
        'risk-source': '#4ecdc4',
        'security-property': '#9b59b6'
    };
    
    const nodeSizes = {
        'risk': { w: 10, h: 10, b: '2px solid #333' },
        'feared-event': { w: 9, h: 9, b: '1px solid #666' },
        'business-asset': { w: 9, h: 9, b: '1px solid #666' },
        'risk-source': { w: 8, h: 8, b: '1px solid #666' },
        'security-property': { w: 8, h: 8, b: '1px solid #666' }
    };
    
    // Créer les éléments de légende pour chaque classe
    ontologyData.classes.forEach(ontologyClass => {
        const classId = ontologyClass.id;
        const color = nodeColors[classId] || '#ddd';
        const size = nodeSizes[classId] || { w: 8, h: 8, b: '1px solid #666' };
        const label = ontologyClass.label[i18n.currentLang] || ontologyClass.label.fr;
        
        const keyItem = document.createElement('div');
        keyItem.className = 'key-item';
        keyItem.innerHTML = `
            <span class="key-color-dot" style="width: ${size.w}px; height: ${size.h}px; background: ${color}; border: ${size.b};"></span>
            <span title="${ontologyClass.isDefinedBy[i18n.currentLang] || ontologyClass.isDefinedBy.fr}">${label}</span>
        `;
        container.appendChild(keyItem);
    });
}

// Récupérer une traduction
function getTranslation(key) {
    const keys = key.split('.');
    let value = i18n.translations;
    for (const k of keys) {
        value = value?.[k];
    }
    return value || key;
}

// Event listeners pour changement de langue
document.addEventListener('DOMContentLoaded', function() {
    // Charger les traductions initiales
    loadTranslations(i18n.currentLang);
    
    // Ajouter les event listeners aux drapeaux
    document.querySelectorAll('.language-toggle').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const lang = this.getAttribute('data-lang');
            loadTranslations(lang);
        });
    });
});

// Dimensions du SVG - adapté au conteneur
const container = d3.select("#graph_container");
const width = container.node().clientWidth || 1200;
const height = container.node().clientHeight || 800;

// SVG
const svg = d3.select("#graph")
    .attr("width", width)
    .attr("height", height);

// Couleurs par gravité
const severityColor = {
    "1. Minimale": "#a6cee3",
    "2. Limitée": "#1f78b4",
    "3. Importante": "#b2df8a",
    "4. Maximale": "#33a02c"
};

// Conteneurs pour les données de référence
const referenceData = {
    riskSources: [],
    businessAssets: [],
    securityCriteria: [],
    severityLevels: [],
    likelihoodLevels: []
};

// Données d'ontologie
let ontologyData = null;

// Variables globales pour les sélections D3
let nodeSelection = null;
let linkSelection = null;

// Mapping des types de relations avec labels traduits
const relationshipLabels = {
    "has-criteria": { fr: "affecte le critère", en: "affects criterion" },
    "affects-asset": { fr: "affecte l'actif", en: "affects asset" },
    "from-source": { fr: "provient de la source", en: "comes from source" },
    "has-severity": { fr: "a pour gravité", en: "has severity" },
    "has-likelihood": { fr: "a pour vraisemblance", en: "has likelihood" }
};

// Mapping des types de nœuds avec labels de l'ontologie
function getNodeTypeLabel(type, lang = 'fr') {
    if (!ontologyData) return type;
    
    const classMap = {
        'risk': 'risk',
        'feared-event': 'feared-event',
        'security-criteria': 'security-property',
        'business-asset': 'business-asset',
        'risk-source': 'risk-source',
        'severity-level': null,
        'likelihood-level': null
    };
    
    const classId = classMap[type];
    if (!classId) return type;
    
    const ontClass = ontologyData.classes.find(c => c.id === classId);
    return ontClass ? ontClass.label[lang] : type;
}

// Fonction pour résoudre un ID dans les données de référence
function resolveId(id, dataType) {
    if (!id || !referenceData[dataType]) return null;
    const item = referenceData[dataType].find(d => d.id === id);
    return item ? item.label : id;
}

// Chargement des données
Promise.all([
    d3.json("data/risks.json"),
    d3.json("data/risk-sources.json"),
    d3.json("data/business-assets.json"),
    d3.json("data/security-criteria.json"),
    d3.json("data/severity-levels.json"),
    d3.json("data/likelihood-levels.json"),
    d3.json("data/cyber-ontology.json")
]).then(function([riskData, riskSources, businessAssets, securityCriteria, severityLevels, likelihoodLevels, cyberOntology]) {
    // Charger les traductions initiales et créer le graphe
    ontologyData = cyberOntology;
    loadTranslations(i18n.currentLang).then(() => {
        generateOntologyLegend(ontologyData);
        renderGraph(riskData, riskSources, businessAssets, securityCriteria, severityLevels, likelihoodLevels);
    }).catch(error => {
        console.error('Erreur lors du chargement du graphe:', error);
    });
});

// Fonction principale pour rendre le graphe
async function renderGraph(riskData, riskSources, businessAssets, securityCriteria, severityLevels, likelihoodLevels) {
    // Charger les données de référence
    referenceData.riskSources = riskSources;
    referenceData.businessAssets = businessAssets;
    referenceData.securityCriteria = securityCriteria;
    referenceData.severityLevels = severityLevels;
    referenceData.likelihoodLevels = likelihoodLevels;

    console.log("Données chargées:", riskData.length, "risques");
    console.log("Références:", {
        riskSources: riskSources.length,
        businessAssets: businessAssets.length,
        securityCriteria: securityCriteria.length
    });

    // ===== CRÉATION DES NŒUDS =====
    // Effacer le graphe existant si rafraîchissement de langue
    svg.selectAll("*").remove();
    
    // Créer un groupe pour le zoom/pan
    let g = svg.append("g");

    // Ajouter le zoom
    const zoom = d3.zoom()
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });

    svg.call(zoom);

    // ===== CRÉATION DES NŒUDS =====
    let nodes = [];
    const nodeMap = new Map(); // Pour éviter les doublons
    let links = [];

    // 1. Ajouter tous les RISQUES
    riskData.forEach(risk => {
        const nodeId = risk["generic-id"];
        nodes.push({
            id: nodeId,
            label: risk["generic-short-label"],
            type: "risk",
            severity: resolveId(risk["feared-event"]["severity-id"], "severityLevels"),
            description: risk.description
        });
        nodeMap.set(nodeId, risk);
    });

    // 2. Ajouter tous les CRITÈRES DE SÉCURITÉ (uniques)
    securityCriteria.forEach(criterion => {
        if (!nodeMap.has(criterion.id)) {
            nodes.push({
                id: criterion.id,
                label: criterion.label,
                type: "security-criteria",
                severity: null
            });
            nodeMap.set(criterion.id, criterion);
        }
    });

    // 3. Ajouter tous les ACTIFS MÉTIER (uniques)
    businessAssets.forEach(asset => {
        if (!nodeMap.has(asset.id)) {
            nodes.push({
                id: asset.id,
                label: asset.label,
                type: "business-asset",
                severity: null
            });
            nodeMap.set(asset.id, asset);
        }
    });

    // 4. Ajouter toutes les SOURCES DE RISQUE (uniques)
    riskSources.forEach(source => {
        if (!nodeMap.has(source.id)) {
            nodes.push({
                id: source.id,
                label: source.label,
                type: "risk-source",
                severity: null
            });
            nodeMap.set(source.id, source);
        }
    });

    // 5. Ajouter tous les NIVEAUX DE GRAVITÉ (uniques)
    severityLevels.forEach(level => {
        if (!nodeMap.has(level.id)) {
            nodes.push({
                id: level.id,
                label: level.label,
                type: "severity-level",
                severity: level.label
            });
            nodeMap.set(level.id, level);
        }
    });

    // 6. Ajouter tous les NIVEAUX DE VRAISEMBLANCE (uniques)
    likelihoodLevels.forEach(level => {
        if (!nodeMap.has(level.id)) {
            nodes.push({
                id: level.id,
                label: level.label,
                type: "likelihood-level",
                severity: null
            });
            nodeMap.set(level.id, level);
        }
    });

    // ===== CRÉATION DES LIENS =====
    riskData.forEach(risk => {
        const riskId = risk["generic-id"];
        
        // Lien vers critère de sécurité
        const criteriaId = risk["feared-event"]["security-criteria-id"];
        links.push({
            source: riskId,
            target: criteriaId,
            type: "has-criteria"
        });

        // Lien vers actif métier
        const assetId = risk["feared-event"]["business-asset-id"];
        links.push({
            source: riskId,
            target: assetId,
            type: "affects-asset"
        });

        // Lien vers source de risque
        const sourceId = risk["risk-scenario"]["risk-source-id"];
        links.push({
            source: riskId,
            target: sourceId,
            type: "from-source"
        });

        // Lien vers niveau de gravité
        const severityId = risk["feared-event"]["severity-id"];
        links.push({
            source: riskId,
            target: severityId,
            type: "has-severity"
        });

        // Lien vers niveau de vraisemblance
        const likelihoodId = risk["risk-scenario"]["likelihood-id"];
        links.push({
            source: riskId,
            target: likelihoodId,
            type: "has-likelihood"
        });
    });

    console.log("Nœuds créés:", nodes.length, "| Liens créés:", links.length);
    
    // Mettre à jour les compteurs d'info
    document.getElementById("nodeCount").textContent = nodes.length;
    document.getElementById("linkCount").textContent = links.length;

    // Calculer le degré (nombre de liens) pour chaque nœud
    const nodeDegree = {};
    nodes.forEach(n => nodeDegree[n.id] = 0);
    links.forEach(l => {
        nodeDegree[l.source]++;
        nodeDegree[l.target]++;
    });

    // Ajouter le degré aux nœuds
    nodes.forEach(n => {
        n.degree = nodeDegree[n.id];
    });

    // Remplir les options du filtre par type
    const typeFilterSelect = document.getElementById('typeFilter');
    const uniqueTypes = [...new Set(nodes.map(n => n.type))];
    uniqueTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = getNodeTypeLabel(type, i18n.currentLang);
        typeFilterSelect.appendChild(option);
    });

    // Force simulation - adapté pour la nouvelle structure
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links)
            .id(d => d.id)
            .distance(d => {
                if (d.source.type === "risk" && d.target.type === "risk") return 80;
                return 150;
            })
            .strength(0.4))
        .force("charge", d3.forceManyBody()
            .strength(d => {
                if (d.type === "risk") return -400;
                return -200;
            }))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius(d => {
            if (d.type === "risk") return 18;
            if (d.type === "security-criteria" || d.type === "business-asset") return 16;
            return 12;
        }));

    // Dessin des liens AVANT les nœuds (important pour l'ordre de rendu)
    linkSelection = g.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("class", d => "link link-" + d.type)
        .attr("stroke", d => {
            if (d.type === "has-criteria") return "#ff6b6b";
            if (d.type === "affects-asset") return "#ffa500";
            if (d.type === "from-source") return "#4ecdc4";
            if (d.type === "has-severity") return "#9b59b6";
            if (d.type === "has-likelihood") return "#2ecc71";
            return "#999";
        })
        .attr("stroke-opacity", 0.7)
        .attr("stroke-width", 1.5);

    // Dessin des nœuds
    nodeSelection = g.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes, d => d.id)
        .enter()
        .append("g")
        .attr("class", d => "node node-" + d.type);

    // Rayon du nœud selon le type ET le degré (nombre de liens)
    const nodeRadius = (d) => {
        const baseSizes = {
            "risk": 12,
            "security-criteria": 10,
            "business-asset": 10,
            "risk-source": 9,
            "severity-level": 8,
            "likelihood-level": 8
        };
        const baseRadius = baseSizes[d.type] || 8;
        // Augmenter le rayon en fonction du degré (max 20% d'augmentation)
        const degreeBoost = Math.min(d.degree * 0.5, 4);
        return baseRadius + degreeBoost;
    };

    nodeSelection.append("circle")
        .attr("r", nodeRadius)
        .attr("fill", d => {
            if (d.type === "risk") return severityColor[d.severity] || "#cccccc";
            if (d.type === "security-criteria") return "#ffb6c1";
            if (d.type === "business-asset") return "#87ceeb";
            if (d.type === "risk-source") return "#4ecdc4";
            if (d.type === "severity-level") return "#9b59b6";
            if (d.type === "likelihood-level") return "#2ecc71";
            return "#ddd";
        })
        .attr("stroke", d => {
            if (d.type === "risk") return "#333";
            return "#666";
        })
        .attr("stroke-width", d => d.type === "risk" ? 2 : 1.5)
        .on("mouseover", function(event, d) {
            // Afficher le type du nœud au survol
            const typeLabel = getNodeTypeLabel(d.type, i18n.currentLang);
            const title = `${typeLabel}\n${d.label}`;
            d3.select(this).attr("data-tooltip", title);
        })
        .on("click", function(event, d) {
            event.stopPropagation();
            displayNodeInfo(d);
        });
    
    // Ajouter des tooltips aux liens
    linkSelection.append("title")
        .text(d => {
            const relationLabel = relationshipLabels[d.type]?.[i18n.currentLang] || d.type;
            return relationLabel;
        });

    nodeSelection.append("text")
        .attr("dx", 15)
        .attr("dy", 4)
        .attr("font-size", d => d.type === "risk" ? "11px" : "9px")
        .attr("font-weight", d => d.type === "risk" ? "bold" : "normal")
        .text(d => d.label)
        .append("title")
        .text(d => `[${d.type}] ${d.label}${d.description ? '\n' + d.description : ""}`);

    // Drag
    nodeSelection.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Simulation tick
    simulation.on("tick", () => {
        linkSelection
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        nodeSelection.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    // Attacher les event listeners aux filtres
    d3.select("#severityFilter").on("change", applyFilters);
    d3.select("#typeFilter").on("change", applyFilters);

};

// Fonction pour appliquer les filtres (doit être accessible globalement)
function applyFilters() {
    if (!nodeSelection || !linkSelection) return;
    
    const severityValue = document.getElementById('severityFilter').value;
    const typeValue = document.getElementById('typeFilter').value;
    
    // Filtrer les nœuds
    nodeSelection.style("opacity", d => {
        const severityMatch = d.type !== "risk" || severityValue === "all" || d.severity === severityValue;
        const typeMatch = typeValue === "all" || d.type === typeValue;
        return (severityMatch && typeMatch) ? 1 : 0.1;
    });
    
    // Filtrer les liens
    linkSelection.style("opacity", l => {
        const severityMatch = l.source.type !== "risk" || severityValue === "all" || l.source.severity === severityValue;
        const typeMatch = typeValue === "all" || l.source.type === typeValue || l.target.type === typeValue;
        return (severityMatch && typeMatch) ? 0.8 : 0.05;
    });
}

// Mettre à jour les labels du filtre type en fonction de la langue
function updateTypeFilterLabels() {
    const typeFilterSelect = document.getElementById('typeFilter');
    if (!typeFilterSelect) return;
    
    // Garder la valeur sélectionnée
    const selectedValue = typeFilterSelect.value;
    
    // Mise à jour des options (excepté "all")
    const options = typeFilterSelect.querySelectorAll('option');
    options.forEach(option => {
        if (option.value !== 'all') {
            const newLabel = getNodeTypeLabel(option.value, i18n.currentLang);
            option.textContent = newLabel;
        }
    });
    
    // Restaurer la sélection
    typeFilterSelect.value = selectedValue;
}

// Fonction pour afficher les informations d'un nœud
function displayNodeInfo(node) {
    const infoDiv = document.getElementById('info');
    const typeLabel = getNodeTypeLabel(node.type, i18n.currentLang);
    
    let html = `
        <div style="border-top: 2px solid #333; padding-top: 10px; margin-top: 10px;">
            <h4 style="margin: 5px 0;">${node.label}</h4>
            <p style="margin: 4px 0;"><strong>Type :</strong> ${typeLabel}</p>
    `;
    
    if (node.degree !== undefined) {
        html += `<p style="margin: 4px 0;"><strong>Nombre de liens :</strong> ${node.degree}</p>`;
    }
    
    if (node.severity) {
        html += `<p style="margin: 4px 0;"><strong>Gravité :</strong> ${node.severity}</p>`;
    }
    
    if (node.description) {
        html += `<p style="margin: 4px 0; font-size: 12px;"><strong>Description :</strong> ${node.description}</p>`;
    }
    
    html += `</div>`;
    
    // Ajouter les infos après les compteurs
    const countersDiv = infoDiv.querySelector('div');
    if (countersDiv) {
        countersDiv.innerHTML += html;
    } else {
        infoDiv.innerHTML = html;
    }
}
