/**
 * Filtering module.
 * Author: Matthieu GRALL (DATA VISIONS)
 * License: Creative Commons Attribution 4.0 International (CC BY 4.0)
 */

const FiltersModule = (() => {
    // ==================== PRIVATE STATE ====================
    const state = {
        activeUsecaseFilters: new Set(),
        activeClassFilters: new Set(),
        visibleNodeIds: new Set(),
        currentNodes: [],
        currentLinks: []
    };

    function getClassKey(node) {
        if (node?.classUri) return String(node.classUri);
        if (node?.type === 'ontology-class') return String(node.id);
        return String(node?.type || 'undefined');
    }

    function getClassLabel(node) {
        const language = I18nModule.getLanguage();
        if (node?.classUri && OntologyModule.getClassLabelByUri) {
            return OntologyModule.getClassLabelByUri(node.classUri, language) || node.classUri;
        }
        if (node?.type === 'ontology-class') {
            return language === 'en'
                ? (node.labelEn || node.label || node.id)
                : (node.labelFr || node.label || node.id);
        }
        return OntologyModule.getNodeTypeLabel(node.type, I18nModule.getLanguage());
    }

    function getUsecaseUris(node) {
        return Array.isArray(node?.usecaseUris) ? node.usecaseUris : [];
    }

    function getUsecaseLabel(usecaseUri) {
        const label = OntologyModule.getUsecaseLabelByUri
            ? OntologyModule.getUsecaseLabelByUri(usecaseUri, I18nModule.getLanguage())
            : '';
        return label || String(usecaseUri || 'unknown-usecase');
    }

    // ==================== PRIVATE FUNCTIONS ====================

    /**
     * Determine which nodes should be visible based on active filters
     * @returns {Set} Set of visible node IDs
     */
    function calculateVisibleNodes() {
        const visibleIds = new Set();

        state.currentNodes.forEach(node => {
            const classKey = getClassKey(node);
            const nodeUsecases = getUsecaseUris(node);
            const matchesUsecase = state.activeUsecaseFilters.size === 0
                || nodeUsecases.some(uri => state.activeUsecaseFilters.has(uri));
            const matchesClass = state.activeClassFilters.size === 0
                || state.activeClassFilters.has(classKey);

            if (matchesUsecase && matchesClass) {
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
            state.activeUsecaseFilters.clear();
            state.activeClassFilters.clear();
            state.visibleNodeIds = new Set(nodes.map(n => n.id));
        },

        /**
         * Populate use case and class filter options
         * Called after data is loaded
         */
        populateFilterOptions() {
            const usecaseContainer = document.getElementById('usecaseFilterContainer');
            const classContainer = document.getElementById('classFilterContainer');
            if (!usecaseContainer || !classContainer) return;

            usecaseContainer.innerHTML = '';
            classContainer.innerHTML = '';

            const usecaseCounts = new Map();
            const usecaseLabels = new Map();
            const classCounts = new Map();
            const classLabels = new Map();

            state.currentNodes.forEach(node => {
                const classKey = getClassKey(node);
                classCounts.set(classKey, (classCounts.get(classKey) || 0) + 1);
                if (!classLabels.has(classKey)) {
                    classLabels.set(classKey, getClassLabel(node));
                }

                getUsecaseUris(node).forEach(usecaseUri => {
                    usecaseCounts.set(usecaseUri, (usecaseCounts.get(usecaseUri) || 0) + 1);
                    if (!usecaseLabels.has(usecaseUri)) {
                        usecaseLabels.set(usecaseUri, getUsecaseLabel(usecaseUri));
                    }
                });
            });

            const sortedUsecaseKeys = Array.from(usecaseLabels.keys()).sort((a, b) =>
                String(usecaseLabels.get(a)).localeCompare(String(usecaseLabels.get(b)), I18nModule.getLanguage())
            );

            sortedUsecaseKeys.forEach(key => {
                const button = document.createElement('button');
                button.className = 'type-filter__item';
                button.setAttribute('data-filter-kind', 'usecase');
                button.setAttribute('data-filter-key', key);
                button.innerHTML = `<span class="label">${usecaseLabels.get(key)}</span><span class="count">${usecaseCounts.get(key) || 0}</span>`;
                usecaseContainer.appendChild(button);
            });

            const sortedClassKeys = Array.from(classLabels.keys()).sort((a, b) =>
                String(classLabels.get(a)).localeCompare(String(classLabels.get(b)), I18nModule.getLanguage())
            );

            sortedClassKeys.forEach(key => {
                const button = document.createElement('button');
                button.className = 'type-filter__item';
                button.setAttribute('data-filter-kind', 'class');
                button.setAttribute('data-filter-key', key);
                button.innerHTML = `<span class="label">${classLabels.get(key)}</span><span class="count">${classCounts.get(key) || 0}</span>`;
                classContainer.appendChild(button);
            });
        },

        /**
         * Update filter labels after language change
         */
        updateFilterLabels() {
            const updateContainerLabels = (container, kind) => {
                if (!container) return;
                container.querySelectorAll('.type-filter__item').forEach(button => {
                    const key = button.getAttribute('data-filter-key');
                    if (!key) return;

                    let label = key;
                    if (kind === 'usecase') {
                        label = getUsecaseLabel(key);
                    } else {
                        const sampleNode = state.currentNodes.find(node => getClassKey(node) === key);
                        if (sampleNode) {
                            label = getClassLabel(sampleNode);
                        }
                    }

                    const labelSpan = button.querySelector('.label');
                    if (labelSpan) labelSpan.textContent = label;
                });
            };

            updateContainerLabels(document.getElementById('usecaseFilterContainer'), 'usecase');
            updateContainerLabels(document.getElementById('classFilterContainer'), 'class');
        },

        /**
         * Handle class filter change event
         * @param {string} classUri - Selected class filter key
         */
        setClassFilter(classUri) {
            if (!classUri) {
                state.activeClassFilters.clear();
            } else {
                if (state.activeClassFilters.has(classUri)) state.activeClassFilters.delete(classUri);
                else state.activeClassFilters.add(classUri);
            }
            state.visibleNodeIds = calculateVisibleNodes();
            applyFiltersToVisualization();
        },

        /**
         * Handle use case filter change event
         * @param {string} usecaseUri - Selected use case URI
         */
        setUsecaseFilter(usecaseUri) {
            if (!usecaseUri) {
                state.activeUsecaseFilters.clear();
            } else {
                if (state.activeUsecaseFilters.has(usecaseUri)) state.activeUsecaseFilters.delete(usecaseUri);
                else state.activeUsecaseFilters.add(usecaseUri);
            }
            state.visibleNodeIds = calculateVisibleNodes();
            applyFiltersToVisualization();
        },

        /**
         * Legacy compatibility alias (class facet)
         * @param {string} value - Class filter key
         */
        setTypeFilter(value) {
            this.setClassFilter(value);
        },

        /**
         * Clear all active filters
         */
        clearFilters() {
            state.activeUsecaseFilters.clear();
            state.activeClassFilters.clear();
            state.visibleNodeIds = new Set(state.currentNodes.map(n => n.id));

            [
                document.getElementById('usecaseFilterContainer'),
                document.getElementById('classFilterContainer')
            ].forEach(container => {
                if (!container) return;
                container.querySelectorAll('.type-filter__item--active').forEach(button => {
                    button.classList.remove('type-filter__item--active');
                });
            });

            applyFiltersToVisualization();
        },

        /**
         * Get current filter state
         * @returns {Object} Object with active filter keys
         */
        getFilterState() {
            return {
                usecases: Array.from(state.activeUsecaseFilters),
                classes: Array.from(state.activeClassFilters)
            };
        },

        /**
         * Attach click event handlers to both filter controls
         */
        attachEventHandlers() {
            const attachToContainer = (container, kind) => {
                if (!container || container.dataset.bound === 'true') return;

                container.addEventListener('click', (event) => {
                    const button = event.target.closest('.type-filter__item');
                    if (!button) return;

                    const key = button.getAttribute('data-filter-key');
                    if (!key) return;

                    const isActive = button.classList.toggle('type-filter__item--active');
                    const targetSet = kind === 'usecase'
                        ? state.activeUsecaseFilters
                        : state.activeClassFilters;

                    if (isActive) targetSet.add(key);
                    else targetSet.delete(key);

                    state.visibleNodeIds = calculateVisibleNodes();
                    applyFiltersToVisualization();
                });

                container.dataset.bound = 'true';
            };

            attachToContainer(document.getElementById('usecaseFilterContainer'), 'usecase');
            attachToContainer(document.getElementById('classFilterContainer'), 'class');
        }
    };
})();