class BandwidthAnalyzer {
    constructor() {
        this.employees = new Map();
        this.STANDARD_HOURS = 40; // Standard working hours per week
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('addProject').addEventListener('click', () => this.addProjectInput());
        document.getElementById('employeeForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        document.getElementById('excelUpload').addEventListener('change', (e) => this.handleExcelUpload(e));
        document.getElementById('searchEmployee').addEventListener('input', (e) => this.handleSearch(e));
    }

    addProjectInput() {
        const projectInputs = document.getElementById('projectInputs');
        const projectDiv = document.createElement('div');
        projectDiv.className = 'project-input';
        projectDiv.innerHTML = `
            <input type="text" class="project-name" placeholder="Project Name">
            <input type="number" class="project-hours" placeholder="Hours/Week">
            <button type="button" class="remove-project">Remove</button>
        `;
        
        projectDiv.querySelector('.remove-project').addEventListener('click', () => {
            projectDiv.remove();
        });
        
        projectInputs.appendChild(projectDiv);
    }

    handleFormSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('employeeName').value;
        const workingHours = parseInt(document.getElementById('workingHours').value);
        const projects = [];

        document.querySelectorAll('.project-input').forEach(project => {
            projects.push({
                name: project.querySelector('.project-name').value,
                hours: parseInt(project.querySelector('.project-hours').value)
            });
        });

        this.addEmployee(name, workingHours, projects);
        this.updateAnalysis();
        e.target.reset();
        document.getElementById('projectInputs').innerHTML = '';
    }

    async handleExcelUpload(e) {
        const file = e.target.files[0];
        const data = await this.readExcelFile(file);
        this.processExcelData(data);
    }

    async readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                resolve(XLSX.utils.sheet_to_json(firstSheet));
            };
            reader.readAsArrayBuffer(file);
        });
    }

    processExcelData(data) {
        data.forEach(row => {
            this.addEmployee(row.Name, row.WorkingHours, this.parseProjects(row));
        });
        this.updateAnalysis();
    }

    parseProjects(row) {
        const projects = [];
        Object.keys(row).forEach(key => {
            if (key.startsWith('Project_')) {
                projects.push({
                    name: key.replace('Project_', ''),
                    hours: parseInt(row[key])
                });
            }
        });
        return projects;
    }

    addEmployee(name, workingHours, projects) {
        this.employees.set(name, {
            workingHours,
            projects,
            totalAssignedHours: projects.reduce((sum, project) => sum + project.hours, 0)
        });
    }

    calculateBandwidth(employee) {
        const utilizationRate = (employee.totalAssignedHours / employee.workingHours) * 100;
        if (utilizationRate < 80) return 'Available';
        if (utilizationRate <= 100) return 'Busy';
        return 'Overloaded';
    }

    updateAnalysis() {
        const resultsDiv = document.getElementById('analysisResults');
        resultsDiv.innerHTML = '';

        this.employees.forEach((data, name) => {
            const status = this.calculateBandwidth(data);
            const utilizationRate = (data.totalAssignedHours / data.workingHours) * 100;

            const employeeCard = document.createElement('div');
            employeeCard.className = 'employee-card';
            employeeCard.innerHTML = `
                <h3>${name}</h3>
                <p>Working Hours: ${data.workingHours}/week</p>
                <p>Assigned Hours: ${data.totalAssignedHours}/week</p>
                <div class="workload-meter">
                    <div class="workload-fill" style="width: ${Math.min(utilizationRate, 100)}%"></div>
                </div>
                <span class="status-indicator status-${status.toLowerCase()}">${status}</span>
                <h4>Projects:</h4>
                <ul>
                    ${data.projects.map(project => `
                        <li>${project.name}: ${project.hours} hours/week</li>
                    `).join('')}
                </ul>
            `;
            resultsDiv.appendChild(employeeCard);
        });
    }

    handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('.employee-card').forEach(card => {
            const name = card.querySelector('h3').textContent.toLowerCase();
            card.style.display = name.includes(searchTerm) ? 'block' : 'none';
        });
    }
}

// Initialize the analyzer
const analyzer = new BandwidthAnalyzer(); 