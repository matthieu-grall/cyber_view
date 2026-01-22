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

// Créer un groupe pour le zoom/pan
const g = svg.append("g");

// Ajouter le zoom
const zoom = d3.zoom()
    .on("zoom", (event) => {
        g.attr("transform", event.transform);
    });

svg.call(zoom);

// Chargement des données
d3.json("data/risks.json").then(function(data) {
    console.log("Données chargées:", data.length, "risques");

    // Création des nœuds et liens
    let nodes = [];
    let links = [];

    data.forEach(risk => {
        // Noeud principal = risque
        nodes.push({
            id: risk["generic-id"],
            label: risk["generic-short-label"],
            type: "risk",
            severity: risk["feared-event"].severity
        });

        // Feared Event
        let fe = {
            id: risk["generic-id"] + "_FE",
            label: risk["feared-event"]["security-criteria"],
            type: "feared-event",
            severity: risk["feared-event"].severity
        };
        nodes.push(fe);
        links.push({ source: risk["generic-id"], target: fe.id });

        // Risk Scenario
        let rs = {
            id: risk["generic-id"] + "_RS",
            label: risk["risk-scenario"]["strategic-scenario"],
            type: "risk-scenario",
            severity: risk["feared-event"].severity
        };
        nodes.push(rs);
        links.push({ source: risk["generic-id"], target: rs.id });
    });

    console.log("Nœuds créés:", nodes.length, "| Liens créés:", links.length);
    
    // Mettre à jour les compteurs d'info
    document.getElementById("nodeCount").textContent = nodes.length;
    document.getElementById("linkCount").textContent = links.length;

    // Force simulation
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width / 2, height / 2));

    // Dessin des liens
    const link = g.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("class", "link");

    // Dessin des nœuds
    const node = g.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .enter()
        .append("g");

    node.append("circle")
        .attr("r", 20)
        .attr("fill", d => severityColor[d.severity] || "#ccc");

    node.append("text")
        .attr("dx", 25)
        .attr("dy", 5)
        .text(d => d.label);

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
        node.style("display", d => (value === "all" || d.severity === value) ? "block" : "none");
        link.style("display", l => {
            const srcVisible = (value === "all" || l.source.severity === value);
            const tgtVisible = (value === "all" || l.target.severity === value);
            return (srcVisible && tgtVisible) ? "block" : "none";
        });
    });

});
