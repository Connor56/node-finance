/**
 * @fileoverview Manages the delete confirmation modal.
 */
import { elements } from "../dom-loader.js";
let actions = {};
function hideModal() {
    elements.deleteModalOverlay.classList.add("hidden");
    elements.deleteModalButtons.innerHTML = ""; // Clear old buttons
}
function createButton(text, classes, clickHandler) {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = `p-2 rounded-md ${classes}`;
    button.addEventListener("click", () => {
        clickHandler();
        hideModal();
    });
    return button;
}
export function showDeleteConfirmation({ isGroup, onConfirm, onUngroup, onConfirmAll, }) {
    const buttonContainer = elements.deleteModalButtons;
    buttonContainer.innerHTML = ""; // Clear previous buttons
    if (isGroup) {
        elements.deleteModalTitle.textContent = "Delete Group";
        elements.deleteModalText.textContent =
            "Do you want to delete the entire group and all its items, or only ungroup the items?";
        const deleteAllBtn = createButton("Delete Group & Items", "bg-red-700 hover:bg-red-800 text-white flex-1", onConfirmAll);
        const ungroupBtn = createButton("Delete Group Only", "bg-yellow-600 hover:bg-yellow-700 text-white flex-1", onUngroup);
        buttonContainer.append(deleteAllBtn, ungroupBtn);
    }
    else {
        elements.deleteModalTitle.textContent = "Delete Item";
        elements.deleteModalText.textContent = "Are you sure you want to delete this item?";
        const deleteBtn = createButton("Delete", "bg-red-600 hover:bg-red-700 text-white flex-1", onConfirm);
        buttonContainer.append(deleteBtn);
    }
    const cancelBtn = createButton("Cancel", "bg-gray-600 hover:bg-gray-700 text-white flex-1", () => { } // No action on cancel
    );
    buttonContainer.append(cancelBtn);
    elements.deleteModalOverlay.classList.remove("hidden");
}
export function initDeleteModal() {
    // Allows closing the modal by clicking the overlay, but not its content
    elements.deleteModalOverlay.addEventListener("click", (e) => {
        if (e.target === elements.deleteModalOverlay) {
            hideModal();
        }
    });
}
