import { getSaveSlots, loadState, saveState, deleteState, overwriteState } from "../state";
import { on, emit } from "../events";
let saveLoadModal;
let closeButton;
let saveSlotsList;
let saveNameInput;
let saveNewButton;
export function initSaveLoadModal() {
    saveLoadModal = document.getElementById("save-load-modal");
    closeButton = saveLoadModal.querySelector(".close-button");
    saveSlotsList = document.getElementById("save-slots-list");
    saveNameInput = document.getElementById("save-name-input");
    saveNewButton = document.getElementById("save-new-button");
    closeButton.addEventListener("click", () => {
        saveLoadModal.style.display = "none";
    });
    saveNewButton.addEventListener("click", handleSaveNew);
    on("ui:save-load-modal:open", () => {
        renderSaveSlots();
        saveLoadModal.style.display = "block";
    });
}
function renderSaveSlots() {
    const slots = getSaveSlots();
    saveSlotsList.innerHTML = ""; // Clear existing list
    if (slots.length === 0) {
        saveSlotsList.innerHTML = "<li>No saved states yet.</li>";
        return;
    }
    slots
        .sort((a, b) => b.id - a.id) // Show newest first
        .forEach((slot) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
        <span class="save-name">${slot.name}</span>
        <span class="save-timestamp">${new Date(slot.timestamp).toLocaleString()}</span>
        <div class="slot-buttons">
          <button class="load-button" data-id="${slot.id}">Load</button>
          <button class="overwrite-button" data-id="${slot.id}">Overwrite</button>
          <button class="delete-button" data-id="${slot.id}">Delete</button>
        </div>
      `;
        saveSlotsList.appendChild(listItem);
    });
    saveSlotsList.querySelectorAll(".load-button").forEach((button) => {
        button.addEventListener("click", handleLoad);
    });
    saveSlotsList.querySelectorAll(".overwrite-button").forEach((button) => {
        button.addEventListener("click", handleOverwrite);
    });
    saveSlotsList.querySelectorAll(".delete-button").forEach((button) => {
        button.addEventListener("click", handleDelete);
    });
}
function handleSaveNew() {
    const name = saveNameInput.value.trim();
    if (!name) {
        alert("Please enter a name for the save.");
        return;
    }
    saveState(name);
    saveNameInput.value = "";
    renderSaveSlots();
    emit("ui:notification", { message: `State '${name}' saved.` });
}
function handleLoad(event) {
    const id = Number(event.target.dataset.id);
    loadState(id);
    saveLoadModal.style.display = "none";
    emit("ui:notification", { message: "State loaded." });
}
function handleOverwrite(event) {
    const id = Number(event.target.dataset.id);
    const slot = getSaveSlots().find((s) => s.id === id);
    if (!slot)
        return;
    const newName = prompt(`Enter new name for "${slot.name}" or leave blank to keep the same name.`);
    if (newName !== null) {
        // Prompt was not cancelled
        const finalName = newName.trim() === "" ? slot.name : newName.trim();
        if (confirm(`Are you sure you want to overwrite the save slot "${slot.name}"?`)) {
            overwriteState(id, finalName);
            renderSaveSlots();
            emit("ui:notification", { message: `State '${slot.name}' overwritten.` });
        }
    }
}
function handleDelete(event) {
    const id = Number(event.target.dataset.id);
    const slot = getSaveSlots().find((s) => s.id === id);
    if (slot && confirm(`Are you sure you want to delete "${slot.name}"?`)) {
        deleteState(id);
        renderSaveSlots();
        emit("ui:notification", { message: `State '${slot.name}' deleted.` });
    }
}
//# sourceMappingURL=save-load-modal.js.map