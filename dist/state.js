/**
 * @fileoverview Manages the application's state and state-mutating business logic.
 */
import { emit } from "./events.js";
import { generateId } from "./utils.js";
import { updateSpeculativeNode } from "./graph/network.js";
export const state = {
    cashFlowData: {
        incomes: [],
        outgoings: [],
        capital: [],
        groups: [],
        speculative: {
            incomes: [],
            outgoings: [],
        },
    },
    editingItemId: null,
    activeFilters: [],
    lastDeletedItem: null,
    speculativeIsYellow: false,
    showSpeculativeNodes: true,
    nodePositionsBeforeDrag: null,
};
// --- Internal Utilities ---
/**
 * Finds an item or group by its ID in the cash flow data.
 * @param {string} id The ID of the item to find.
 * @returns {{item: Item | Group | SpeculativeIncome | SpeculativeOutgoing | null, type: ItemType | SpeculativeType | 'groups' | null}} The found item and its type.
 */
export function findById(id) {
    if (id.startsWith("group_")) {
        const group = state.cashFlowData.groups.find((g) => g.id === id);
        return { item: group || null, type: group ? "groups" : null };
    }
    // Check speculative items first
    const speculativeIncome = state.cashFlowData.speculative.incomes.find((i) => i.id === id);
    if (speculativeIncome) {
        return { item: speculativeIncome, type: "speculative-incomes" };
    }
    const speculativeOutgoing = state.cashFlowData.speculative.outgoings.find((i) => i.id === id);
    if (speculativeOutgoing) {
        return { item: speculativeOutgoing, type: "speculative-outgoings" };
    }
    // Check regular items
    for (const type of ["incomes", "outgoings", "capital"]) {
        const item = state.cashFlowData[type].find((i) => i.id === id);
        if (item) {
            return { item, type };
        }
    }
    return { item: null, type: null };
}
// --- State Getters ---
/**
 * Filters the cash flow data based on active tags.
 * @returns {CashFlowData} The filtered data.
 */
export function getFilteredData() {
    if (state.activeFilters.length === 0) {
        return state.cashFlowData;
    }
    const filteredData = {
        incomes: state.cashFlowData.incomes.filter((item) => item.tags && item.tags.some((tag) => state.activeFilters.includes(tag))),
        outgoings: state.cashFlowData.outgoings.filter((item) => item.tags && item.tags.some((tag) => state.activeFilters.includes(tag))),
        capital: state.cashFlowData.capital.filter((item) => item.tags && item.tags.some((tag) => state.activeFilters.includes(tag))),
        groups: state.cashFlowData.groups, // Groups are not filtered
        speculative: {
            incomes: state.cashFlowData.speculative.incomes.filter((item) => item.tags && item.tags.some((tag) => state.activeFilters.includes(tag))),
            outgoings: state.cashFlowData.speculative.outgoings.filter((item) => item.tags && item.tags.some((tag) => state.activeFilters.includes(tag))),
        },
    };
    return filteredData;
}
/**
 * Extracts all unique tags from the cash flow data.
 * @returns {string[]} An array of unique tags.
 */
export function getAllTags() {
    const allTags = new Set();
    Object.values(state.cashFlowData).forEach((category) => {
        if (Array.isArray(category)) {
            category.forEach((item) => {
                if ("tags" in item && item.tags) {
                    item.tags.forEach((tag) => allTags.add(tag));
                }
            });
        }
    });
    return [...allTags];
}
/**
 * Retrieves saved filters from local storage.
 * @returns {object} An object containing saved filters.
 */
export function getSavedFilters() {
    const SAVED_FILTER_PREFIX = "cashflow-filter-";
    const filters = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(SAVED_FILTER_PREFIX)) {
            const name = key.substring(SAVED_FILTER_PREFIX.length);
            try {
                filters[name] = JSON.parse(localStorage.getItem(key));
            }
            catch (e) {
                console.error(`Failed to parse saved filter '${name}':`, e);
            }
        }
    }
    return filters;
}
// --- State Mutators ---
/**
 * Toggles the visibility of speculative items between yellow and opacity-based visibility.
 * Sends an event to the graph to update the visibility of the speculative items.
 */
export function toggleSpeculativeNodes() {
    state.showSpeculativeNodes = !state.showSpeculativeNodes;
    emit("state:loaded", state.cashFlowData);
}
/**
 * Toggles the colour of speculative items between yellow and opacity-based visibility.
 * Sends an event to the graph to update the colour of the speculative items.
 */
