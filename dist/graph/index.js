/**
 * @fileoverview Initializes the vis.js network, subscribes to state changes,
 * and coordinates the graph, network, and interaction modules.
 */
import { state, findById, getFilteredData } from "../state.js";
import { elements } from "../dom-loader.js";
import { on } from "../events.js";
import { formatCurrency } from "../utils.js";
import * as networkApi from "./network.js";
import { initInteractions, attachWheelListener } from "./interactions.js";
let network = null;
let speculativeDisplayMode = "opacity";
// --- Helper Functions ---
function calculateGroupTotal(groupId) {
    const { item: group } = findById(groupId);
    if (!group || !("type" in group))
        return 0;
    const groupItems = state.cashFlowData[group.type].filter((item) => item.groupId === groupId);
    return groupItems.reduce((sum, item) => {
        const value = "isAsset" in item && item.isAsset ? item.quantity * item.rate : "amount" in item ? item.amount : 0;
        return sum + (value || 0);
    }, 0);
}
/**
 * Calculates the net flow of the cash flow data. Not including speculative items.
 * @returns The net flow of the cash flow data.
 */
function calculateNetFlow() {
    const data = getFilteredData();
    return (data.incomes.reduce((s, i) => s + (i.amount || 0), 0) - data.outgoings.reduce((s, o) => s + (o.amount || 0), 0));
}
function calculateSpeculativeBreakdown() {
    const data = getFilteredData();
    const trueTotal = calculateNetFlow();
    // Get all unique likelihood percentages and sort them descending
    const allLikelihoods = [
        ...data.speculative.incomes.map((item) => item.likelihood),
        ...data.speculative.outgoings.map((item) => item.likelihood),
    ];
    const uniqueThresholds = [...new Set(allLikelihoods)].sort((a, b) => b - a);
    const speculativesByThreshold = uniqueThresholds.map((threshold) => {
        const speculativeIncomes = data.speculative.incomes
            .filter((item) => item.likelihood >= threshold)
            .reduce((sum, item) => sum + item.amount, 0);
        const speculativeOutgoings = data.speculative.outgoings
            .filter((item) => item.likelihood >= threshold)
            .reduce((sum, item) => sum + item.amount, 0);
        return {
            threshold,
            total: trueTotal + speculativeIncomes - speculativeOutgoings,
        };
    });
    return { trueTotal, speculativesByThreshold };
}
function createCentralNodeLabel() {
    const breakdown = calculateSpeculativeBreakdown();
    const allSpeculative = breakdown.speculativesByThreshold[breakdown.speculativesByThreshold.length - 1];
    let label = `Net Monthly Flow\n\n`;
    if (allSpeculative && state.showSpeculativeNodes) {
        label += `${formatCurrency(allSpeculative.total)}\n`;
    }
    else {
        label += `${formatCurrency(breakdown.trueTotal)}\n`;
    }
    return label;
}
function createCentralNodeTooltip() {
    const breakdown = calculateSpeculativeBreakdown();
    let tooltip = `True Total: ${formatCurrency(breakdown.trueTotal)}`;
    if (breakdown.speculativesByThreshold.length > 0) {
        tooltip += "\n\nSpeculative Scenarios:";
        breakdown.speculativesByThreshold.forEach(({ threshold, total }) => {
            tooltip += `\n${threshold}%+ likely: ${formatCurrency(total)}`;
        });
    }
    return tooltip;
}
// --- Main Rendering ---
function renderGraph() {
    if (!network)
        return;
    const dataToRender = getFilteredData();
    const nodes = new window.vis.DataSet();
    const edges = new window.vis.DataSet();
    // Add Center Node with speculative calculations
    nodes.add({
        id: "center",
        label: createCentralNodeLabel(),
        title: createCentralNodeTooltip(), // Tooltip on hover
        x: 0,
        y: 0,
        fixed: true,
        color: "#e94560",
        font: { size: 18, color: "#ffffff" },
        shape: "box",
    });
    // Add Item Nodes and Edges
    ["incomes", "outgoings", "capital"].forEach((type) => {
        dataToRender[type].forEach((item, i) => {
            // Basic positioning for initial render
            let position = { x: 0, y: 0 };
            if (type === "incomes") {
                position = {
                    x: -300,
                    y: i * 120 - (dataToRender.incomes.length - 1) * 60,
                };
            }
            else if (type === "outgoings") {
                position = {
                    x: 300,
                    y: i * 120 - (dataToRender.outgoings.length - 1) * 60,
                };
            }
            else if (type === "capital") {
                position = {
                    y: 300,
                    x: i * 200 - (dataToRender.capital.length - 1) * 100,
                };
            }
            const itemHasNoPosition = item.position === undefined;
            if (itemHasNoPosition) {
                item.position = position;
            }
            const name = "source" in item ? item.source : "destination" in item ? item.destination : item.location;
            const amount = "isAsset" in item && item.isAsset ? item.quantity * item.rate : "amount" in item ? item.amount : 0;
            const nodeData = {
                id: item.id,
                label: `${name}\n${formatCurrency(amount)}\n[${(item.tags || []).join(", ")}]`,
                group: type,
                x: item.position.x,
                y: item.position.y,
                fixed: false,
                groupId: item.groupId,
            };
            nodes.add(nodeData);
            if (!item.groupId) {
                if (type === "incomes") {
                    edges.add({ from: item.id, to: "center", arrows: "to" });
                }
                else if (type === "outgoings") {
                    edges.add({ from: "center", to: item.id, arrows: "to" });
                }
            }
        });
    });
    // Add Speculative Nodes and Edges
    if (state.showSpeculativeNodes) {
        ["speculative-incomes", "speculative-outgoings"].forEach((type) => {
            const speculativeItems = type === "speculative-incomes" ? dataToRender.speculative.incomes : dataToRender.speculative.outgoings;
            const baseType = type === "speculative-incomes" ? "incomes" : "outgoings";
            speculativeItems.forEach((item, i) => {
                // Basic positioning for initial render (offset from regular items)
                let position = { x: 0, y: 0 };
                if (baseType === "incomes") {
                    position = {
                        x: -450, // Further left than regular incomes
                        y: i * 120 - (speculativeItems.length - 1) * 60,
                    };
                }
                else if (baseType === "outgoings") {
                    position = {
                        x: 450, // Further right than regular outgoings
                        y: i * 120 - (speculativeItems.length - 1) * 60,
                    };
                }
                const itemHasNoPosition = item.position === undefined;
                if (itemHasNoPosition) {
                    item.position = position;
                }
                const name = "source" in item ? item.source : item.destination;
                const amount = item.amount;
                const showAsYellow = speculativeDisplayMode === "yellow";
                let nodeData = {
                    id: item.id,
                    label: `${name}\n${formatCurrency(amount)} (${item.likelihood}%)\n[${(item.tags || []).join(", ")}]`,
                    group: baseType,
                    x: item.position.x,
                    y: item.position.y,
                    fixed: false,
                    groupId: item.groupId,
                    isSpeculative: true,
                    likelihood: item.likelihood,
                    description: item.description,
                };
                if (showAsYellow) {
                    nodeData.color = {
                        background: "#FFD700",
                        border: baseType === "incomes" ? "#2ecc71" : "#e74c3c",
                    };
                }
                else {
                    const opacity = Math.max(0.3, item.likelihood / 100);
                    nodeData.color = {
                        background: "#16213e",
                        border: baseType === "incomes" ? "#2ecc71" : "#e74c3c",
                    };
                    nodeData.opacity = opacity;
                }
                nodes.add(nodeData);
                if (!item.groupId) {
                    if (baseType === "incomes") {
                        edges.add({
                            from: item.id,
                            to: "center",
                            arrows: "to",
                            dashes: true, // Dashed lines for speculative items
                            color: { opacity: showAsYellow ? 1 : Math.max(0.3, item.likelihood / 100) },
                        });
                    }
                    else if (baseType === "outgoings") {
                        edges.add({
                            from: "center",
                            to: item.id,
                            arrows: "to",
                            dashes: true, // Dashed lines for speculative items
                            color: { opacity: showAsYellow ? 1 : Math.max(0.3, item.likelihood / 100) },
                        });
                    }
                }
            });
        });
    }
    network.setData({ nodes, edges });
    state.cashFlowData.groups.forEach((groupDefinition) => {
        networkApi.addGroupNode(groupDefinition, calculateGroupTotal(groupDefinition.id));
    });
}
// --- Event Listeners for State Changes ---
function setupStateListeners() {
    on("state:loaded", renderGraph);
    on("filter:changed", renderGraph);
    on("item:added", ({ item, type }) => {
        networkApi.addNode(item, type);
        networkApi.updateCenterNode(createCentralNodeLabel(), createCentralNodeTooltip());
    });
    on("speculative:added", ({ item, type }) => {
        networkApi.addSpeculativeNode(item, type, speculativeDisplayMode === "yellow");
        networkApi.updateCenterNode(createCentralNodeLabel(), createCentralNodeTooltip());
    });
    on("item:updated", ({ item, type, typeChanged }) => {
        if (typeChanged) {
            // This is a complex case that involves changing groups and edges,
            // a full re-render is the safest option for now.
            renderGraph();
        }
        else {
            networkApi.updateNode(item, type);
            networkApi.updateCenterNode(createCentralNodeLabel(), createCentralNodeTooltip());
            if (item.groupId) {
                const { item: group } = findById(item.groupId);
                if (group) {
                    networkApi.updateGroupNode(group, calculateGroupTotal(group.id));
                }
            }
        }
    });
    on("speculative:updated", ({ item, type, typeChanged, }) => {
        if (typeChanged) {
            renderGraph(); // Full re-render for type changes
        }
        else {
            networkApi.updateSpeculativeNode(item, type, speculativeDisplayMode === "yellow");
            networkApi.updateCenterNode(createCentralNodeLabel(), createCentralNodeTooltip());
        }
    });
    on("item:deleted", ({ itemId }) => {
        networkApi.removeNode(itemId);
        networkApi.updateCenterNode(createCentralNodeLabel(), createCentralNodeTooltip());
    });
    on("speculative:deleted", ({ itemId }) => {
        networkApi.removeNode(itemId);
        networkApi.updateCenterNode(createCentralNodeLabel(), createCentralNodeTooltip());
    });
    on("group:added", (group) => {
        networkApi.addGroupNode(group, 0);
    });
    on("group:updated", (group) => {
        networkApi.updateGroupNode(group, calculateGroupTotal(group.id));
    });
    on("item:group-changed", ({ item, previousGroupId }) => {
        const { type } = findById(item.id);
        const newGroupId = item.groupId;
        const previousGroupIdExists = previousGroupId !== null;
        const newGroupIdExists = newGroupId !== null;
        if (previousGroupIdExists) {
            const { item: oldGroup } = findById(previousGroupId);
            const oldGroupExists = oldGroup !== null;
            if (oldGroupExists)
                networkApi.updateGroupNode(oldGroup, calculateGroupTotal(previousGroupId));
        }
        if (newGroupIdExists) {
            const { item: newGroup } = findById(newGroupId);
            const newGroupExists = newGroup !== null;
            if (newGroupExists)
                networkApi.updateGroupNode(newGroup, calculateGroupTotal(newGroupId));
        }
        const itemIsNoLongerInAGroup = previousGroupIdExists && !newGroupIdExists;
        const itemHasNewlyJoinedAGroup = !previousGroupIdExists && newGroupIdExists;
        if (itemIsNoLongerInAGroup) {
            networkApi.addNode(item, type, false);
        }
        if (itemHasNewlyJoinedAGroup) {
            networkApi.removeNode(item.id);
        }
        networkApi.updateCenterNode(createCentralNodeLabel(), createCentralNodeTooltip());
    });
    on("group:deleted", ({ groupId, deleteMembers, originalGroup, deletedItemIds, }) => {
        networkApi.removeGroupNode(groupId);
        if (deleteMembers) {
            deletedItemIds?.forEach((id) => networkApi.removeNode(id));
        }
        else {
            const ungroupedItems = state.cashFlowData[originalGroup.type].filter((item) => item.groupId === null);
            ungroupedItems.forEach((item) => networkApi.addNode(item, originalGroup.type, false));
        }
        networkApi.updateCenterNode(createCentralNodeLabel(), createCentralNodeTooltip());
    });
}
// --- Speculative Display Control ---
/**
 * Toggles between opacity and yellow display modes for speculative nodes.
 */
