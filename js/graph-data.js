/**
 * Graph data structure module.
 * Author: Matthieu GRALL (DATA VISIONS)
 * License: Creative Commons Attribution 4.0 International (CC BY 4.0)
 */

const GraphDataModule = (() => {
    // ==================== PUBLIC API ====================
    return {
        /**
         * Create nodes and links from an ontology-native use case payload.
         * Expected shape: { individuals: [{ id, class, properties, relations }] }
         * @returns {Object} Object containing nodes and links arrays
         */
        createGraphData(usecasePayload) {
            return GraphDataModule.createGraphDataFromPayload(usecasePayload);
        },

        createGraphDataFromPayload(usecasePayload) {
            const nodes = [];
            const nodeMap = new Map();
            const links = [];

            function normalizeUriFragment(value, prefix) {
                if (!value || typeof value !== 'string') return '';
                return value
                    .replace(/^.*[#/]/, '')
                    .replace(new RegExp(`^${prefix}`), '')
                    .toLowerCase();
            }

            function inferLabelFromIndividual(individual) {
                const props = Array.isArray(individual?.properties) ? individual.properties : [];
                const shortLabel = props.find(p => p && p.type === '#property-short-label' && typeof p.value === 'string');
                if (shortLabel?.value) return shortLabel.value;

                const longLabel = props.find(p => p && p.type === '#property-long-label' && typeof p.value === 'string');
                if (longLabel?.value) return longLabel.value;

                return individual?.label || individual?.name || individual?.id || '';
            }

            function normalizeIndividualType(classUri) {
                if (!classUri || typeof classUri !== 'string') return 'individual';
                return normalizeUriFragment(classUri, 'class-') || 'individual';
            }

            function isOntologyIndividualsPayload(payload) {
                if (!payload || typeof payload !== 'object') return false;
                if (!Array.isArray(payload.individuals) || payload.individuals.length === 0) return false;
                return payload.individuals.some(item =>
                    item && typeof item === 'object' && typeof item.id === 'string' && typeof item.class === 'string');
            }

            function addNode(id, type, label, rawData) {
                if (!id) return null;
                if (nodeMap.has(id)) {
                    const existing = nodeMap.get(id);
                    const preferredType = type && existing.type === 'undefined' ? type : existing.type;
                    existing.type = preferredType || existing.type;
                    if (label && existing.label === existing.id) {
                        existing.label = label;
                    }
                    if (!existing.rawData && rawData) {
                        existing.rawData = rawData;
                    }
                    return existing;
                }
                const node = {
                    id,
                    type: type || 'undefined',
                    label: label || id,
                    rawData: rawData || null,
                    degree: 0,
                    isUndefined: type === 'undefined'
                };
                nodeMap.set(id, node);
                nodes.push(node);
                return node;
            }

            function addLink(sourceId, targetId, relationType, semanticRelationType = null) {
                if (!sourceId || !targetId || sourceId === targetId) return;
                links.push({
                    source: sourceId,
                    target: targetId,
                    type: relationType || 'related-to',
                    relationType: semanticRelationType || relationType || 'related-to'
                });
            }

            if (!usecasePayload || typeof usecasePayload !== 'object') {
                return { nodes, links };
            }

            if (usecasePayload.currentUsecaseRaw) {
                usecasePayload = usecasePayload.currentUsecaseRaw;
            }

            if (isOntologyIndividualsPayload(usecasePayload)) {
                const individuals = usecasePayload.individuals;

                individuals.forEach(individual => {
                    const id = individual.id;
                    if (!id) return;

                    const type = normalizeIndividualType(individual.class);
                    const label = inferLabelFromIndividual(individual);
                    addNode(id, type, label, individual);
                });

                individuals.forEach(individual => {
                    const sourceId = individual.id;
                    if (!sourceId) return;

                    const relations = Array.isArray(individual.relations) ? individual.relations : [];
                    relations.forEach(relation => {
                        const targetId = relation?.target;
                        if (!targetId || !nodeMap.has(targetId)) return;
                        const relationUri = relation.type || '#relation-related-to';
                        // Render all use-case links as ontology relations (red) and keep
                        // the semantic relation URI for i18n labels/tooltips.
                        addLink(sourceId, targetId, 'ontology-relation', relationUri);
                    });
                });

                // Group parallel links and separate them with curve offsets.
                const parallelLinkGroups = new Map();
                links.forEach(link => {
                    const orderedPair = [link.source, link.target].slice().sort().join('|');
                    const group = parallelLinkGroups.get(orderedPair) || [];
                    group.push(link);
                    parallelLinkGroups.set(orderedPair, group);
                });

                parallelLinkGroups.forEach(group => {
                    if (group.length <= 1) return;

                    const baseOffset = GRAPH_CONFIG.PARALLEL_OFFSET_STEP;
                    const middleIndex = (group.length - 1) / 2;
                    group.forEach((link, index) => {
                        let offsetIndex = index - middleIndex;
                        if (offsetIndex === 0) {
                            offsetIndex = 0.5;
                        }
                        link.curveOffset = offsetIndex * baseOffset;
                    });
                });

                // Mark reverse links so inverse relations are visibly distinct.
                const linkKeyMap = new Map();
                links.forEach(link => {
                    const key = `${link.source}|${link.target}`;
                    linkKeyMap.set(key, link);
                });
                links.forEach(link => {
                    const reverseKey = `${link.target}|${link.source}`;
                    if (linkKeyMap.has(reverseKey)) {
                        link.isBidirectional = true;
                    }
                });

                // Normalize link endpoints to node references for D3
                links.forEach(link => {
                    link.source = nodeMap.get(link.source) || { id: link.source };
                    link.target = nodeMap.get(link.target) || { id: link.target };
                });

                const nodeDegree = {};
                nodes.forEach(n => nodeDegree[n.id] = 0);
                links.forEach(l => {
                    const sourceId = l.source.id || l.source;
                    const targetId = l.target.id || l.target;
                    nodeDegree[sourceId] = (nodeDegree[sourceId] || 0) + 1;
                    nodeDegree[targetId] = (nodeDegree[targetId] || 0) + 1;
                });
                nodes.forEach(n => {
                    n.degree = nodeDegree[n.id] || 0;
                    n.isUndefined = false;
                });

                return { nodes, links };
            }
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
                if (rawParent) {
                    const parents = Array.isArray(rawParent) ? rawParent : [rawParent];
                    parents.forEach(p => {
                        const parentId = (typeof p === 'string') ? p : (p.id || p.uri || p['@id'] || null);
                        if (!parentId || !classMap.has(parentId)) return;

                        links.push({
                            source: parentId,
                            target: childId,
                            type: 'subClassOf'
                        });
                    });
                }

                const relations = ontologyClass.relations || [];
                relations.forEach(rel => {
                    const relationType = rel.uri ? String(rel.uri).replace(/^.*[#\/]/, '').replace(/^relation-/, '') : null;
                    const relationTargets = Array.isArray(rel.range) ? rel.range : [rel.range];

                    relationTargets.forEach(target => {
                        const targetId = (typeof target === 'string') ? target : (target.id || target.uri || target['@id'] || null);
                        if (!targetId || !classMap.has(targetId)) return;

                        links.push({
                            source: childId,
                            target: targetId,
                            type: 'ontology-relation',
                            relationType: relationType || rel.uri || 'relation',
                            label: rel.label || null,
                            rawData: rel
                        });
                    });
                });
            });

            // Group parallel links for curve separation
            const parallelLinkGroups = new Map();
            links.forEach(link => {
                const orderedPair = [link.source, link.target].slice().sort().join('|');
                const group = parallelLinkGroups.get(orderedPair) || [];
                group.push(link);
                parallelLinkGroups.set(orderedPair, group);
            });

            parallelLinkGroups.forEach(group => {
                if (group.length <= 1) return;

                const baseOffset = GRAPH_CONFIG.PARALLEL_OFFSET_STEP;
                const middleIndex = (group.length - 1) / 2;
                group.forEach((link, index) => {
                    let offsetIndex = index - middleIndex;
                    if (offsetIndex === 0) {
                        offsetIndex = 0.5;
                    }
                    link.curveOffset = offsetIndex * baseOffset;
                });
            });

            // Mark bidirectional links so their reverse edges curve in opposite directions
            const linkKeyMap = new Map();
            links.forEach(link => {
                const key = `${link.source}|${link.target}`;
                linkKeyMap.set(key, link);
            });
            links.forEach(link => {
                const reverseKey = `${link.target}|${link.source}`;
                if (linkKeyMap.has(reverseKey)) {
                    link.isBidirectional = true;
                }
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
