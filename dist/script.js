/**
 * @fileoverview Main application entry point.
 */
import { state, loadData, toggleSpeculativeColour, toggleSpeculativeNodes } from "./state.js";
import { loadComponents } from "./component-loader.js";
import { elements, initElements } from "./dom-loader.js";
import { initSidebar } from "./components/sidebar.js";
import { initBottomBar } from "./components/bottom-bar.js";
import { initSummary } from "./components/summary.js";
import { initTables } from "./components/tables.js";
import { initFilters } from "./components/filters.js";
import { initItemModal } from "./components/item-modal.js";
import { initGroupModal } from "./components/group-modal.js";
import { initGraph } from "./graph/index.js";
import { initDeleteModal } from "./components/delete-modal.js";
import { initSaveModal } from "./components/save-modal.js";
import { initLoadModal } from "./components/load-modal.js";
import { initDB } from "./persistence.js";
const sampleData = {
    incomes: [{ id: "inc1", source: "Salary", amount: 2500, tags: ["job", "regular"], groupId: null }],
    outgoings: [
        {
            id: "out1",
            destination: "Rent",
            amount: 1000,
            tags: ["housing", "fixed"],
            groupId: null,
        },
        {
            id: "out2",
            destination: "Groceries",
            amount: 400,
            tags: ["food", "variable"],
            groupId: null,
        },
    ],
    capital: [
        {
            id: "cap1",
            location: "Bitcoin",
            quantity: 0.5,
            rate: 45000,
            isAsset: true,
            tags: ["crypto", "investment"],
            groupId: null,
        },
        {
            id: "cap2",
            location: "Savings Account",
            amount: 10000,
            isAsset: false,
            tags: ["cash", "emergency fund"],
            groupId: null,
        },
    ],
    groups: [
        {
            id: "group_1",
            name: "a group",
            type: "incomes",
        },
    ],
    speculative: {
        incomes: [
            {
                id: "speculative_inc1",
                source: "Freelance Project",
                amount: 3000,
                tags: ["freelance", "one-time"],
                groupId: null,
                description: "Potential web development project for Q2",
                likelihood: 75,
            },
        ],
        outgoings: [
            {
                id: "speculative_out1",
                destination: "Car Repair",
                amount: 800,
                tags: ["maintenance", "unexpected"],
                groupId: null,
                description: "Potential engine repair based on recent inspection warning",
                likelihood: 40,
            },
        ],
    },
};
/**
 * Shows an error message in the UI.
 * @param {string} message The error message to display.
 */
function showError(message) {
    elements.errorEl.textContent = message;
    elements.errorEl.classList.remove("hidden");
}
/**
 * Clears the error message from the UI.
 */
function clearError() {
    elements.errorEl.textContent = "";
    elements.errorEl.classList.add("hidden");
}
/**
 * Initializes the application logic after the DOM is populated.
 */
function init() {
    // Initialize all components
    initSidebar();
    initFilters();
    initItemModal();
    initGroupModal();
    initTables();
    initSummary();
    initGraph();
    initDeleteModal();
    initSaveModal();
    initLoadModal();
    initBottomBar();
    // Initialize the indexedDB database
    initDB();
    // Event listeners for top-level controls
    elements.generateBtn.addEventListener("click", () => {
        try {
            clearError();
            const data = JSON.parse(elements.jsonInput.value);
            // Basic validation
            if (!data.incomes || !data.outgoings || !data.capital) {
                throw new Error("Invalid JSON structure.");
            }
            loadData(data);
        }
        catch (e) {
            showError(`Error parsing JSON: ${e.message}`);
        }
    });
    elements.exportJsonBtn.addEventListener("click", () => {
        const dataStr = JSON.stringify(state.cashFlowData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "cash-flow-data.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    // Initial load
    elements.jsonInput.value = JSON.stringify(sampleData, null, 2);
    loadData(sampleData);
    elements.speculativeColourButton.addEventListener("click", () => {
        toggleSpeculativeColour();
    });
    elements.speculativeOnOffButton.addEventListener("click", () => {
        toggleSpeculativeNodes();
    });
}
/**
 * Main entry point. Loads components and then initializes the application.
 */
async function main() {
    await loadComponents([
        ["./components/sidebar.html", "#sidebar-placeholder"],
        ["./components/bottom-bar.html", "#bottom-bar-placeholder"],
        ["./components/item-modal.html", "#item-modal-placeholder"],
        ["./components/group-modal.html", "#group-modal-placeholder"],
        ["./components/delete-modal.html", "#delete-modal-placeholder"],
        ["./components/save-modal.html", "#save-modal-placeholder"],
        ["./components/load-modal.html", "#load-modal-placeholder"],
    ]);
    initElements();
    // Now that the DOM is loaded with components, initialize the app logic
    init();
}
// Start the application
document.addEventListener("DOMContentLoaded", main);