export function toggleSpeculativeColour() {
    state.speculativeIsYellow = !state.speculativeIsYellow;
    console.log("speculativeIsYellow", state.speculativeIsYellow);
    for (const speculativeNode of state.cashFlowData.speculative.incomes) {
        updateSpeculativeNode(speculativeNode, "speculative-incomes", state.speculativeIsYellow);
    }
    for (const speculativeNode of state.cashFlowData.speculative.outgoings) {
        updateSpeculativeNode(speculativeNode, "speculative-outgoings", state.speculativeIsYellow);
    }
}
/**
 * Loads data into the state and emits a load event.
 * @param {CashFlowData} data The data to load.
 */
export function loadData(data) {
    state.cashFlowData = data;
    emit("state:loaded", getFilteredData());
}
/**
 * Resets the active filters and emits a filter change event.
 */
export function clearActiveFilters() {
    state.activeFilters = [];
    emit("filter:changed", getFilteredData());
}
/**
 * Sets the active filters and emits a filter change event.
 * @param {string[]} filters
 */
export function setActiveFilters(filters) {
    state.activeFilters = filters;
    emit("filter:changed", getFilteredData());
}
/**
 * Adds a new item to the state and emits an event.
 * @param {Omit<Item, 'id'>} itemData The data for the new item (without an id).
 * @param {ItemType} type The type of the item ('incomes', 'outgoings', 'capital').
 */
export function addItem(itemData, type) {
    const newItem = { ...itemData, id: generateId() };
    state.cashFlowData[type].push(newItem);
    emit("item:added", { item: newItem, type });
}
/**
 * Adds a new speculative item to the state and emits an event.
 * @param {Omit<SpeculativeIncome | SpeculativeOutgoing, 'id'>} itemData The data for the new speculative item (without an id).
 * @param {SpeculativeType} type The type of the speculative item.
 */
export function addSpeculativeItem(itemData, type) {
    const newItem = { ...itemData, id: `speculative_${generateId()}` };
    const targetArray = type === "speculative-incomes" ? state.cashFlowData.speculative.incomes : state.cashFlowData.speculative.outgoings;
    targetArray.push(newItem);
    emit("speculative:added", { item: newItem, type });
}
/**
 * Updates an existing speculative item in the state and emits an event.
 * @param {SpeculativeIncome | SpeculativeOutgoing} updatedItem The full speculative item object with updated data.
 * @param {SpeculativeType} newType The potentially new type of the item.
 * @param {boolean} typeChanged Whether the item's type has changed.
 */
export function updateSpeculativeItem(updatedItem, newType, typeChanged) {
    if (typeChanged) {
        const { type: oldType } = findById(updatedItem.id);
        if (oldType && oldType !== newType && (oldType === "speculative-incomes" || oldType === "speculative-outgoings")) {
            const oldArray = oldType === "speculative-incomes"
                ? state.cashFlowData.speculative.incomes
                : state.cashFlowData.speculative.outgoings;
            const newArray = newType === "speculative-incomes"
                ? state.cashFlowData.speculative.incomes
                : state.cashFlowData.speculative.outgoings;
            const index = oldArray.findIndex((i) => i.id === updatedItem.id);
            if (index > -1) {
                oldArray.splice(index, 1);
                newArray.push(updatedItem);
            }
        }
    }
    else {
        const targetArray = newType === "speculative-incomes"
            ? state.cashFlowData.speculative.incomes
            : state.cashFlowData.speculative.outgoings;
        const itemIndex = targetArray.findIndex((i) => i.id === updatedItem.id);
        if (itemIndex > -1) {
            targetArray[itemIndex] = updatedItem;
        }
    }
    emit("speculative:updated", { item: updatedItem, type: newType, typeChanged });
}
/**
 * Deletes a speculative item from the state and emits an event.
 * @param {string} itemId The ID of the speculative item to delete.
 */
export function deleteSpeculativeItem(itemId) {
    const { item, type } = findById(itemId);
    if (!item || !type || (type !== "speculative-incomes" && type !== "speculative-outgoings"))
        return;
    const targetArray = type === "speculative-incomes" ? state.cashFlowData.speculative.incomes : state.cashFlowData.speculative.outgoings;
    const index = targetArray.findIndex((i) => i.id === itemId);
    if (index > -1) {
        targetArray.splice(index, 1);
    }
    emit("speculative:deleted", { itemId, type: type });
}
/**
 * Updates an existing item in the state and emits an event.
 * @param {Item} updatedItem The full item object with updated data.
 * @param {ItemType} newType The potentially new type of the item.
 * @param {boolean} typeChanged Whether the item's type has changed.
 */
