const CustomMappings = (function () {
    let customMappings = JSON.parse(localStorage.getItem('customMappings')) || {};

    /**
     * Add or update a custom mapping
     * @param {string} keyword - The string to map
     * @param {string} category - The category to map to
     */
    function addCustomMapping(keyword, category) {
        customMappings[keyword.toLowerCase()] = category;
        localStorage.setItem('customMappings', JSON.stringify(customMappings));
    }

    /**
     * Delete a custom mapping
     * @param {string} keyword - The string to remove
     */
    function deleteCustomMapping(keyword) {
        delete customMappings[keyword.toLowerCase()];
        localStorage.setItem('customMappings', JSON.stringify(customMappings));
    }

    /**
     * Get all custom mappings
     * @returns {Object} - The custom mappings
     */
    function getCustomMappings() {
        return { ...customMappings };
    }

    return {
        addCustomMapping,
        deleteCustomMapping,
        getCustomMappings,
    };
})();
