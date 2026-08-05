/**
 * Node details module.
 * Author: Matthieu GRALL (DATA VISIONS)
 * License: Creative Commons Attribution 4.0 International (CC BY 4.0)
 */

const NodeDetailsModule = (() => {
    // ==================== PRIVATE STATE ====================
    const state = {
        currentNode: null,
        allNodes: [],
        allLinks: []
    };

    // ==================== PRIVATE FUNCTIONS ====================

    /**
     * Get all nodes directly connected to given node
     * @param {Object} node - The node to find connections for
     * @returns {Array} Array of connected node objects with relationship info
     */
    function getConnectedNodes(node) {
        const connected = [];
        const processedKeys = new Set();

        state.allLinks.forEach(link => {
            let connectedNode = null;
            let relationshipType = null;
            let direction = null;

            if (link.source.id === node.id) {
                connectedNode = link.target;
                relationshipType = link.type;
                direction = 'outgoing';
            } else if (link.target.id === node.id) {
                connectedNode = link.source;
                relationshipType = link.type;
                direction = 'incoming';
            }

            if (!connectedNode) {
                return;
            }

            if (relationshipType === 'subClassOf') {
                // Only show subclass relation from the child node perspective
                // (incoming edge means this node is subclass of another).
                if (direction !== 'incoming') {
                    return;
                }
            } else {
                // For other relations, show only those declared on the selected class.
                if (direction !== 'outgoing') {
                    return;
                }
            }

            const key = `${connectedNode.id}|${relationshipType}|${direction}`;
            if (!processedKeys.has(key)) {
                connected.push({
                    node: connectedNode,
                    relationship: relationshipType,
                    direction,
                    link
                });
                processedKeys.add(key);
            }
        });

        return connected;
    }

    /**
     * Format node property for display
     * Handles special cases like arrays and objects
     * @param {string} key - Property name
     * @param {*} value - Property value
     * @returns {string} Formatted display text
     */
    function formatPropertyValue(key, value) {
        if (value === null || value === undefined) {
            return 'N/A';
        }

        if (typeof value === 'object') {
            if (Array.isArray(value)) {
                return value.join(', ');
            }
            return JSON.stringify(value);
        }

        return String(value);
    }

    function createNodeDetailsHTML(node) {
        const language = I18nModule.getLanguage();
        const typeLabel = OntologyModule.getNodeTypeLabel(node.type, language);
        const connected = getConnectedNodes(node);
        const rawData = node.rawData || {};
        const definition = rawData.isDefinedBy?.[language] || rawData.isDefinedBy?.fr || rawData.isDefinedBy?.en || '';
        const rationale = rawData.labelRationale?.[language] || rawData.labelRationale?.fr || rawData.labelRationale?.en || '';
        const properties = Array.isArray(rawData.properties) ? rawData.properties : [];

        const displayLabel = language === 'en' ? (node.labelEn || node.label) : (node.labelFr || node.label);

        let html = `
            <div class="node-details__body">
                <div class="node-details__header">
                    <h2>${escapeHtml(displayLabel)}</h2>
                    ${definition ? `<p class="node-details__definition">${escapeHtml(definition)}</p>` : ''}
                </div>
        `;

        if (node.type === 'ontology-class') {
            if (rationale) {
                html += `
                    <div class="node-details__section node-details__section--rationale">
                        <p class="node-details__rationale">${escapeHtml(rationale)}</p>
                    </div>
                `;
            }

            if (properties.length > 0) {
                html += `
                    <div class="node-details__section">
                        <h3>${I18nModule.getTranslation('informationLabels.ontologyProperties')} (${properties.length})</h3>
                        <ul class="node-details__properties">
                `;
                properties.forEach(prop => {
                    const propLabel = prop.label?.[language] || prop.label?.fr || prop.id || '';
                    const propRange = prop.range ? ` (${escapeHtml(prop.range)})` : '';
                    html += `<li class="node-details__property-item"><span class="node-details__property-label">${escapeHtml(propLabel)}</span>${propRange}</li>`;
                });
                html += `
                        </ul>
                    </div>
                `;
            }
        }

        if (node.description && node.type !== 'ontology-class') {
            html += `
                <div class="node-details__section">
                    <h3>${I18nModule.getTranslation('informationLabels.description')}</h3>
                    <p>${escapeHtml(node.description)}</p>
                </div>
            `;
        }

        if (connected.length > 0) {
            html += `
                <div class="node-details__section">
                    <h3>${I18nModule.getTranslation('informationLabels.relations') || 'Relations'} (${connected.length})</h3>
                    <ul class="node-details__connections">
            `;

            connected.forEach(conn => {
                const language = I18nModule.getLanguage();
                let relationText = OntologyModule.getRelationLabel(
                    (conn.link && (conn.link.relationType || conn.link.type)) || conn.relationship,
                    language
                );
                if (!relationText) {
                    relationText = conn.relationship || '';
                }

                html += `
                    <li>
                        <span class="node-details__relationship-badge">${escapeHtml(relationText)}</span>
                        <span class="node-details__connection-label">${escapeHtml(conn.node.label)}</span>
                    </li>
                `;
            });

            html += `
                    </ul>
                </div>
            `;
        }

        html += `
            </div>
        `;

        return html;
    }

    /**
     * Escape HTML special characters to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text safe for HTML
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==================== PUBLIC API ====================
    return {
        /**
         * Initialize node details module with graph data
         * @param {Array} nodes - All nodes in graph
         * @param {Array} links - All links in graph
         */
        initialize(nodes, links) {
            state.allNodes = nodes;
            state.allLinks = links;
        },

        /**
         * Display details for selected node
         * @param {Object} node - Node object to display
         */
        displayNodeDetails(node) {
            state.currentNode = node;

            const infoPanel = d3.select(AppConfig.selectors.informationPanel);
            infoPanel.html(createNodeDetailsHTML(node))
                .style('display', 'block');

            // Keep selected node highlighted
            if (typeof NodeRendererModule !== 'undefined' && NodeRendererModule.selectNode) {
                NodeRendererModule.selectNode(node.id);
            } else {
                d3.selectAll('.node-bg')
                    .style('opacity', n => n.id === node.id ? 1 : 0.4)
                    .attr('stroke-width', n => n.id === node.id ? 4 : 2);
            }
        },

        /**
         * Clear displayed information and reset highlighting
         */
        clearNodeDetails() {
            state.currentNode = null;

            const infoPanel = d3.select(AppConfig.selectors.informationPanel);
            infoPanel.html('')
                .style('display', 'none');

            if (typeof NodeRendererModule !== 'undefined' && NodeRendererModule.clearSelection) {
                NodeRendererModule.clearSelection();
            } else {
                d3.selectAll('.node-bg')
                    .style('opacity', 1)
                    .attr('stroke-width', 1);
            }
        },

        /**
         * Update panel labels after language change
         * Refreshes displayed information if a node is currently shown
         */
        updateLabels() {
            if (state.currentNode) {
                this.displayNodeDetails(state.currentNode);
            }
        },

        /**
         * Attach event listeners for node selection
         */
        attachEventHandlers() {
            // Listen for custom nodeSelected event from NodeRendererModule
            document.addEventListener('nodeSelected', (event) => {
                NodeDetailsModule.displayNodeDetails(event.detail);
            });

            // Listen for click on graph background rectangle to clear details
            const svgBackground = d3.select(AppConfig.selectors.svgContainer).select('.svg-background');
            if (!svgBackground.empty()) {
                svgBackground.on('click', function(event) {
                    NodeDetailsModule.clearNodeDetails();
                    if (typeof LinkRendererModule !== 'undefined' && LinkRendererModule.clearSelection) {
                        LinkRendererModule.clearSelection();
                    }
                    event.stopPropagation();
                });
            } else {
                d3.select(AppConfig.selectors.svgContainer)
                    .on('click', function(event) {
                        if (event.target === this) {
                            NodeDetailsModule.clearNodeDetails();
                        }
                    });
            }
        }
    };
})();