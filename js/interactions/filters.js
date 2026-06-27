/**
 * Filters Module
 * Handles filtering logic for severity and node type
 * Coordinates between UI controls and graph visualization
 */

const FiltersModule = (() => {
    // ==================== PRIVATE STATE ====================
    const state = {
        activeSeverityFilter: null,
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
            let matches = true;

            // Check severity filter
            if (state.activeSeverityFilter && node.severity !== state.activeSeverityFilter) {
                matches = false;
            }

            // Check type filters (multi-select). If none selected, allow all types.
            if (state.activeTypeFilters.size > 0 && !state.activeTypeFilters.has(node.type)) {
                matches = false;
            }

            if (matches) {
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
            state.visibleNodeIds = new Set(nodes.map(n => n.id));
        },

        /**
         * Populate filter dropdown options
         * Called after data is loaded
         */
        populateFilterOptions() {
            // Populate severity filter
            const severityFilter = d3.select(AppConfig.selectors.severityFilter);
            const severityLevels = DataLoaderModule.getReferenceData('severityLevels') || [];

            severityFilter.selectAll('option').remove(); // Remove existing options

            severityFilter.append('option')
                .attr('value', '')
                .attr('data-i18n', 'commandsLabels.allClasses')
                .text(I18nModule.getTranslation('commandsLabels.allClasses'));

            severityLevels.forEach(level => {
                severityFilter.append('option')
                    .attr('value', level.label)
                    .text(level.label);
            });

            // Populate type filter as a list of buttons
            const container = document.getElementById('typeFilterContainer');
            if (container) {
                container.innerHTML = '';

                // Count nodes per type
                const counts = {};
                state.currentNodes.forEach(n => { counts[n.type] = (counts[n.type] || 0) + 1; });

                const nodeTypes = [...new Set(state.currentNodes.map(n => n.type))];

                nodeTypes.forEach(type => {
                    const typeLabel = OntologyModule.getNodeTypeLabel(type, I18nModule.getLanguage());
                    const btn = document.createElement('button');
                    btn.className = 'type-filter__item';
                    btn.setAttribute('data-type', type);
                    btn.innerHTML = `<span class="label">${typeLabel}</span><span class="count">${counts[type] || 0}</span>`;
                    container.appendChild(btn);
                });
            }
        },

        /**
         * Update filter labels after language change
         */
        updateFilterLabels() {
            const severityFilter = d3.select(AppConfig.selectors.severityFilter);

                // Update type filter buttons labels if present
                const container = document.getElementById('typeFilterContainer');
                if (container) {
                    container.querySelectorAll('.type-filter__item').forEach(btn => {
                        const type = btn.getAttribute('data-type');
                        const typeLabel = OntologyModule.getNodeTypeLabel(type, I18nModule.getLanguage());
                        const count = btn.querySelector('.count') ? btn.querySelector('.count').textContent : '';
                        btn.querySelector('.label').textContent = typeLabel;
                        if (count) btn.querySelector('.count').textContent = count;
                    });
                }

            // Severity labels are language-independent (numeric/descriptive)
            severityFilter.selectAll('option[value=""]').text(
                I18nModule.getTranslation('commandsLabels.allClasses')
            );
        },

        /**
         * Handle severity filter change event
         * @param {string} severity - Selected severity value (empty string = all)
         */
        setSeverityFilter(severity) {
            state.activeSeverityFilter = severity || null;
            state.visibleNodeIds = calculateVisibleNodes();
            applyFiltersToVisualization();
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
            state.activeSeverityFilter = null;
            state.activeTypeFilters.clear();
            state.visibleNodeIds = new Set(state.currentNodes.map(n => n.id));

            d3.select(AppConfig.selectors.severityFilter).property('value', '');
            const container = document.getElementById('typeFilterContainer');
            if (container) container.querySelectorAll('.type-filter__item--active').forEach(b => b.classList.remove('type-filter__item--active'));

            applyFiltersToVisualization();
        },

        /**
         * Get current filter state
         * @returns {Object} Object with activeSeverityFilter and activeTypeFilter
         */
        getFilterState() {
            return {
                severity: state.activeSeverityFilter,
                types: Array.from(state.activeTypeFilters)
            };
        },

        /**
         * Attach change event handlers to filter controls
         */
        attachEventHandlers() {
            d3.select(AppConfig.selectors.severityFilter)
                .on('change', function() {
                    FiltersModule.setSeverityFilter(this.value);
                });

            // Type filter buttons click handling
            const container = document.getElementById('typeFilterContainer');
            if (container) {
                container.addEventListener('click', (e) => {
                    const btn = e.target.closest('.type-filter__item');
                    if (!btn) return;
                    const type = btn.getAttribute('data-type');
                    // toggle visual state
                    const isActive = btn.classList.toggle('type-filter__item--active');
                    // update state
                    if (isActive) state.activeTypeFilters.add(type);
                    else state.activeTypeFilters.delete(type);
                    state.visibleNodeIds = calculateVisibleNodes();
                    applyFiltersToVisualization();
                });
            }
        }
    };
})();