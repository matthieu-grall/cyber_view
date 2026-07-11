/**
 * Node Renderer Module
 * Handles creation and styling of graph nodes with tooltips and interactions
 * 
 * FIXES HOVER ISSUE: Uses proper SVG <title> elements for browser tooltips
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
            .style('opacity', 1)
            .attr('stroke-width', 1);

        d3.selectAll('.link')
            .style('stroke-opacity', 0.6)
            .style('stroke-width', 1);
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

        d3.selectAll('.node-bg')
            .style('opacity', node => connectedIds.has(node.id) ? 1 : 0.4)
            .attr('stroke-width', node => node.id === nodeId ? 3 : 1);

        d3.selectAll('.link')
            .style('stroke-opacity', link => (link.source.id === nodeId || link.target.id === nodeId) ? 0.8 : 0.2)
            .style('stroke-width', link => (link.source.id === nodeId || link.target.id === nodeId) ? 3 : 1);

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
                    d.fx = null;
                    d.fy = null;
                });

            nodeGroup.call(drag);

            // Add hover effects
            nodeGroup
                .on('mouseenter', function(event, d) {
                    if (state.selectedNodeId) {
                        return;
                    }

                    // Highlight connected nodes and links
                    d3.select(this).select('rect.node-bg')
                        .attr('stroke-width', 3)
                        .attr('filter', 'drop-shadow(0 0 6px rgba(0,0,0,0.3))');
                    
                    d3.selectAll('.link')
                        .style('stroke-opacity', link => 
                            (link.source.id === d.id || link.target.id === d.id) ? 0.8 : 0.2
                        )
                        .style('stroke-width', link => 
                            (link.source.id === d.id || link.target.id === d.id) ? 3 : 1
                        );
                    
                    d3.selectAll('.node-bg')
                        .style('opacity', node => 
                            (node.id === d.id || 
                             d3.selectAll('.link').filter(l => 
                                (l.source.id === d.id && l.target.id === node.id) ||
                                (l.target.id === d.id && l.source.id === node.id)
                            ).size() > 0) ? 1 : 0.4
                        );
                })
                .on('mouseleave', function(event, d) {
                    if (state.selectedNodeId) {
                        return;
                    }

                    // Reset styles
                    d3.select(this).select('rect.node-bg')
                        .attr('stroke-width', 1)
                        .attr('filter', 'none');
                    
                    resetGraphHighlight();
                })
                .on('click', function(event, d) {
                    applySelectionHighlight(d.id);

                    // Directly display node details if the module is available
                    if (typeof NodeDetailsModule !== 'undefined' && NodeDetailsModule.displayNodeDetails) {
                        NodeDetailsModule.displayNodeDetails(d);
                    }

                    // Dispatch custom event for node selection as fallback
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
        }
    };
})();
