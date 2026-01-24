/**
 * Data loader module
 * Handles loading all JSON data files for the graph visualization
 */

const DataLoaderModule = (() => {
    // ==================== PRIVATE STATE ====================
    const data = {
        risks: [],
        riskSources: [],
        businessAssets: [],
        securityCriteria: [],
        severityLevels: [],
        likelihoodLevels: []
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
         * Load all required data files in parallel
         * @returns {Promise<Object>} Promise resolving to all loaded data
         */
        async loadAll() {
            try {
                const [risks, riskSources, businessAssets, securityCriteria, severityLevels, likelihoodLevels] = 
                    await Promise.all([
                        loadJsonFile(AppConfig.dataFiles.risks),
                        loadJsonFile(AppConfig.dataFiles.riskSources),
                        loadJsonFile(AppConfig.dataFiles.businessAssets),
                        loadJsonFile(AppConfig.dataFiles.securityCriteria),
                        loadJsonFile(AppConfig.dataFiles.severityLevels),
                        loadJsonFile(AppConfig.dataFiles.likelihoodLevels)
                    ]);

                data.risks = risks;
                data.riskSources = riskSources;
                data.businessAssets = businessAssets;
                data.securityCriteria = securityCriteria;
                data.severityLevels = severityLevels;
                data.likelihoodLevels = likelihoodLevels;

                return data;
            } catch (error) {
                console.error('Failed to load all data files:', error);
                throw error;
            }
        },

        /**
         * Resolve an ID reference to a label using reference data
         * @param {string} id - ID to resolve
         * @param {string} dataType - Type of reference data (e.g., 'severityLevels')
         * @returns {string|null} Label or null if not found
         */
        resolveIdToLabel(id, dataType) {
            if (!id || !data[dataType]) return null;
            const item = data[dataType].find(d => d.id === id);
            return item ? item.label : id;
        },

        /**
         * Get reference data by type
         * @param {string} dataType - Type of reference data
         * @returns {Array} Array of reference data items
         */
        getReferenceData(dataType) {
            return data[dataType] || [];
        }
    };
})();
