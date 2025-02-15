class DashboardManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.initializeDashboard();
        this.setupEventListeners();
    }

    initializeDashboard() {
        this.updateDashboard();
    }

    setupEventListeners() {
        // Listen for storage updates
        window.addEventListener('storageUpdated', () => {
            this.updateDashboard();
        });
    }

    updateDashboard() {
        this.updateTeamSummary();
        this.updateWorkloadSummary();
        this.updateRecentTasks();
    }

    updateTeamSummary() {
        const users = this.storage.getUsers();
        const tasks = this.storage.getTasks();
        
        const teamSummary = document.getElementById('teamSummary');
        if (!teamSummary) return;

        const totalCapacity = users.reduce((sum, user) => sum + user.capacity, 0);
        const totalAssigned = users.reduce((sum, user) => sum + user.currentLoad, 0);
        
        teamSummary.innerHTML = `
            <div class="stat">
                <span>Total Team Members:</span>
                <strong>${users.length}</strong>
            </div>
            <div class="stat">
                <span>Active Tasks:</span>
                <strong>${tasks.length}</strong>
            </div>
            <div class="stat">
                <span>Team Capacity:</span>
                <strong>${totalCapacity} SP</strong>
            </div>
            <div class="stat">
                <span>Allocated:</span>
                <strong>${totalAssigned} SP (${Math.round((totalAssigned/totalCapacity) * 100)}%)</strong>
            </div>
        `;
    }

    updateWorkloadSummary() {
        const users = this.storage.getUsers();
        const workloadSummary = document.getElementById('workloadSummary');
        if (!workloadSummary) return;

        workloadSummary.innerHTML = users.map(user => {
            const utilizationRate = (user.currentLoad / user.capacity) * 100;
            return `
                <div class="user-workload">
                    <div class="user-info">
                        <span>${user.name}</span>
                        <span>${Math.round(utilizationRate)}%</span>
                    </div>
                    <div class="workload-meter">
                        <div class="workload-fill" style="width: ${Math.min(utilizationRate, 100)}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateRecentTasks() {
        const tasks = this.storage.getTasks();
        const recentTasks = document.getElementById('recentTasks');
        if (!recentTasks) return;

        if (tasks.length === 0) {
            recentTasks.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <p>No tasks available</p>
                </div>
            `;
            return;
        }

        const sortedTasks = [...tasks]
            .sort((a, b) => b.id - a.id)
            .slice(0, 5);

        recentTasks.innerHTML = sortedTasks.map(task => {
            const user = this.storage.getUserById(task.assignedTo);
            return `
                <div class="task-item priority-${task.priority}">
                    <div class="task-info">
                        <strong>${task.name}</strong>
                        <span>${task.storyPoints} SP</span>
                    </div>
                    <div class="task-meta">
                        <span>${user ? user.name : 'Unassigned'}</span>
                        <span class="priority-badge ${task.priority}">${task.priority}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
} 