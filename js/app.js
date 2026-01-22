// =============================================
// app.js - Visualisation D3.js des risques
// =============================================

// Dimensions du SVG - adapté au conteneur
const container = d3.select("#graph-container");
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

// Fonction pour résoudre un ID dans les données de référence
function resolveId(id, dataType) {
    if (!id || !referenceData[dataType]) return null;
    const item = referenceData[dataType].find(d => d.id === id);
    return item ? item.label : id;
}

// Créer un groupe pour le zoom/pan
const g = svg.append("g");

// Ajouter le zoom
const zoom = d3.zoom()
    .on("zoom", (event) => {
        g.attr("transform", event.transform);
    });

svg.call(zoom);

// Chargement des données
Promise.all([
    d3.json("data/risks.json"),
    d3.json("data/risk-sources.json"),
    d3.json("data/business-assets.json"),
    d3.json("data/security-criteria.json"),
    d3.json("data/severity-levels.json"),
    d3.json("data/likelihood-levels.json")
]).then(function([riskData, riskSources, businessAssets, securityCriteria, severityLevels, likelihoodLevels]) {
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
    const link = g.append("g")
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
    const node = g.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes, d => d.id)
        .enter()
        .append("g")
        .attr("class", d => "node node-" + d.type);

    // Rayon du nœud selon le type
    const nodeRadius = (d) => {
        if (d.type === "risk") return 12;
        if (d.type === "security-criteria") return 10;
        if (d.type === "business-asset") return 10;
        if (d.type === "risk-source") return 9;
        if (d.type === "severity-level") return 8;
        if (d.type === "likelihood-level") return 8;
        return 8;
    };

    node.append("circle")
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
        .attr("stroke-width", d => d.type === "risk" ? 2 : 1.5);

    node.append("text")
        .attr("dx", 15)
        .attr("dy", 4)
        .attr("font-size", d => d.type === "risk" ? "11px" : "9px")
        .attr("font-weight", d => d.type === "risk" ? "bold" : "normal")
        .text(d => d.label)
        .append("title")
        .text(d => `[${d.type}] ${d.label}${d.description ? '\n' + d.description : ""}`);

    // Drag
    node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Simulation tick
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("transform", d => `translate(${d.x},${d.y})`);
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

    // Filtre par gravité
    d3.select("#severityFilter").on("change", function() {
        const value = this.value;
        
        // Filtrer les nœuds
        node.style("opacity", d => {
            if (d.type === "risk") {
                return (value === "all" || d.severity === value) ? 1 : 0.1;
            }
            // Les nœuds intermédiaires suivent leurs nœuds parents
            return 1;
        });
        
        // Filtrer les liens
        link.style("opacity", l => {
            const srcType = l.source.type;
            const srcSeverity = l.source.severity;
            
            if (srcType === "risk") {
                return (value === "all" || srcSeverity === value) ? 0.8 : 0.05;
            }
            return 1;
        });
    });

});
