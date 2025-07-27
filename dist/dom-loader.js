/**
 * @fileoverview Centralized DOM element loader.
 */
export const elements = {};
export function initElements() {
    // Main layout
    elements.graphContainer = document.getElementById("graph-container");
    elements.sidebar = document.getElementById("sidebar");
    elements.sidebarContent = document.getElementById("sidebar-content");
    elements.sidebarToggle = document.getElementById("sidebar-toggle");
    elements.sidebarToggleIcon = document.getElementById("sidebar-toggle-icon");
    elements.mainContent = document.getElementById("main-content");
    elements.bottomBar = document.getElementById("bottom-bar");
    elements.bottomBarToggle = document.getElementById("bottom-bar-toggle");
    elements.bottomBarToggleIcon = document.getElementById("bottom-bar-toggle-icon");
    elements.bottomBarContent = document.getElementById("bottom-bar-content");
    // Tables
    elements.incomeTableBody = document.querySelector("#income-table tbody");
    elements.outgoingTableBody = document.querySelector("#outgoing-table tbody");
    elements.capitalTableBody = document.querySelector("#capital-table tbody");
    // Summary
    elements.netFlowTotalEl = document.getElementById("net-flow-total");
    elements.netWorthTotalEl = document.getElementById("net-worth-total");
    // JSON and Controls
    elements.jsonInput = document.getElementById("json-input");
    elements.generateBtn = document.getElementById("generate-btn");
    elements.exportJsonBtn = document.getElementById("export-json-btn");
    elements.createGroupBtn = document.getElementById("create-group-btn");
    elements.errorEl = document.getElementById("error-message");
    elements.speculativeColourButton = document.getElementById("speculative-colour-btn");
    elements.speculativeOnOffButton = document.getElementById("speculative-on-off-btn");
    // Filters
    elements.tagFilterContainer = document.getElementById("tag-filter-container");
    elements.clearFilterBtn = document.getElementById("clear-filter-btn");
    elements.filterNameInput = document.getElementById("filter-name-input");
    elements.saveFilterBtn = document.getElementById("save-filter-btn");
    elements.savedFiltersSelect = document.getElementById("saved-filters-select");
    elements.loadFilterBtn = document.getElementById("load-filter-btn");
    elements.deleteFilterBtn = document.getElementById("delete-filter-btn");
    // Item Add/ Update Modal
    elements.modalOverlay = document.getElementById("modal-overlay");
    elements.addItemForm = document.getElementById("add-item-form");
    elements.addNewItemBtn = document.getElementById("add-new-item-btn");
    elements.modalCloseBtn = document.getElementById("modal-close-btn");
    elements.modalCancelBtn = document.getElementById("modal-cancel-btn");
    elements.isAssetToggle = document.getElementById("is-asset-toggle");
    elements.isAssetGroupContainer = document.getElementById("is-asset-group-container");
    elements.isSpeculativeToggle = document.getElementById("is-speculative-toggle");
    elements.isSpeculativeGroupContainer = document.getElementById("is-speculative-group-container");
    elements.speculativeGroup = document.getElementById("speculative-group");
    elements.speculativeDescriptionInput = document.getElementById("speculative-description");
    elements.speculativeLikelihoodInput = document.getElementById("speculative-likelihood");
    elements.amountGroup = document.getElementById("amount-group");
    elements.assetGroup = document.getElementById("asset-group");
    elements.itemTypeSelect = document.getElementById("item-type");
    elements.itemNameInput = document.getElementById("item-name");
    elements.itemAmountInput = document.getElementById("item-amount");
    elements.itemQuantityInput = document.getElementById("item-quantity");
    elements.itemRateInput = document.getElementById("item-rate");
    elements.itemTagsInput = document.getElementById("item-tags");
    elements.groupSelectContainer = document.getElementById("group-select-container");
    elements.itemGroupSelect = document.getElementById("item-group-select");
    // Group Modal
    elements.groupModalOverlay = document.getElementById("group-modal-overlay");
    elements.groupForm = document.getElementById("group-form");
    elements.groupModalCloseBtn = document.getElementById("group-modal-close-btn");
    elements.groupModalCancelBtn = document.getElementById("group-modal-cancel-btn");
    elements.groupNameInput = document.getElementById("group-name");
    elements.groupTypeSelect = document.getElementById("group-type");
    elements.availableNodesContainer = document.getElementById("available-nodes-container");
    elements.groupItemsTableBody = document.getElementById("group-items-table-body");
    // Delete Modal
    elements.deleteModalOverlay = document.getElementById("delete-modal-overlay");
    elements.deleteModalTitle = document.getElementById("delete-modal-title");
    elements.deleteModalText = document.getElementById("delete-modal-text");
    elements.deleteModalButtons = document.getElementById("delete-modal-buttons");
    // Save Modal
    elements.saveModalOverlay = document.getElementById("save-modal-overlay");
    elements.saveStateForm = document.getElementById("save-state-form");
    elements.saveModalCloseBtn = document.getElementById("save-modal-close-btn");
    elements.saveModalCancelBtn = document.getElementById("save-modal-cancel-btn");
    elements.saveStateNameInput = document.getElementById("save-state-name");
    elements.saveModalMessages = document.getElementById("save-modal-messages");
    elements.saveSuccessMessage = document.getElementById("save-success-message");
    elements.saveErrorMessage = document.getElementById("save-error-message");
    elements.saveStateBtn = document.getElementById("save-state-btn");
    // Load Modal
    elements.loadModalOverlay = document.getElementById("load-modal-overlay");
    elements.loadModalCloseBtn = document.getElementById("load-modal-close-btn");
    elements.loadModalCloseBtnBottom = document.getElementById("load-modal-close-btn-bottom");
    elements.refreshSavedStatesBtn = document.getElementById("refresh-saved-states-btn");
    elements.savedStatesContainer = document.getElementById("saved-states-container");
    elements.savedStatesList = document.getElementById("saved-states-list");
    elements.noSavedStates = document.getElementById("no-saved-states");
    elements.loadingSavedStates = document.getElementById("loading-saved-states");
    elements.loadModalMessages = document.getElementById("load-modal-messages");
    elements.loadSuccessMessage = document.getElementById("load-success-message");
    elements.loadErrorMessage = document.getElementById("load-error-message");
    elements.loadStateBtn = document.getElementById("load-state-btn");
    elements.savedStateItemTemplate = document.getElementById("saved-state-item-template");
}
