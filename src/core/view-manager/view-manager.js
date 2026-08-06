/**
 * View manager module.
 * Author: Matthieu GRALL (DATA VISIONS)
 * License: Creative Commons Attribution 4.0 International (CC BY 4.0)
 */

const ViewManagerModule = (() => {
    const state = {
        views: new Map(),
        currentViewId: null
    };

    return {
        registerView(viewDefinition) {
            if (!viewDefinition || !viewDefinition.id) {
                throw new Error('Invalid view definition: missing id');
            }
            state.views.set(viewDefinition.id, viewDefinition);
        },

        registerViews(viewDefinitions) {
            (viewDefinitions || []).forEach(view => this.registerView(view));
        },

        setCurrentView(viewId) {
            if (!state.views.has(viewId)) {
                throw new Error(`Unknown view: ${viewId}`);
            }
            state.currentViewId = viewId;
        },

        getCurrentView() {
            if (!state.currentViewId) return null;
            return state.views.get(state.currentViewId) || null;
        },

        getCurrentViewId() {
            return state.currentViewId;
        },

        getView(viewId) {
            return state.views.get(viewId) || null;
        },

        getViews() {
            return Array.from(state.views.values());
        }
    };
})();
