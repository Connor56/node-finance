/**
 * @fileoverview Manages the collapsible sidebar functionality.
 */
import { elements } from "../dom-loader.js";
function toggleSidebar() {
    const isCollapsed = elements.sidebar.classList.contains("w-8");
    // Toggle classes for the sidebar container
    elements.sidebar.classList.toggle("w-96", isCollapsed); // Expand
    elements.sidebar.classList.toggle("w-8", !isCollapsed); // Collapse
    elements.sidebar.classList.toggle("p-4", isCollapsed); // Add padding back
    elements.sidebar.classList.toggle("p-2", !isCollapsed); // Reduce padding
    // Hide or show the content
    elements.sidebarContent.classList.toggle("hidden");
    if (!isCollapsed) {
        // --- Currently OPEN, about to COLLAPSE ---
        elements.sidebarToggleIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />`; // Point left
        elements.sidebarToggle.classList.remove("-right-4");
        elements.sidebarToggle.classList.add("right-1/2", "translate-x-1/2");
    }
    else {
        // --- Currently COLLAPSED, about to EXPAND ---
        elements.sidebarToggleIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />`; // Point right
        elements.sidebarToggle.classList.remove("right-1/2", "translate-x-1/2");
        elements.sidebarToggle.classList.add("-right-4");
    }
    // After the animation, the graph will be resized by the graph component's event listener
}
/**
 * Initializes the sidebar component.
 */
export function initSidebar() {
    elements.sidebarToggle.addEventListener("click", toggleSidebar);
}
