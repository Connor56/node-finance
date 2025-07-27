/**
 * @fileoverview Manages the Add/Edit item modal.
 */
import { state, findById, addItem, updateItem, addSpeculativeItem, updateSpeculativeItem } from "../state.js";
import { elements } from "../dom-loader.js";
function showModal() {
    elements.modalOverlay.classList.remove("hidden");
}
function hideModal() {
    elements.modalOverlay.classList.add("hidden");
    elements.addItemForm.reset();
    elements.assetGroup.classList.add("hidden");
    elements.amountGroup.classList.remove("hidden");
    elements.speculativeGroup.classList.add("hidden");
    elements.isAssetToggle.checked = false;
    elements.isAssetToggle.disabled = false;
    elements.isSpeculativeToggle.checked = false;
    elements.isSpeculativeToggle.disabled = false;
    document.querySelectorAll(".error-message").forEach((el) => (el.textContent = ""));
    document.querySelectorAll("input.invalid").forEach((el) => el.classList.remove("invalid"));
    document.querySelectorAll("textarea.invalid").forEach((el) => el.classList.remove("invalid"));
    state.editingItemId = null; // Clear editing state when modal is hidden
}
function validateField(input, validator, customErrorMessage) {
    const errorMessage = input.nextElementSibling;
    if (validator(input.value)) {
        input.classList.remove("invalid");
        errorMessage.textContent = "";
        return true;
    }
    input.classList.add("invalid");
    errorMessage.textContent = customErrorMessage || "This field is required.";
    return false;
}
function handleSpeculativeItem(itemType, itemName, groupId, tags, description, likelihood) {
    const speculativeType = itemType === "incomes" ? "speculative-incomes" : "speculative-outgoings";
    const amount = parseFloat(elements.itemAmountInput.value);
    const speculativeData = {
        [itemType === "incomes" ? "source" : "destination"]: itemName,
        amount,
        tags,
        groupId,
        description,
        likelihood,
    };
    if (state.editingItemId) {
        const { type: originalType } = findById(state.editingItemId);
        const updatedItem = { ...speculativeData, id: state.editingItemId };
        const typeChanged = originalType !== speculativeType;
        updateSpeculativeItem(updatedItem, speculativeType, typeChanged);
    }
    else {
        addSpeculativeItem(speculativeData, speculativeType);
    }
    hideModal();
}
function handleFormSubmit(e) {
    e.preventDefault();
    const isAsset = elements.isAssetToggle.checked;
    const isSpeculative = elements.isSpeculativeToggle.checked;
    let isValid = validateField(elements.itemNameInput, (val) => val.trim() !== "");
    isValid =
        isValid &&
            (isAsset
                ? validateField(elements.itemQuantityInput, (val) => val !== "" && !isNaN(parseFloat(val))) &&
                    validateField(elements.itemRateInput, (val) => val !== "" && !isNaN(parseFloat(val)))
                : validateField(elements.itemAmountInput, (val) => val !== "" && !isNaN(parseFloat(val))));
    // Speculative validation
    if (isSpeculative) {
        isValid = isValid && validateField(elements.speculativeDescriptionInput, (val) => val.trim() !== "");
        isValid =
            isValid &&
                validateField(elements.speculativeLikelihoodInput, (val) => val !== "" && !isNaN(parseInt(val)) && parseInt(val) >= 1 && parseInt(val) <= 100, "Likelihood must be a number between 1 and 100");
    }
    if (!isValid)
        return;
    const itemType = elements.itemTypeSelect.value;
    const itemName = elements.itemNameInput.value.trim();
    const groupId = elements.itemGroupSelect.value || null;
    const tags = elements
        .itemTagsInput.value.split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    // Handle speculative items
    if (isSpeculative) {
        const description = elements.speculativeDescriptionInput.value.trim();
        const likelihood = parseInt(elements.speculativeLikelihoodInput.value);
        if (itemType === "capital") {
            alert("Capital items cannot be speculative. Please change the type to Income or Outgoing.");
            return;
        }
        handleSpeculativeItem(itemType, itemName, groupId, tags, description, likelihood);
        return;
    }
    const callWithItem = (itemData) => {
        if (state.editingItemId) {
            const { type: originalType } = findById(state.editingItemId);
            const updatedItem = { ...itemData, id: state.editingItemId };
            const typeChanged = originalType !== itemType;
            updateItem(updatedItem, itemType, typeChanged);
        }
        else {
            addItem(itemData, itemType);
        }
    };
    if (isAsset) {
        const itemData = {
            location: itemName,
            quantity: parseFloat(elements.itemQuantityInput.value),
            rate: parseFloat(elements.itemRateInput.value),
            isAsset: true,
            tags,
            groupId,
        };
        callWithItem(itemData);
    }
    else {
        const amount = parseFloat(elements.itemAmountInput.value);
        if (itemType === "incomes") {
            const itemData = { source: itemName, amount, tags, groupId };
            callWithItem(itemData);
        }
        else if (itemType === "outgoings") {
            const itemData = { destination: itemName, amount, tags, groupId };
            callWithItem(itemData);
        }
        else {
            // Capital Non-Asset
            const itemData = { location: itemName, amount, isAsset: false, tags, groupId };
            callWithItem(itemData);
        }
    }
    hideModal();
}
export function openEditModal(item, type) {
    state.editingItemId = item.id;
    elements.itemTypeSelect.value = type;
    let itemName;
    if ("source" in item)
        itemName = item.source;
    else if ("destination" in item)
        itemName = item.destination;
    else
        itemName = item.location;
    elements.itemNameInput.value = itemName;
    elements.itemTagsInput.value = (item.tags || []).join(", ");
    const itemIsNotCapitalType = type !== "capital";
    console.log("itemIsNotCapitalType", itemIsNotCapitalType);
    if (itemIsNotCapitalType) {
        elements.isAssetGroupContainer.classList.add("hidden");
        elements.isSpeculativeGroupContainer.classList.remove("hidden");
    }
    else {
        elements.isAssetGroupContainer.classList.remove("hidden");
        console.log("isSpeculativeGroupContainer", elements.isSpeculativeGroupContainer);
        elements.isSpeculativeGroupContainer.classList.add("hidden");
    }
    elements.isAssetToggle.checked = "isAsset" in item ? item.isAsset : false;
    elements.isAssetToggle.dispatchEvent(new Event("change"));
    elements.itemTypeSelect.dispatchEvent(new Event("change"));
    elements.itemGroupSelect.innerHTML = '<option value="">None</option>';
    const availableGroups = state.cashFlowData.groups.filter((g) => g.type === type);
    if (availableGroups.length > 0) {
        availableGroups.forEach((group) => {
            const option = document.createElement("option");
            option.value = group.id;
            option.textContent = group.name;
            if (item.groupId === group.id) {
                option.selected = true;
            }
            elements.itemGroupSelect.appendChild(option);
        });
        elements.groupSelectContainer.classList.remove("hidden");
    }
    else {
        elements.groupSelectContainer.classList.add("hidden");
    }
    if (type.includes("speculative")) {
        elements.isSpeculativeToggle.checked = true;
        elements.isSpeculativeToggle.dispatchEvent(new Event("change"));
        elements.speculativeDescriptionInput.value = item.description;
        elements.speculativeLikelihoodInput.value = String(item.likelihood);
        elements.itemTypeSelect.value = type.replace("speculative-", "");
    }
    else {
        elements.isSpeculativeToggle.checked = false;
        elements.isSpeculativeToggle.dispatchEvent(new Event("change"));
    }
    if ("isAsset" in item && item.isAsset) {
        elements.itemQuantityInput.value = String(item.quantity);
        elements.itemRateInput.value = String(item.rate);
    }
    else if ("amount" in item) {
        elements.itemAmountInput.value = String(item.amount);
    }
    showModal();
}
/**
 * Initializes the item modal component.
 */
