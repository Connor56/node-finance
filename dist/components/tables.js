/**
 * @fileoverview Renders the data tables.
 */
import { getFilteredData } from "../state.js";
import { elements } from "../dom-loader.js";
import { formatCurrency } from "../utils.js";
import { on } from "../events.js";
function renderIncomeTable(data) {
    elements.incomeTableBody.innerHTML = "";
    data.incomes.forEach((item) => {
        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${item.source}</td>
      <td>${formatCurrency(item.amount)}</td>
      <td>${(item.tags || []).join(", ")}</td>
    `;
        elements.incomeTableBody.appendChild(row);
    });
}
function renderOutgoingTable(data) {
    elements.outgoingTableBody.innerHTML = "";
    data.outgoings.forEach((item) => {
        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${item.destination}</td>
      <td>${formatCurrency(item.amount)}</td>
      <td>${(item.tags || []).join(", ")}</td>
    `;
        elements.outgoingTableBody.appendChild(row);
    });
}
function renderCapitalTable(data) {
    elements.capitalTableBody.innerHTML = "";
    data.capital.forEach((item) => {
        const totalValue = "isAsset" in item && item.isAsset ? (item.quantity || 0) * (item.rate || 0) : "amount" in item ? item.amount : 0;
        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${item.location}</td>
      <td>${"isAsset" in item && item.isAsset ? item.quantity : "N/A"}</td>
      <td>${"isAsset" in item && item.isAsset ? formatCurrency(item.rate) : "N/A"}</td>
      <td>${formatCurrency(totalValue)}</td>
      <td>${(item.tags || []).join(", ")}</td>
    `;
        elements.capitalTableBody.appendChild(row);
    });
}
/**
 * Renders all data tables based on the currently filtered data.
 */
export function renderTables() {
    const dataToRender = getFilteredData();
    renderIncomeTable(dataToRender);
    renderOutgoingTable(dataToRender);
    renderCapitalTable(dataToRender);
}
/**
 * Initializes the table rendering module.
 * Subscribes to state changes to automatically re-render the tables.
 */
export function initTables() {
    on("state:loaded", renderTables);
    on("filter:changed", renderTables);
    on("item:added", renderTables);
    on("item:updated", renderTables);
    on("item:deleted", renderTables);
    on("item:group-changed", renderTables);
    on("group:deleted", renderTables);
    on("group:deleted-with-items", renderTables);
    // Initial render
    renderTables();
}
