/**
 * Link Renderer Module
 * Handles creation and styling of graph links (edges) with relationship tooltips
 */

const LinkRendererModule = (() => {
    // ==================== PRIVATE FUNCTIONS ====================

    /**
     * Get color for link based on relationship type
     * @param {Object} link - D3 link object with type property
     * @returns {string} Color hex code or RGB value
     */
    function getLinkColor(link) {
        return AppConfig.colors.linkType[link.type] || '#cccccc';
    }

    /**
     * Get stroke width for link based on relationship type
     * Links of certain types may be emphasized
     * @param {Object} link - D3 link object
     * @returns {number} Stroke width in pixels
     */
    function getLinkStrokeWidth(link) {
        // Critical relationships get thicker stroke
        const criticalTypes = ['has-criteria', 'affects-asset'];
        return criticalTypes.includes(link.type) ? 2 : 1;
    }

    /**
     * Create tooltip text for link showing relationship name
     * @param {Object} link - D3 link object
     * @returns {string} Formatted relationship description
     */
    function createLinkTooltip(link) {
        const relationshipLabels = AppConfig.relationships[link.type];
        if (!relationshipLabels) {
            return link.type;
        }

        const language = I18nModule.getLanguage();
        const label = relationshipLabels[language] || relationshipLabels.en;
        return `${link.source.label} → ${label} → ${link.target.label}`;
    }

    // ==================== PUBLIC API ====================
    return {
        /**
         * Create and append link elements to D3 selection
         * @param {d3.Selection} linkGroup - D3 selection for link group
         * @returns {d3.Selection} Updated link selection with styling and tooltips
         */
        renderLinks(linkGroup) {
            // Ensure an SVG marker for directed edges exists
            const svg = d3.select(AppConfig.selectors.svgContainer).select('svg');
            if (!svg.select('defs').node()) {
                const defs = svg.append('defs');
                defs.append('marker')
                    .attr('id', 'arrow')
                    .attr('viewBox', '0 -5 10 10')
                    .attr('refX', 10)
                    .attr('refY', 0)
                    .attr('markerWidth', 6)
                    .attr('markerHeight', 6)
                    .attr('orient', 'auto')
                    .attr('markerUnits', 'strokeWidth')
                    .append('path')
                    .attr('d', 'M0,-5 L10,0 L0,5')
                    .attr('fill', '#999');
            }

            // Create line elements for each link (directed: show arrowheads)
            const lines = linkGroup
                .append('line')
                .attr('stroke', link => getLinkColor(link))
                .attr('stroke-width', link => getLinkStrokeWidth(link))
                .attr('stroke-opacity', 0.6)
                .attr('class', 'link')
                .attr('marker-end', 'url(#arrow)');

            // Add SVG title element for native browser tooltips
            // Shows relationship name and connected nodes
            lines.append('title')
                .text(link => createLinkTooltip(link));

            // Add text labels on link midpoints
            // Only show for critical relationships to avoid clutter
            const criticalTypes = ['has-criteria', 'affects-asset', 'from-source'];
            
            const labels = linkGroup
                .filter(link => criticalTypes.includes(link.type))
                .append('text')
                .attr('font-size', '11px')
                .attr('text-anchor', 'middle')
                .attr('fill', '#666')
                .attr('pointer-events', 'none')
                .attr('class', 'link-label')
                .attr('dy', '-4px')
                .text(link => {
                    const relationshipLabels = AppConfig.relationships[link.type];
                    if (!relationshipLabels) return '';
                    const language = I18nModule.getLanguage();
                    return relationshipLabels[language] || relationshipLabels.en;
                });

            return linkGroup;
        },

        /**
         * Update link positions based on node positions
         * Called during force simulation tick event
         * @param {d3.Selection} linkGroup - D3 selection for link group
         */
        updateLinkPositions(linkGroup) {
            linkGroup.selectAll('line')
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            linkGroup.selectAll('text')
                .attr('x', d => (d.source.x + d.target.x) / 2)
                .attr('y', d => (d.source.y + d.target.y) / 2);
        },

        /**
         * Update link labels after language change
         * Refreshes relationship text on critical links
         * @param {d3.Selection} linkGroup - D3 selection for link group
         */
        updateLinkLabels(linkGroup) {
            // Update tooltips
            linkGroup.selectAll('title')
                .text(link => createLinkTooltip(link));

            // Update text labels
            linkGroup.selectAll('text')
                .text(link => {
                    const relationshipLabels = AppConfig.relationships[link.type];
                    if (!relationshipLabels) return '';
                    const language = I18nModule.getLanguage();
                    return relationshipLabels[language] || relationshipLabels.en;
                });
        }
    };
})();
