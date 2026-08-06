/**
 * Ontology view definition.
 * Author: Matthieu GRALL (DATA VISIONS)
 * License: Creative Commons Attribution 4.0 International (CC BY 4.0)
 */

const OntologyView = createNetworkViewBase({
    id: 'ontology',

    async getGraphData(context) {
        const ontologyData = await context.services.loadOntologyData();
        return context.services.createOntologyGraphData(ontologyData, I18nModule.getLanguage());
    },

    getVisualizationOptions() {
        return {
            linkDistance: GRAPH_CONFIG.ONTOLOGY_LINK_DISTANCE
        };
    },

    getTooltipProvider() {
        // Keep the current renderer behavior as default for this view.
        return node => NodeRendererModule.createDefaultTooltip(node);
    },

    getDetailsPanelProvider() {
        // Keep the current details panel behavior as default for this view.
        return (node, helpers) => NodeDetailsModule.createDefaultDetailsHTML(node, helpers);
    }
});
