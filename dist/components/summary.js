/**
 * @fileoverview Manages the financial summary calculations and rendering.
 */
import { state } from "../state.js";
import { elements } from "../dom-loader.js";
import { formatCurrency } from "../utils.js";
import { on } from "../events.js";
/**
 * Calculates the net flow and net worth from the current data.
 * @returns {{netFlow: number, netWorth: number, totalIncome: number, totalOutgoing: number}}
 */
function calculateTotals() {
    const { incomes, outgoings, capital } = state.cashFlowData;
    const totalIncome = incomes.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalOutgoing = outgoings.reduce((sum, item) => sum + (item.amount || 0), 0);
    const netWorth = capital.reduce((sum, item) => {
        const value = "isAsset" in item && item.isAsset
            ? (item.quantity || 0) * (item.rate || 0)
            : "amount" in item
                ? item.amount || 0
                : 0;
        return sum + value;
    }, 0);
    const netFlow = totalIncome - totalOutgoing;
    return { netFlow, netWorth, totalIncome, totalOutgoing };
}
/**
 * Renders the financial summary section.
 */
export function renderSummary() {
    const { netFlow, netWorth } = calculateTotals();
    elements.netFlowTotalEl.textContent = formatCurrency(netFlow);
    elements.netWorthTotalEl.textContent = formatCurrency(netWorth);
}
/**
 * Initializes the summary module.
 * Subscribes to state changes to automatically re-render the summary.
 */
export function initSummary() {
    on("state:loaded", renderSummary);
    on("filter:changed", renderSummary);
    on("item:added", renderSummary);
    on("item:updated", renderSummary);
    on("item:deleted", renderSummary);
    on("item:group-changed", renderSummary);
    on("group:deleted", renderSummary);
    on("group:deleted-with-items", renderSummary);
    // Initial render
    renderSummary();
}
