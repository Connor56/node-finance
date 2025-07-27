/**
 * @fileoverview Manages the filtering UI and logic.
 */
import { state, getAllTags, getSavedFilters, clearActiveFilters, setActiveFilters } from "../state.js";
import { elements } from "../dom-loader.js";
import { on } from "../events.js";
/**
 * Renders the tag filter checkboxes.
 */
export function renderTagFilters() {
    const allTags = getAllTags();
    elements.tagFilterContainer.innerHTML = "";
    allTags.forEach((tag) => {
        const checkboxId = `tag-${tag}`;
        const isChecked = state.activeFilters.includes(tag);
        const checkbox = `
      <div class="tag-checkbox">
        <input type="checkbox" id="${checkboxId}" value="${tag}" ${isChecked ? "checked" : ""}>
        <label for="${checkboxId}">${tag}</label>
      </div>
    `;
        elements.tagFilterContainer.innerHTML += checkbox;
    });
    elements.tagFilterContainer.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
        checkbox.addEventListener("change", (e) => {
            const target = e.target;
            const tag = target.value;
            if (target.checked) {
                state.activeFilters.push(tag);
            }
            else {
                state.activeFilters = state.activeFilters.filter((t) => t !== tag);
            }
            // Emit an event instead of calling fullRender
            setActiveFilters([...state.activeFilters]);
        });
    });
}
/**
 * Renders the saved filters dropdown.
 */
export function renderSavedFilters() {
    const savedFilters = getSavedFilters();
    elements.savedFiltersSelect.innerHTML = '<option value="">Select a filter...</option>';
    for (const name in savedFilters) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        elements.savedFiltersSelect.appendChild(option);
    }
}
function saveFilter() {
    const name = elements.filterNameInput.value.trim();
    if (!name) {
        alert("Please enter a name for the filter.");
        return;
    }
    if (state.activeFilters.length === 0) {
        alert("Cannot save an empty filter. Please select at least one tag.");
        return;
    }
    localStorage.setItem(`cashflow-filter-${name}`, JSON.stringify(state.activeFilters));
    elements.filterNameInput.value = "";
    renderSavedFilters();
}
function loadFilter() {
    const name = elements.savedFiltersSelect.value;
    if (!name)
        return;
    const savedFilters = getSavedFilters();
    setActiveFilters(savedFilters[name] || []);
}
function deleteFilter() {
    const name = elements.savedFiltersSelect.value;
    if (!name)
        return;
    localStorage.removeItem(`cashflow-filter-${name}`);
    renderSavedFilters();
}
/**
 * Initializes the filters component.
 */
export function initFilters() {
    elements.saveFilterBtn.addEventListener("click", saveFilter);
    elements.loadFilterBtn.addEventListener("click", loadFilter);
    elements.deleteFilterBtn.addEventListener("click", deleteFilter);
    elements.clearFilterBtn.addEventListener("click", () => {
        clearActiveFilters();
    });
    on("state:loaded", () => {
        renderTagFilters();
        renderSavedFilters();
    });
    on("filter:changed", renderTagFilters);
}