export function updateItem(updatedItem, newType, typeChanged) {
    if (typeChanged) {
        const { type: oldType } = findById(updatedItem.id);
        if (oldType && oldType !== newType && oldType !== "groups") {
            state.cashFlowData[oldType] = state.cashFlowData[oldType].filter((i) => i.id !== updatedItem.id);
            state.cashFlowData[newType].push(updatedItem);
        }
    }
    else {
        const itemIndex = state.cashFlowData[newType].findIndex((i) => i.id === updatedItem.id);
        if (itemIndex > -1) {
            state.cashFlowData[newType][itemIndex] = updatedItem;
        }
    }
    emit("item:updated", { item: updatedItem, type: newType, typeChanged });
}
/**
 * Deletes an item from the state and emits an event.
 * @param {string} itemId The ID of the item to delete.
 */
export function deleteItem(itemId) {
    const { item, type } = findById(itemId);
    if (!item || !type || type === "groups" || type === "speculative-incomes" || type === "speculative-outgoings")
        return;
    state.lastDeletedItem = { item: item, type: type };
    state.cashFlowData[type] = state.cashFlowData[type].filter((i) => i.id !== itemId);
    emit("item:deleted", { itemId, type: type });
}
/**
 * Adds a new group to the state and emits an event.
 * @param {Omit<Group, 'id'>} groupData The data for the new group.
 */
export function addGroup(groupData) {
    const newGroup = { ...groupData, id: `group_${generateId()}` };
    state.cashFlowData.groups.push(newGroup);
    emit("group:added", newGroup);
    return newGroup;
}
/**
 * Updates a group in the state and emits an event.
 * @param {Group} updatedGroup The full group object with updated data.
 */
export function updateGroup(updatedGroup) {
    const groupIndex = state.cashFlowData.groups.findIndex((g) => g.id === updatedGroup.id);
    if (groupIndex > -1) {
        state.cashFlowData.groups[groupIndex] = updatedGroup;
        emit("group:updated", updatedGroup);
    }
}
/**
 * Changes an item's group ID and emits an event.
 * @param {string} itemId The ID of the item to update.
 * @param {string|null} newGroupId The new group ID.
 */
export function setItemGroupId(itemId, newGroupId) {
    const { item } = findById(itemId);
    if (!item || "name" in item)
        return; // is a group
    const previousGroupId = item.groupId;
    item.groupId = newGroupId;
    emit("item:group-changed", { item, previousGroupId, newGroupId });
}
/**
 * Updates the position of an item in the state. This ensures when items are added and removed
 * from groups their positions remain consistent when they disappear and re-appear in the graph.
 *
 * Emits nothing as nothing else needs to worry about this state change, it's used when nodes
 * are re-added to the graph.
 * @param {string} itemId The ID of the item to update.
 * @param {{x: number, y: number}} position The item's new position.
 */
export function updateItemPosition(itemId, position) {
    const { item } = findById(itemId);
    if (!item)
        return;
    item.position = position;
}
/**
 * Deletes a group and un-groups its member items.
 * @param {string} groupId The ID of the group to delete.
 */
export function deleteGroupAndUngroupItems(groupId) {
    const { item: group, type } = findById(groupId);
    if (type !== "groups")
        return;
    const groupExists = group !== null;
    if (!groupExists)
        return;
    const groupItemType = group.type;
    const groupItems = state.cashFlowData[groupItemType];
    groupItems.forEach((item) => {
        if (item.groupId === groupId) {
            item.groupId = null;
        }
    });
    const allGroups = state.cashFlowData.groups;
    const groupsWithoutTheDeletedOne = allGroups.filter((g) => g.id !== groupId);
    state.cashFlowData.groups = groupsWithoutTheDeletedOne;
    emit("group:deleted", {
        groupId,
        deleteMembers: false,
        originalGroup: group,
    });
}
/**
 * Deletes a group and all of its member items.
 * @param {string} groupId The ID of the group to delete.
 */
export function deleteGroupAndItems(groupId) {
    const { item: group, type } = findById(groupId);
    if (!group || type !== "groups")
        return;
    const groupType = group.type;
    const deletedItemIds = state.cashFlowData[groupType]
        .filter((item) => item.groupId === groupId)
        .map((item) => item.id);
    state.cashFlowData[groupType] = state.cashFlowData[groupType].filter((item) => item.groupId !== groupId);
    state.cashFlowData.groups = state.cashFlowData.groups.filter((g) => g.id !== groupId);
    emit("group:deleted", {
        groupId,
        deleteMembers: true,
        originalGroup: group,
        deletedItemIds,
    });
}
/**
 * Saves the current position of a node (for drag-and-drop).
 * @param {string} nodeId The ID of the node.
 * @param {{x: number, y: number}} position The node's position.
 */
export function updateNodePosition(nodeId, position) {
    if (!state.nodePositionsBeforeDrag) {
        state.nodePositionsBeforeDrag = new Map();
    }
    state.nodePositionsBeforeDrag.set(nodeId, position);
    emit("node:position-updated", { nodeId, position });
}
