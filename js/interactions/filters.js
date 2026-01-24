/**
 * Filters Module
 * Handles filtering logic for severity and node type
 * Coordinates between UI controls and graph visualization
 */

const FiltersModule = (() => {
    // ==================== PRIVATE STATE ====================
    const state = {
        activeSeverityFilter: null,
        activeTypeFilter: null,
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

            // Check type filter
            if (state.activeTypeFilter && node.type !== state.activeTypeFilter) {
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

            severityFilter.selectAll('option[data-value]').remove(); // Remove existing options

            severityFilter.append('option')
                .attr('value', '')
                .attr('data-i18n', 'menu.allSeverities')
                .text(I18nModule.getTranslation('menu.allSeverities'));

            severityLevels.forEach(level => {
                severityFilter.append('option')
                    .attr('value', level.label)
                    .text(level.label);
            });

            // Populate type filter
            const typeFilter = d3.select(AppConfig.selectors.typeFilter);
            const nodeTypes = [...new Set(state.currentNodes.map(n => n.type))];

            typeFilter.selectAll('option[data-value]').remove(); // Remove existing options

            typeFilter.append('option')
                .attr('value', '')
                .attr('data-i18n', 'menu.allTypes')
                .text(I18nModule.getTranslation('menu.allTypes'));

            nodeTypes.forEach(type => {
                const typeLabel = OntologyModule.getNodeTypeLabel(type, I18nModule.getLanguage());
                typeFilter.append('option')
                    .attr('value', type)
                    .text(typeLabel);
            });
        },

        /**
         * Update filter dropdown labels after language change
         */
        updateFilterLabels() {
            const severityFilter = d3.select(AppConfig.selectors.severityFilter);
            const typeFilter = d3.select(AppConfig.selectors.typeFilter);

            // Update type filter labels
            typeFilter.selectAll('option').each(function(d, i) {
                if (i === 0) {
                    d3.select(this).text(I18nModule.getTranslation('menu.allTypes'));
                } else {
                    const value = d3.select(this).attr('value');
                    const typeLabel = OntologyModule.getNodeTypeLabel(value, I18nModule.getLanguage());
                    d3.select(this).text(typeLabel);
                }
            });

            // Severity labels are language-independent (numeric/descriptive)
            severityFilter.selectAll('option[value=""]').text(
                I18nModule.getTranslation('menu.allSeverities')
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
            state.activeTypeFilter = type || null;
            state.visibleNodeIds = calculateVisibleNodes();
            applyFiltersToVisualization();
        },

        /**
         * Clear all active filters
         */
        clearFilters() {
            state.activeSeverityFilter = null;
            state.activeTypeFilter = null;
            state.visibleNodeIds = new Set(state.currentNodes.map(n => n.id));
            
            d3.select(AppConfig.selectors.severityFilter).property('value', '');
            d3.select(AppConfig.selectors.typeFilter).property('value', '');
            
            applyFiltersToVisualization();
        },

        /**
         * Get current filter state
         * @returns {Object} Object with activeSeverityFilter and activeTypeFilter
         */
        getFilterState() {
            return {
                severity: state.activeSeverityFilter,
                type: state.activeTypeFilter
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

            d3.select(AppConfig.selectors.typeFilter)
                .on('change', function() {
                    FiltersModule.setTypeFilter(this.value);
                });
        }
    };
})();
