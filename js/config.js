/**
 * Central configuration for the cyber_view application.
 * Author: Matthieu GRALL (DATA VISIONS)
 * License: Creative Commons Attribution 4.0 International (CC BY 4.0)
 */

const AppConfig = {
    // ==================== COLOR PALETTE ====================
    colors: {
        nodeType: {
            'ontology-class': '#7f7f7f',
            undefined: '#d3d3d3'
        },
        linkType: {
            'subClassOf': '#7f7f7f',
            'ontology-relation': '#8b0000',
            'default': '#999'
        }
    },

    dataFiles: {
        useCase: 'data/usecase-2026-08-05.json',
        cyberOntology: 'data/cyber-ontology.json'
    },

    useCases: [
        {
            id: 'usecase-2026-08-05',
            label: 'Use case 2026-08-05',
            file: 'data/usecase-2026-08-05.json'
        }
    ],
    defaultUseCaseId: 'usecase-2026-08-05',

    // ==================== TRANSLATION FILES ====================
    translationFiles: {
        fr: 'locales/fr.json',
        en: 'locales/en.json'
    },

    // ==================== DOM SELECTORS ====================
    /**
     * Centralized DOM selectors used throughout the application
     * Update these if HTML structure changes
     */
    selectors: {
        svgContainer: '#content_graph_container',
        informationPanel: '#info',
        languageToggle: '.language-toggle',
        loadedStudyName: '#loadedFileName',
    },

    // ==================== SIMULATION FORCES ====================
    /**
     * Force simulation parameters for D3
     * Adjust for different graph layouts
     */
    simulationForces: {
        center: {
            strength: 0.1  // Gentle centering force
        }
    },

    // ==================== DEFAULTS ====================
    defaults: {
        language: 'fr'
    }
};

/**
 * Rendering and simulation constants.
 * All numerical values used by graph renderers and the D3 simulation are
 * grouped here. No raw literals should appear in rendering or simulation
 * code — reference GRAPH_CONFIG instead.
 *
 * Author: Matthieu GRALL (DATA VISIONS)
 * License: Creative Commons Attribution 4.0 International (CC BY 4.0)
 */
const GRAPH_CONFIG = {

    // ── Force simulation ──────────────────────────────────────────────────────

    /** Repulsive charge strength between nodes (negative = repulsion).
     *  Further scaled by √(nodeCount) inside the simulation module. */
    NODE_REPULSION: -280,

    /** Link distance for the Individuals view. */
    DEFAULT_LINK_DISTANCE: 280,

    /** Larger link distance for the Ontology view (denser, more parallel links). */
    ONTOLOGY_LINK_DISTANCE: 400,

    /** Extra padding (px) added around the node bounding-box half-diagonal
     *  for the collision-detection force so rectangles never visually overlap. */
    COLLISION_MARGIN: 24,

    /** Alpha decay — controls how fast the simulation cools.
     *  Lower value → longer, smoother settling animation. */
    ALPHA_DECAY: 0.022,

    /** Velocity decay per tick — higher value → stronger damping. */
    VELOCITY_DECAY: 0.42,

    // ── Edges and curves ─────────────────────────────────────────────────────

    /** Perpendicular offset (px) applied to bidirectional links without
     *  an explicit curveOffset from the data layer. */
    BASE_CURVE_OFFSET: 45,

    /** Perpendicular offset step (px) between each parallel link in a group. */
    PARALLEL_OFFSET_STEP: 44,

    /** Self-loop radius expressed as a multiplier of the node half-diagonal,
     *  so the loop always clears the rectangle and remains fully visible. */
    SELF_LOOP_RADIUS_FACTOR: 1.9,

    // ── Selection and highlighting ────────────────────────────────────────────

    /** Opacity of elements excluded from the active selection or hover focus. */
    DIM_OPACITY: 0.08,

    /** Stroke colour applied to a selected relation edge and its arrowhead. */
    SELECTED_LINK_COLOR: '#c62828',

    /** Stroke width applied to a selected relation. */
    SELECTED_LINK_STROKE_WIDTH: 2.5,

    // ── Relation label backgrounds ────────────────────────────────────────────

    /** Horizontal padding (px) inside a relation label background rectangle. */
    LABEL_PADDING_X: 5,

    /** Vertical padding (px) inside a relation label background rectangle. */
    LABEL_PADDING_Y: 2,

    /** Corner radius (px) of relation label background rectangles. */
    LABEL_CORNER_RADIUS: 3,

    /** Fill-opacity of relation label background rectangles. */
    LABEL_BG_OPACITY: 0.92,

    /** Fallback node box size (px) before label measurement is available. */
    NODE_FALLBACK_RECT_SIZE: 16,
};