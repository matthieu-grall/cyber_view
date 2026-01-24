/**
 * Node Details Module
 * Handles display of detailed node information in side panel
 * Shows node properties, connections, and semantic information
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
        const processedIds = new Set();

        state.allLinks.forEach(link => {
            let connectedNode = null;
            let relationshipType = null;

            if (link.source.id === node.id) {
                connectedNode = link.target;
                relationshipType = link.type;
            } else if (link.target.id === node.id) {
                connectedNode = link.source;
                // Reverse relationship direction for clarity
                relationshipType = link.type;
            }

            if (connectedNode && !processedIds.has(connectedNode.id)) {
                connected.push({
                    node: connectedNode,
                    relationship: relationshipType
                });
                processedIds.add(connectedNode.id);
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
            // For nested objects, show stringified version
            return JSON.stringify(value);
        }

        return String(value);
    }

    /**
     * Create HTML content for information panel
     * @param {Object} node - Node object to display
     * @returns {string} HTML string
     */
    function createNodeDetailsHTML(node) {
        const typeLabel = OntologyModule.getNodeTypeLabel(node.type, I18nModule.getLanguage());
        const typeDefinition = OntologyModule.getNodeTypeDefinition(node.type, I18nModule.getLanguage());
        const connected = getConnectedNodes(node);

        let html = `
            <div class="node-details">
                <div class="details-header">
                    <h2>${escapeHtml(node.label)}</h2>
                    <p class="node-type">${escapeHtml(typeLabel)}</p>
                </div>

                <div class="details-section">
                    <h3>${I18nModule.getTranslation('information.type')}</h3>
                    <p>${escapeHtml(typeDefinition || typeLabel)}</p>
                </div>
        `;

        // Show severity if available
        if (node.severity) {
            html += `
                <div class="details-section">
                    <h3>${I18nModule.getTranslation('information.severity') || 'Severity'}</h3>
                    <p class="severity-badge severity-${node.severity.toLowerCase()}">${escapeHtml(node.severity)}</p>
                </div>
            `;
        }

        // Show description if available
        if (node.description) {
            html += `
                <div class="details-section">
                    <h3>${I18nModule.getTranslation('information.description')}</h3>
                    <p>${escapeHtml(node.description)}</p>
                </div>
            `;
        }

        // Show connections
        if (connected.length > 0) {
            html += `
                <div class="details-section">
                    <h3>${I18nModule.getTranslation('information.connections')} (${connected.length})</h3>
                    <ul class="connections-list">
            `;

            connected.forEach(conn => {
                const relationLabel = AppConfig.relationships[conn.relationship];
                const relationText = relationLabel 
                    ? relationLabel[I18nModule.getLanguage()] || relationLabel.en
                    : conn.relationship;

                html += `
                    <li>
                        <span class="connection-label">${escapeHtml(conn.node.label)}</span>
                        <span class="relationship-badge">${escapeHtml(relationText)}</span>
                    </li>
                `;
            });

            html += `
                    </ul>
                </div>
            `;
        }

        // Show additional properties
        const excludeKeys = ['id', 'label', 'type', 'severity', 'description', 'degree'];
        const additionalProps = Object.keys(node).filter(k => !excludeKeys.includes(k));

        if (additionalProps.length > 0) {
            html += `
                <div class="details-section">
                    <h3>${I18nModule.getTranslation('information.properties')}</h3>
                    <dl class="properties-list">
            `;

            additionalProps.forEach(key => {
                const value = formatPropertyValue(key, node[key]);
                html += `
                    <dt>${escapeHtml(key)}</dt>
                    <dd>${escapeHtml(value)}</dd>
                `;
            });

            html += `
                    </dl>
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

            // Highlight selected node in graph
            d3.selectAll('.node-circle')
                .style('opacity', n => n.id === node.id ? 1 : 0.4)
                .attr('stroke-width', n => n.id === node.id ? 4 : 2);
        },

        /**
         * Clear displayed information and reset highlighting
         */
        clearNodeDetails() {
            state.currentNode = null;

            const infoPanel = d3.select(AppConfig.selectors.informationPanel);
            infoPanel.html('')
                .style('display', 'none');

            d3.selectAll('.node-circle')
                .style('opacity', 1)
                .attr('stroke-width', 2);
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

            // Listen for click on graph background to clear details
            d3.select(AppConfig.selectors.svgContainer)
                .on('click', function(event) {
                    // Only clear if clicking on empty space, not on node
                    if (event.target === this) {
                        NodeDetailsModule.clearNodeDetails();
                    }
                });
        }
    };
})();
