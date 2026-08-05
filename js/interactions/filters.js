/**
 * Filtering module.
 * Author: Matthieu GRALL (DATA VISIONS)
 * License: Creative Commons Attribution 4.0 International (CC BY 4.0)
 */

const FiltersModule = (() => {
    // ==================== PRIVATE STATE ====================
    const state = {
        activeTypeFilters: new Set(),
        visibleNodeIds: new Set(),
        currentNodes: [],
        currentLinks: []
    };

    // ==================== PRIVATE FUNCTIONS ====================

    /**
     * Determine which nodes should be visible based on active filters
     * @returns {Set} Set of visible node IDs
     */
        function calculateVisibleNodes() {
        const visibleIds = new Set();

        state.currentNodes.forEach(node => {
            if (state.activeTypeFilters.size === 0 || state.activeTypeFilters.has(node.type)) {
                visibleIds.add(node.id);
            }
        });

        return visibleIds;
    }

    /**
     * Get all visible links based on current node visibility
     * @returns {Array} Filtered links array
     */
    function calculateVisibleLinks() {
        return state.currentLinks.filter(link => {
            const sourceId = link.source.id || link.source;
            const targetId = link.target.id || link.target;
            return state.visibleNodeIds.has(sourceId) && state.visibleNodeIds.has(targetId);
        });
    }

    /**
     * Apply filters to visualization elements
     * Updates both node and link visibility
     */
    function applyFiltersToVisualization() {
        // Apply node filter to individual node groups
        d3.selectAll('.node-group-item').style('display', node => {
            const isVisible = state.visibleNodeIds.has(node.id);
            return isVisible ? 'block' : 'none';
        });

        // Apply link filter based on visible nodes
        d3.selectAll('.link-group-item').style('display', link => {
            const sourceId = link.source.id || link.source;
            const targetId = link.target.id || link.target;
            const isVisible = state.visibleNodeIds.has(sourceId) && state.visibleNodeIds.has(targetId);
            return isVisible ? 'block' : 'none';
        });

        // Update simulation with filtered data
        const visibleNodes = state.currentNodes.filter(n => state.visibleNodeIds.has(n.id));
        const visibleLinks = calculateVisibleLinks();

        SimulationModule.updateNodes(visibleNodes);
        SimulationModule.updateLinks(visibleLinks);
        SimulationModule.reheat();
    }

    // ==================== PUBLIC API ====================
    return {
        /**
         * Initialize filters module with graph data
         * @param {Array} nodes - All nodes in the graph
         * @param {Array} links - All links in the graph
         */
        initialize(nodes, links) {
            state.currentNodes = nodes;
            state.currentLinks = links;
            state.activeTypeFilters.clear();
            state.visibleNodeIds = new Set(nodes.map(n => n.id));
        },

        /**
         * Populate filter dropdown options
         * Called after data is loaded
         */
        populateFilterOptions() {
            const container = document.getElementById('typeFilterContainer');
            if (!container) return;

            container.innerHTML = '';

            const counts = {};
            state.currentNodes.forEach(node => {
                counts[node.type] = (counts[node.type] || 0) + 1;
            });

            const nodeTypes = [...new Set(state.currentNodes.map(node => node.type))].sort();
            nodeTypes.forEach(type => {
                const typeLabel = OntologyModule.getNodeTypeLabel(type, I18nModule.getLanguage());
                const button = document.createElement('button');
                button.className = 'type-filter__item';
                button.setAttribute('data-type', type);
                button.innerHTML = `<span class="label">${typeLabel}</span><span class="count">${counts[type] || 0}</span>`;
                container.appendChild(button);
            });
        },

        /**
         * Update filter labels after language change
         */
        updateFilterLabels() {
            const container = document.getElementById('typeFilterContainer');
            if (!container) return;

            container.querySelectorAll('.type-filter__item').forEach(button => {
                const type = button.getAttribute('data-type');
                const typeLabel = OntologyModule.getNodeTypeLabel(type, I18nModule.getLanguage());
                const count = button.querySelector('.count')?.textContent || '';
                button.querySelector('.label').textContent = typeLabel;
                if (count) button.querySelector('.count').textContent = count;
            });
        },

        /**
         * Handle type filter change event
         * @param {string} type - Selected node type (empty string = all)
         */
        setTypeFilter(type) {
            // Toggle single type selection: if empty -> clear
            if (!type) {
                state.activeTypeFilters.clear();
            } else {
                if (state.activeTypeFilters.has(type)) state.activeTypeFilters.delete(type);
                else state.activeTypeFilters.add(type);
            }
            state.visibleNodeIds = calculateVisibleNodes();
            applyFiltersToVisualization();
        },

        /**
         * Clear all active filters
         */
        clearFilters() {
            state.activeTypeFilters.clear();
            state.visibleNodeIds = new Set(state.currentNodes.map(n => n.id));

            const container = document.getElementById('typeFilterContainer');
            if (container) {
                container.querySelectorAll('.type-filter__item--active').forEach(button => {
                    button.classList.remove('type-filter__item--active');
                });
            }

            applyFiltersToVisualization();
        },

        /**
         * Get current filter state
         * @returns {Object} Object with active type filters
         */
        getFilterState() {
            return {
                types: Array.from(state.activeTypeFilters)
            };
        },

        /**
         * Attach change event handlers to filter controls
         */
        attachEventHandlers() {
            const container = document.getElementById('typeFilterContainer');
            if (!container) return;

            container.addEventListener('click', (event) => {
                const button = event.target.closest('.type-filter__item');
                if (!button) return;

                const type = button.getAttribute('data-type');
                const isActive = button.classList.toggle('type-filter__item--active');

                if (isActive) {
                    state.activeTypeFilters.add(type);
                } else {
                    state.activeTypeFilters.delete(type);
                }

                state.visibleNodeIds = calculateVisibleNodes();
                applyFiltersToVisualization();
            });
        }
    };
})();