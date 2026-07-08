/**
 * Graph data structure module
 * Transforms raw data into nodes and links for D3 visualization
 */

const GraphDataModule = (() => {
    // ==================== PUBLIC API ====================
    return {
        /**
         * Create nodes and links from raw data
         * @param {Array} riskData - Risk data array
         * @param {Array} riskSources - Risk source reference data
         * @param {Array} businessAssets - Business asset reference data
         * @param {Array} securityCriteria - Security criteria reference data
         * @param {Array} severityLevels - Severity level reference data
         * @param {Array} likelihoodLevels - Likelihood level reference data
         * @returns {Object} Object containing nodes and links arrays
         */
        createGraphData(riskData, riskSources, businessAssets, securityCriteria, severityLevels, likelihoodLevels) {
            const nodes = [];
            const nodeMap = new Map();
            const links = [];

            // ==================== ADD RISK NODES ====================
            riskData.forEach(risk => {
                const nodeId = risk['generic-id'];
                const severityLabel = DataLoaderModule.resolveIdToLabel(
                    risk['feared-event']['severity-id'],
                    'severityLevels'
                );

                nodes.push({
                    id: nodeId,
                    label: risk['generic-short-label'],
                    type: 'risk',
                    severity: severityLabel,
                    description: risk.description,
                    degree: 0
                });
                nodeMap.set(nodeId, risk);
            });

            // ==================== ADD SECURITY CRITERIA NODES ====================
            securityCriteria.forEach(criterion => {
                if (!nodeMap.has(criterion.id)) {
                    nodes.push({
                        id: criterion.id,
                        label: criterion.label,
                        type: 'security-criteria',
                        severity: null,
                        degree: 0
                    });
                    nodeMap.set(criterion.id, criterion);
                }
            });

            // ==================== ADD BUSINESS ASSET NODES ====================
            businessAssets.forEach(asset => {
                if (!nodeMap.has(asset.id)) {
                    nodes.push({
                        id: asset.id,
                        label: asset.label,
                        type: 'business-asset',
                        severity: null,
                        degree: 0
                    });
                    nodeMap.set(asset.id, asset);
                }
            });

            // ==================== ADD RISK SOURCE NODES ====================
            riskSources.forEach(source => {
                if (!nodeMap.has(source.id)) {
                    nodes.push({
                        id: source.id,
                        label: source.label,
                        type: 'risk-source',
                        severity: null,
                        degree: 0
                    });
                    nodeMap.set(source.id, source);
                }
            });

            // ==================== ADD SEVERITY LEVEL NODES ====================
            severityLevels.forEach(level => {
                if (!nodeMap.has(level.id)) {
                    nodes.push({
                        id: level.id,
                        label: level.label,
                        type: 'severity-level',
                        severity: level.label,
                        degree: 0
                    });
                    nodeMap.set(level.id, level);
                }
            });

            // ==================== ADD LIKELIHOOD LEVEL NODES ====================
            likelihoodLevels.forEach(level => {
                if (!nodeMap.has(level.id)) {
                    nodes.push({
                        id: level.id,
                        label: level.label,
                        type: 'likelihood-level',
                        severity: null,
                        degree: 0
                    });
                    nodeMap.set(level.id, level);
                }
            });

            // ==================== CREATE LINKS ====================
            riskData.forEach(risk => {
                const riskId = risk['generic-id'];

                // Link to security criteria
                links.push({
                    source: riskId,
                    target: risk['feared-event']['security-criteria-id'],
                    type: 'has-criteria'
                });

                // Link to business asset
                links.push({
                    source: riskId,
                    target: risk['feared-event']['business-asset-id'],
                    type: 'affects-asset'
                });

                // Link to risk source
                links.push({
                    source: riskId,
                    target: risk['risk-scenario']['risk-source-id'],
                    type: 'from-source'
                });

                // Link to severity level
                links.push({
                    source: riskId,
                    target: risk['feared-event']['severity-id'],
                    type: 'has-severity'
                });

                // Link to likelihood level
                links.push({
                    source: riskId,
                    target: risk['risk-scenario']['likelihood-id'],
                    type: 'has-likelihood'
                });
            });

            // ==================== CALCULATE NODE DEGREES ====================
            const nodeDegree = {};
            nodes.forEach(n => nodeDegree[n.id] = 0);
            links.forEach(l => {
                nodeDegree[l.source]++;
                nodeDegree[l.target]++;
            });

            nodes.forEach(n => {
                n.degree = nodeDegree[n.id];
            });

            return { nodes, links };
        },

        /**
         * Create ontology graph from ontology JSON schema
         * @param {Object} ontologyData - Ontology JSON data
         * @param {string} language - Language code for labels
         * @returns {Object} Object containing nodes and links arrays
         */
        createOntologyGraph(ontologyData, language = 'fr') {
            const nodes = [];
            const links = [];
            const classMap = new Map();
            const classes = ontologyData?.classes || [];

            // Helper to extract a stable id from different ontology formats
            function extractId(ontObj) {
                if (!ontObj) return null;
                return ontObj.id || ontObj.uri || ontObj['@id'] || null;
            }

            // First pass: create nodes with robust id and label handling
            classes.forEach(ontologyClass => {
                const id = ontologyClass.id || ontologyClass.uri || ontologyClass['@id'] || null;
                if (!id) return; // skip malformed entries

                const labelFr = (typeof ontologyClass.label === 'string') ? ontologyClass.label : (ontologyClass.label?.fr || id);
                const labelEn = (typeof ontologyClass.label === 'string') ? ontologyClass.label : (ontologyClass.label?.en || id);
                const label = language === 'en' ? labelEn : labelFr;

                const node = {
                    id,
                    type: 'ontology-class',
                    label,
                    labelFr,
                    labelEn,
                    rawData: ontologyClass,
                    // keep original subClassOf raw value for reference
                    subClassOf: ontologyClass.subClassOf || null,
                    description: (typeof ontologyClass.isDefinedBy === 'string') ? ontologyClass.isDefinedBy : (ontologyClass.isDefinedBy?.[language] || ontologyClass.isDefinedBy?.fr || ''),
                    degree: 0
                };

                nodes.push(node);
                classMap.set(node.id, node);
            });

            // Second pass: create subclass links, normalizing arrays and uri fields
            classes.forEach(ontologyClass => {
                const childId = ontologyClass.id || ontologyClass.uri || ontologyClass['@id'] || null;
                if (!childId) return;

                const rawParent = ontologyClass.subClassOf;
                if (!rawParent) return;

                // Accept string or array of parents
                const parents = Array.isArray(rawParent) ? rawParent : [rawParent];
                parents.forEach(p => {
                    // p may be a uri string or an object; try to extract id
                    const parentId = (typeof p === 'string') ? p : (p.id || p.uri || p['@id'] || null);
                    if (!parentId) return;

                    links.push({
                        source: parentId,
                        target: childId,
                        type: 'subClassOf'
                    });
                });
            });

            // Compute degrees safely (initialize missing nodes to 0)
            const nodeDegree = {};
            nodes.forEach(n => nodeDegree[n.id] = 0);
            links.forEach(l => {
                if (nodeDegree[l.source] === undefined) nodeDegree[l.source] = 0;
                if (nodeDegree[l.target] === undefined) nodeDegree[l.target] = 0;
                nodeDegree[l.source]++;
                nodeDegree[l.target]++;
            });
            nodes.forEach(n => {
                n.degree = nodeDegree[n.id] || 0;
            });

            return { nodes, links };
        },
    };
})();
