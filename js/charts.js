class ChartManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.charts = {};
        this.initializeCharts();
    }

    initializeCharts() {
        const chartsContainer = document.querySelector('.charts-container');
        chartsContainer.innerHTML = `
            <div class="chart-wrapper">
                <h3>Team Workload Distribution</h3>
                <canvas id="workloadChart"></canvas>
            </div>
            <div class="chart-wrapper">
                <h3>Project Task Distribution</h3>
                <canvas id="projectDistributionChart"></canvas>
            </div>
        `;

        this.setupCharts();
    }

    setupCharts() {
        // Workload Chart
        const workloadCtx = document.getElementById('workloadChart').getContext('2d');
        this.charts.workload = new Chart(workloadCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Current Load (SP)',
                    backgroundColor: 'rgba(33, 150, 243, 0.5)',
                    borderColor: 'rgb(33, 150, 243)',
                    borderWidth: 1,
                    data: []
                }, {
                    label: 'Capacity (SP)',
                    backgroundColor: 'rgba(76, 175, 80, 0.5)',
                    borderColor: 'rgb(76, 175, 80)',
                    borderWidth: 1,
                    data: []
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Story Points'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // Project Distribution Chart
        const distributionCtx = document.getElementById('projectDistributionChart').getContext('2d');
        this.charts.distribution = new Chart(distributionCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        'rgba(33, 150, 243, 0.5)',
                        'rgba(76, 175, 80, 0.5)',
                        'rgba(255, 193, 7, 0.5)',
                        'rgba(244, 67, 54, 0.5)'
                    ],
                    borderColor: [
                        'rgb(33, 150, 243)',
                        'rgb(76, 175, 80)',
                        'rgb(255, 193, 7)',
                        'rgb(244, 67, 54)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateCharts() {
        this.updateWorkloadChart();
        this.updateDistributionChart();
    }

    updateWorkloadChart() {
        const users = this.storage.getUsers();
        const chartData = this.charts.workload.data;
        
        chartData.labels = users.map(user => user.name);
        chartData.datasets[0].data = users.map(user => user.currentLoad);
        chartData.datasets[1].data = users.map(user => user.capacity);
        
        this.charts.workload.update();
    }

    updateDistributionChart() {
        const tasks = this.storage.getTasks();
        const priorityCount = {
            high: 0,
            medium: 0,
            low: 0
        };
        
        tasks.forEach(task => {
            priorityCount[task.priority]++;
        });
        
        const chartData = this.charts.distribution.data;
        chartData.labels = ['High Priority', 'Medium Priority', 'Low Priority'];
        chartData.datasets[0].data = [
            priorityCount.high,
            priorityCount.medium,
            priorityCount.low
        ];
        
        this.charts.distribution.update();
    }
} 