class ExportManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const exportBtn = document.getElementById('exportToExcel');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToExcel());
        }
    }

    exportToExcel() {
        try {
            // Create workbook
            const wb = XLSX.utils.book_new();
            
            // Add Users worksheet
            const usersWS = XLSX.utils.json_to_sheet(this.formatUsersData());
            XLSX.utils.book_append_sheet(wb, usersWS, "Users");
            
            // Add Tasks worksheet
            const tasksWS = XLSX.utils.json_to_sheet(this.formatTasksData());
            XLSX.utils.book_append_sheet(wb, tasksWS, "Tasks");
            
            // Add Summary worksheet
            const summaryWS = XLSX.utils.json_to_sheet(this.generateSummaryData());
            XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");

            // Generate Excel file
            const fileName = `team_bandwidth_${this.getFormattedDate()}.xlsx`;
            XLSX.writeFile(wb, fileName);

            this.showNotification('Excel file exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Failed to export Excel file', 'error');
        }
    }

    formatUsersData() {
        return this.storage.data.users.map(user => ({
            'Name': user.name,
            'Role': user.role,
            'Capacity (SP)': user.capacity,
            'Current Load (SP)': user.currentLoad,
            'Utilization (%)': Math.round((user.currentLoad / user.capacity) * 100) + '%'
        }));
    }

    formatTasksData() {
        return this.storage.data.tasks.map(task => {
            const assignedUser = this.storage.data.users.find(u => u.id === task.assignedTo);
            return {
                'Task Name': task.name,
                'Story Points': task.storyPoints,
                'Assigned To': assignedUser ? assignedUser.name : 'Unassigned',
                'Priority': task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
            };
        });
    }

    generateSummaryData() {
        const users = this.storage.data.users;
        const tasks = this.storage.data.tasks;

        // Calculate totals
        const totalCapacity = users.reduce((sum, user) => sum + user.capacity, 0);
        const totalLoad = users.reduce((sum, user) => sum + user.currentLoad, 0);
        const totalTasks = tasks.length;

        // Calculate priority distribution
        const priorities = tasks.reduce((acc, task) => {
            acc[task.priority] = (acc[task.priority] || 0) + 1;
            return acc;
        }, {});

        // Calculate role distribution
        const roles = users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {});

        return [
            { 'Metric': 'Total Team Members', 'Value': users.length },
            { 'Metric': 'Total Tasks', 'Value': totalTasks },
            { 'Metric': 'Total Capacity (SP)', 'Value': totalCapacity },
            { 'Metric': 'Total Allocated (SP)', 'Value': totalLoad },
            { 'Metric': 'Team Utilization (%)', 'Value': Math.round((totalLoad / totalCapacity) * 100) + '%' },
            { 'Metric': 'High Priority Tasks', 'Value': priorities.high || 0 },
            { 'Metric': 'Medium Priority Tasks', 'Value': priorities.medium || 0 },
            { 'Metric': 'Low Priority Tasks', 'Value': priorities.low || 0 },
            { 'Metric': 'Developers', 'Value': roles.developer || 0 },
            { 'Metric': 'Designers', 'Value': roles.designer || 0 },
            { 'Metric': 'Managers', 'Value': roles.manager || 0 }
        ];
    }

    getFormattedDate() {
        const date = new Date();
        return date.toISOString().split('T')[0];
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
} 