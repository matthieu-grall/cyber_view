/**
 * Shared network visualization module.
 * Author: Matthieu GRALL (DATA VISIONS)
 * License: Creative Commons Attribution 4.0 International (CC BY 4.0)
 */

const NetworkVisualizationModule = (() => {
    const state = {
        initialized: false,
        svg: null,
        container: null,
        linkGroup: null,
        nodeGroup: null,
        width: 0,
        height: 0,
        zoom: null,
        simulation: null,
        resizeBound: false
    };

    function initializeCanvas() {
        const container = d3.select(AppConfig.selectors.svgContainer);
        const width = container.node().clientWidth;
        const height = container.node().clientHeight;

        container.selectAll('svg').remove();

        const svg = container
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, height]);

        svg.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'white')
            .attr('class', 'svg-background');

        const linkGroup = svg.append('g').attr('class', 'link-group');
        const nodeGroup = svg.append('g').attr('class', 'node-group');

        const zoom = d3.zoom().on('zoom', (event) => {
            linkGroup.attr('transform', event.transform);
            nodeGroup.attr('transform', event.transform);
        });

        svg.call(zoom);

        state.container = container;
        state.svg = svg;
        state.linkGroup = linkGroup;
        state.nodeGroup = nodeGroup;
        state.width = width;
        state.height = height;
        state.zoom = zoom;
        state.initialized = true;

        if (!state.resizeBound) {
            window.addEventListener('resize', () => {
                if (!state.initialized || !state.container || !state.svg) return;

                const newWidth = state.container.node().clientWidth;
                const newHeight = state.container.node().clientHeight;

                state.width = newWidth;
                state.height = newHeight;

                state.svg
                    .attr('width', newWidth)
                    .attr('height', newHeight)
                    .attr('viewBox', [0, 0, newWidth, newHeight]);

                state.svg.selectAll('.svg-background')
                    .attr('width', newWidth)
                    .attr('height', newHeight);
            });
            state.resizeBound = true;
        }
    }

    return {
        initialize() {
            initializeCanvas();
            return {
                width: state.width,
                height: state.height,
                linkGroup: state.linkGroup,
                nodeGroup: state.nodeGroup
            };
        },

        render(nodes, links, options = {}) {
            if (!state.initialized) {
                initializeCanvas();
            }

            const linkDistance = options.linkDistance;

            const simulation = SimulationModule.createSimulation(
                nodes,
                links,
                state.width,
                state.height,
                linkDistance
            );
            state.simulation = simulation;

            state.linkGroup.selectAll('.link-group-item').remove();
            state.nodeGroup.selectAll('.node-group-item').remove();

            const linkSelection = state.linkGroup.selectAll('g')
                .data(links)
                .enter()
                .append('g')
                .attr('class', 'link-group-item');

            LinkRendererModule.renderLinks(linkSelection);

            const nodeSelection = state.nodeGroup.selectAll('g')
                .data(nodes, d => d.id)
                .enter()
                .append('g')
                .attr('class', 'node-group-item');

            NodeRendererModule.renderNodes(nodeSelection, simulation);
            SimulationModule.attachTickHandler(simulation, nodeSelection, linkSelection);
        },

        setTooltipProvider(provider) {
            if (NodeRendererModule.setTooltipProvider) {
                NodeRendererModule.setTooltipProvider(provider || null);
            }
        },

        setDetailsPanelProvider(provider) {
            if (NodeDetailsModule.setDetailsPanelProvider) {
                NodeDetailsModule.setDetailsPanelProvider(provider || null);
            }
        },

        updateLabels() {
            const nodeSelection = d3.selectAll('.node-group-item');
            const linkSelection = d3.selectAll('.link-group-item');
            NodeRendererModule.updateNodeLabels(nodeSelection);
            LinkRendererModule.updateLinkLabels(linkSelection);
        },

        getSimulation() {
            return state.simulation;
        },

        getDimensions() {
            return { width: state.width, height: state.height };
        }
    };
})();
