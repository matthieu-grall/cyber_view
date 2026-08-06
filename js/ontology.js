/**
 * Ontology management module.
 * Author: Matthieu GRALL (DATA VISIONS)
 * License: Creative Commons Attribution 4.0 International (CC BY 4.0)
 */

const OntologyModule = (() => {
    // ==================== PRIVATE STATE ====================
    let ontologyData = null;
    const classByUri = new Map();
    const classByLabel = new Map();
    const relationByUri = new Map();
    const relationByNormalizedLabel = new Map();
    const usecaseByUri = new Map();
    const usecaseUriByNormalizedLabel = new Map();

    const collectionNameToClassUriFallback = {
        risks: '#class-risk',
        riskSources: '#class-actor',
        businessAssets: '#class-business-asset',
        securityCriteria: '#class-dimension',
        severityLevels: '#class-severity-level',
        likelihoodLevels: '#class-likelihood-level',
        actions: '#class-action',
        objectives: '#class-objective',
        consequences: '#class-consequence',
        actors: '#class-actor',
        'feared-events': '#class-effect',
        effects: '#class-effect'
    };

    function normalizeKey(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[#\/]$/, '')
            .replace(/[\s_\-]+/g, '');
    }

    function buildOntologyRegistry(data) {
        classByUri.clear();
        classByLabel.clear();
        relationByUri.clear();
        relationByNormalizedLabel.clear();
        usecaseByUri.clear();
        usecaseUriByNormalizedLabel.clear();

        (data.usecases || []).forEach(usecase => {
            const uri = usecase?.uri || usecase?.id || usecase?.['@id'];
            if (!uri) return;
            usecaseByUri.set(uri, usecase);

            const normalizedLabelFr = normalizeKey(usecase.label?.fr);
            const normalizedLabelEn = normalizeKey(usecase.label?.en);
            if (normalizedLabelFr) usecaseUriByNormalizedLabel.set(normalizedLabelFr, uri);
            if (normalizedLabelEn) usecaseUriByNormalizedLabel.set(normalizedLabelEn, uri);

            const normalizedUriKey = normalizeKey(uri.replace(/^#usecase-/, ''));
            if (normalizedUriKey) usecaseUriByNormalizedLabel.set(normalizedUriKey, uri);
        });

        (data.classes || []).forEach(ontologyClass => {
            const uri = ontologyClass.uri || ontologyClass.id || ontologyClass['@id'];
            if (!uri) return;
            classByUri.set(uri, ontologyClass);

            const normalizedLabelFr = normalizeKey(ontologyClass.label?.fr);
            const normalizedLabelEn = normalizeKey(ontologyClass.label?.en);
            if (normalizedLabelFr) classByLabel.set(normalizedLabelFr, uri);
            if (normalizedLabelEn) classByLabel.set(normalizedLabelEn, uri);

            const normalizedUriKey = normalizeKey(uri.replace(/^#class-/, ''));
            if (normalizedUriKey) classByLabel.set(normalizedUriKey, uri);

            (ontologyClass.relations || []).forEach(rel => {
                const relUri = rel.uri || rel.id || rel['@id'];
                if (!relUri) return;
                relationByUri.set(relUri, rel);

                const normalizedRelLabelFr = normalizeKey(rel.label?.fr);
                const normalizedRelLabelEn = normalizeKey(rel.label?.en);
                if (normalizedRelLabelFr) relationByNormalizedLabel.set(normalizedRelLabelFr, rel);
                if (normalizedRelLabelEn) relationByNormalizedLabel.set(normalizedRelLabelEn, rel);

                const normalizedRelUriKey = normalizeKey(relUri.replace(/^#relation-/, ''));
                if (normalizedRelUriKey) relationByNormalizedLabel.set(normalizedRelUriKey, rel);
            });
        });
    }

    function getClassUriFromCollectionName(collectionName) {
        if (!collectionName) return null;
        if (collectionNameToClassUriFallback[collectionName]) {
            return collectionNameToClassUriFallback[collectionName];
        }

        const normalized = normalizeKey(collectionName.replace(/s$/, ''));
        if (classByLabel.has(normalized)) {
            return classByLabel.get(normalized);
        }
        return null;
    }

    function getClassDefinitionByUri(uri) {
        return classByUri.get(uri) || null;
    }

    function getClassLabelByUri(uri, language = 'fr') {
        const ontologyClass = getClassDefinitionByUri(uri);
        if (!ontologyClass) return uri;
        return ontologyClass.label?.[language]
            || ontologyClass.label?.fr
            || ontologyClass.label?.en
            || uri;
    }

    function normalizeUsecaseUri(usecaseRef) {
        if (!usecaseRef || typeof usecaseRef !== 'string') return null;
        if (usecaseByUri.has(usecaseRef)) return usecaseRef;
        if (/^#usecase-/.test(usecaseRef)) return usecaseRef;

        const normalized = normalizeKey(usecaseRef);
        if (usecaseUriByNormalizedLabel.has(normalized)) {
            return usecaseUriByNormalizedLabel.get(normalized);
        }

        const fallback = `#usecase-${String(usecaseRef).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
        return fallback || null;
    }

    function getUsecaseLabelByUri(uri, language = 'fr') {
        if (!uri) return '';
        const usecase = usecaseByUri.get(uri);
        if (usecase?.label) {
            return usecase.label[language] || usecase.label.fr || usecase.label.en || uri;
        }
        return uri;
    }

    function getClassUsecaseUris(classUri) {
        const ontologyClass = getClassDefinitionByUri(classUri);
        if (!ontologyClass) return [];

        const refs = Array.isArray(ontologyClass.usecases) ? ontologyClass.usecases : [];
        return refs
            .map(normalizeUsecaseUri)
            .filter(Boolean);
    }

    function getRelationDefinition(relationType) {
        if (!relationType) return null;
        const normalized = normalizeKey(relationType);
        return relationByUri.get(relationType) || relationByNormalizedLabel.get(normalized) || null;
    }

    function getRelationLabel(relationType, language = 'fr') {
        if (!relationType) return '';
        if (normalizeKey(relationType) === 'subclassof') {
            return I18nModule.getTranslation('informationLabels.inheritedClassRelation')
                || (language === 'fr' ? 'Classe hérité' : 'Inherited class');
        }
        const relation = getRelationDefinition(relationType);
        if (relation && relation.label) {
            return relation.label[language] || relation.label.fr || relation.label.en || String(relationType);
        }
        return String(relationType);
    }

    // ==================== PRIVATE METHODS ====================
    /**
     * Map node type identifiers to ontology class IDs
     * @param {string} nodeType - Type of node from graph data
     * @returns {string|null} Ontology class ID or null if not mapped
     */
    function mapNodeTypeToOntologyClass(nodeType) {
        if (!nodeType) return null;

        if (typeof nodeType === 'string' && nodeType.startsWith('#class-')) {
            return nodeType;
        }

        const normalizedType = normalizeKey(nodeType);
        if (classByLabel.has(normalizedType)) {
            return classByLabel.get(normalizedType);
        }

        const typeMap = {
            'risk': '#class-risk',
            'feared-event': '#class-cyber-event',
            'cyber-event': '#class-cyber-event',
            'security-criteria': '#class-dimension',
            'dimension': '#class-dimension',
            'business-asset': '#class-information-object',
            'information-object': '#class-information-object',
            'risk-source': '#class-actor',
            'actor': '#class-actor',
            'severity-level': '#class-consequence-level',
            'consequence-level': '#class-consequence-level',
            'likelihood-level': '#class-likelihood-level',
            'action': '#class-action',
            'goal': '#class-goal',
            'consequence': '#class-consequence'
        };
        return typeMap[nodeType] || null;
    }

    // ==================== PUBLIC API ====================
    return {
        /**
         * Load ontology data from file
         * @returns {Promise<Object>} Promise resolving to ontology data
         */
        async load() {
            try {
                const response = await fetch(AppConfig.dataFiles.cyberOntology);
                if (!response.ok) {
                    throw new Error(`Failed to load ontology: ${response.statusText}`);
                }
                ontologyData = await response.json();
                buildOntologyRegistry(ontologyData);
                return ontologyData;
            } catch (error) {
                console.error('Ontology loading error:', error);
                return null;
            }
        },

        /**
         * Get ontology data
         * @returns {Object|null} Ontology data or null if not loaded
         */
        getData() {
            return ontologyData;
        },

        /**
         * Get localized label for a node type
         * @param {string} nodeType - Type identifier of the node
         * @param {string} language - Language code (e.g., 'fr', 'en')
         * @returns {string} Localized label or original type if not found
         */
        getNodeTypeLabel(nodeType, language) {
            if (!ontologyData) return nodeType;

            if (nodeType === 'ontology-class') {
                return I18nModule.getTranslation('informationLabels.ontologyClass') || 'Ontology class';
            }

            const ontologyClass = mapNodeTypeToOntologyClass(nodeType);
            if (!ontologyClass) return nodeType;

            const ontClass = getClassDefinitionByUri(ontologyClass)
                || ontologyData.classes.find(c => c.id === ontologyClass);
            return ontClass ? (ontClass.label?.[language] || ontClass.label?.fr || ontClass.label?.en || nodeType) : nodeType;
        },

        /**
         * Get definition for a node type
         * @param {string} nodeType - Type identifier of the node
         * @param {string} language - Language code (e.g., 'fr', 'en')
         * @returns {string} Definition text
         */
        getNodeTypeDefinition(nodeType, language) {
            if (!ontologyData) return '';

            if (nodeType === 'ontology-class') {
                return I18nModule.getTranslation('informationLabels.ontologyClass') || 'Ontology class';
            }

            const ontologyClass = mapNodeTypeToOntologyClass(nodeType);
            if (!ontologyClass) return '';

            const ontClass = getClassDefinitionByUri(ontologyClass)
                || ontologyData.classes.find(c => c.id === ontologyClass);
            return ontClass ? (ontClass.isDefinedBy?.[language] || ontClass.isDefinedBy?.fr || ontClass.isDefinedBy?.en || '') : '';
        },

        /**
         * Get ontology class URI from a raw use case collection name
         * @param {string} collectionName
         * @returns {string|null}
         */
        getClassUriFromCollectionName(collectionName) {
            return getClassUriFromCollectionName(collectionName);
        },

        /**
         * Get ontology class definition by URI
         * @param {string} uri
         * @returns {Object|null}
         */
        getClassDefinitionByUri(uri) {
            return getClassDefinitionByUri(uri);
        },

        /**
         * Get localized ontology class label by class URI.
         * @param {string} uri
         * @param {string} language
         * @returns {string}
         */
        getClassLabelByUri(uri, language = 'fr') {
            return getClassLabelByUri(uri, language);
        },

        /**
         * Normalize a use case reference to its URI form.
         * @param {string} usecaseRef
         * @returns {string|null}
         */
        normalizeUsecaseUri(usecaseRef) {
            return normalizeUsecaseUri(usecaseRef);
        },

        /**
         * Get all declared use case definitions from ontology root.
         * @returns {Array}
         */
        getUsecases() {
            return Array.from(usecaseByUri.values());
        },

        /**
         * Get localized use case label by URI.
         * @param {string} uri
         * @param {string} language
         * @returns {string}
         */
        getUsecaseLabelByUri(uri, language = 'fr') {
            return getUsecaseLabelByUri(uri, language);
        },

        /**
         * Get normalized use case URIs assigned to a class URI.
         * @param {string} classUri
         * @returns {Array<string>}
         */
        getClassUsecaseUris(classUri) {
            return getClassUsecaseUris(classUri);
        },

        /**
         * Get localized relation label for a relation type or property path
         * @param {string} relationType
         * @param {string} language
         * @returns {string}
         */
        getRelationLabel(relationType, language = 'fr') {
            return getRelationLabel(relationType, language);
        },

        /**
         * Generate ontology legend in the UI
         */
        generateLegend() {
            if (!ontologyData) return;

            const classesContainer = document.querySelector('#legend-classes');
            const relationsContainer = document.querySelector('#legend-relations');
            if (!classesContainer || !relationsContainer) return;

            const classDot = document.createElement('div');
            classDot.className = 'key-item';
            classDot.innerHTML = `
                <span>${I18nModule.getTranslation('informationLabels.classes')}</span>
                <span class="key-color-square" style="
                    width: 16px;
                    height: 12px;
                    background: #ffffff;
                    border: 2px solid ${AppConfig.colors.nodeType['ontology-class'] || '#4b91d6'};
                    display: inline-block;
                    vertical-align: middle;
                    margin-left: 8px;
                "></span>
            `;

            const relationLine = document.createElement('div');
            relationLine.className = 'key-item';
            relationLine.innerHTML = `
                <span>${I18nModule.getTranslation('informationLabels.relations')}</span>
                <span class="key-line" style="
                    width: 24px;
                    height: 2px;
                    background: ${AppConfig.colors.linkType['ontology-relation'] || '#8b0000'};
                    display: inline-block;
                    vertical-align: middle;
                    margin-left: 8px;
                "></span>
            `;

            classesContainer.innerHTML = '';
            relationsContainer.innerHTML = '';
            classesContainer.appendChild(classDot);

            const typesLine = document.createElement('div');
            typesLine.className = 'key-item';
            typesLine.innerHTML = `
                <span>${I18nModule.getTranslation('informationLabels.types')}</span>
                <span class="key-line" style="
                    width: 24px;
                    height: 2px;
                    background: ${AppConfig.colors.linkType.subClassOf || '#7f7f7f'};
                    display: inline-block;
                    vertical-align: middle;
                    margin-left: 8px;
                "></span>
            `;
            classesContainer.appendChild(typesLine);
            relationsContainer.appendChild(relationLine);
        }
    };
})();