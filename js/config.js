/**
 * Configuration centrale pour l'application cyber_view
 * Contient les constantes, les couleurs et les paramètres de base
 */

const AppConfig = {
    // ==================== COLOR PALETTE ====================
    colors: {
        nodeType: {
            risk: '#a6cee3',
            fearedEvent: '#ffb6c1',
            businessAsset: '#87ceeb',
            riskSource: '#4ecdc4',
            securityProperty: '#9b59b6',
            severityLevel: '#9b59b6',
            likelihoodLevel: '#2ecc71',
            'ontology-class': '#7f7f7f'
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