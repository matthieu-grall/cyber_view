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
        currentView: 'usecase',
        currentUsecaseData: null,
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
                updateLoadedStudyName();
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

    function getUseCaseConfig(useCaseId) {
        return AppConfig.useCases.find(useCase => useCase.id === useCaseId);
    }

    function updateLoadedStudyName() {
        const loadedStudyNameElement = document.querySelector(AppConfig.selectors.loadedStudyName);
        if (!loadedStudyNameElement) return;

        const currentUsecase = DataLoaderModule.getCurrentUsecase();
        if (!currentUsecase) {
            loadedStudyNameElement.textContent = '';
            return;
        }

        const label = currentUsecase.name || currentUsecase.id || '';
        loadedStudyNameElement.textContent = label;
    }

    async function loadUseCaseData(useCaseId) {
        const useCaseConfig = getUseCaseConfig(useCaseId);
        if (!useCaseConfig) {
            throw new Error(`Use case not found: ${useCaseId}`);
        }

        const allData = await DataLoaderModule.loadAll(useCaseConfig.file);
        state.currentUsecaseData = allData;
        updateLoadedStudyName();
        return allData;
    }

    function initializeViewControls() {
        // Source buttons
        const viewBtnIndividuals = document.getElementById('viewBtnIndividuals');
        const viewBtnOntology = document.getElementById('viewBtnOntology');

        if (viewBtnIndividuals && viewBtnOntology) {
            const setSource = async (source) => {
                viewBtnIndividuals.classList.toggle('active', source === 'usecase');
                viewBtnOntology.classList.toggle('active', source === 'ontology');
                state.currentView = source === 'ontology' ? 'ontology' : 'usecase';
                await renderCurrentView();
            };

            viewBtnIndividuals.addEventListener('click', async () => setSource('usecase'));
            viewBtnOntology.addEventListener('click', async () => setSource('ontology'));
        }
    }

    async function renderCurrentView() {
        if (state.currentView === 'ontology') {
            await renderOntologyGraph();
        } else {
            await renderUsecaseGraph();
        }
    }

    async function renderUsecaseGraph() {
        if (!state.currentUsecaseData) {
            await loadUseCaseData(AppConfig.defaultUseCaseId);
        }

        const allData = state.currentUsecaseData;
        const graphData = GraphDataModule.createGraphData(
            allData.risks,
            allData.riskSources,
            allData.businessAssets,
            allData.securityCriteria,
            allData.severityLevels,
            allData.likelihoodLevels
        );

        state.currentData = graphData;
        renderGraph(graphData.nodes, graphData.links, state.renderWidth, state.renderHeight);
        FiltersModule.initialize(graphData.nodes, graphData.links);
        FiltersModule.populateFilterOptions();
        FiltersModule.attachEventHandlers();
        NodeDetailsModule.initialize(graphData.nodes, graphData.links);
        NodeDetailsModule.attachEventHandlers();
        document.getElementById('filters').style.display = '';
    }

    async function renderOntologyGraph() {
        const ontologyData = await DataLoaderModule.loadOntology();
        const graphData = GraphDataModule.createOntologyGraph(ontologyData, I18nModule.getLanguage());

        state.currentData = graphData;
        renderGraph(graphData.nodes, graphData.links, state.renderWidth, state.renderHeight);
        NodeDetailsModule.initialize(graphData.nodes, graphData.links);
        NodeDetailsModule.attachEventHandlers();
        document.getElementById('filters').style.display = 'none';
    }

    function populateStudySelector() {
        const studySelect = document.querySelector(AppConfig.selectors.studySelect);
        if (studySelect) {
            studySelect.innerHTML = '';
            AppConfig.useCases.forEach(useCase => {
                const option = document.createElement('option');
                option.value = useCase.id;
                option.textContent = useCase.label;
                studySelect.appendChild(option);
            });

            studySelect.value = AppConfig.defaultUseCaseId;
            studySelect.addEventListener('change', async () => {
                try {
                    const allData = await loadUseCaseData(studySelect.value);
                    if (state.currentView === 'usecase') {
                        await renderUsecaseGraph();
                    }
                } catch (error) {
                    console.error('Failed to load selected use case:', error);
                }
            });
        }

        // File load button and input wiring (always present)
        const loadButton = document.getElementById('studyLoadButton');
        const fileInput = document.getElementById('studyFileInput');
        if (loadButton && fileInput) {
            loadButton.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', async (evt) => {
                const file = evt.target.files && evt.target.files[0];
                if (!file) return;
                try {
                    const allData = await DataLoaderModule.loadFromFile(file);
                    state.currentUsecaseData = allData;
                    if (state.currentView === 'usecase') {
                        await renderUsecaseGraph();
                    }
                    updateLoadedStudyName();
                } catch (err) {
                    console.error('Error loading use case from file:', err);
                }
            });
        }
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

                // ========== STAGE 3: Prepare study selection UI ==========
                populateStudySelector();

                // ========== STAGE 4: Initialize visualization ==========
                const vizConfig = initializeVisualization();
                state.nodeGroup = vizConfig.nodeGroup;
                state.linkGroup = vizConfig.linkGroup;
                state.renderWidth = vizConfig.width;
                state.renderHeight = vizConfig.height;
                logProgress('VIZ', 'Visualization canvas created');

                // ========== STAGE 5: Load use case data ==========
                const allData = await loadUseCaseData(AppConfig.defaultUseCaseId);
                logProgress('DATA', 'Use case data loaded');

                // ========== STAGE 6: Load ontology ==========
                await OntologyModule.load();
                OntologyModule.generateLegend();
                logProgress('ONTOLOGY', 'Ontology loaded and legend generated');

                // ========== STAGE 7: Store use case data ==========
                state.currentUsecaseData = allData;
                logProgress('DATA', 'Use case data cached for rendering');

                // ========== STAGE 8: Render initial view ==========
                await renderCurrentView();
                logProgress('RENDER', 'Initial view rendered');

                // ========== STAGE 9: Set up language switching ==========
                setupLanguageSwitching();
                logProgress('LANG_SWITCH', 'Language switching initialized');

                // ========== STAGE 11: Set up view controls ==========
                initializeViewControls();

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
                        <p>${this.escapeHtml(message)}</p>
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