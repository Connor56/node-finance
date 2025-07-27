/**
 * @fileoverview Manages the Add/Edit group modal.
 */
import { state, addGroup, updateGroup, setItemGroupId, findById } from "../state.js";
import { elements } from "../dom-loader.js";
import { formatCurrency } from "../utils.js";
import { on } from "../events.js";
let editingGroupId = null;
function renderAvailableItems(group) {
    const container = elements.availableNodesContainer;
    container.innerHTML = "";
    // An item is available if it matches the group's type.
    const availableItems = state.cashFlowData[group.type];
    availableItems.forEach((item) => {
        const isAdded = item.groupId === group.id;
        // An item is "taken" if it has a groupId, but it's not the current group's ID.
        const isTaken = item.groupId && item.groupId !== group.id;
        const itemEl = document.createElement("div");
        itemEl.className = `p-3 rounded-md border text-sm flex justify-between items-center mb-2 ${isAdded ? "glow-green border-green-500" : "border-gray-600 hover:border-gray-400"}`;
        if (!isTaken && !isAdded) {
            itemEl.classList.add("cursor-pointer");
        }
        itemEl.dataset.itemId = item.id;
        const name = "source" in item ? item.source : "destination" in item ? item.destination : item.location;
        const amount = "isAsset" in item && item.isAsset ? item.quantity * item.rate : "amount" in item ? item.amount : 0;
        let actionIcon = "";
        if (isAdded) {
            actionIcon = '<span class="text-green-500 text-2xl">✓</span>';
        }
        else if (isTaken) {
            // Transfer icon
            actionIcon = `
        <span class="text-yellow-500 cursor-pointer" title="Move to this group">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right-left"><path d="m16 3 4 4-4 4"/><path d="m20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>
        </span>
      `;
        }
        itemEl.innerHTML = `
      <div>
        <div class="font-bold">${name}</div>
        <div class="text-xs text-gray-400">${(item.tags || []).join(", ")}</div>
      </div>
      <div class="flex items-center">
        <span class="mr-4 font-mono">${formatCurrency(amount)}</span>
        ${actionIcon}
      </div>
    `;
        // Handle clicks for adding, removing, or transferring items.
        if (isTaken) {
            const transferBtn = itemEl.querySelector(".lucide-arrow-right-left");
            transferBtn.addEventListener("click", (e) => {
                e.stopPropagation(); // prevent the main div click handler
                setItemGroupId(item.id, group.id);
                // The component will re-render via state event listeners
            });
        }
        else if (isAdded) {
            // A click on an already added item will remove it.
            itemEl.classList.add("cursor-pointer");
            itemEl.addEventListener("click", () => {
                setItemGroupId(item.id, null);
                // The component will re-render via state event listeners
            });
        }
        else {
            // A click on an available item will add it.
            itemEl.addEventListener("click", () => {
                setItemGroupId(item.id, group.id);
                // The component will re-render via state event listeners
            });
        }
        container.appendChild(itemEl);
    });
}
function renderGroupItemsTable(group) {
    const tableBody = elements.groupItemsTableBody;
    tableBody.innerHTML = "";
    const groupItems = state.cashFlowData[group.type].filter((item) => item.groupId === group.id);
    if (groupItems.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="3" class="text-center text-gray-500 py-4">No items in this group.</td></tr>`;
        return;
    }
    groupItems.forEach((item) => {
        const row = document.createElement("tr");
        const name = "source" in item ? item.source : "destination" in item ? item.destination : item.location;
        const amount = "isAsset" in item && item.isAsset ? item.quantity * item.rate : "amount" in item ? item.amount : 0;
        row.innerHTML = `
      <td class="py-2 px-4">${name}</td>
      <td class="py-2 px-4">${formatCurrency(amount)}</td>
      <td class="py-2 px-4">${(item.tags || []).join(", ")}</td>
      <td class="py-2 px-4 text-right">
        <button class="text-red-500 hover:text-red-400 remove-item-btn" title="Remove from group">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2 inline-block"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
        </button>
      </td>
    `;
        row.querySelector(".remove-item-btn").addEventListener("click", () => {
            setItemGroupId(item.id, null);
            // The component will re-render via state event listeners
        });
        tableBody.appendChild(row);
    });
}
function renderModalContent(group) {
    renderAvailableItems(group);
    renderGroupItemsTable(group);
}
function showModal() {
    elements.groupModalOverlay.classList.remove("hidden");
}
function hideModal() {
    elements.groupModalOverlay.classList.add("hidden");
    elements.groupForm.reset();
    document.querySelectorAll("#group-form .error-message").forEach((el) => (el.textContent = ""));
    document.querySelectorAll("#group-form input.invalid").forEach((el) => el.classList.remove("invalid"));
    editingGroupId = null;
}
function validateField(input, validator) {
    const errorMessage = input.nextElementSibling;
    if (validator(input.value)) {
        input.classList.remove("invalid");
        errorMessage.textContent = "";
        return true;
    }
    input.classList.add("invalid");
    errorMessage.textContent = "This field is required.";
    return false;
}
function handleFormSubmit(e) {
    e.preventDefault();
    let isValid = validateField(elements.groupNameInput, (val) => val.trim() !== "");
    if (!isValid)
        return;
    const newGroupData = {
        name: elements.groupNameInput.value.trim(),
        type: elements.groupTypeSelect.value,
    };
    if (editingGroupId) {
        const { item: originalGroup } = findById(editingGroupId);
        if (originalGroup && "name" in originalGroup) {
            // If the group type changes, ungroup any items that no longer match.
            if (originalGroup.type !== newGroupData.type) {
                state.cashFlowData[originalGroup.type].forEach((item) => {
                    if (item.groupId === editingGroupId) {
                        setItemGroupId(item.id, null);
                    }
                });
            }
            const updatedGroup = {
                ...originalGroup,
                ...newGroupData,
            };
            updateGroup(updatedGroup);
            // After saving, re-render modal content to reflect changes
            renderModalContent(updatedGroup);
        }
    }
    else {
        // Logic for creating a new group and immediately opening the full editor
        const newGroup = addGroup({
            ...newGroupData,
        });
        editingGroupId = newGroup.id;
        // Don't hide modal, just render the content for the new group
        renderModalContent(newGroup);
    }
}
export function openGroupEditModal(groupId) {
    const group = state.cashFlowData.groups.find((g) => g.id === groupId);
    if (!group)
        return;
    editingGroupId = groupId;
    elements.groupNameInput.value = group.name;
    elements.groupTypeSelect.value = group.type;
    renderModalContent(group);
    showModal();
}
export function initGroupModal() {
    elements.createGroupBtn.addEventListener("click", () => {
        editingGroupId = null;
        elements.groupForm.reset();
        elements.groupItemsTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-gray-500 py-4">Save group to start adding items.</td></tr>`;
        elements.availableNodesContainer.innerHTML = `<div class="text-center text-gray-500 py-4">Save group to see available items.</div>`;
        showModal();
    });
    elements.groupModalCloseBtn.addEventListener("click", hideModal);
    elements.groupModalCancelBtn.addEventListener("click", hideModal);
    elements.groupForm.addEventListener("submit", handleFormSubmit);
    on("item:group-changed", (e) => {
        console.log("item:group-changed", e);
        if (e.newGroupId === editingGroupId) {
            renderModalContent(state.cashFlowData.groups.find((g) => g.id === e.newGroupId));
        }
        else if (e.previousGroupId === editingGroupId) {
            renderModalContent(state.cashFlowData.groups.find((g) => g.id === e.previousGroupId));
        }
    });
}
