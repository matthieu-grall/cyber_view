/**
 * Central configuration for the cyber_view application.
 * Author: Matthieu GRALL (DATA VISIONS)
 * License: Creative Commons Attribution 4.0 International (CC BY 4.0)
 */

const AppConfig = {
    // ==================== COLOR PALETTE ====================
    colors: {
        nodeType: {
            risk: '#a6cee3',
            'feared-event': '#ffb6c1',
            'business-asset': '#87ceeb',
            'risk-source': '#4ecdc4',
            'security-criteria': '#9b59b6',
            'severity-level': '#9b59b6',
            'likelihood-level': '#2ecc71',
            'ontology-class': '#7f7f7f',
            undefined: '#d3d3d3'
        },
        nodeSeverity: {
            '1. Minimale': '#a6cee3',
            '2. Limitée': '#1f78b4',
            '3. Importante': '#b2df8a',
            '4. Maximale': '#33a02c'
        },
        linkType: {
            'has-criteria': '#ff6b6b',
            'affects-asset': '#ffa500',
            'from-source': '#4ecdc4',
            'has-severity': '#9b59b6',
            'has-likelihood': '#2ecc71',
            'subClassOf': '#7f7f7f',
            'ontology-relation': '#8b0000',
            'default': '#999'
        }
    },

    // ==================== NODE SIZES ====================
    nodeSizes: {
        baseRadius: {
            risk: 12,
            'security-criteria': 10,
            'business-asset': 10,
            'risk-source': 9,
            'severity-level': 8,
            'likelihood-level': 8,
            'ontology-class': 10,
            'default': 8
        },
        degreeBoost: {
            factor: 0.5,
            max: 4
        }
    },

    // ==================== RELATIONSHIP MAPPING ====================
    /**
     * Relationship type labels in French and English
     * Used for link labels and tooltips
     */
    relationships: {
        'has-criteria': { fr: 'affecte le critère', en: 'affects criterion' },
        'affects-asset': { fr: 'affecte l\'actif', en: 'affects asset' },
        'from-source': { fr: 'provient de la source', en: 'comes from source' },
        'has-severity': { fr: 'a pour gravité', en: 'has severity' },
        'has-likelihood': { fr: 'a pour vraisemblance', en: 'has likelihood' },
        'risk-source': { fr: 'source du risque', en: 'risk source' },
        'security-criteria': { fr: 'critère de sécurité', en: 'security criterion' },
        'business-asset': { fr: 'actif métier', en: 'business asset' },
        'severity': { fr: 'gravité', en: 'severity' },
        'likelihood': { fr: 'vraisemblance', en: 'likelihood' },
        'related-to': { fr: 'lié à', en: 'related to' },
        'feared-event': { fr: 'événement redouté', en: 'feared event' },
        'subClassOf': { fr: 'est sous-classe de', en: 'is subclass of' }
    },
    dataFiles: {
        risks: 'data/risks.json',
        riskSources: 'data/risk-sources.json',
        businessAssets: 'data/business-assets.json',
        securityCriteria: 'data/security-criteria.json',
        severityLevels: 'data/severity-levels.json',
        likelihoodLevels: 'data/likelihood-levels.json',
        useCase: 'data/usecase-2026-06-05.json',
        cyberOntology: 'data/cyber-ontology.json'
    },

    useCases: [
        {
            id: 'usecase-2026-06-05',
            label: 'Use case 2026-06-05',
            file: 'data/usecase-2026-06-05.json'
        }
    ],
    defaultUseCaseId: 'usecase-2026-06-05',

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
        graph: '#graph',
        severityFilter: '#severityFilter',
        typeFilter: '#typeFilter',
        informationPanel: '#info',
        ontologyLegend: '#ontology-nodes',
        languageToggle: '.language-toggle',
        nodeCount: '#nodeCount',
        linkCount: '#linkCount',
        studySelect: '#studySelect',
        loadedStudyName: '#loadedFileName',
        sourceSelect: '#sourceSelect',
        modeSelect: '#modeSelect'
    },

    // ==================== SIMULATION FORCES ====================
    /**
     * Force simulation parameters for D3
     * Adjust for different graph layouts
     */
    simulationForces: {
        charge: {
            strength: -100  // Negative = repulsive force
        },
        link: {
            distance: 180,
            // FIX (D): dedicated, larger link distance for the Ontology
            // view, giving curved parallel/bidirectional links more room
            // to breathe around highly-connected nodes.
            distanceOntology: 260,
            strength: 0.7
        },
        collide: {
            radius: 12  // Additional collision padding
        },
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
};