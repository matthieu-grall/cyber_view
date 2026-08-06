/**
 * Individuals view definition.
 * Author: Matthieu GRALL (DATA VISIONS)
 * License: Creative Commons Attribution 4.0 International (CC BY 4.0)
 */

const IndividualsView = createNetworkViewBase({
    id: 'usecase',

    async getGraphData(context) {
        let useCaseData = context.state.currentUsecaseData;
        if (!useCaseData) {
            useCaseData = await context.services.loadDefaultUseCaseData();
            context.state.currentUsecaseData = useCaseData;
        }
        return context.services.createUseCaseGraphData(useCaseData);
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
