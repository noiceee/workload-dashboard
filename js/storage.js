class StorageManager {
    constructor() {
        this.storageKey = 'teamBandwidthData';
        this.data = {
            users: [],
            tasks: []
        };
    }

    saveToLocalStorage() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        // Dispatch event for other components to update
        window.dispatchEvent(new CustomEvent('storageUpdated'));
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            this.data = JSON.parse(saved);
        } else {
            // Initialize with empty data structure
            this.data = {
                users: [],
                tasks: []
            };
            this.saveToLocalStorage();
        }
    }

    clearStorage() {
        localStorage.removeItem(this.storageKey);
        this.data = {
            users: [],
            tasks: []
        };
        this.saveToLocalStorage();
    }

    // Helper methods for data access
    getUsers() {
        return this.data.users;
    }

    getTasks() {
        return this.data.tasks;
    }

    getUserById(id) {
        return this.data.users.find(user => user.id === id);
    }

    getTaskById(id) {
        return this.data.tasks.find(task => task.id === id);
    }

    exportToGoogleSheets() {
        // Implementation for Google Sheets export
    }
} 