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
        const language = I18nModule.getLanguage();
        const relationshipLabels = AppConfig.relationships[link.type];

        if (relationshipLabels) {
            return relationshipLabels[language] || relationshipLabels.en;
        }

        if (link.label) {
            return link.label[language] || link.label.fr || link.label.en || String(link.type);
        }

        const ontologyLabel = OntologyModule.getRelationLabel(link.relationType || link.type, language);
        if (ontologyLabel) {
            return ontologyLabel;
        }

        return String(link.type);
    }

    function getNodeBorderPoint(node, targetX, targetY) {
        const width = node.rectWidth || (AppConfig.nodeSizes.baseRadius[node.type] || 8) * 2;
        const height = node.rectHeight || (AppConfig.nodeSizes.baseRadius[node.type] || 8) * 2;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const dx = targetX - node.x;
        const dy = targetY - node.y;

        if (dx === 0 && dy === 0) {
            return { x: node.x, y: node.y };
        }

        const tx = dx === 0 ? Infinity : halfWidth / Math.abs(dx);
        const ty = dy === 0 ? Infinity : halfHeight / Math.abs(dy);
        const t = Math.min(tx, ty);

        return {
            x: node.x + dx * t,
            y: node.y + dy * t
        };
    }

    /**
     * Compute the shared geometry (endpoints and, if curved, control point(s))
     * used both to draw the link path and to position its label.
     * Centralizing this avoids the path and the label drifting apart
     * when links are curved (parallel / bidirectional relations), and
     * handles self-referencing relations (source === target) as a small
     * loop instead of a degenerate zero-length line.
     * @param {Object} link - D3 link object
     * @returns {Object} Geometry descriptor
     */
    function getLinkGeometry(link) {
        const source = link.source;
        const target = link.target;
        const sourcePoint = getNodeBorderPoint(source, target.x, target.y);
        const targetPoint = getNodeBorderPoint(target, source.x, source.y);

        const x1 = sourcePoint.x;
        const y1 = sourcePoint.y;
        const x2 = targetPoint.x;
        const y2 = targetPoint.y;
        const centerX = source.x;
        const centerY = source.y;

        const isSelfLoop = source.id === target.id;

        if (isSelfLoop) {
            const offset = link.curveOffset || 24;
            const baseRadius = Math.max(source.rectWidth || 48, source.rectHeight || 48) / 2;
            const loopRadius = baseRadius + Math.abs(offset) * 0.25 + 16;
            const directionSign = Math.sign(offset) || 1;
            const angle = -Math.PI / 2 + directionSign * 0.6;
            const spread = 0.9;
            const startAngle = angle - spread;
            const endAngle = angle + spread;
            const startX = centerX + Math.cos(startAngle) * baseRadius;
            const startY = centerY + Math.sin(startAngle) * baseRadius;
            const endX = centerX + Math.cos(endAngle) * baseRadius;
            const endY = centerY + Math.sin(endAngle) * baseRadius;
            const controlDistance = loopRadius * 1.2;
            const cx1 = centerX + Math.cos(angle - 0.35) * controlDistance;
            const cy1 = centerY + Math.sin(angle - 0.35) * controlDistance;
            const cx2 = centerX + Math.cos(angle + 0.35) * controlDistance;
            const cy2 = centerY + Math.sin(angle + 0.35) * controlDistance;

            const labelX = (startX + 3 * cx1 + 3 * cx2 + endX) / 8;
            const labelY = (startY + 3 * cy1 + 3 * cy2 + endY) / 8;

            return {
                x1: startX,
                y1: startY,
                x2: endX,
                y2: endY,
                selfLoop: true,
                cx1,
                cy1,
                cx2,
                cy2,
                labelX,
                labelY
            };
        }

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
     * Build the SVG path string for a link: straight, curved, or a small
     * loop for self-referencing relations.
     * @param {Object} link - D3 link object
     * @returns {string} SVG path "d" attribute value
     */
    function getLinkPath(link) {
        const g = getLinkGeometry(link);
        if (g.selfLoop) {
            return `M${g.x1},${g.y1} C${g.cx1},${g.cy1} ${g.cx2},${g.cy2} ${g.x2},${g.y2}`;
        }
        if (!g.curved) {
            return `M${g.x1},${g.y1} L${g.x2},${g.y2}`;
        }
        return `M${g.x1},${g.y1} Q${g.cx},${g.cy} ${g.x2},${g.y2}`;
    }

    /**
     * Compute the "natural" label anchor for a link: the actual midpoint
     * of the rendered curve (t=0.5 on the quadratic Bézier) for curved
     * links, or the loop anchor for self-loops, so the label sits on (or
     * right next to) the visible line instead of on an unrelated point.
     * @param {Object} link - D3 link object
     * @returns {{x: number, y: number}} Anchor coordinates
     */
    function getLinkMidpoint(link) {
        const g = getLinkGeometry(link);
        if (g.selfLoop) {
            return { x: g.labelX, y: g.labelY };
        }
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
                .attr('marker-end', link => (link.source.id === link.target.id ? null : 'url(#arrow)'))
                .style('cursor', 'pointer');

            paths.append('title')
                .text(link => createLinkTooltip(link));

            // "subClassOf" labels are redundant with the legend (grey arrow
            // = subclass relation), so we skip creating a <text> for them.
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

            // Gather the "natural" label position (curve midpoint, or loop
            // anchor for self-loops) for every link that has a visible label.
            const entries = [];
            linkGroup.each(function(d) {
                const textSelection = d3.select(this).select('text');
                if (textSelection.empty()) return; // subClassOf links have no label
                const pos = getLinkMidpoint(d);
                entries.push({ textSelection, x: pos.x, y: pos.y, datum: d });
            });

            // FIX: distinct relations can end up with near-identical label
            // positions purely by coincidence of the force layout (e.g.
            // several relations converging on the same hub node), even
            // though each one individually follows its own curve correctly.
            // Group labels landing within a small tolerance of each other
            // and spread them out vertically — the axis on which the
            // stacking is actually visible — instead of trying to fix the
            // underlying graph layout itself.
            const cellSize = 42; // px tolerance to consider two labels "at the same spot"
            const lineHeight = 15;
            const groups = new Map();
            entries.forEach(entry => {
                const key = `${Math.round(entry.x / cellSize)}|${Math.round(entry.y / cellSize)}`;
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key).push(entry);
            });

            groups.forEach(group => {
                if (group.length === 1) {
                    const entry = group[0];
                    entry.textSelection
                        .attr('x', entry.x)
                        .attr('y', entry.y)
                        .attr('stroke', '#fff')
                        .attr('stroke-width', 2)
                        .attr('paint-order', 'stroke fill');
                    return;
                }
                // Stable order across ticks (by relation label text) so
                // labels don't swap position / jitter as nodes keep moving.
                group.sort((a, b) => getLinkLabel(a.datum).localeCompare(getLinkLabel(b.datum)));
                const middle = (group.length - 1) / 2;
                group.forEach((entry, index) => {
                    const verticalOffset = (index - middle) * (lineHeight + 4);
                    entry.textSelection
                        .attr('x', entry.x)
                        .attr('y', entry.y + verticalOffset)
                        .attr('stroke', '#fff')
                        .attr('stroke-width', 2)
                        .attr('paint-order', 'stroke fill');
                });
            });
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
                .text(link => getLinkLabel(link));
        }
    };
})();