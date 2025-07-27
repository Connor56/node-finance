/**
 * @fileoverview Provides an API for direct manipulation of the vis.js network.
 * This module is intended to be called by listeners subscribed to state events.
 */
import { formatCurrency } from "../utils.js";
let network;
/**
 * Initializes the network API with the vis.js network instance.
 * @param {object} networkInstance The vis.js network instance.
 */
export function initNetworkApi(networkInstance) {
    network = networkInstance;
}
/**
 * Builds a node object for the vis.js network.
 * @param {Item} item The item to build a node object for.
 * @param {ItemType} type The type of item.
 * @returns {any} The node object.
 */
function buildNodeObject(item, type) {
    const isAsset = "isAsset" in item && item.isAsset;
    const name = "source" in item ? item.source : "destination" in item ? item.destination : item.location;
    const amount = isAsset ? item.quantity * item.rate : "amount" in item ? item.amount : 0;
    const label = `${name}\n${formatCurrency(amount)}\n[${(item.tags || []).join(", ")}]`;
    return {
        id: item.id,
        label: label,
        group: type,
        x: item.position?.x,
        y: item.position?.y,
        fixed: false,
        groupId: item.groupId,
    };
}
/**
 * Builds a speculative node object for the vis.js network.
 * @param {SpeculativeIncome | SpeculativeOutgoing} item The speculative item to build a node object for.
 * @param {SpeculativeType} type The type of speculative item.
 * @param {boolean} showAsYellow Whether to show as yellow instead of opacity-based visibility.
 * @returns {any} The node object.
 */
function buildSpeculativeNodeObject(item, type, showAsYellow = false) {
    const name = "source" in item ? item.source : item.destination;
    const amount = item.amount;
    const label = `${name}\n${formatCurrency(amount)} (${item.likelihood}%)\n[${(item.tags || []).join(", ")}]`;
    const baseType = type === "speculative-incomes" ? "incomes" : "outgoings";
    let nodeStyle = {
        id: item.id,
        label: label,
        group: baseType,
        x: item.position?.x,
        y: item.position?.y,
        fixed: false,
        groupId: item.groupId,
        isSpeculative: true,
        likelihood: item.likelihood,
        description: item.description,
    };
    if (showAsYellow) {
        // Yellow highlighting mode
        nodeStyle.color = {
            border: "#FFD700",
        };
        nodeStyle.opacity = 1;
    }
    else {
        // Opacity mode based on likelihood
        const opacity = Math.max(0.05, item.likelihood / 100);
        const baseColor = baseType === "incomes" ? "#16213e" : "#16213e";
        const borderColor = baseType === "incomes" ? "#2ecc71" : "#e74c3c";
        nodeStyle.color = {
            background: baseColor,
            border: borderColor,
        };
        nodeStyle.opacity = opacity;
    }
    return nodeStyle;
}
/**
 * Adds a node to the network.
 * @param {Item} item The item to add.
 * @param {ItemType} type The type of item.
 * @param {boolean} isNew Whether the item is new, i.e. it's not being re-added to the graph because of a group change.
 */
export function addNode(item, type, isNew = true) {
    if (!network)
        return;
    const newNode = buildNodeObject(item, type);
    network.body.data.nodes.add(newNode);
    // Also add the corresponding edge
    if (!item.groupId) {
        if (type === "incomes") {
            network.body.data.edges.add({
                id: `edge_${item.id}`,
                from: item.id,
                to: "center",
                arrows: "to",
            });
        }
        else if (type === "outgoings") {
            network.body.data.edges.add({
                id: `edge_${item.id}`,
                from: "center",
                to: item.id,
                arrows: "to",
            });
        }
    }
    // Pan to the new node
    if (isNew) {
        network.focus(item.id, {
            scale: network.getScale(), // Keep current zoom level
            animation: {
                duration: 1000,
                easingFunction: "easeInOutQuad",
            },
        });
    }
}
export function updateNode(item, type) {
    if (!network)
        return;
    const updatedNode = buildNodeObject(item, type);
    network.body.data.nodes.update(updatedNode);
}
/**
 * Adds a speculative node to the network.
 * @param {SpeculativeItemType} item The speculative item to add.
 * @param {SpeculativeType} type The type of speculative item.
 * @param {boolean} showAsYellow Whether to show as yellow instead of opacity-based visibility.
 * @param {boolean} isNew Whether the item is new.
 */
export function addSpeculativeNode(item, type, showAsYellow = false, isNew = true) {
    if (!network)
        return;
    const newNode = buildSpeculativeNodeObject(item, type, showAsYellow);
    network.body.data.nodes.add(newNode);
    // Add the corresponding edge
    if (!item.groupId) {
        const baseType = type === "speculative-incomes" ? "incomes" : "outgoings";
        if (baseType === "incomes") {
            network.body.data.edges.add({
                id: `edge_${item.id}`,
                from: item.id,
                to: "center",
                arrows: "to",
                dashes: true, // Dashed line for speculative items
            });
        }
        else {
            network.body.data.edges.add({
                id: `edge_${item.id}`,
                from: "center",
                to: item.id,
                arrows: "to",
                dashes: true, // Dashed line for speculative items
            });
        }
    }
    // Pan to the new node
    if (isNew) {
        network.focus(item.id, {
            scale: network.getScale(),
            animation: {
                duration: 1000,
                easingFunction: "easeInOutQuad",
            },
        });
    }
}
export function updateSpeculativeNode(item, type, showAsYellow = false) {
    if (!network)
        return;
    const updatedNode = buildSpeculativeNodeObject(item, type, showAsYellow);
    network.body.data.nodes.update(updatedNode);
}
export function removeNode(itemId) {
    if (!network)
        return;
    try {
        network.body.data.nodes.remove(itemId);
        network.body.data.edges.remove(`edge_${itemId}`);
    }
    catch (e) {
        console.warn(`Could not remove node or edge for ${itemId}:`, e.message);
    }
}
export function addGroupNode(group, total) {
    if (!network)
        return;
    network.body.data.nodes.add({
        id: group.id,
        label: `${group.name}\nTotal: ${formatCurrency(total)}`,
        group: "clusterNode",
        x: group.position?.x || 0,
        y: group.position?.y || 0,
        fixed: false,
    });
    if (group.type === "incomes") {
        network.body.data.edges.add({ from: group.id, to: "center", arrows: "to" });
    }
    else if (group.type === "outgoings") {
        network.body.data.edges.add({ from: "center", to: group.id, arrows: "to" });
    }
}
export function updateGroupNode(group, total) {
    if (!network)
        return;
    network.body.data.nodes.update({
        id: group.id,
        label: `${group.name}\nTotal: ${formatCurrency(total)}`,
    });
}
/**
 * Updates the central node's label and tooltip.
 * @param {string} label The new label for the center node.
 * @param {string} tooltip The tooltip content for the center node.
 */
export function updateCenterNode(label, tooltip) {
    if (!network)
        return;
    network.body.data.nodes.update({
        id: "center",
        label: label,
        title: tooltip,
    });
}
export function openCluster(clusterId) {
    if (!network)
        return;
    network.openCluster(clusterId);
}
export function removeGroupNode(groupId) {
    if (!network)
        return;
    network.body.data.nodes.remove(groupId);
}
