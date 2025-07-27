const events = new Map();
/**
 * Subscribes to an event.
 * @param {string} eventName The name of the event to subscribe to.
 * @param {function} callback The function to call when the event is emitted.
 */
export function on(eventName, callback) {
    if (!events.has(eventName)) {
        events.set(eventName, []);
    }
    events.get(eventName).push(callback);
}
/**
 * Emits an event, calling all subscribed callbacks.
 * @param {string} eventName The name of the event to emit.
 * @param {*} [data] The data to pass to the callbacks.
 */
export function emit(eventName, data) {
    if (events.has(eventName)) {
        events.get(eventName).forEach((callback) => callback(data));
    }
}
