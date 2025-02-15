class UserManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.initializeUserManager();
    }

    initializeUserManager() {
        this.setupUserForm();
        this.renderUsersList();
        this.setupEventListeners();
    }

    setupUserForm() {
        const userForm = `
            <form id="userForm" class="animated-form">
                <input type="hidden" id="userId">
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" id="userName" required>
                </div>
                <div class="form-group">
                    <label>Role</label>
                    <select id="userRole" required>
                        <option value="developer">Developer</option>
                        <option value="designer">Designer</option>
                        <option value="manager">Manager</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Capacity (Story Points/Sprint)</label>
                    <input type="number" id="userCapacity" min="1" max="100" required>
                </div>
                <button type="submit" class="btn-primary">
                    <i class="fas fa-save"></i> Save User
                </button>
            </form>
        `;
        document.querySelector('.user-form').innerHTML = userForm;
    }

    setupEventListeners() {
        document.getElementById('userForm').addEventListener('submit', (e) => this.saveUser(e));
    }

    saveUser(e) {
        e.preventDefault();
        const userData = {
            id: document.getElementById('userId').value || Date.now().toString(),
            name: document.getElementById('userName').value,
            role: document.getElementById('userRole').value,
            capacity: parseInt(document.getElementById('userCapacity').value),
            currentLoad: 0
        };

        const existingUserIndex = this.storage.data.users.findIndex(u => u.id === userData.id);
        if (existingUserIndex !== -1) {
            this.storage.data.users[existingUserIndex] = {
                ...this.storage.data.users[existingUserIndex],
                ...userData
            };
        } else {
            this.storage.data.users.push(userData);
        }

        this.storage.saveToLocalStorage();
        this.resetForm();
        this.renderUsersList();
        this.showNotification('User saved successfully!', 'success');

        // Dispatch event to update task manager
        window.dispatchEvent(new CustomEvent('usersUpdated'));
    }

    renderUsersList() {
        const usersList = document.querySelector('.users-list');
        usersList.innerHTML = this.storage.data.users.map(user => {
            const utilizationRate = (user.currentLoad / user.capacity) * 100;
            return `
                <div class="user-card animate-in">
                    <h3>
                        ${user.name}
                        <span class="role-badge ${user.role}">${user.role}</span>
                    </h3>
                    <div class="user-info">
                        <p>Capacity: ${user.capacity} SP</p>
                        <p>Current Load: ${user.currentLoad} SP</p>
                        <div class="capacity-wrapper">
                            <div class="capacity-meter">
                                <div class="capacity-fill" style="width: ${Math.min(utilizationRate, 100)}%"></div>
                            </div>
                            <span class="workload-percentage">${Math.round(utilizationRate)}%</span>
                        </div>
                    </div>
                    <div class="user-actions">
                        <button onclick="app.userManager.editUser('${user.id}')" class="btn-icon">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="app.userManager.deleteUser('${user.id}')" class="btn-icon">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
} 