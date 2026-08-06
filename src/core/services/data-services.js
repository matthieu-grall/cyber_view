/**
 * Data services module.
 * Author: Matthieu GRALL (DATA VISIONS)
 * License: Creative Commons Attribution 4.0 International (CC BY 4.0)
 */

const DataServicesModule = (() => {
    function getUseCaseConfig(useCaseId) {
        return AppConfig.useCases.find(useCase => useCase.id === useCaseId) || null;
    }

    return {
        getUseCaseConfig,

        async loadUseCaseData(useCaseId) {
            const useCaseConfig = getUseCaseConfig(useCaseId);
            if (!useCaseConfig) {
                throw new Error(`Use case not found: ${useCaseId}`);
            }
            return DataLoaderModule.loadAll(useCaseConfig.file);
        },

        async loadDefaultUseCaseData() {
            return this.loadUseCaseData(AppConfig.defaultUseCaseId);
        },

        async loadUseCaseDataFromFile(file) {
            return DataLoaderModule.loadFromFile(file);
        },

        async loadOntologyData() {
            return DataLoaderModule.loadOntology();
        },

        createUseCaseGraphData(useCaseData) {
            const rawUsecase = useCaseData?.currentUsecaseRaw || useCaseData;
            return GraphDataModule.createGraphData(rawUsecase);
        },

        createOntologyGraphData(ontologyData, language) {
            return GraphDataModule.createOntologyGraph(ontologyData, language);
        },

        getCurrentUsecaseMetadata() {
            return DataLoaderModule.getCurrentUsecase();
        },

        getCurrentUsecaseRaw() {
            return DataLoaderModule.getCurrentUsecaseRaw();
        }
    };
})();
