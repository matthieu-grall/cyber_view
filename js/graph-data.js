/**
 * Graph data structure module.
 * Author: Matthieu GRALL (DATA VISIONS)
 * License: Creative Commons Attribution 4.0 International (CC BY 4.0)
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
        createGraphData(usecasePayload, riskSources, businessAssets, securityCriteria, severityLevels, likelihoodLevels) {
            if (Array.isArray(usecasePayload) && arguments.length > 1) {
                // Backward compatible signature: separate arrays from older call sites.
                return GraphDataModule.createGraphDataFromCollections(
                    { risks: usecasePayload },
                    riskSources,
                    businessAssets,
                    securityCriteria,
                    severityLevels,
                    likelihoodLevels
                );
            }
            return GraphDataModule.createGraphDataFromPayload(usecasePayload);
        },

        createGraphDataFromCollections(risks, riskSources, businessAssets, securityCriteria, severityLevels, likelihoodLevels) {
            const payload = {
                risks: risks || [],
                riskSources: riskSources || [],
                businessAssets: businessAssets || [],
                securityCriteria: securityCriteria || [],
                severityLevels: severityLevels || [],
                likelihoodLevels: likelihoodLevels || []
            };
            return GraphDataModule.createGraphDataFromPayload(payload);
        },

        createGraphDataFromPayload(usecasePayload) {
            const nodes = [];
            const nodeMap = new Map();
            const links = [];
            const visitedIds = new Set();

            function normalizeTypeName(name) {
                if (!name) return 'unknown';
                const normalized = name
                    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
                    .replace(/[_\.]/g, '-')
                    .replace(/s$/, '')
                    .toLowerCase();
                return normalized;
            }

            function inferLabel(item) {
                if (!item || typeof item !== 'object') return String(item || '');
                const candidates = [
                    'generic-short-label',
                    'generic-long-label',
                    'shortLabel',
                    'longLabel',
                    'label',
                    'name',
                    'id',
                    'description'
                ];
                for (const key of candidates) {
                    if (item[key]) {
                        return String(item[key]);
                    }
                }
                return item.id || item.uri || item['@id'] || '';
            }

            function getItemId(item) {
                if (!item || typeof item !== 'object') return null;
                return item.id || item.uri || item['@id'] || item['generic-id'] || item['generic-technical-id'] || null;
            }

            function inferNodeTypeFromFieldName(fieldName) {
                if (!fieldName || typeof fieldName !== 'string') return 'undefined';
                const cleaned = fieldName
                    .replace(/[-_]?id$/i, '')
                    .replace(/[-_]+$/g, '');
                const normalized = normalizeTypeName(cleaned);
                const mapping = {
                    'risk-source': 'risk-source',
                    'risksource': 'risk-source',
                    'security-criteria': 'security-criteria',
                    'securitycriteria': 'security-criteria',
                    'business-asset': 'business-asset',
                    'businessasset': 'business-asset',
                    'severity': 'severity-level',
                    'likelihood': 'likelihood-level',
                    'feared-event': 'feared-event',
                    'risk-scenario': 'risk-scenario'
                };
                return mapping[normalized] || normalized || 'undefined';
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
                    existing.description = existing.description || rawData?.description || existing.description;
                    existing.severity = existing.severity || rawData?.severity || existing.severity;
                    existing.isUndefined = existing.type === 'undefined';
                    return existing;
                }
                const node = {
                    id,
                    type: type || 'undefined',
                    label: label || id,
                    rawData: rawData || null,
                    severity: rawData?.severity || null,
                    description: rawData?.description || null,
                    degree: 0,
                    isUndefined: type === 'undefined'
                };
                nodeMap.set(id, node);
                nodes.push(node);
                return node;
            }

            function addLink(sourceId, targetId, relationType) {
                if (!sourceId || !targetId || sourceId === targetId) return;
                links.push({
                    source: sourceId,
                    target: targetId,
                    type: relationType || 'related-to',
                    relationType: relationType || 'related-to'
                });
            }

            const ignoredReferenceFields = new Set(['generic-id', 'generic-technical-id']);

            function isIgnoredReferenceField(fieldName) {
                if (!fieldName || typeof fieldName !== 'string') return false;
                return ignoredReferenceFields.has(fieldName.toLowerCase());
            }

            function handleReference(sourceId, fieldName, value) {
                if (isIgnoredReferenceField(fieldName)) {
                    return;
                }
                const relationType = normalizeTypeName(fieldName.replace(/[-_]?id$/i, '').replace(/[-_]+$/g, '')) || 'related-to';
                const targetId = typeof value === 'string' ? value : getItemId(value);
                if (!targetId) return;
                const targetLabel = typeof value === 'object' ? inferLabel(value) : targetId;
                const targetType = inferNodeTypeFromFieldName(fieldName);
                addNode(targetId, targetType, targetLabel, typeof value === 'object' ? value : null);
                addLink(sourceId, targetId, relationType);
            }

            function scanObject(sourceId, obj, prefix = '') {
                if (!obj || typeof obj !== 'object') return;
                if (Array.isArray(obj)) {
                    obj.forEach(item => scanObject(sourceId, item, prefix));
                    return;
                }
                Object.entries(obj).forEach(([key, value]) => {
                    if (value == null) return;
                    const fullKey = prefix ? `${prefix}.${key}` : key;

                    if (typeof value === 'string' && /(?:[-_]?id)$/i.test(key)) {
                        handleReference(sourceId, key, value);
                        return;
                    }

                    if (typeof value === 'object' && getItemId(value)) {
                        // Nested object with an id is likely a referenced resource.
                        handleReference(sourceId, key, value);
                        return;
                    }

                    if (Array.isArray(value)) {
                        value.forEach(item => {
                            if (typeof item === 'string') {
                                handleReference(sourceId, key, item);
                            } else if (typeof item === 'object') {
                                if (getItemId(item)) {
                                    handleReference(sourceId, key, item);
                                } else {
                                    scanObject(sourceId, item, fullKey);
                                }
                            }
                        });
                        return;
                    }

                    if (typeof value === 'object') {
                        scanObject(sourceId, value, fullKey);
                    }
                });
            }

            const internalPayloadKeys = new Set(['currentUsecase', 'currentUsecaseRaw', 'ontology', 'dataFiles']);

            function isIgnoredCollectionName(collectionName) {
                return internalPayloadKeys.has(collectionName);
            }

            function collectNodesFromCollection(collectionName, items) {
                if (!Array.isArray(items) || isIgnoredCollectionName(collectionName)) return;
                const nodeType = normalizeTypeName(collectionName);
                items.forEach(item => {
                    const id = getItemId(item);
                    if (!id) return;
                    const label = inferLabel(item);
                    addNode(id, nodeType, label, item);
                    visitedIds.add(id);
                });
            }

            function collectDefaultNodes() {
                const nodeType = 'individual';
                Object.entries(usecasePayload).forEach(([collectionName, items]) => {
                    if (!Array.isArray(items) || isIgnoredCollectionName(collectionName)) return;
                    items.forEach(item => {
                        const id = getItemId(item);
                        if (!id) return;
                        if (!nodeMap.has(id)) {
                            const label = inferLabel(item);
                            addNode(id, nodeType, label, item);
                        }
                    });
                });
            }

            if (!usecasePayload || typeof usecasePayload !== 'object') {
                return { nodes, links };
            }

            if (usecasePayload.currentUsecaseRaw) {
                usecasePayload = usecasePayload.currentUsecaseRaw;
            }

            Object.entries(usecasePayload).forEach(([collectionName, items]) => {
                collectNodesFromCollection(collectionName, items);
            });

            Object.entries(usecasePayload).forEach(([collectionName, items]) => {
                if (!Array.isArray(items)) return;
                items.forEach(item => {
                    const sourceId = getItemId(item);
                    if (!sourceId) return;
                    scanObject(sourceId, item);
                });
            });

            collectDefaultNodes();

            // Normalize link endpoints to node references for D3
            links.forEach(link => {
                link.source = nodeMap.get(link.source) || { id: link.source };
                link.target = nodeMap.get(link.target) || { id: link.target };
                if (link.relationType && !link.label) {
                    link.label = { fr: link.relationType, en: link.relationType };
                }
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
