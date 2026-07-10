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

    /**
     * Compute the shared geometry (endpoints and, if curved, control point)
     * used both to draw the link path and to position its label.
     * Centralizing this avoids the path and the label drifting apart
     * when links are curved (parallel / bidirectional relations).
     * @param {Object} link - D3 link object
     * @returns {Object} Geometry descriptor: {x1, y1, x2, y2, curved, cx?, cy?}
     */
    function getLinkGeometry(link) {
        const source = link.source;
        const target = link.target;
        const x1 = source.x;
        const y1 = source.y;
        const x2 = target.x;
        const y2 = target.y;

        if (link.curveOffset === undefined && !link.isBidirectional) {
            return { x1, y1, x2, y2, curved: false };
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

        return { x1, y1, x2, y2, cx, cy, curved: true };
    }

    /**
     * Build the SVG path string for a link, straight or curved.
     * @param {Object} link - D3 link object
     * @returns {string} SVG path "d" attribute value
     */
    function getLinkPath(link) {
        const g = getLinkGeometry(link);
        if (!g.curved) {
            return `M${g.x1},${g.y1} L${g.x2},${g.y2}`;
        }
        return `M${g.x1},${g.y1} Q${g.cx},${g.cy} ${g.x2},${g.y2}`;
    }

    /**
     * Compute the actual midpoint of the rendered link (t=0.5 on the
     * quadratic Bézier curve when curved), so the label sits exactly on
     * the visible line instead of on the straight-line midpoint.
     * @param {Object} link - D3 link object
     * @returns {{x: number, y: number}} Midpoint coordinates
     */
    function getLinkMidpoint(link) {
        const g = getLinkGeometry(link);
        if (!g.curved) {
            return { x: (g.x1 + g.x2) / 2, y: (g.y1 + g.y2) / 2 };
        }
        // Quadratic Bézier at t=0.5: B(0.5) = 0.25*P0 + 0.5*P1 + 0.25*P2
        return {
            x: 0.25 * g.x1 + 0.5 * g.cx + 0.25 * g.x2,
            y: 0.25 * g.y1 + 0.5 * g.cy + 0.25 * g.y2
        };
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

            // FIX (A): "subClassOf" labels are redundant with the legend
            // (grey arrow = subclass relation), so we skip creating a
            // <text> element for them entirely, reducing visual clutter.
            const labels = linkGroup
                .filter(link => link.type !== 'subClassOf')
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

            // FIX (B): use the real curve midpoint instead of the
            // straight-line midpoint, so labels of parallel/bidirectional
            // (curved) relations no longer overlap each other.
            linkGroup.selectAll('text')
                .attr('x', d => getLinkMidpoint(d).x)
                .attr('y', d => getLinkMidpoint(d).y);
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

            // Update text labels (subClassOf links have no <text> element,
            // so selectAll('text') on them simply returns an empty selection)
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