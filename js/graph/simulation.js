/**
 * Force simulation module.
 * Author: Matthieu GRALL (DATA VISIONS)
 * License: Creative Commons Attribution 4.0 International (CC BY 4.0)
 */

const SimulationModule = (() => {
    // ==================== PRIVATE STATE ====================
    let simulation = null;

    // ==================== PRIVATE FUNCTIONS ====================

    /**
     * Create tick handler for simulation updates
     * Called on each simulation iteration to update element positions
     * @param {d3.Selection} nodeGroup - D3 selection for nodes
     * @param {d3.Selection} linkGroup - D3 selection for links
     * @returns {Function} Tick event handler
     */
    function createTickHandler(nodeGroup, linkGroup) {
        return () => {
            // Update link positions
            LinkRendererModule.updateLinkPositions(linkGroup);

            // Update node positions
            nodeGroup
                .attr('transform', d => `translate(${d.x},${d.y})`);
        };
    }

    /**
     * Get force parameters based on graph size
     * Adapts simulation parameters to number of nodes
     * @param {number} nodeCount - Total number of nodes in graph
     * @param {number} svgWidth - SVG container width
     * @param {number} svgHeight - SVG container height
     * @param {number} [linkDistance] - Optional override for link distance
    *   (e.g. a larger value for the Ontology view)
     * @returns {Object} Force parameters object
     */
    function getForceParameters(nodeCount, svgWidth, svgHeight, linkDistance) {
        return {
            charge: GRAPH_CONFIG.NODE_REPULSION * Math.max(1, Math.sqrt(nodeCount)),
            linkDistance: linkDistance || GRAPH_CONFIG.DEFAULT_LINK_DISTANCE,
            centerX: svgWidth / 2,
            centerY: svgHeight / 2,
            centerStrength: AppConfig.simulationForces.center.strength
        };
    }

    // ==================== PUBLIC API ====================
    return {
        /**
         * Initialize and return D3 force simulation
         * @param {Array} nodes - Array of node objects
         * @param {Array} links - Array of link objects
         * @param {number} svgWidth - SVG container width
         * @param {number} svgHeight - SVG container height
         * @param {number} [linkDistance] - Optional override for link distance
         * @returns {d3.Simulation} Configured simulation object
         */
        createSimulation(nodes, links, svgWidth, svgHeight, linkDistance) {
            const params = getForceParameters(nodes.length, svgWidth, svgHeight, linkDistance);

            // Create simulation with forces
            simulation = d3.forceSimulation(nodes)
                .alphaDecay(GRAPH_CONFIG.ALPHA_DECAY)
                .velocityDecay(GRAPH_CONFIG.VELOCITY_DECAY)

                // Repulsive charge: keeps nodes spread apart
                .force('charge', d3.forceManyBody()
                    .strength(params.charge))

                // Attractive link force: pulls connected nodes toward their target distance
                .force('link', d3.forceLink(links)
                    .id(d => d.id)
                    .distance(params.linkDistance)
                    .strength(0.7))

                // Centering force: keeps the graph inside the viewport
                .force('center', d3.forceCenter(params.centerX, params.centerY)
                    .strength(params.centerStrength))

                // Collision avoidance using the node's actual bounding-box half-diagonal
                // so rectangular nodes never visually overlap regardless of label length.
                .force('collide', d3.forceCollide()
                    .radius(d => {
                        const hw = (d.rectWidth || 80) / 2;
                        const hh = (d.rectHeight || 28) / 2;
                        return Math.sqrt(hw * hw + hh * hh) + GRAPH_CONFIG.COLLISION_MARGIN;
                    })
                    .iterations(3));

            return simulation;
        },

        /**
         * Attach tick handler to simulation
         * Updates visual elements on each simulation step
         * @param {d3.Simulation} sim - D3 force simulation
         * @param {d3.Selection} nodeGroup - D3 selection for nodes
         * @param {d3.Selection} linkGroup - D3 selection for links
         */
        attachTickHandler(sim, nodeGroup, linkGroup) {
            if (!sim) {
                console.error('SimulationModule: Simulation not initialized');
                return;
            }

            sim.on('tick', createTickHandler(nodeGroup, linkGroup));
        },

        /**
         * Get current simulation instance
         * @returns {d3.Simulation|null} Current simulation or null if not initialized
         */
        getSimulation() {
            return simulation;
        },

        /**
         * Reheat simulation to restart animation
         * Useful when graph structure changes
         */
        reheat() {
            if (simulation) {
                simulation.alpha(1).restart();
            }
        },

        /**
         * Cool down simulation gradually
         * Called when user interaction is complete
         */
        cool() {
            if (simulation) {
                simulation.alphaTarget(0);
            }
        },

        /**
         * Update simulation nodes (useful after filtering)
         * @param {Array} nodes - Updated nodes array
         */
        updateNodes(nodes) {
            if (simulation) {
                simulation.nodes(nodes);
            }
        },

        /**
         * Update simulation links (useful after filtering)
         * @param {Array} links - Updated links array
         */
        updateLinks(links) {
            if (simulation) {
                simulation.force('link', d3.forceLink(links)
                    .id(d => d.id)
                    .distance(GRAPH_CONFIG.DEFAULT_LINK_DISTANCE)
                    .strength(0.7));
            }
        },

        /**
         * Completely reset and reinitialize simulation
         * @param {Array} nodes - New nodes array
         * @param {Array} links - New links array
         * @param {number} svgWidth - SVG width
         * @param {number} svgHeight - SVG height
         * @param {number} [linkDistance] - Optional override for link distance
         * @returns {d3.Simulation} New simulation instance
         */
        reset(nodes, links, svgWidth, svgHeight, linkDistance) {
            if (simulation) {
                simulation.stop();
            }
            return this.createSimulation(nodes, links, svgWidth, svgHeight, linkDistance);
        }
    };
})();