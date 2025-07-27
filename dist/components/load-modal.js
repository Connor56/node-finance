/**
 * @fileoverview Manages the load state modal.
 */
import { elements } from "../dom-loader.js";
import { loadData } from "../state.js";
import { emit, on } from "../events.js";
import { getSavedStateMetadata, loadState, deleteSavedState, initDB } from "../persistence.js";
let isInitialized = false;
function showModal() {
    elements.loadModalOverlay.classList.remove("hidden");
    loadSavedStates();
}
function hideModal() {
    elements.loadModalOverlay.classList.add("hidden");
    clearMessages();
}
function clearMessages() {
    elements.loadModalMessages.classList.add("hidden");
    elements.loadSuccessMessage.classList.add("hidden");
    elements.loadErrorMessage.classList.add("hidden");
}
function showSuccessMessage(message) {
    clearMessages();
    elements.loadSuccessMessage.textContent = message;
    elements.loadSuccessMessage.classList.remove("hidden");
    elements.loadModalMessages.classList.remove("hidden");
}
function showErrorMessage(message) {
    clearMessages();
    elements.loadErrorMessage.textContent = message;
    elements.loadErrorMessage.classList.remove("hidden");
    elements.loadModalMessages.classList.remove("hidden");
}
function showLoadingState() {
    elements.savedStatesList.innerHTML = "";
    elements.noSavedStates.classList.add("hidden");
    elements.loadingSavedStates.classList.remove("hidden");
}
function hideLoadingState() {
    elements.loadingSavedStates.classList.add("hidden");
}
function formatTimestamp(timestamp) {
    // Convert to Date if it's a string (from JSON)
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleString();
}
function createSavedStateItem(savedState) {
    const template = elements.savedStateItemTemplate;
    const clone = template.content.cloneNode(true);
    const container = clone.querySelector(".saved-state-item");
    const nameElement = clone.querySelector(".saved-state-name");
    const timestampElement = clone.querySelector(".saved-state-timestamp");
    const loadButton = clone.querySelector(".load-state-btn");
    const deleteButton = clone.querySelector(".delete-saved-state-btn");
    nameElement.textContent = savedState.name;
    timestampElement.innerHTML = `<strong>Index: ${(savedState.id + 1).toString()}</strong></br> Saved: ${formatTimestamp(savedState.timestamp)}`;
    loadButton.dataset.stateId = savedState.id.toString();
    deleteButton.dataset.stateId = savedState.id.toString();
    loadButton.addEventListener("click", () => handleLoadState(savedState.id));
    deleteButton.addEventListener("click", () => handleDeleteState(savedState.id, savedState.name));
    return container;
}
async function loadSavedStates() {
    try {
        showLoadingState();
        clearMessages();
        const savedStates = await getSavedStateMetadata();
        hideLoadingState();
        if (savedStates.length === 0) {
            elements.savedStatesList.innerHTML = "";
            elements.noSavedStates.classList.remove("hidden");
            return;
        }
        elements.noSavedStates.classList.add("hidden");
        // Sort by timestamp (newest first)
        savedStates.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        // Clear existing list
        elements.savedStatesList.innerHTML = "";
        // Add each saved state to the list
        savedStates.forEach((savedState) => {
            const stateElement = createSavedStateItem(savedState);
            elements.savedStatesList.appendChild(stateElement);
        });
    }
    catch (error) {
        hideLoadingState();
        const errorMessage = error instanceof Error ? error.message : "Failed to load saved states";
        showErrorMessage(`Failed to load saved states: ${errorMessage}`);
    }
}
async function handleLoadState(stateId) {
    try {
        clearMessages();
        const savedState = await loadState(stateId);
        if (!savedState) {
            showErrorMessage("Saved state not found");
            return;
        }
        console.log("savedState", savedState);
        // Load the data into the application state
        loadData(savedState.cashFlowData);
        // Update active filters if they exist
        if (savedState.activeFilters && savedState.activeFilters.length > 0) {
            // This will be handled by the state management system
            // The state.ts setActiveFilters function will emit the filter:changed event
            const { setActiveFilters } = await import("../state.js");
            setActiveFilters(savedState.activeFilters);
        }
        emit("state:load-complete", savedState.cashFlowData);
        showSuccessMessage(`State "${savedState.name}" loaded successfully!`);
        // Auto-hide modal after success
        setTimeout(() => {
            hideModal();
        }, 1500);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load state";
        showErrorMessage(`Failed to load state: ${errorMessage}`);
    }
}
async function handleDeleteState(stateId, stateName) {
    if (!confirm(`Are you sure you want to delete the saved state "${stateName}"? This action cannot be undone.`)) {
        return;
    }
    try {
        clearMessages();
        await deleteSavedState(stateId);
        showSuccessMessage(`State "${stateName}" deleted successfully!`);
        // Refresh the list
        await loadSavedStates();
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete state";
        showErrorMessage(`Failed to delete state: ${errorMessage}`);
    }
}
function setupEventListeners() {
    if (isInitialized)
        return;
    // Load state button
    elements.loadStateBtn.addEventListener("click", showModal);
    // Close button (X)
    elements.loadModalCloseBtn.addEventListener("click", hideModal);
    // Close button (bottom)
    elements.loadModalCloseBtnBottom.addEventListener("click", hideModal);
    // Refresh button
    elements.refreshSavedStatesBtn.addEventListener("click", loadSavedStates);
    // Click outside modal to close
    elements.loadModalOverlay.addEventListener("click", (e) => {
        if (e.target === elements.loadModalOverlay) {
            hideModal();
        }
    });
    // ESC key to close
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !elements.loadModalOverlay.classList.contains("hidden")) {
            hideModal();
        }
    });
    // Listen for successful saves to refresh the list if modal is open
    on("state:saved", () => {
        if (!elements.loadModalOverlay.classList.contains("hidden")) {
            loadSavedStates();
        }
    });
    isInitialized = true;
}
export function initLoadModal() {
    // Initialize the database
    initDB().catch(console.error);
    // Set up event listeners
    setupEventListeners();
}
export function showLoadModal() {
    showModal();
}
export { hideModal as hideLoadModal };