export function toggleSpeculativeDisplayMode() {
    speculativeDisplayMode = speculativeDisplayMode === "opacity" ? "yellow" : "opacity";
    refreshSpeculativeNodes();
}
/**
 * Updates all speculative nodes to match current display mode.
 */
function refreshSpeculativeNodes() {
    if (!network)
        return;
    const data = getFilteredData();
    const showAsYellow = speculativeDisplayMode === "yellow";
    // Update all speculative income nodes
    data.speculative.incomes.forEach((item) => {
        networkApi.updateSpeculativeNode(item, "speculative-incomes", showAsYellow);
    });
    // Update all speculative outgoing nodes
    data.speculative.outgoings.forEach((item) => {
        networkApi.updateSpeculativeNode(item, "speculative-outgoings", showAsYellow);
    });
}
/**
 * Gets the current speculative display mode.
 */
export function getSpeculativeDisplayMode() {
    return speculativeDisplayMode;
}
// --- Initialization ---
export function initGraph() {
    const options = {
        nodes: {
            shape: "box",
            margin: 10,
            widthConstraint: { maximum: 200 },
            font: { color: "#dcdcdc" },
            borderWidth: 1,
            chosen: {
                node: function (values, id, selected, hovering) {
                    if (selected)
                        values.borderWidth /= 2;
                    if (selected || hovering) {
                        values.shadow = true;
                        values.shadowColor = "rgba(255, 255, 255, 0.6)";
                        values.shadowSize = 15;
                        values.shadowX = 0;
                        values.shadowY = 0;
                    }
                },
            },
        },
        edges: {
            color: { color: "#848484", highlight: "#dcdcdc", hover: "#dcdcdc" },
            arrows: { to: { enabled: true, scaleFactor: 1, type: "arrow" } },
            smooth: { enabled: true, type: "cubicBezier", roundness: 0.7 },
        },
        groups: {
            incomes: {
                color: { background: "#16213e", border: "#2ecc71" },
                borderWidth: 3,
            },
            outgoings: {
                color: { background: "#16213e", border: "#e74c3c" },
                borderWidth: 3,
            },
            capital: {
                color: { background: "#16213e", border: "#3498db" },
                borderWidth: 3,
            },
            clusterNode: {
                shape: "circle",
                color: { background: "#f39c12", border: "#f1c40f" },
                font: { color: "#ffffff", size: 18 },
                size: 40,
                labelHighlightBold: true,
            },
        },
        physics: { enabled: false },
        interaction: {
            hover: true,
            dragNodes: true,
            dragView: true,
            zoomView: false,
            tooltipDelay: 500,
        },
    };
    const data = {
        nodes: new window.vis.DataSet(),
        edges: new window.vis.DataSet(),
    };
    if (network) {
        network.destroy();
    }
    network = new window.vis.Network(elements.graphContainer, data, options);
    // Initialize modules
    networkApi.initNetworkApi(network);
    initInteractions(network);
    attachWheelListener(elements.graphContainer);
    // Subscribe to state changes
    setupStateListeners();
    // Initial render
    renderGraph();
    // Handle graph resizing when sidebars toggle
    elements.sidebarToggle.addEventListener("click", () => {
        setTimeout(() => network.redraw(), 300);
    });
    elements.bottomBarToggle.addEventListener("click", () => {
        setTimeout(() => network.redraw(), 300);
    });
}
