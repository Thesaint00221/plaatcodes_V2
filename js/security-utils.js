// ============================================
// security-utils.js
// Veiligheid: HTML escaping + input sanitatie
// ============================================

/**
 * Escape HTML-speciale karakters om XSS te voorkomen
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) return "";
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
        '/': '&#x2F;'
    };
    
    return String(text).replace(/[&<>"'\/]/g, m => map[m]);
}

/**
 * Saniteer zoekinvoer: verwijder gevaarlijke karakters
 * @param {string} term - Search term
 * @returns {string} Sanitized term
 */
function saniteerZoekterm(term) {
    if (!term) return "";
    
    return String(term)
        // Verwijder alles wat geen alfanumeriek, spatie, of veilige interpunctie is
        .replace(/[^a-zA-Z0-9 \-_.ñöäëéè]/g, "")
        // Extra: zeker geen SQL-operators
        .replace(/[,()%;'"]/g, "")
        // Trim en max lengte (DOS-preventie)
        .trim()
        .slice(0, 100);
}

/**
 * Valideer plaatcode tegen patroon
 * @param {string} code - Plate code
 * @returns {boolean} Is valid
 */
function isValidePlaatcode(code) {
    const PLAATCODE_PATROON = /^[A-Za-z0-9 ._/-]{1,50}$/;
    return PLAATCODE_PATROON.test(code);
}
