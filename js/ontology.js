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

            const container = document.querySelector(AppConfig.selectors.ontologyLegend);
            if (!container) return;

            container.innerHTML = '';

            const nodeSizes = AppConfig.nodeSizes.baseRadius;
            const nodeColors = AppConfig.colors.nodeType;

            ontologyData.classes.forEach(ontologyClass => {
                const classId = ontologyClass.id;
                const color = nodeColors[classId] || nodeColors[classId.replace('-', '')] || '#ddd';
                const baseSize = nodeSizes[classId] || nodeSizes.default;
                const label = ontologyClass.label[I18nModule.getLanguage()] || ontologyClass.label.fr;
                const definition = ontologyClass.isDefinedBy[I18nModule.getLanguage()] || ontologyClass.isDefinedBy.fr;

                const keyItem = document.createElement('div');
                keyItem.className = 'key-item';
                keyItem.innerHTML = `
                    <span class="key-color-dot" style="
                        width: ${baseSize * 1.5}px;
                        height: ${baseSize * 1.5}px;
                        background: ${color};
                        border: 1px solid #666;
                        display: inline-block;
                        border-radius: 50%;
                    "></span>
                    <span title="${definition}">${label}</span>
                `;
                container.appendChild(keyItem);
            });
        }
    };
})();
