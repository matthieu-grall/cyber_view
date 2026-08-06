/**
 * Data loader module.
 * Author: Matthieu GRALL (DATA VISIONS)
 * License: Creative Commons Attribution 4.0 International (CC BY 4.0)
 */

const DataLoaderModule = (() => {
    // ==================== PRIVATE STATE ====================
    const data = {
        currentUsecase: null,
        currentUsecaseRaw: null
    };

    // ==================== PRIVATE METHODS ====================
    /**
     * Load a single JSON file
     * @param {string} filePath - Path to the JSON file
     * @returns {Promise<Object>} Promise resolving to parsed JSON data
     */
    async function loadJsonFile(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error loading file ${filePath}:`, error);
            throw error;
        }
    }

    // ==================== PUBLIC API ====================
    return {
        /**
         * Load a unified use case JSON file
         * @param {string} useCaseFile - Path to the use case JSON file
         * @returns {Promise<Object>} Promise resolving to data loaded from the use case
         */
        async loadAll(useCaseFile = AppConfig.dataFiles.useCase) {
            try {
                const useCaseData = await loadJsonFile(useCaseFile);

                data.currentUsecaseRaw = useCaseData;
                data.currentUsecase = {
                    id: useCaseData.id || null,
                    name: useCaseData.name || null,
                    description: useCaseData.description || null,
                    date: useCaseData.date || null,
                    metadata: useCaseData.metadata || null
                };

                return data;
            } catch (error) {
                console.error('Failed to load use case data:', error);
                throw error;
            }
        },

        /**
         * Load a use case from a File object (from an <input type="file">)
         * @param {File} file - File object selected by the user
         * @returns {Promise<Object>} Promise resolving to loaded data
         */
        async loadFromFile(file) {
            try {
                const text = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(reader.error);
                    reader.readAsText(file, 'utf-8');
                });

                const useCaseData = JSON.parse(text);

                data.currentUsecaseRaw = useCaseData;
                data.currentUsecase = {
                    id: useCaseData.id || null,
                    name: useCaseData.name || null,
                    description: useCaseData.description || null,
                    date: useCaseData.date || null,
                    metadata: useCaseData.metadata || null
                };

                return data;
            } catch (error) {
                console.error('Failed to load use case from file:', error);
                throw error;
            }
        },

        /**
         * Get metadata about the currently loaded use case
         * @returns {Object|null}
         */
        getCurrentUsecase() {
            return data.currentUsecase;
        },

        /**
         * Get raw use case payload loaded from file or from data store
         * @returns {Object|null}
         */
        getCurrentUsecaseRaw() {
            return data.currentUsecaseRaw;
        },

        /**
         * Load ontology JSON data from file
         * @returns {Promise<Object>} Promise resolving to ontology data
         */
        async loadOntology() {
            try {
                if (data.ontology) {
                    return data.ontology;
                }
                const response = await loadJsonFile(AppConfig.dataFiles.cyberOntology);
                data.ontology = response;
                return data.ontology;
            } catch (error) {
                console.error('Failed to load ontology data:', error);
                throw error;
            }
        },

        /**
         * Get loaded ontology data
         * @returns {Object|null} Ontology data or null if not loaded
         */
        getOntologyData() {
            return data.ontology || null;
        },

    };
})();
