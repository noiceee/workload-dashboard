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

    editUser(userId) {
        const user = this.storage.data.users.find(u => u.id === userId);
        if (user) {
            // Populate form fields
            document.getElementById('userId').value = user.id;
            document.getElementById('userName').value = user.name;
            document.getElementById('userRole').value = user.role;
            document.getElementById('userCapacity').value = user.capacity;

            // Update button text
            const submitButton = document.querySelector('#userForm button[type="submit"]');
            submitButton.innerHTML = '<i class="fas fa-save"></i> Update User';

            // Scroll to form
            document.querySelector('.user-form').scrollIntoView({ behavior: 'smooth' });
        }
    }

    deleteUser(userId) {
        if (confirm('Are you sure you want to delete this user?')) {
            // Check if user has assigned tasks
            const hasAssignedTasks = this.storage.data.tasks.some(task => task.assignedTo === userId);
            
            if (hasAssignedTasks) {
                alert('This user has assigned tasks. Please reassign or delete the tasks first.');
                return;
            }

            this.storage.data.users = this.storage.data.users.filter(user => user.id !== userId);
            this.storage.saveToLocalStorage();
            this.renderUsersList();
            this.showNotification('User deleted successfully!', 'success');

            // Reset form if the deleted user was being edited
            if (document.getElementById('userId').value === userId) {
                this.resetForm();
            }

            // Dispatch event to update task manager
            window.dispatchEvent(new CustomEvent('usersUpdated'));
        }
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
            // Preserve current load when updating user
            userData.currentLoad = this.storage.data.users[existingUserIndex].currentLoad;
            this.storage.data.users[existingUserIndex] = userData;
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

    resetForm() {
        document.getElementById('userForm').reset();
        document.getElementById('userId').value = '';
        const submitButton = document.querySelector('#userForm button[type="submit"]');
        submitButton.innerHTML = '<i class="fas fa-save"></i> Save User';
    }

    setupEventListeners() {
        document.getElementById('userForm').addEventListener('submit', (e) => this.saveUser(e));
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    renderUsersList() {
        const usersList = document.querySelector('.users-list');
        usersList.innerHTML = this.storage.data.users.map(user => {
            const utilizationRate = (user.currentLoad / user.capacity) * 100;
            const getUtilizationColor = (rate) => {
                if (rate > 100) return 'var(--danger-color)';
                if (rate > 80) return 'var(--warning-color)';
                return 'var(--success-color)';
            };

            const getRoleShorthand = (role) => {
                switch(role) {
                    case 'developer': return 'DEV';
                    case 'designer': return 'DES';
                    case 'manager': return 'MGR';
                    default: return role.toUpperCase();
                }
            };

            return `
                <div class="user-card animate-in">
                    <h3>
                        ${user.name}
                        <span class="role-badge ${user.role}">${getRoleShorthand(user.role)}</span>
                    </h3>
                    <div class="user-info">
                        <p>Capacity: ${user.capacity} SP</p>
                        <p>Current Load: ${user.currentLoad} SP</p>
                        <div class="capacity-meter">
                            <div class="capacity-fill" style="width: ${Math.min(utilizationRate, 100)}%; 
                                background: ${getUtilizationColor(utilizationRate)}">
                            </div>
                        </div>
                        <p class="utilization-text">
                            Utilization: ${Math.round(utilizationRate)}%
                            ${utilizationRate > 100 ? ' (Overallocated)' : ''}
                        </p>
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
} 