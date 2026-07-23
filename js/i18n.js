/**
 * Internationalization module.
 * Author: Matthieu GRALL (DATA VISIONS)
 * License: Creative Commons Attribution 4.0 International (CC BY 4.0)
 */

const I18nModule = (() => {
    // ==================== PRIVATE STATE ====================
    const state = {
        currentLanguage: localStorage.getItem('lang') || AppConfig.defaults.language,
        translations: {}
    };

    // ==================== PUBLIC API ====================
    return {
        /**
         * Get current language
         * @returns {string} Current language code (e.g., 'fr', 'en')
         */
        getLanguage() {
            return state.currentLanguage;
        },

        /**
         * Load translations for a specific language
         * @param {string} language - Language code (e.g., 'fr', 'en')
         * @returns {Promise} Promise that resolves when translations are loaded
         */
        async loadTranslations(language) {
            try {
                const filePath = AppConfig.translationFiles[language];
                if (!filePath) {
                    throw new Error(`Translation file not found for language: ${language}`);
                }

                const response = await fetch(filePath);
                if (!response.ok) {
                    throw new Error(`Failed to load translations: ${response.statusText}`);
                }

                state.translations = await response.json();
                state.currentLanguage = language;
                localStorage.setItem('lang', language);
                document.documentElement.lang = language;

                return true;
            } catch (error) {
                console.error('Translation loading error:', error);
                return false;
            }
        },

        /**
         * Get a translation value by dot-notation path
         * @param {string} key - Key path (e.g., 'menu.actions')
         * @returns {string} Translated text or key itself if not found
         */
        getTranslation(key) {
            const keys = key.split('.');
            let value = state.translations;

            for (const k of keys) {
                value = value?.[k];
            }

            return value || key;
        },

        /**
         * Apply translations to all DOM elements with data-i18n attribute
         */
        applyTranslations() {
            // Apply to text content
            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                const text = this.getTranslation(key);
                if (text) element.textContent = text;
            });

            // Apply to placeholder attributes
            document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
                const key = element.getAttribute('data-i18n-placeholder');
                const text = this.getTranslation(key);
                if (text) element.placeholder = text;
            });
        }
    };
})();
