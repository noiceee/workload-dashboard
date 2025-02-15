class ChartManager {
    constructor(storageManager) {
        this.storage = storageManager;
        
        // Test direct localStorage access
        console.log('Direct localStorage check:');
        console.log('Tasks:', JSON.parse(localStorage.getItem('tasks')));
        console.log('Users:', JSON.parse(localStorage.getItem('users')));
        
        // Test storage manager
        console.log('Storage Manager check:');
        console.log('Storage instance:', this.storage);
        console.log('getTasks():', this.storage.getTasks());
        console.log('getUsers():', this.storage.getUsers());
        
        this.charts = {};
        this.initializeCharts();
        
        // Listen for task updates
        document.addEventListener('tasksUpdated', () => {
            console.log('Tasks Updated Event Received');
            this.updateCharts();
        });
        
        document.addEventListener('usersUpdated', () => {
            console.log('Users Updated Event Received');
            this.updateCharts();
        });
    }

    getChartColors() {
        const isDark = document.body.classList.contains('dark');
        return {
            textColor: isDark ? '#CCC' : '#707070',
            gridColor: isDark ? '#3A3B3C' : '#E4E9F7',
            barColors: {
                workload: isDark ? 'rgba(105, 92, 254, 0.8)' : 'rgba(105, 92, 254, 0.8)',
                capacity: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
            }
        };
    }

    initializeCharts() {
        window.addEventListener('themeChanged', () => this.updateChartColors());
        this.setupCharts();
    }

    updateChartColors() {
        const colors = this.getChartColors();
        
        Object.values(this.charts).forEach(chart => {
            if (chart.options && chart.options.scales) {
                Object.values(chart.options.scales).forEach(scale => {
                    if (scale.grid) scale.grid.color = colors.gridColor;
                    if (scale.ticks) scale.ticks.color = colors.textColor;
                });
            }
            
            if (chart.options && chart.options.plugins && chart.options.plugins.legend) {
                chart.options.plugins.legend.labels.color = colors.textColor;
            }
            
            chart.update();
        });
    }

    setupCharts() {
        const colors = this.getChartColors();
        
        // Workload Chart
        const workloadCtx = document.getElementById('workloadChart').getContext('2d');
        this.charts.workload = new Chart(workloadCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Current Load (SP)',
                        data: [],
                        backgroundColor: colors.barColors.workload
                    },
                    {
                        label: 'Capacity (SP)',
                        data: [],
                        backgroundColor: colors.barColors.capacity
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: colors.gridColor
                        },
                        ticks: {
                            color: colors.textColor
                        }
                    },
                    x: {
                        grid: {
                            color: colors.gridColor
                        },
                        ticks: {
                            color: colors.textColor
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: colors.textColor
                        }
                    }
                }
            }
        });

        // Distribution Chart
        const distributionCtx = document.getElementById('distributionChart').getContext('2d');
        this.charts.distribution = new Chart(distributionCtx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        'rgba(105, 92, 254, 0.8)',   // Primary color
                        'rgba(65, 184, 131, 0.8)',   // Green
                        'rgba(255, 184, 0, 0.8)',    // Yellow
                        'rgba(255, 99, 132, 0.8)',   // Red
                        'rgba(54, 162, 235, 0.8)',   // Blue
                        'rgba(153, 102, 255, 0.8)'   // Purple
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: colors.textColor,
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Task Distribution per User',
                        color: colors.textColor,
                        font: {
                            size: 16
                        },
                        padding: {
                            bottom: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} SP (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        this.updateCharts();
    }

    updateCharts() {
        const users = this.storage.getUsers();
        const tasks = this.storage.getTasks();
        
        console.log('Raw Tasks:', tasks);
        console.log('Raw Users:', users);
        
        // Create user ID to name mapping
        const userMap = {};
        users.forEach(user => {
            userMap[user.id] = user.name;
        });
        
        console.log('User ID to Name mapping:', userMap);
        
        // Update workload chart
        const workloadData = {
            labels: users.map(user => user.name),
            currentLoad: users.map(user => {
                const userTasks = tasks.filter(task => task.assignedTo === user.id);
                console.log(`Tasks for ${user.name} (ID: ${user.id}):`, userTasks);
                return userTasks.reduce((sum, task) => sum + (parseInt(task.storyPoints) || 0), 0);
            }),
            capacity: users.map(user => parseInt(user.capacity) || 10)
        };

        console.log('Workload Data:', workloadData);

        this.charts.workload.data.labels = workloadData.labels;
        this.charts.workload.data.datasets[0].data = workloadData.currentLoad;
        this.charts.workload.data.datasets[1].data = workloadData.capacity;
        this.charts.workload.update();

        // Update distribution chart - Now using story points instead of task count
        const distributionData = {
            labels: users.map(user => user.name),
            data: users.map(user => {
                const userStoryPoints = tasks
                    .filter(task => task.assignedTo === user.id)
                    .reduce((sum, task) => sum + (parseInt(task.storyPoints) || 0), 0);
                console.log(`Story points for ${user.name}:`, userStoryPoints);
                return userStoryPoints;
            })
        };

        // Update pie chart configuration
        this.charts.distribution.options.plugins.tooltip = {
            callbacks: {
                label: function(context) {
                    const label = context.label || '';
                    const value = context.raw || 0;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = Math.round((value / total) * 100);
                    return `${label}: ${value} SP (${percentage}%)`;
                }
            }
        };

        this.charts.distribution.data.labels = distributionData.labels;
        this.charts.distribution.data.datasets[0].data = distributionData.data;
        this.charts.distribution.update();
    }
} 