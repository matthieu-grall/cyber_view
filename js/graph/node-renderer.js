/**
 * Node Renderer Module
 * Handles creation and styling of graph nodes with tooltips and interactions
 * 
 * FIXES HOVER ISSUE: Uses proper SVG <title> elements for browser tooltips
 */

const NodeRendererModule = (() => {
    // ==================== PRIVATE CONSTANTS ====================
    const TOOLTIP_DELAY = 200; // milliseconds

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
        const typeLabel = OntologyModule.getNodeTypeLabel(node.type, I18nModule.getLanguage());
        let tooltip = `${node.label}\n[${typeLabel}]`;
        
        if (node.severity) {
            tooltip += `\nSeverity: ${node.severity}`;
        }
        
        if (node.degree) {
            tooltip += `\nConnections: ${node.degree}`;
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
            // Create circle elements for each node
            const circles = nodeGroup
                .append('circle')
                .attr('r', node => calculateNodeRadius(node))
                .attr('fill', node => getNodeColor(node))
                .attr('stroke', '#333')
                .attr('stroke-width', 2)
                .attr('class', 'node-circle');

            // FIX: Add SVG title element for native browser tooltips
            // This replaces the ineffective data-tooltip attribute
            circles.append('title')
                .text(node => createNodeTooltip(node));

            // Add text labels on nodes
            const labels = nodeGroup
                .append('text')
                .attr('dy', '0.3em')
                .attr('text-anchor', 'middle')
                .attr('font-size', '12px')
                .attr('font-weight', 'bold')
                .attr('fill', '#333')
                .attr('pointer-events', 'none')
                .attr('class', 'node-label')
                .text(node => {
                    // Truncate long labels
                    const maxLength = 15;
                    return node.label.length > maxLength 
                        ? node.label.substring(0, maxLength) + '...' 
                        : node.label;
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
                    // Highlight connected nodes and links
                    d3.select(this).select('circle')
                        .attr('r', node => calculateNodeRadius(node) + 4)
                        .attr('stroke-width', 3)
                        .attr('filter', 'drop-shadow(0 0 6px rgba(0,0,0,0.3))');
                    
                    d3.selectAll('.link')
                        .style('stroke-opacity', link => 
                            (link.source.id === d.id || link.target.id === d.id) ? 0.8 : 0.2
                        )
                        .style('stroke-width', link => 
                            (link.source.id === d.id || link.target.id === d.id) ? 3 : 1
                        );
                    
                    d3.selectAll('.node-circle')
                        .style('opacity', node => 
                            (node.id === d.id || 
                             d3.selectAll('.link').filter(l => 
                                (l.source.id === d.id && l.target.id === node.id) ||
                                (l.target.id === d.id && l.source.id === node.id)
                            ).size() > 0) ? 1 : 0.4
                        );
                })
                .on('mouseleave', function(event, d) {
                    // Reset styles
                    d3.select(this).select('circle')
                        .attr('r', node => calculateNodeRadius(node))
                        .attr('stroke-width', 2)
                        .attr('filter', 'none');
                    
                    d3.selectAll('.link')
                        .style('stroke-opacity', 0.6)
                        .style('stroke-width', 1);
                    
                    d3.selectAll('.node-circle')
                        .style('opacity', 1);
                })
                .on('click', function(event, d) {
                    // Dispatch custom event for node selection
                    // Will be handled by NodeDetailsModule
                    document.dispatchEvent(new CustomEvent('nodeSelected', { detail: d }));
                });

            return nodeGroup;
        },

        /**
         * Update node properties after data change (e.g., language change)
         * Refreshes tooltips and labels
         * @param {d3.Selection} nodeGroup - D3 selection for node group
         */
        updateNodeLabels(nodeGroup) {
            // Update labels for nodes that carry both French and English forms
            nodeGroup.selectAll('text')
                .text(node => {
                    if (node.labelFr && node.labelEn) {
                        node.label = I18nModule.getLanguage() === 'en' ? node.labelEn : node.labelFr;
                    }
                    const maxLength = 15;
                    return node.label.length > maxLength
                        ? node.label.substring(0, maxLength) + '...'
                        : node.label;
                });

            // Update tooltips with new language
            nodeGroup.selectAll('title')
                .text(node => createNodeTooltip(node));
        }
    };
})();
