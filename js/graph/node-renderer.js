/**
 * Node rendering module.
 * Author: Matthieu GRALL (DATA VISIONS)
 * License: Creative Commons Attribution 4.0 International (CC BY 4.0)
 */

const NodeRendererModule = (() => {
    // ==================== PRIVATE CONSTANTS ====================
    const TOOLTIP_DELAY = 200; // milliseconds

    // State for node selection highlight persistence
    const state = {
        selectedNodeId: null
    };

    // ==================== PRIVATE FUNCTIONS ====================

    /**
     * Calculate node radius based on degree (number of connections)
     * @param {Object} node - D3 node object with degree property
     * @returns {number} Radius in pixels
     */
    function calculateNodeRadius(node) {
        const baseRadius = AppConfig.nodeSizes.baseRadius[node.type] || 8;
        const boost = Math.min(node.degree * AppConfig.nodeSizes.degreeBoost.factor, AppConfig.nodeSizes.degreeBoost.max);
        return baseRadius + boost;
    }

    function resetGraphHighlight() {
        d3.selectAll('.node-bg')
            .style('opacity', null)        // revert to CSS / browser default (1)
            .attr('stroke-width', 1)
            .style('filter', null);        // revert to CSS base drop-shadow

        d3.selectAll('.link')
            .style('stroke-opacity', null) // revert to CSS default
            .style('stroke-width', null);
    }

    function getConnectedNodeIds(nodeId) {
        const connectedIds = new Set();
        d3.selectAll('.link').each(link => {
            if (!link.source || !link.target) return;
            if (link.source.id === nodeId || link.target.id === nodeId) {
                connectedIds.add(link.source.id);
                connectedIds.add(link.target.id);
            }
        });
        return connectedIds;
    }

    function applySelectionHighlight(nodeId) {
        resetGraphHighlight();
        const connectedIds = getConnectedNodeIds(nodeId);

        // Dim all nodes except the selected node and its direct neighbours
        d3.selectAll('.node-bg')
            .style('opacity', node => connectedIds.has(node.id) ? null : GRAPH_CONFIG.DIM_OPACITY)
            .attr('stroke-width', node => node.id === nodeId ? 2.5 : 1);

        // Apply a selection halo to the focused node
        d3.selectAll('.node-bg').filter(node => node.id === nodeId)
            .style('filter', 'drop-shadow(0 0 8px rgba(75, 145, 214, 0.65))');

        // Dim non-adjacent links; emphasise links that touch the selected node
        d3.selectAll('.link')
            .style('stroke-opacity', link =>
                (link.source.id === nodeId || link.target.id === nodeId)
                    ? '0.85'
                    : String(GRAPH_CONFIG.DIM_OPACITY))
            .style('stroke-width', link =>
                (link.source.id === nodeId || link.target.id === nodeId)
                    ? '2.5px' : '1px');

        state.selectedNodeId = nodeId;
    }

    function clearSelectionHighlight() {
        state.selectedNodeId = null;
        resetGraphHighlight();
    }

    /**
     * Get color for node based on type or severity
     * @param {Object} node - D3 node object
     * @returns {string} Color hex code
     */
    function getNodeColor(node) {
        if (node.severity && AppConfig.colors.nodeSeverity[node.severity]) {
            return AppConfig.colors.nodeSeverity[node.severity];
        }
        return AppConfig.colors.nodeType[node.type] || '#999999';
    }

    /**
     * Create tooltip text content for node
     * Combines label, type, and severity information
     * @param {Object} node - D3 node object
     * @returns {string} Formatted tooltip text
     */
    function createNodeTooltip(node) {
        const language = I18nModule.getLanguage();
        const nodeLabel = node.label;
        const definition = node.rawData?.isDefinedBy;
        let tooltip = `${nodeLabel}`;

        const typeLabel = OntologyModule.getNodeTypeLabel(node.type, language);
        if (node.type === 'ontology-class' && definition) {
            const definitionText = typeof definition === 'string'
                ? definition
                : definition[language] || definition.fr || definition.en || '';
            if (definitionText) {
                tooltip += `\n${definitionText}`;
            } else {
                tooltip += `\n[${typeLabel}]`;
            }
        } else {
            tooltip += `\n[${typeLabel}]`;

            if (node.severity) {
                tooltip += `\nSeverity: ${node.severity}`;
            }

            if (node.degree) {
                tooltip += `\nConnections: ${node.degree}`;
            }
        }

        return tooltip;
    }

    // ==================== PUBLIC API ====================
    return {
        /**
         * Create and append node elements to D3 selection
         * @param {d3.Selection} nodeGroup - D3 selection for node group
         * @param {d3.Selection} simulation - D3 force simulation
         * @returns {d3.Selection} Updated node selection with event handlers
         */
        renderNodes(nodeGroup, simulation) {
            // Create a shape for each node: rectangle background with a label.
            const backgrounds = nodeGroup
                .append('rect')
                .attr('class', 'node-bg')
                .attr('fill', node => node.isUndefined ? '#f7f7f7' : '#ffffff')
                .attr('fill-opacity', 1)
                .attr('stroke', node => getNodeColor(node))
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', node => node.isUndefined ? '4 3' : null)
                .attr('rx', 8)
                .attr('ry', 8)
                .attr('pointer-events', 'all')
                .style('cursor', 'pointer');

            nodeGroup.append('title')
                .text(node => createNodeTooltip(node));

            const labels = nodeGroup
                .append('text')
                .attr('x', 0)
                .attr('dy', '0.35em')
                .attr('text-anchor', 'middle')
                .attr('font-size', '12px')
                .attr('font-weight', 'bold')
                .attr('fill', '#111')
                .attr('pointer-events', 'none')
                .attr('class', 'node-label')
                .text(node => node.label);

            labels.each(function() {
                const bbox = this.getBBox();
                const paddingX = 10;
                const paddingY = 6;
                const node = d3.select(this.parentNode).datum();
                node.rectWidth = bbox.width + paddingX * 2;
                node.rectHeight = bbox.height + paddingY * 2;
                d3.select(this.parentNode).select('rect.node-bg')
                    .attr('x', bbox.x - paddingX)
                    .attr('y', bbox.y - paddingY)
                    .attr('width', node.rectWidth)
                    .attr('height', node.rectHeight);
            });

            // Add drag behavior to nodes
            const drag = d3.drag()
                .on('start', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on('drag', (event, d) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on('end', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    // Keep the node pinned at its dropped position (fx/fy stay set).
                    // Call NodeRendererModule.resetLayout() to unpin all nodes.
                });

            nodeGroup.call(drag);

            // Add hover effects
            nodeGroup
                .on('mouseenter', function(event, d) {
                    if (state.selectedNodeId) return;

                    d3.select(this).select('rect.node-bg')
                        .attr('stroke-width', 2.5)
                        .style('filter', 'drop-shadow(0 0 6px rgba(0,0,0,0.22))');

                    d3.selectAll('.link')
                        .style('stroke-opacity', link =>
                            (link.source.id === d.id || link.target.id === d.id) ? '0.85' : '0.10')
                        .style('stroke-width', link =>
                            (link.source.id === d.id || link.target.id === d.id) ? '2.5px' : '1px');

                    d3.selectAll('.node-bg')
                        .style('opacity', node =>
                            (node.id === d.id ||
                             d3.selectAll('.link').filter(l =>
                                (l.source.id === d.id && l.target.id === node.id) ||
                                (l.target.id === d.id && l.source.id === node.id)
                            ).size() > 0) ? null : GRAPH_CONFIG.DIM_OPACITY);
                })
                .on('mouseleave', function(event, d) {
                    if (state.selectedNodeId) return;

                    d3.select(this).select('rect.node-bg')
                        .attr('stroke-width', 1)
                        .style('filter', null);  // revert to CSS base drop-shadow

                    resetGraphHighlight();
                })
                .on('click', function(event, d) {
                    applySelectionHighlight(d.id);

                    // Clear any active link selection when a node is focused
                    if (typeof LinkRendererModule !== 'undefined' && LinkRendererModule.clearSelection) {
                        LinkRendererModule.clearSelection();
                    }

                    if (typeof NodeDetailsModule !== 'undefined' && NodeDetailsModule.displayNodeDetails) {
                        NodeDetailsModule.displayNodeDetails(d);
                    }

                    document.dispatchEvent(new CustomEvent('nodeSelected', { detail: d }));
                });

            return nodeGroup;
        },

        selectNode(nodeId) {
            applySelectionHighlight(nodeId);
        },

        clearSelection() {
            clearSelectionHighlight();
        },

        /**
         * Update node properties after data change (e.g., language change)
         * Refreshes tooltips and labels
         * @param {d3.Selection} nodeGroup - D3 selection for node group
         */
        updateNodeLabels(nodeGroup) {
            // Update labels for nodes that carry both French and English forms
            nodeGroup.selectAll('text.node-label')
                .text(node => {
                    if (node.labelFr && node.labelEn) {
                        node.label = I18nModule.getLanguage() === 'en' ? node.labelEn : node.labelFr;
                    }
                    return node.label;
                });

            // Update tooltips with new language
            nodeGroup.selectAll('title')
                .text(node => createNodeTooltip(node));

            nodeGroup.selectAll('text.node-label').each(function() {
                const bbox = this.getBBox();
                const paddingX = 10;
                const paddingY = 6;
                const node = d3.select(this.parentNode).datum();
                node.rectWidth = bbox.width + paddingX * 2;
                node.rectHeight = bbox.height + paddingY * 2;
                d3.select(this.parentNode).select('rect.node-bg')
                    .attr('x', bbox.x - paddingX)
                    .attr('y', bbox.y - paddingY)
                    .attr('width', node.rectWidth)
                    .attr('height', node.rectHeight);
            });
        },

        /**
         * Unpin all manually positioned nodes and restart the simulation.
         * Call this to release pinned nodes after dragging them into position.
         */
        resetLayout() {
            d3.selectAll('.node-group-item').each(d => {
                d.fx = null;
                d.fy = null;
            });
            SimulationModule.reheat();
        }
    };
})();
