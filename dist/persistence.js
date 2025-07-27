// Global variable for your database instance
let DB = null;
/**
 * Initializes the database.
 * Call this ONCE when your app starts up, e.g., in your main component's useEffect.
 */
export function initDB() {
    return new Promise((resolve, reject) => {
        // Open (or create) your database named 'saved-states' at version 1
        const request = indexedDB.open("saved-states", 1);
        // This runs ONLY when the database is first created or its version changes.
        // It's where you define your "tables" (object stores).
        request.onupgradeneeded = (event) => {
            DB = event.target.result;
            // Create your 'savedStates' object store.
            // 'id' is the unique key, and 'autoIncrement: true' makes it generate itself.
            if (!DB.objectStoreNames.contains("savedStates")) {
                DB.createObjectStore("savedStates", { keyPath: "id", autoIncrement: true });
                console.log("Object store 'savedStates' created.");
            }
        };
        // This runs when the database is successfully opened.
        request.onsuccess = (event) => {
            DB = event.target.result;
            console.log("Database opened.");
            resolve();
        };
        // Handles any errors during database opening.
        request.onerror = (event) => {
            console.error("DB Error:", event.target.error);
            reject(event.target.error);
        };
    });
}
/**
 * Saves a state to the database.
 * @param stateToSave - The state to save.
 * @returns A promise that resolves to the ID of the saved state.
 */
export function saveState(stateToSave) {
    return new Promise(async (resolve, reject) => {
        // Make sure the DB is open before doing anything.
        if (!DB)
            await initDB();
        if (!DB)
            return reject(new Error("Database not ready."));
        // Start a 'readwrite' transaction on your 'savedStates' store.
        const transaction = DB.transaction(["savedStates"], "readwrite");
        const store = transaction.objectStore("savedStates");
        // Important: Handle transaction completion/errors too.
        transaction.oncomplete = () => console.log("Save transaction complete.");
        transaction.onerror = (event) => reject(event.target.error);
        // Use .put() to either add a new state (if no 'id' or 'id' doesn't exist)
        // or update an existing state (if 'id' exists).
        const request = store.put(stateToSave);
        request.onsuccess = (event) => {
            resolve(event.target.result); // Returns the ID of the saved item
        };
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}
/**
 * Loads a state from the database by its ID.
 * @param id - The ID of the state to load.
 * @returns A promise that resolves to the state if it exists, or undefined if it doesn't.
 */
export function loadState(id) {
    return new Promise(async (resolve, reject) => {
        if (!DB)
            await initDB();
        if (!DB)
            return reject(new Error("Database not ready."));
        // Start a 'readonly' transaction.
        const transaction = DB.transaction(["savedStates"], "readonly");
        const store = transaction.objectStore("savedStates");
        transaction.oncomplete = () => console.log("Load transaction complete.");
        transaction.onerror = (event) => reject(event.target.error);
        // Get the item by its 'id'.
        const request = store.get(id);
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}
/**
 * Gets the metadata for all saved states, this powers the saved states list.
 * @returns A promise that resolves to an array of saved state metadata.
 */
export function getSavedStateMetadata() {
    return new Promise(async (resolve, reject) => {
        if (!DB)
            await initDB();
        if (!DB)
            return reject(new Error("Database not ready."));
        const transaction = DB.transaction(["savedStates"], "readonly");
        const store = transaction.objectStore("savedStates");
        transaction.oncomplete = () => console.log("Get metadata transaction complete.");
        transaction.onerror = (event) => reject(event.target.error);
        const request = store.getAll();
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}
/**
 * Deletes a saved state from the database by its ID.
 * @param id - The ID of the state to delete.
 * @returns A promise that resolves when the state is deleted.
 */
export function deleteSavedState(id) {
    return new Promise(async (resolve, reject) => {
        if (!DB)
            await initDB();
        if (!DB)
            return reject(new Error("Database not ready."));
        const transaction = DB.transaction(["savedStates"], "readwrite");
        const store = transaction.objectStore("savedStates");
        transaction.oncomplete = () => console.log("Delete transaction complete.");
        transaction.onerror = (event) => reject(event.target.error);
        const request = store.delete(id);
        request.onsuccess = () => {
            resolve();
        };
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}
