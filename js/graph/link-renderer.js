/**
 * Link rendering module.
 * Author: Matthieu GRALL (DATA VISIONS)
 * License: Creative Commons Attribution 4.0 International (CC BY 4.0)
 */

const LinkRendererModule = (() => {
    // ==================== PRIVATE STATE ====================
    /** Datum of the currently selected link, or null. */
    const state = { selectedLink: null };

    // ==================== PRIVATE FUNCTIONS ====================

    /**
     * Apply red-selection styling to one link and restore defaults on all others.
     * The arrowhead inherits the colour automatically because the marker definition
     * uses `currentColor` (driven by the CSS `color` property on the path element).
     * @param {Object} datum - Link datum to select
     */
    function selectLink(datum) {
        state.selectedLink = datum;
        d3.selectAll('.link-group-item').each(function(d) {
            const path = d3.select(this).select('path.link');
            if (d === datum) {
                path.style('stroke', GRAPH_CONFIG.SELECTED_LINK_COLOR)
                    .style('color', GRAPH_CONFIG.SELECTED_LINK_COLOR)
                    .style('stroke-opacity', '1')
                    .style('stroke-width', GRAPH_CONFIG.SELECTED_LINK_STROKE_WIDTH + 'px');
            } else {
                path.style('stroke', getLinkColor(d))
                    .style('color', getLinkColor(d))
                    .style('stroke-opacity', null)
                    .style('stroke-width', null);
            }
        });
    }

    /**
     * Remove link selection and restore default styles for all links.
     */
    function clearLinkSelection() {
        state.selectedLink = null;
        d3.selectAll('.link-group-item').each(function(d) {
            const path = d3.select(this).select('path.link');
            path.style('stroke', getLinkColor(d))
                .style('color', getLinkColor(d))
                .style('stroke-opacity', null)
                .style('stroke-width', null);
        });
    }

    /**
     * Position a label entry (text + background rect) at (x, y).
     * Extracted from updateLinkPositions so the stacking logic stays lean.
     * @param {Object} entry - {textSelection, bgSelection, datum}
     * @param {number} x
     * @param {number} y
     */
    function setLabelEntryPosition(entry, x, y) {
        entry.textSelection
            .attr('x', x)
            .attr('y', y)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('paint-order', 'stroke fill');

        if (!entry.bgSelection || entry.bgSelection.empty()) return;
        const d = entry.datum;
        const w = d._labelWidth || 0;
        const h = d._labelHeight || 0;
        if (!w || !h) return;
        const px = GRAPH_CONFIG.LABEL_PADDING_X;
        const py = GRAPH_CONFIG.LABEL_PADDING_Y;
        // _labelRelX / _labelRelY are relative bbox offsets from the text anchor
        // measured once at render time (text at its origin), used every tick.
        entry.bgSelection
            .attr('x', x + (d._labelRelX || -w / 2) - px)
            .attr('y', y + (d._labelRelY || -h) - py)
            .attr('width', w + px * 2)
            .attr('height', h + py * 2);
    }

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
            const offset = link.curveOffset || 32;
            // Compute loop radius from the node's bounding-box half-diagonal
            // so the loop always clears the rectangle and stays fully visible.
            const hw = (source.rectWidth || 80) / 2;
            const hh = (source.rectHeight || 28) / 2;
            const halfDiag = Math.sqrt(hw * hw + hh * hh);
            const loopRadius = halfDiag * GRAPH_CONFIG.SELF_LOOP_RADIUS_FACTOR;
            const directionSign = Math.sign(offset) || 1;
            const angle = -Math.PI / 2 + directionSign * 0.6;
            const spread = 0.9;
            const startAngle = angle - spread;
            const endAngle = angle + spread;
            const startX = centerX + Math.cos(startAngle) * loopRadius;
            const startY = centerY + Math.sin(startAngle) * loopRadius;
            const endX = centerX + Math.cos(endAngle) * loopRadius;
            const endY = centerY + Math.sin(endAngle) * loopRadius;
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
        const baseOffset = GRAPH_CONFIG.BASE_CURVE_OFFSET;
        const directionSign = source.id < target.id ? 1 : -1;
        const offset = link.curveOffset !== undefined ? link.curveOffset : (baseOffset * directionSign);
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
            // Ensure the SVG <defs> block with the arrowhead markers exists.
            // The markers use `currentColor` so they inherit the path stroke colour
            // automatically — including the red colour on selection.
            const svg = d3.select(AppConfig.selectors.svgContainer).select('svg');
            if (!svg.select('defs').node()) {
                const defs = svg.append('defs');
                
                // Standard filled arrow for most links
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
                
                // Hollow (unfilled) arrow for subClassOf relations
                defs.append('marker')
                    .attr('id', 'arrow-hollow')
                    .attr('viewBox', '0 -5 10 10')
                    .attr('refX', -10)  // Reversed position for marker-start
                    .attr('refY', 0)
                    .attr('markerWidth', 6)
                    .attr('markerHeight', 6)
                    .attr('orient', 'auto')
                    .attr('markerUnits', 'strokeWidth')
                    .append('path')
                    .attr('d', 'M10,-5 L0,0 L10,5')  // Reversed arrow direction
                    .attr('fill', 'none')
                    .attr('stroke', 'currentColor')
                    .attr('stroke-width', '1.5');
            }

            // 1. Visual edge path (pointer-events disabled via CSS .link)
            const paths = linkGroup
                .append('path')
                .attr('d', link => getLinkPath(link))
                .style('stroke', link => getLinkColor(link))
                .style('color', link => getLinkColor(link))
                .attr('stroke-width', link => getLinkStrokeWidth(link))
                .attr('fill', 'none')
                .attr('class', 'link')
                .attr('marker-start', link => (link.type === 'subClassOf' ? 'url(#arrow-hollow)' : null))
                .attr('marker-end', link => (link.source.id === link.target.id || link.type === 'subClassOf' ? null : 'url(#arrow)'));

            paths.append('title')
                .text(link => createLinkTooltip(link));

            // 2. Label background rectangles (non-subClassOf links only).
            //    Appended before the label text so they render underneath it.
            const labelGroups = linkGroup.filter(link => link.type !== 'subClassOf');

            labelGroups.append('rect')
                .attr('class', 'link-label-bg')
                .attr('fill', 'white')
                .attr('fill-opacity', GRAPH_CONFIG.LABEL_BG_OPACITY)
                .attr('rx', GRAPH_CONFIG.LABEL_CORNER_RADIUS)
                .attr('ry', GRAPH_CONFIG.LABEL_CORNER_RADIUS)
                .attr('x', -9999)  // off-screen until the first tick positions it
                .attr('y', -9999)
                .attr('width', 0)
                .attr('height', 0)
                .attr('pointer-events', 'none');

            // 3. Label text
            const labels = labelGroups
                .append('text')
                .attr('font-size', '11px')
                .attr('text-anchor', 'middle')
                .attr('fill', '#444')
                .attr('pointer-events', 'none')
                .attr('class', link => {
                    // Add 'link-label-adjacent' class if link is adjacent to selected node
                    if (typeof NodeRendererModule !== 'undefined' && NodeRendererModule.getSelectedNodeId) {
                        const selectedId = NodeRendererModule.getSelectedNodeId();
                        if (selectedId && (link.source.id === selectedId || link.target.id === selectedId)) {
                            return 'link-label link-label-adjacent';
                        }
                    }
                    return 'link-label';
                })
                .attr('dy', '-4px')
                .text(link => getLinkLabel(link));

            // Measure each label's bounding box at render time (text at origin)
            // and store the relative offsets for use in updateLinkPositions.
            labels.each(function(d) {
                const bbox = this.getBBox();
                if (bbox.width > 0) {
                    d._labelRelX = bbox.x;        // relative x offset from the text anchor
                    d._labelRelY = bbox.y;        // relative y offset from the text anchor
                    d._labelWidth = bbox.width;
                    d._labelHeight = bbox.height;
                }
            });

            // 4. Invisible wider hit area for click-to-select.
            //    Appended last so it sits on top and captures pointer events.
            linkGroup.append('path')
                .attr('class', 'link-hit')
                .attr('d', link => getLinkPath(link))
                .attr('fill', 'none')
                .attr('stroke', 'transparent')
                .attr('stroke-width', 14)
                .on('click', (event, d) => {
                    event.stopPropagation();
                    // Toggle: clicking the same link again deselects it
                    if (state.selectedLink === d) {
                        clearLinkSelection();
                    } else {
                        selectLink(d);
                    }
                });

            return linkGroup;
        },

        /**
         * Update link positions based on node positions.
         * Called on every simulation tick.
         * @param {d3.Selection} linkGroup - D3 selection for all link group elements
         */
        updateLinkPositions(linkGroup) {
            // Update all paths (visual + hit) to reflect current node positions
            linkGroup.selectAll('path')
                .attr('d', d => getLinkPath(d));

            // Get currently selected node ID
            const selectedNodeId = typeof NodeRendererModule !== 'undefined' && NodeRendererModule.getSelectedNodeId
                ? NodeRendererModule.getSelectedNodeId()
                : null;

            // Update label classes by iterating each link group
            linkGroup.each(function(linkDatum) {
                const groupSelection = d3.select(this);
                const isAdjacent = selectedNodeId && (linkDatum.source.id === selectedNodeId || linkDatum.target.id === selectedNodeId);
                
                groupSelection.selectAll('text').attr('class', () => {
                    return isAdjacent ? 'link-label link-label-adjacent' : 'link-label';
                });
            });

            // Build an entry list for every label (text + its background rect)
            const entries = [];
            linkGroup.each(function(d) {
                const textSelection = d3.select(this).select('text.link-label');
                if (textSelection.empty()) return;  // subClassOf links carry no label
                const bgSelection = d3.select(this).select('rect.link-label-bg');
                const pos = getLinkMidpoint(d);
                entries.push({ textSelection, bgSelection, x: pos.x, y: pos.y, datum: d });
            });

            // Group labels that fall within a tolerance window and stack them
            // vertically so overlapping labels from co-located relations remain legible.
            const CELL_SIZE = 42;
            const LINE_HEIGHT = 15;
            const groups = new Map();
            entries.forEach(entry => {
                const key = `${Math.round(entry.x / CELL_SIZE)}|${Math.round(entry.y / CELL_SIZE)}`;
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key).push(entry);
            });

            groups.forEach(group => {
                if (group.length === 1) {
                    setLabelEntryPosition(group[0], group[0].x, group[0].y);
                    return;
                }
                // Sort by label text for a stable order across ticks (prevents jitter)
                group.sort((a, b) => getLinkLabel(a.datum).localeCompare(getLinkLabel(b.datum)));
                const middle = (group.length - 1) / 2;
                group.forEach((entry, index) => {
                    const verticalOffset = (index - middle) * (LINE_HEIGHT + 4);
                    setLabelEntryPosition(entry, entry.x, entry.y + verticalOffset);
                });
            });
        },

        /**
         * Update link labels after language change
         * Refreshes relationship text on critical links
         * @param {d3.Selection} linkGroup - D3 selection for link group
         */
        updateLinkLabels(linkGroup) {
            linkGroup.selectAll('title')
                .text(link => createLinkTooltip(link));

            // Update label text and re-measure bounding boxes so the background
            // rects are resized correctly after the text content changes.
            linkGroup.each(function(d) {
                const text = d3.select(this).select('text.link-label');
                if (text.empty()) return;
                text.text(getLinkLabel(d));
                // Subtract current position to recover relative (origin-based) offsets.
                const tx = parseFloat(text.attr('x')) || 0;
                const ty = parseFloat(text.attr('y')) || 0;
                const bbox = text.node().getBBox();
                if (bbox.width > 0) {
                    d._labelRelX = bbox.x - tx;
                    d._labelRelY = bbox.y - ty;
                    d._labelWidth = bbox.width;
                    d._labelHeight = bbox.height;
                }
            });
        },

        /**
         * Clear any active link selection and restore default link styles.
         * Called by NodeRendererModule when a node is selected so that
         * node and link selections do not coexist simultaneously.
         */
        clearSelection() {
            clearLinkSelection();
        }
    };
})();