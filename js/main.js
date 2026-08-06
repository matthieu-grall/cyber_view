/**
 * Main application module.
 * Author: Matthieu GRALL (DATA VISIONS)
 * License: Creative Commons Attribution 4.0 International (CC BY 4.0)
 */

const CyberViewApplication = (() => {
    // ==================== PRIVATE STATE ====================
    const state = {
        isInitialized: false,
        currentData: null,
        currentView: 'usecase',
        currentUsecaseData: null
    };

    // ==================== PRIVATE FUNCTIONS ====================

    function registerViews() {
        ViewManagerModule.registerViews([IndividualsView, OntologyView]);
    }

    function getViewContext() {
        return {
            state,
            services: DataServicesModule
        };
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
                NetworkVisualizationModule.updateLabels();

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

    function updateLoadedStudyName() {
        const loadedStudyNameElement = document.querySelector(AppConfig.selectors.loadedStudyName);
        if (!loadedStudyNameElement) return;

        const currentUsecase = DataServicesModule.getCurrentUsecaseMetadata();
        if (!currentUsecase) {
            loadedStudyNameElement.textContent = '';
            return;
        }

        const label = currentUsecase.name || currentUsecase.id || '';
        loadedStudyNameElement.textContent = label;
    }

    function updateViewButtons(viewId) {
        const viewBtnIndividuals = document.getElementById('viewBtnIndividuals');
        const viewBtnOntology = document.getElementById('viewBtnOntology');
        if (!viewBtnIndividuals || !viewBtnOntology) return;

        viewBtnIndividuals.classList.toggle('view-toggle__btn--active', viewId === 'usecase');
        viewBtnOntology.classList.toggle('view-toggle__btn--active', viewId === 'ontology');
        viewBtnIndividuals.setAttribute('aria-pressed', viewId === 'usecase');
        viewBtnOntology.setAttribute('aria-pressed', viewId === 'ontology');
    }

    function initializeViewControls() {
        // Source buttons
        const viewBtnIndividuals = document.getElementById('viewBtnIndividuals');
        const viewBtnOntology = document.getElementById('viewBtnOntology');

        if (viewBtnIndividuals && viewBtnOntology) {
            const setSource = async (source) => {
                const viewId = source === 'ontology' ? 'ontology' : 'usecase';
                ViewManagerModule.setCurrentView(viewId);
                state.currentView = viewId;
                updateViewButtons(viewId);
                await renderCurrentView();
            };

            viewBtnIndividuals.addEventListener('click', async () => setSource('usecase'));
            viewBtnOntology.addEventListener('click', async () => setSource('ontology'));
        }
    }

    async function renderCurrentView() {
        const currentView = ViewManagerModule.getCurrentView();
        if (!currentView) {
            throw new Error('No active view registered');
        }

        const context = getViewContext();
        const graphData = await currentView.getGraphData(context);
        const tooltipProvider = currentView.getTooltipProvider ? currentView.getTooltipProvider(context) : null;
        const detailsPanelProvider = currentView.getDetailsPanelProvider ? currentView.getDetailsPanelProvider(context) : null;
        const visualizationOptions = currentView.getVisualizationOptions ? currentView.getVisualizationOptions(context) : {};

        state.currentData = graphData;
        NetworkVisualizationModule.setTooltipProvider(tooltipProvider);
        NetworkVisualizationModule.setDetailsPanelProvider(detailsPanelProvider);
        NetworkVisualizationModule.render(graphData.nodes, graphData.links, visualizationOptions);

        FiltersModule.initialize(graphData.nodes, graphData.links);
        FiltersModule.populateFilterOptions();
        FiltersModule.attachEventHandlers();
        NodeDetailsModule.initialize(graphData.nodes, graphData.links);
        NodeDetailsModule.attachEventHandlers();
        document.getElementById('filters').style.display = '';
    }

    function setupDataLoadingControls() {
        const loadButton = document.getElementById('fileLoadButton');
        const fileInput = document.getElementById('filut');

        if (loadButton && fileInput) {
            loadButton.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', async (event) => {
                const file = event.target.files && event.target.files[0];
                if (!file) return;

                try {
                    const allData = await DataServicesModule.loadUseCaseDataFromFile(file);
                    state.currentUsecaseData = allData;
                    if (ViewManagerModule.getCurrentViewId() === 'usecase') {
                        await renderCurrentView();
                    }
                    updateLoadedStudyName();
                } catch (error) {
                    console.error('Error loading use case from file:', error);
                }
            });
        }

        // Wire the layout reset button to NodeRendererModule.resetLayout()
        const resetButton = document.getElementById('resetLayoutButton');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                if (typeof NodeRendererModule !== 'undefined' && NodeRendererModule.resetLayout) {
                    NodeRendererModule.resetLayout();
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

                // ========== STAGE 3: Initialize data loading controls ==========
                setupDataLoadingControls();

                // ========== STAGE 4: Initialize visualization ==========
                NetworkVisualizationModule.initialize();
                logProgress('VIZ', 'Visualization canvas created');

                // ========== STAGE 5: Load use case data ==========
                const allData = await DataServicesModule.loadDefaultUseCaseData();
                logProgress('DATA', 'Use case data loaded');

                // ========== STAGE 6: Load ontology ==========
                await OntologyModule.load();
                OntologyModule.generateLegend();
                logProgress('ONTOLOGY', 'Ontology loaded and legend generated');

                // ========== STAGE 7: Store use case data ==========
                state.currentUsecaseData = allData;
                updateLoadedStudyName();
                logProgress('DATA', 'Use case data cached for rendering');

                // ========== STAGE 8: Register and initialize views ==========
                registerViews();
                ViewManagerModule.setCurrentView('usecase');
                state.currentView = 'usecase';
                updateViewButtons('usecase');

                // ========== STAGE 9: Render initial view ==========
                await renderCurrentView();
                logProgress('RENDER', 'Initial view rendered');

                // ========== STAGE 10: Set up language switching ==========
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