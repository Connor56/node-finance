/**
 * @fileoverview Shared utility functions.
 */
/**
 * Formats a number as a currency string.
 * @param {number} value The number to format.
 * @returns {string} The formatted currency string.
 */
export const formatCurrency = (value) => `£${(value || 0).toFixed(2)}`;
/**
 * Generates a unique ID string.
 * @returns {string} A unique ID.
 */
export const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
