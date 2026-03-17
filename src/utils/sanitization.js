/**
 * Sanitizes user input to prevent XSS attacks.
 * Strips HTML tags and escapes sensitive characters.
 */
export const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Replace HTML tags with empty string
    const stripped = str.replace(/<[^>]*>?/gm, '');
    
    // Escape risky characters
    return stripped
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

/**
 * Recursively sanitizes an object's string properties.
 */
export const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
        if (typeof obj[key] === 'string') {
            sanitized[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object') {
            sanitized[key] = sanitizeObject(obj[key]);
        } else {
            sanitized[key] = obj[key];
        }
    }
    
    return sanitized;
};
