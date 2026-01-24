/**
 * Main Application Module
 * Orchestrates initialization and coordination of all submodules
 * Entry point for the cyber risk visualization application
 * 
 * INITIALIZATION SEQUENCE:
 * 1. Load configuration
 * 2. Initialize i18n system
 * 3. Load all data files
 * 4. Load ontology
 * 5. Create graph data
 * 6. Initialize D3 visualization
 * 7. Set up event handlers
 * 8. Render initial state
 */

const CyberViewApplication = (() => {
    // ==================== PRIVATE STATE ====================
    const state = {
        isInitialized: false,
        currentData: null,
        simulation: null,
        nodeGroup: null,
        linkGroup: null
    };

    // ==================== PRIVATE FUNCTIONS ====================

    /**
     * Initialize the D3 visualization canvas
     * Creates SVG container with zoom, pan, and resize capabilities
     * @returns {Object} Object containing svg, container, and zoom behavior
     */
    function initializeVisualization() {
        const container = d3.select(AppConfig.selectors.svgContainer);
        const width = container.node().clientWidth;
        const height = container.node().clientHeight;

        // Clear existing SVG if any
        container.selectAll('svg').remove();

        // Create SVG element
        const svg = container
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, height]);

        // Create background rectangle for zoom/pan and click detection
        svg.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'white')
            .attr('class', 'svg-background');

        // Create groups for layered rendering (links below nodes)
        const linkGroup = svg.append('g')
            .attr('class', 'link-group');

        const nodeGroup = svg.append('g')
            .attr('class', 'node-group');

        // Create zoom behavior
        const zoom = d3.zoom()
            .on('zoom', (event) => {
                linkGroup.attr('transform', event.transform);
                nodeGroup.attr('transform', event.transform);
            });

        svg.call(zoom);

        // Handle window resize
        window.addEventListener('resize', () => {
            const newWidth = container.node().clientWidth;
            const newHeight = container.node().clientHeight;
            
            svg.attr('width', newWidth)
                .attr('height', newHeight)
                .attr('viewBox', [0, 0, newWidth, newHeight]);

            // Update background
            svg.selectAll('.svg-background')
                .attr('width', newWidth)
                .attr('height', newHeight);
        });

        return { svg, container, width, height, linkGroup, nodeGroup, zoom };
    }

    /**
     * Render the graph with nodes and links
     * @param {Array} nodes - Processed nodes array
     * @param {Array} links - Processed links array
     * @param {number} svgWidth - SVG width
     * @param {number} svgHeight - SVG height
     */
    function renderGraph(nodes, links, svgWidth, svgHeight) {
        // Create force simulation
        const simulation = SimulationModule.createSimulation(nodes, links, svgWidth, svgHeight);
        state.simulation = simulation;

        // Create D3 selections for data binding
        state.linkGroup.selectAll('.link-group-item').remove(); // Clear existing
        state.nodeGroup.selectAll('.node-group-item').remove();

        // Bind link data
        const linkSelection = state.linkGroup.selectAll('g')
            .data(links)
            .enter()
            .append('g')
            .attr('class', 'link-group-item');

        LinkRendererModule.renderLinks(linkSelection);

        // Bind node data
        const nodeSelection = state.nodeGroup.selectAll('g')
            .data(nodes, d => d.id)
            .enter()
            .append('g')
            .attr('class', 'node-group-item');

        NodeRendererModule.renderNodes(nodeSelection, simulation);

        // Attach simulation tick handler
        SimulationModule.attachTickHandler(simulation, nodeSelection, linkSelection);
    }

    /**
     * Set up language switching functionality
     */
    function setupLanguageSwitching() {
        document.querySelectorAll(AppConfig.selectors.languageToggle).forEach(el => {
            el.addEventListener('click', async (event) => {
                event.preventDefault();
                const language = el.getAttribute('data-lang');
                
                // Load and apply translations
                await I18nModule.loadTranslations(language);
                I18nModule.applyTranslations();

                // Update ontology labels
                OntologyModule.generateLegend();

                // Update filter labels
                FiltersModule.updateFilterLabels();

                // Update node details if displayed
                NodeDetailsModule.updateLabels();

                // Update node and link labels
                const nodeSelection = d3.selectAll('.node-group-item');
                const linkSelection = d3.selectAll('.link-group-item');
                
                NodeRendererModule.updateNodeLabels(nodeSelection);
                LinkRendererModule.updateLinkLabels(linkSelection);

                // Update UI state
                document.querySelectorAll(AppConfig.selectors.languageToggle).forEach(toggle => {
                    toggle.classList.remove('active');
                });
                el.classList.add('active');
            });
        });

        // Set initial active language toggle
        const currentLanguage = I18nModule.getLanguage();
        document.querySelectorAll(AppConfig.selectors.languageToggle).forEach(el => {
            if (el.getAttribute('data-lang') === currentLanguage) {
                el.classList.add('active');
            }
        });
    }

    /**
     * Log initialization progress for debugging
     * @param {string} stage - Current initialization stage
     * @param {string} status - Status message
     */
    function logProgress(stage, status) {
        console.log(`[CyberView] ${stage}: ${status}`);
    }

    // ==================== PUBLIC API ====================
    return {
        /**
         * Initialize the entire application
         * Loads all data, sets up visualization, and attaches handlers
         * @returns {Promise<void>}
         */
        async initialize() {
            try {
                logProgress('INIT', 'Starting application initialization');

                // ========== STAGE 1: Load configuration ==========
                logProgress('CONFIG', 'Configuration loaded');

                // ========== STAGE 2: Initialize internationalization ==========
                const currentLanguage = I18nModule.getLanguage();
                await I18nModule.loadTranslations(currentLanguage);
                I18nModule.applyTranslations();
                logProgress('I18N', `Language set to: ${currentLanguage}`);

                // ========== STAGE 3: Load data files ==========
                const allData = await DataLoaderModule.loadAll();
                logProgress('DATA', 'All data files loaded');

                // ========== STAGE 4: Load ontology ==========
                await OntologyModule.load();
                OntologyModule.generateLegend();
                logProgress('ONTOLOGY', 'Ontology loaded and legend generated');

                // ========== STAGE 5: Create graph data structure ==========
                const graphData = GraphDataModule.createGraphData(
                    allData.risks,
                    allData.riskSources,
                    allData.businessAssets,
                    allData.securityCriteria,
                    allData.severityLevels,
                    allData.likelihoodLevels
                );
                state.currentData = graphData;
                logProgress('GRAPH', `Graph created: ${graphData.nodes.length} nodes, ${graphData.links.length} links`);

                // ========== STAGE 6: Initialize visualization ==========
                const vizConfig = initializeVisualization();
                state.nodeGroup = vizConfig.nodeGroup;
                state.linkGroup = vizConfig.linkGroup;
                logProgress('VIZ', 'Visualization canvas created');

                // ========== STAGE 7: Render graph ==========
                renderGraph(graphData.nodes, graphData.links, vizConfig.width, vizConfig.height);
                logProgress('RENDER', 'Graph rendered with nodes and links');

                // ========== STAGE 8: Initialize modules ==========
                FiltersModule.initialize(graphData.nodes, graphData.links);
                FiltersModule.populateFilterOptions();
                FiltersModule.attachEventHandlers();
                logProgress('FILTERS', 'Filter module initialized');

                NodeDetailsModule.initialize(graphData.nodes, graphData.links);
                NodeDetailsModule.attachEventHandlers();
                logProgress('DETAILS', 'Node details module initialized');

                // ========== STAGE 9: Set up language switching ==========
                setupLanguageSwitching();
                logProgress('LANG_SWITCH', 'Language switching initialized');

                // ========== FINAL: Mark as initialized ==========
                state.isInitialized = true;
                logProgress('INIT', 'Application initialization complete');

            } catch (error) {
                console.error('[CyberView] Initialization failed:', error);
                this.displayErrorMessage(error);
            }
        },

        /**
         * Display error message to user
         * @param {Error} error - Error object
         */
        displayErrorMessage(error) {
            const message = error.message || 'An unexpected error occurred';
            const errorDiv = document.querySelector('[data-i18n="information.error"]') || 
                            d3.select(AppConfig.selectors.informationPanel).node();

            if (errorDiv) {
                d3.select(errorDiv).html(`
                    <div class="error-message">
                        <h3>Error</h3>
                        <p>${escapeHtml(message)}</p>
                    </div>
                `).style('display', 'block');
            }
        },

        /**
         * Check if application is fully initialized
         * @returns {boolean}
         */
        isReady() {
            return state.isInitialized;
        },

        /**
         * Get current graph data
         * @returns {Object|null} Current graph data or null if not initialized
         */
        getGraphData() {
            return state.currentData;
        },

        /**
         * Utility: Escape HTML to prevent XSS
         * @param {string} text - Text to escape
         * @returns {string} Escaped text
         */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };
})();

// ==================== AUTO-INITIALIZE ON DOM READY ====================
/**
 * Start application when DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    CyberViewApplication.initialize();
});
