/**
 * @fileoverview Manages the save state modal.
 */
import { elements } from "../dom-loader.js";
import { state } from "../state.js";
import { emit } from "../events.js";
import { saveState, initDB } from "../persistence.js";
let isInitialized = false;
function showModal() {
    elements.saveModalOverlay.classList.remove("hidden");
    elements.saveStateNameInput.focus();
}
function hideModal() {
    elements.saveModalOverlay.classList.add("hidden");
    elements.saveStateForm.reset();
    clearMessages();
    clearValidationErrors();
}
function clearMessages() {
    elements.saveModalMessages.classList.add("hidden");
    elements.saveSuccessMessage.classList.add("hidden");
    elements.saveErrorMessage.classList.add("hidden");
}
function clearValidationErrors() {
    const errorElements = elements.saveModalOverlay.querySelectorAll(".error-message");
    errorElements.forEach((el) => (el.textContent = ""));
    const invalidInputs = elements.saveModalOverlay.querySelectorAll("input.invalid");
    invalidInputs.forEach((el) => el.classList.remove("invalid"));
}
function showSuccessMessage(message) {
    clearMessages();
    elements.saveSuccessMessage.textContent = message;
    elements.saveSuccessMessage.classList.remove("hidden");
    elements.saveModalMessages.classList.remove("hidden");
}
function showErrorMessage(message) {
    clearMessages();
    elements.saveErrorMessage.textContent = message;
    elements.saveErrorMessage.classList.remove("hidden");
    elements.saveModalMessages.classList.remove("hidden");
}
function validateStateName(name) {
    const trimmedName = name.trim();
    if (!trimmedName) {
        const errorElement = elements.saveStateNameInput.nextElementSibling;
        errorElement.textContent = "State name is required.";
        elements.saveStateNameInput.classList.add("invalid");
        return false;
    }
    if (trimmedName.length > 100) {
        const errorElement = elements.saveStateNameInput.nextElementSibling;
        errorElement.textContent = "State name must be 100 characters or less.";
        elements.saveStateNameInput.classList.add("invalid");
        return false;
    }
    return true;
}
async function handleSaveState(e) {
    e.preventDefault();
    clearValidationErrors();
    clearMessages();
    const stateName = elements.saveStateNameInput.value;
    if (!validateStateName(stateName)) {
        return;
    }
    try {
        // Prepare the state to save
        const stateToSave = {
            cashFlowData: state.cashFlowData,
            activeFilters: state.activeFilters,
            name: stateName.trim(),
            timestamp: new Date(),
        };
        // Save the state using persistence.ts
        const savedId = await saveState(stateToSave);
        emit("state:saved", { id: savedId, name: stateName.trim() });
        showSuccessMessage(`State "${stateName.trim()}" saved successfully!`);
        // Auto-hide modal after success
        setTimeout(() => {
            hideModal();
        }, 1500);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to save state";
        showErrorMessage(`Failed to save state: ${errorMessage}`);
    }
}
function setupEventListeners() {
    if (isInitialized)
        return;
    // Save state button
    elements.saveStateBtn.addEventListener("click", showModal);
    // Form submission
    elements.saveStateForm.addEventListener("submit", handleSaveState);
    // Close button (X)
    elements.saveModalCloseBtn.addEventListener("click", hideModal);
    // Cancel button
    elements.saveModalCancelBtn.addEventListener("click", hideModal);
    // Click outside modal to close
    elements.saveModalOverlay.addEventListener("click", (e) => {
        if (e.target === elements.saveModalOverlay) {
            hideModal();
        }
    });
    // Clear validation errors when user starts typing
    elements.saveStateNameInput.addEventListener("input", () => {
        clearValidationErrors();
        clearMessages();
    });
    // ESC key to close
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !elements.saveModalOverlay.classList.contains("hidden")) {
            hideModal();
        }
    });
    isInitialized = true;
}
export function initSaveModal() {
    // Initialize the database
    initDB().catch(console.error);
    // Set up event listeners
    setupEventListeners();
}
export function showSaveModal() {
    showModal();
}
export { hideModal as hideSaveModal };
