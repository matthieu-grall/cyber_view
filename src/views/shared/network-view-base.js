/**
 * Shared network view helpers.
 * Author: Matthieu GRALL (DATA VISIONS)
 * License: Creative Commons Attribution 4.0 International (CC BY 4.0)
 */

function createNetworkViewBase(definition) {
    return {
        id: definition.id,
        visualizationId: 'network',

        async getGraphData(context) {
            return definition.getGraphData(context);
        },

        getVisualizationOptions(context) {
            if (typeof definition.getVisualizationOptions === 'function') {
                return definition.getVisualizationOptions(context);
            }
            return {};
        },

        getTooltipProvider(context) {
            if (typeof definition.getTooltipProvider === 'function') {
                return definition.getTooltipProvider(context);
            }
            return null;
        },

        getDetailsPanelProvider(context) {
            if (typeof definition.getDetailsPanelProvider === 'function') {
                return definition.getDetailsPanelProvider(context);
            }
            return null;
        }
    };
}
