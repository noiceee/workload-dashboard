class TaskManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.initializeTaskManager();
        
        // Add this event listener
        window.addEventListener('usersUpdated', () => {
            this.setupTaskForm(); // Refresh the form with updated user list
        });
    }

    initializeTaskManager() {
        this.setupTaskForm();
        this.renderTasksList();
        this.setupEventListeners();
    }

    setupTaskForm() {
        const taskForm = `
            <form id="taskForm" class="animated-form">
                <input type="hidden" id="taskId">
                <div class="form-row">
                    <div class="form-group">
                        <label>Task Name</label>
                        <input type="text" id="taskName" placeholder="Enter task name" required>
                    </div>
                    <div class="form-group">
                        <label>Story Points</label>
                        <input type="number" id="storyPoints" min="1" placeholder="Enter story points" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Assign To</label>
                        <select id="assignedUser" required>
                            <option value="">Select User</option>
                            ${this.generateUserOptions()}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Priority</label>
                        <select id="taskPriority" required>
                            <option value="high">High Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="low">Low Priority</option>
                        </select>
                    </div>
                </div>
                <button type="submit" class="btn-primary">
                    <i class="fas fa-plus"></i> Add Task
                </button>
            </form>
        `;
        document.querySelector('.task-form').innerHTML = taskForm;
    }

    generateUserOptions() {
        return this.storage.data.users.map(user => 
            `<option value="${user.id}">${user.name} (${user.currentLoad}/${user.capacity} SP)</option>`
        ).join('');
    }

    setupEventListeners() {
        // Ensure form exists before adding listener
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => this.saveTask(e));
        }

        // Listen for user updates to refresh the form
        window.addEventListener('usersUpdated', () => {
            this.setupTaskForm();
            this.renderTasksList();
        });
    }

    saveTask(e) {
        e.preventDefault();
        
        const taskData = {
            id: document.getElementById('taskId').value || Date.now().toString(),
            name: document.getElementById('taskName').value,
            storyPoints: parseInt(document.getElementById('storyPoints').value),
            assignedTo: document.getElementById('assignedUser').value,
            priority: document.getElementById('taskPriority').value
        };

        // Validate story points
        if (taskData.storyPoints <= 0) {
            this.showNotification('Story points must be greater than 0', 'error');
            return;
        }

        // Check user capacity before saving
        const assignedUser = this.storage.data.users.find(u => u.id === taskData.assignedTo);
        if (!assignedUser) {
            this.showNotification('Please select a valid user', 'error');
            return;
        }

        const existingTask = this.storage.data.tasks.find(t => t.id === taskData.id);
        const oldStoryPoints = existingTask ? existingTask.storyPoints : 0;
        const newTotalLoad = assignedUser.currentLoad - oldStoryPoints + taskData.storyPoints;

        if (newTotalLoad > assignedUser.capacity * 1.5) { // Allow overallocation up to 150%
            if (!confirm(`Warning: This will overallocate ${assignedUser.name}. Proceed anyway?`)) {
                return;
            }
        }

        // Update user's current load
        if (existingTask) {
            // If task existed and was assigned to someone else, update old user's load
            if (existingTask.assignedTo !== taskData.assignedTo) {
                const oldUser = this.storage.data.users.find(u => u.id === existingTask.assignedTo);
                if (oldUser) {
                    oldUser.currentLoad -= existingTask.storyPoints;
                }
            }
        }

        // Update new user's load
        assignedUser.currentLoad = newTotalLoad;

        // Save task
        const taskIndex = this.storage.data.tasks.findIndex(t => t.id === taskData.id);
        if (taskIndex !== -1) {
            this.storage.data.tasks[taskIndex] = taskData;
        } else {
            this.storage.data.tasks.push(taskData);
        }

        this.storage.saveToLocalStorage();
        this.resetForm();
        this.renderTasksList();
        this.setupTaskForm(); // Refresh form to update user options
        this.showNotification('Task saved successfully!', 'success');

        // Trigger dashboard update
        window.dispatchEvent(new CustomEvent('tasksUpdated'));
    }

    resetForm() {
        const form = document.getElementById('taskForm');
        if (form) {
            form.reset();
            document.getElementById('taskId').value = '';
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.innerHTML = '<i class="fas fa-plus"></i> Add Task';
        }
    }

    editTask(taskId) {
        const task = this.storage.data.tasks.find(t => t.id === taskId);
        if (task) {
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskName').value = task.name;
            document.getElementById('storyPoints').value = task.storyPoints;
            document.getElementById('assignedUser').value = task.assignedTo;
            document.getElementById('taskPriority').value = task.priority;
        }
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            const taskIndex = this.storage.data.tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                const task = this.storage.data.tasks[taskIndex];
                const user = this.storage.data.users.find(u => u.id === task.assignedTo);
                if (user) {
                    user.currentLoad -= task.storyPoints;
                }
                this.storage.data.tasks.splice(taskIndex, 1);
                this.storage.saveToLocalStorage();
                this.renderTasksList();
                this.setupTaskForm(); // Refresh the form to update user options
                this.showNotification('Task deleted successfully!', 'success');
            }
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    renderTasksList() {
        const tasksList = document.querySelector('.task-list');
        if (this.storage.data.tasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>No Tasks Yet</h3>
                    <p>Add your first task using the form above</p>
                </div>
            `;
            return;
        }

        tasksList.innerHTML = this.storage.data.tasks.map(task => {
            const assignedUser = this.storage.data.users.find(u => u.id === task.assignedTo);
            return `
                <div class="task-card priority-${task.priority}">
                    <div class="task-header">
                        <h3>${task.name}</h3>
                        <span class="story-points">${task.storyPoints} SP</span>
                    </div>
                    <div class="task-body">
                        <p>
                            <span>Assigned to:</span>
                            <strong>${assignedUser ? assignedUser.name : 'Unassigned'}</strong>
                        </p>
                        <p>
                            <span>Priority:</span>
                            <span class="priority-badge ${task.priority}">${task.priority}</span>
                        </p>
                    </div>
                    <div class="task-actions">
                        <button onclick="app.taskManager.editTask('${task.id}')" class="btn-icon" title="Edit Task">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="app.taskManager.deleteTask('${task.id}')" class="btn-icon" title="Delete Task">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
} 