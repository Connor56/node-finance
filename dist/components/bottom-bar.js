/**
 * @fileoverview Manages the collapsible sidebar functionality.
 */
import { elements } from "../dom-loader.js";
function toggleBottomBar() {
    const isCollapsed = elements.bottomBar.classList.contains("h-8");
    // Toggle classes for the sidebar container
    elements.bottomBar.classList.toggle("h-[35%]", isCollapsed); // Expand
    elements.bottomBar.classList.toggle("min-h-[250px]", isCollapsed); // Expand
    elements.bottomBar.classList.toggle("h-8", !isCollapsed); // Collapse
    elements.bottomBar.classList.toggle("p-4", isCollapsed); // Add padding back
    elements.bottomBar.classList.toggle("p-2", !isCollapsed); // Reduce padding
    // Hide or show the content
    elements.bottomBarContent.classList.toggle("hidden");
    if (!isCollapsed) {
        // --- Currently OPEN, about to COLLAPSE ---
        elements.bottomBarToggleIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />`; // Point down
    }
    else {
        // --- Currently COLLAPSED, about to EXPAND ---
        elements.bottomBarToggleIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />`; // Point up
    }
    // After the animation, the graph will be resized by the graph component's event listener
}
/**
 * Initializes the sidebar component.
 */
export function initBottomBar() {
    elements.bottomBarToggle.addEventListener("click", toggleBottomBar);
}
