/**
 * @fileoverview Manages user interactions with the graph, such as clicks and drags.
 */
import { findById, updateNodePosition, state as appState, updateItemPosition } from "../state.js";
import { openEditModal } from "../components/item-modal.js";
import { openGroupEditModal } from "../components/group-modal.js";
import { showDeleteConfirmation } from "../components/delete-modal.js";
import { deleteItem, deleteGroupAndUngroupItems, deleteGroupAndItems, deleteSpeculativeItem } from "../state.js";
let network;
/**
 * Initializes the interaction handlers with the vis.js network instance.
 * @param {object} networkInstance The vis.js network instance.
 */
export function initInteractions(networkInstance) {
    network = networkInstance;
    network.on("doubleClick", handleDoubleClick);
    network.on("oncontext", handleRightClick);
    network.on("dragStart", handleDragStart);
    network.on("dragEnd", handleDragEnd);
}
/**
 * Handles double clicks on nodes.
 * @param {any} params The parameters from the vis.js event.
 */
function handleDoubleClick(params) {
    if (params.nodes.length === 0)
        return;
    const nodeId = params.nodes[0];
    const nodeIsNotTheCenterNode = nodeId !== "center";
    const nodeIsAGroup = nodeId.startsWith("group_");
    if (nodeIsAGroup) {
        openGroupEditModal(nodeId);
    }
    else if (nodeIsNotTheCenterNode) {
        const { item, type } = findById(nodeId);
        if (item && type !== "groups") {
            console.log("item", item, type);
            openEditModal(item, type);
        }
    }
}
function handleRightClick(params) {
    params.event.preventDefault();
    const nodeId = network.getNodeAt(params.pointer.DOM);
    if (!nodeId || nodeId === "center")
        return;
    const nodeIsSpeculative = nodeId.startsWith("speculative_");
    if (nodeIsSpeculative) {
        console.log("hi");
        showDeleteConfirmation({
            isGroup: false,
            onConfirm: () => deleteSpeculativeItem(nodeId),
            onUngroup: () => deleteGroupAndUngroupItems(nodeId),
            onConfirmAll: () => deleteGroupAndItems(nodeId),
        });
    }
    else {
        const nodeIsAGroup = nodeId.startsWith("group_");
        showDeleteConfirmation({
            isGroup: nodeIsAGroup,
            onConfirm: () => deleteItem(nodeId),
            onUngroup: () => deleteGroupAndUngroupItems(nodeId),
            onConfirmAll: () => deleteGroupAndItems(nodeId),
        });
    }
}
function handleDragStart() {
    appState.nodePositionsBeforeDrag = new Map(Object.entries(network.getPositions()));
}
function handleDragEnd(params) {
    if (params.nodes.length > 0) {
        const draggedNodeId = params.nodes[0];
        const newPos = network.getPositions([draggedNodeId])[draggedNodeId];
        updateNodePosition(draggedNodeId, newPos);
        updateItemPosition(draggedNodeId, newPos);
    }
    appState.nodePositionsBeforeDrag = null;
}
/**
 * Attaches a custom wheel listener for zooming and panning.
 * @param {HTMLElement} container The graph container element.
 */
export function attachWheelListener(container) {
    container.addEventListener("wheel", (event) => {
        if (!network)
            return;
        event.preventDefault();
        if (event.ctrlKey || event.metaKey) {
            // Zooming
            const scale = network.getScale();
            const newScale = event.deltaY < 0 ? scale * 1.2 : scale / 1.2;
            network.moveTo({ scale: newScale });
        }
        else if (event.shiftKey) {
            // Panning left to right
            const currentPosition = network.getViewPosition();
            const scale = network.getScale();
            network.moveTo({
                position: {
                    x: currentPosition.x + event.deltaY / scale,
                    y: currentPosition.y + event.deltaX / scale,
                },
            });
        }
        else {
            // Panning up and down
            const currentPosition = network.getViewPosition();
            const scale = network.getScale();
            network.moveTo({
                position: {
                    x: currentPosition.x + event.deltaX / scale,
                    y: currentPosition.y + event.deltaY / scale,
                },
            });
        }
    });
}
