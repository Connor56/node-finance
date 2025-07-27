/**
 * Fetches an HTML component and inserts it into a target element.
 * @param {string} componentPath - The path to the HTML component file (e.g., 'components/header.html').
 * @param {string} targetSelector - The CSS selector of the DOM element where the component should be inserted.
 */
async function loadComponent(componentPath, targetSelector) {
    try {
        const response = await fetch(componentPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        const targetElement = document.querySelector(targetSelector);
        if (targetElement) {
            // Replace the placeholder with the fetched HTML
            targetElement.outerHTML = html;
        }
        else {
            console.error(`Target element with selector "${targetSelector}" not found.`);
        }
    }
    catch (error) {
        console.error(`Error loading component from ${componentPath}:`, error);
    }
}
/**
 * Loads multiple HTML components into the DOM concurrently.
 * @param {Array<[string, string]>} components - An array of tuples, where each tuple contains
 *                                                the component path and the target selector.
 */
export async function loadComponents(components) {
    const promises = components.map(([path, selector]) => loadComponent(path, selector));
    await Promise.all(promises);
}