export function initItemModal() {
    elements.addNewItemBtn.addEventListener("click", () => {
        // Reset the form for a new item
        state.editingItemId = null;
        elements.addItemForm.reset();
        elements.itemTypeSelect.value = "incomes";
        elements.itemTypeSelect.dispatchEvent(new Event("change"));
        elements.groupSelectContainer.classList.add("hidden");
        showModal();
    });
    elements.modalCloseBtn.addEventListener("click", hideModal);
    elements.modalCancelBtn.addEventListener("click", hideModal);
    elements.addItemForm.addEventListener("submit", handleFormSubmit);
    elements.isAssetToggle.addEventListener("change", (e) => {
        const target = e.target;
        const isCapital = elements.itemTypeSelect.value === "capital";
        if (target.checked && isCapital) {
            elements.amountGroup.classList.add("hidden");
            elements.assetGroup.classList.remove("hidden");
        }
        else {
            elements.amountGroup.classList.remove("hidden");
            elements.assetGroup.classList.add("hidden");
        }
    });
    elements.isSpeculativeToggle.addEventListener("change", (e) => {
        const target = e.target;
        if (target.checked) {
            elements.speculativeGroup.classList.remove("hidden");
            // Disable asset toggle when speculative is enabled (capital can't be speculative)
            if (elements.itemTypeSelect.value === "capital") {
                alert("Capital items cannot be speculative. Changing type to Incomes.");
                elements.itemTypeSelect.value = "incomes";
                elements.itemTypeSelect.dispatchEvent(new Event("change"));
            }
        }
        else {
            elements.speculativeGroup.classList.add("hidden");
        }
    });
    elements.itemTypeSelect.addEventListener("change", (e) => {
        const target = e.target;
        const itemType = target.value;
        if (itemType === "capital") {
            elements.isAssetToggle.disabled = false;
            // Disable speculative for capital items
            if (elements.isSpeculativeToggle.checked) {
                elements.isSpeculativeToggle.checked = false;
                elements.isSpeculativeToggle.dispatchEvent(new Event("change"));
            }
            elements.isSpeculativeToggle.disabled = true;
        }
        else {
            elements.isAssetToggle.disabled = true;
            elements.isAssetToggle.checked = false;
            elements.isSpeculativeToggle.disabled = false;
        }
        elements.isAssetToggle.dispatchEvent(new Event("change"));
        // Repopulate group dropdown based on the new type
        const availableGroups = state.cashFlowData.groups.filter((g) => g.type === itemType);
        elements.itemGroupSelect.innerHTML = '<option value="">None</option>';
        if (availableGroups.length > 0) {
            availableGroups.forEach((group) => {
                const option = document.createElement("option");
                option.value = group.id;
                option.textContent = group.name;
                elements.itemGroupSelect.appendChild(option);
            });
            elements.groupSelectContainer.classList.remove("hidden");
        }
        else {
            elements.groupSelectContainer.classList.add("hidden");
        }
    });
}
