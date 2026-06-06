/**
 * Ontology management module
 * Handles cyber-ontology data and provides semantic information about node types
 */

const OntologyModule = (() => {
    // ==================== PRIVATE STATE ====================
    let ontologyData = null;

    // ==================== PRIVATE METHODS ====================
    /**
     * Map node type identifiers to ontology class IDs
     * @param {string} nodeType - Type of node from graph data
     * @returns {string|null} Ontology class ID or null if not mapped
     */
    function mapNodeTypeToOntologyClass(nodeType) {
        const typeMap = {
            'risk': 'risk',
            'feared-event': 'feared-event',
            'security-criteria': 'security-property',
            'business-asset': 'business-asset',
            'risk-source': 'risk-source',
            'severity-level': null,
            'likelihood-level': null
        };
        return typeMap[nodeType] || null;
    }

    // ==================== PUBLIC API ====================
    return {
        /**
         * Load ontology data from file
         * @returns {Promise<Object>} Promise resolving to ontology data
         */
        async load() {
            try {
                const response = await fetch(AppConfig.dataFiles.cyberOntology);
                if (!response.ok) {
                    throw new Error(`Failed to load ontology: ${response.statusText}`);
                }
                ontologyData = await response.json();
                return ontologyData;
            } catch (error) {
                console.error('Ontology loading error:', error);
                return null;
            }
        },

        /**
         * Get ontology data
         * @returns {Object|null} Ontology data or null if not loaded
         */
        getData() {
            return ontologyData;
        },

        /**
         * Get localized label for a node type
         * @param {string} nodeType - Type identifier of the node
         * @param {string} language - Language code (e.g., 'fr', 'en')
         * @returns {string} Localized label or original type if not found
         */
        getNodeTypeLabel(nodeType, language) {
            if (!ontologyData) return nodeType;

            if (nodeType === 'ontology-class') {
                return I18nModule.getTranslation('information.ontologyClass') || 'Ontology class';
            }

            const ontologyClass = mapNodeTypeToOntologyClass(nodeType);
            if (!ontologyClass) return nodeType;

            const ontClass = ontologyData.classes.find(c => c.id === ontologyClass);
            return ontClass ? ontClass.label[language] || ontClass.label.fr : nodeType;
        },

        /**
         * Get definition for a node type
         * @param {string} nodeType - Type identifier of the node
         * @param {string} language - Language code (e.g., 'fr', 'en')
         * @returns {string} Definition text
         */
        getNodeTypeDefinition(nodeType, language) {
            if (!ontologyData) return '';

            if (nodeType === 'ontology-class') {
                return I18nModule.getTranslation('information.ontologyClass') || 'Ontology class';
            }

            const ontologyClass = mapNodeTypeToOntologyClass(nodeType);
            if (!ontologyClass) return '';

            const ontClass = ontologyData.classes.find(c => c.id === ontologyClass);
            return ontClass ? (ontClass.isDefinedBy[language] || ontClass.isDefinedBy.fr) : '';
        },

        /**
         * Generate ontology legend in the UI
         */
        generateLegend() {
            if (!ontologyData) return;

            const classesContainer = document.querySelector('#legend-classes');
            const relationsContainer = document.querySelector('#legend-relations');
            if (!classesContainer || !relationsContainer) return;

            const classDot = document.createElement('div');
            classDot.className = 'key-item';
            classDot.innerHTML = `
                <span class="key-color-dot" style="
                    width: 12px;
                    height: 12px;
                    background: ${AppConfig.colors.nodeType['ontology-class'] || '#4b91d6'};
                    border: 1px solid #666;
                    display: inline-block;
                    border-radius: 50%;
                    vertical-align: middle;
                "></span>
                <span>${I18nModule.getTranslation('information.classes')}</span>
            `;

            const relationLine = document.createElement('div');
            relationLine.className = 'key-item';
            relationLine.innerHTML = `
                <span class="key-line" style="
                    width: 24px;
                    height: 2px;
                    background: #888;
                    display: inline-block;
                    vertical-align: middle;
                    margin-right: 8px;
                "></span>
                <span>${I18nModule.getTranslation('information.relations')}</span>
            `;

            classesContainer.innerHTML = '';
            relationsContainer.innerHTML = '';
            classesContainer.appendChild(classDot);
            relationsContainer.appendChild(relationLine);
        }
    };
})();
