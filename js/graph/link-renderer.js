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
        if (link.type === 'subClassOf') {
            return AppConfig.colors.linkType.subClassOf || '#7f7f7f';
        }
        if (link.type === 'ontology-relation') {
            return AppConfig.colors.linkType['ontology-relation'] || '#8b0000';
        }
        return AppConfig.colors.linkType[link.type] || AppConfig.colors.linkType['default'] || '#999';
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
        const label = getLinkLabel(link);
        const sourceLabel = link.source && typeof link.source === 'object' ? link.source.label : link.source;
        const targetLabel = link.target && typeof link.target === 'object' ? link.target.label : link.target;

        return `${sourceLabel || ''} → ${label} → ${targetLabel || ''}`;
    }

    function getLinkLabel(link) {
        const relationshipLabels = AppConfig.relationships[link.type];
        const language = I18nModule.getLanguage();

        if (relationshipLabels) {
            return relationshipLabels[language] || relationshipLabels.en;
        }
        if (link.label) {
            return link.label[language] || link.label.fr || link.label.en || String(link.type);
        }
        return String(link.type);
    }

    function getLinkPath(link) {
        const source = link.source;
        const target = link.target;
        const x1 = source.x;
        const y1 = source.y;
        const x2 = target.x;
        const y2 = target.y;

        if (!link.curveOffset && !link.isBidirectional) {
            return `M${x1},${y1} L${x2},${y2}`;
        }

        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const nx = -dy;
        const ny = dx;
        const norm = Math.sqrt(nx * nx + ny * ny) || 1;
        const baseOffset = 20;
        const directionSign = source.id < target.id ? 1 : -1;
        const offset = link.curveOffset || (baseOffset * directionSign);
        const cx = mx + (nx / norm) * offset;
        const cy = my + (ny / norm) * offset;

        return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
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
                    .attr('fill', 'currentColor')
                    .attr('stroke', 'currentColor');
            }

            const paths = linkGroup
                .append('path')
                .attr('d', link => getLinkPath(link))
                .style('stroke', link => getLinkColor(link))
                .style('color', link => getLinkColor(link))
                .attr('stroke-width', link => getLinkStrokeWidth(link))
                .attr('stroke-opacity', 0.6)
                .attr('fill', 'none')
                .attr('class', 'link')
                .attr('marker-end', 'url(#arrow)');

            paths.append('title')
                .text(link => createLinkTooltip(link));

            const labels = linkGroup
                .append('text')
                .attr('font-size', '11px')
                .attr('text-anchor', 'middle')
                .attr('fill', link => getLinkColor(link))
                .attr('pointer-events', 'none')
                .attr('class', 'link-label')
                .attr('dy', '-4px')
                .text(link => getLinkLabel(link));

            return linkGroup;
        },

        /**
         * Update link positions based on node positions
         * Called during force simulation tick event
         * @param {d3.Selection} linkGroup - D3 selection for link group
         */
        updateLinkPositions(linkGroup) {
            linkGroup.selectAll('path')
                .attr('d', d => getLinkPath(d));

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
                    const language = I18nModule.getLanguage();
                    if (relationshipLabels) {
                        return relationshipLabels[language] || relationshipLabels.en;
                    }
                    if (link.label) {
                        return link.label[language] || link.label.fr || link.label.en || String(link.type);
                    }
                    return String(link.type);
                });
        }
    };
})();
