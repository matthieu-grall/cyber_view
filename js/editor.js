/**
 * JSON Editor Module
 * Manages the JSON editing interface with validation and export functionality
 */

const EditorModule = (() => {
    let currentMode = 'visualization'; // 'visualization' or 'edit'
    let currentSource = 'ontology'; // 'ontology' or 'usecase'
    let currentData = null; // Currently edited data
    let isValidJSON = false;

    // Initialize editor
    function init() {
        setupModeToggle();
        setupSourceToggle();
        setupEditorControls();
        loadInitialData();
    }

    // Setup mode selector (visualization vs edit)
    function setupModeToggle() {
        const modeBtnVisualization = document.getElementById('modeBtnVisualization');
        const modeBtnEdit = document.getElementById('modeBtnEdit');
        if (modeBtnVisualization && modeBtnEdit) {
            modeBtnVisualization.addEventListener('click', () => {
                currentMode = 'visualization';
                toggleMode(currentMode);
            });
            modeBtnEdit.addEventListener('click', () => {
                currentMode = 'edit';
                toggleMode(currentMode);
            });
        }
    }

    // Setup source selector (ontology vs usecase)
    function setupSourceToggle() {
        const viewBtnIndividuals = document.getElementById('viewBtnIndividuals');
        const viewBtnOntology = document.getElementById('viewBtnOntology');
        if (viewBtnIndividuals && viewBtnOntology) {
            viewBtnIndividuals.addEventListener('click', () => {
                currentSource = 'usecase';
                loadDataBySource(currentSource);
            });
            viewBtnOntology.addEventListener('click', () => {
                currentSource = 'ontology';
                loadDataBySource(currentSource);
            });
        }
    }

    // Setup editor controls (validate, export)
    function setupEditorControls() {
        const validateBtn = document.getElementById('editorValidateButton');
        const exportBtn = document.getElementById('editorExportButton');
        const jsonEditor = document.getElementById('jsonEditor');

        if (validateBtn) {
            validateBtn.addEventListener('click', validateJSON);
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', exportJSON);
        }

        if (jsonEditor) {
            jsonEditor.addEventListener('input', () => {
                isValidJSON = false;
                updateEditorStatus('Modifications non validées', 'warning');
            });
        }
    }

    // Toggle between visualization and edit modes
    function toggleMode(mode) {
        const visualizationElements = document.querySelectorAll('.visualization-only');
        const editorContainer = document.getElementById('editor_container');
        const sourceSelector = document.querySelector('.source_selector_container');
        const filterContainer = document.getElementById('filters');

        if (mode === 'visualization') {
            // Show visualization elements
            visualizationElements.forEach(el => el.style.display = '');
            if (editorContainer) editorContainer.style.display = 'none';
            if (sourceSelector) sourceSelector.style.display = 'none';
        } else {
            // Show editor elements
            visualizationElements.forEach(el => el.style.display = 'none');
            if (editorContainer) editorContainer.style.display = 'block';
            if (sourceSelector) sourceSelector.style.display = 'block';
            
            // Load data into editor
            loadDataBySource(currentSource);
        }
    }

    // Load data based on source selection
    async function loadDataBySource(source) {
        const editorStatus = document.getElementById('editorStatus');
        const jsonEditor = document.getElementById('jsonEditor');

        try {
            if (source === 'ontology') {
                // Load ontology
                const response = await fetch('data/cyber-ontology.json');
                currentData = await response.json();
            } else {
                // Load use-case
                const useCase = DataLoaderModule.getCurrentUsecase();
                if (useCase) {
                    currentData = useCase;
                } else {
                    // Try to load the default use-case file
                    const response = await fetch('data/usecase-2026-06-05.json');
                    currentData = await response.json();
                }
            }

            // Display in editor
            if (jsonEditor) {
                jsonEditor.value = JSON.stringify(currentData, null, 2);
            }
            
            isValidJSON = true;
            updateEditorStatus('JSON chargé', 'success');
        } catch (error) {
            console.error('Error loading data:', error);
            updateEditorStatus('Erreur : ' + error.message, 'error');
            isValidJSON = false;
        }
    }

    // Load initial data (ontology by default)
    async function loadInitialData() {
        try {
            const response = await fetch('data/cyber-ontology.json');
            currentData = await response.json();
            const jsonEditor = document.getElementById('jsonEditor');
            if (jsonEditor) {
                jsonEditor.value = JSON.stringify(currentData, null, 2);
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    // Validate JSON from editor
    function validateJSON() {
        const jsonEditor = document.getElementById('jsonEditor');
        const editorStatus = document.getElementById('editorStatus');

        try {
            const text = jsonEditor.value.trim();
            if (!text) {
                throw new Error('L\'éditeur est vide');
            }
            
            currentData = JSON.parse(text);
            isValidJSON = true;
            updateEditorStatus('JSON valide ✓', 'success');
            
            // Optionally trigger graph update if viewing from dataviz later
            console.log('Valid JSON:', currentData);
        } catch (error) {
            isValidJSON = false;
            updateEditorStatus('JSON invalide : ' + error.message, 'error');
        }
    }

    // Export JSON as file download
    function exportJSON() {
        if (!isValidJSON) {
            alert('Veuillez d\'abord valider le JSON');
            return;
        }

        const filename = currentSource === 'ontology' 
            ? 'cyber-ontology.json' 
            : 'usecase-' + new Date().toISOString().split('T')[0] + '.json';
        
        const dataStr = JSON.stringify(currentData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    // Update editor status display
    function updateEditorStatus(message, type) {
        const editorStatus = document.getElementById('editorStatus');
        if (editorStatus) {
            editorStatus.textContent = message;
            editorStatus.className = 'editor-status ' + type;
        }
    }

    // Public API
    return {
        init,
        getCurrentData: () => currentData,
        getCurrentMode: () => currentMode,
        getCurrentSource: () => currentSource,
        isValidJSON: () => isValidJSON
    };
})();

// Initialize editor when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        EditorModule.init();
    });
} else {
    EditorModule.init();
}
