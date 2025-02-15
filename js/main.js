class AppManager {
    constructor() {
        this.currentTab = 'dashboard';
        this.isMobile = window.innerWidth <= 768;
        this.initializeApp();
    }

    initializeApp() {
        this.storage = new StorageManager();
        this.storage.loadFromLocalStorage();
        
        this.userManager = new UserManager(this.storage);
        this.taskManager = new TaskManager(this.storage);
        this.chartManager = new ChartManager(this.storage);
        this.exportManager = new ExportManager(this.storage);
        this.dashboardManager = new DashboardManager(this.storage);

        this.setupEventListeners();
        this.setupNavigation();
        this.setupThemeToggle();
    }

    setupNavigation() {
        if (this.isMobile) {
            this.setupMobileNav();
        } else {
            this.setupDesktopNav();
        }
    }

    setupDesktopNav() {
        const sidebar = document.querySelector('.sidebar');
        
        // Ensure mobile nav is removed if it exists
        const mobileNav = sidebar.querySelector('.mobile-nav');
        if (mobileNav) {
            mobileNav.remove();
        }

        // Setup desktop sidebar
        if (!sidebar.querySelector('.sidebar-menu')) {
            const sidebarContent = `
                <div class="sidebar-header">
                    <i class="fas fa-bars hamburger-icon"></i>
                    <span class="sidebar-title">Team Bandwidth</span>
                </div>
                <ul class="sidebar-menu">
                    <li data-tab="dashboard" class="active">
                        <i class="fas fa-home"></i>
                        <span>Dashboard</span>
                    </li>
                    <li data-tab="users">
                        <i class="fas fa-users"></i>
                        <span>Manage Users</span>
                    </li>
                    <li data-tab="tasks">
                        <i class="fas fa-tasks"></i>
                        <span>Task Allocation</span>
                    </li>
                    <li data-tab="analytics">
                        <i class="fas fa-chart-bar"></i>
                        <span>Analytics</span>
                    </li>
                    <li data-tab="import-export">
                        <i class="fas fa-file-export"></i>
                        <span>Import/Export</span>
                    </li>
                </ul>
            `;
            sidebar.innerHTML = sidebarContent;
        }
    }

    setupMobileNav() {
        const isMobile = window.innerWidth <= 768;
        const sidebar = document.querySelector('.sidebar');
        
        if (isMobile) {
            const mobileNav = document.createElement('div');
            mobileNav.className = 'mobile-nav';
            
            const menuItems = [
                { id: 'dashboard', icon: 'home', label: 'Dashboard' },
                { id: 'users', icon: 'users', label: 'Users' },
                { id: 'tasks', icon: 'tasks', label: 'Tasks' },
                { id: 'analytics', icon: 'chart-bar', label: 'Analytics' }
            ];

            mobileNav.innerHTML = menuItems.map(item => `
                <div class="mobile-nav-item ${item.id === 'dashboard' ? 'active' : ''}" 
                     data-tab="${item.id}">
                    <i class="fas fa-${item.icon}"></i>
                    <span>${item.label}</span>
                </div>
            `).join('');

            sidebar.innerHTML = mobileNav.outerHTML;

            // Setup mobile nav listeners
            document.querySelectorAll('.mobile-nav-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const tabId = e.currentTarget.dataset.tab;
                    this.switchTab(tabId);
                    
                    // Update active state
                    document.querySelectorAll('.mobile-nav-item').forEach(navItem => {
                        navItem.classList.remove('active');
                    });
                    e.currentTarget.classList.add('active');
                });
            });
        }
    }

    setupEventListeners() {
        // Hamburger menu for desktop
        document.addEventListener('click', (e) => {
            if (e.target.closest('.hamburger-icon')) {
                document.querySelector('.sidebar').classList.toggle('expanded');
            }
        });

        // Tab switching
        document.addEventListener('click', (e) => {
            const tabTrigger = e.target.closest('[data-tab]');
            if (tabTrigger) {
                this.switchTab(tabTrigger.dataset.tab);
                
                // Update active states
                if (this.isMobile) {
                    document.querySelectorAll('.mobile-nav-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    tabTrigger.classList.add('active');
                } else {
                    document.querySelectorAll('.sidebar-menu li').forEach(item => {
                        item.classList.remove('active');
                    });
                    tabTrigger.classList.add('active');
                }
            }
        });

        // Handle resize
        window.addEventListener('resize', () => {
            const newIsMobile = window.innerWidth <= 768;
            if (newIsMobile !== this.isMobile) {
                this.isMobile = newIsMobile;
                this.setupNavigation();
            }
        });
    }

    switchTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');

        if (tabId === 'analytics') {
            this.chartManager.updateCharts();
        }

        // Scroll to top on mobile
        if (this.isMobile) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    loadInitialData() {
        this.storage.loadFromLocalStorage();
        this.switchTab('dashboard');
    }

    setupThemeToggle() {
        const toggle = document.getElementById('theme-toggle');
        
        // Check saved theme on load
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark');
            toggle.checked = true;
        } else {
            document.body.classList.remove('dark');
            toggle.checked = false;
        }
        
        // Handle theme toggle
        toggle.addEventListener('change', () => {
            if (toggle.checked) {
                document.body.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
            
            // Dispatch theme change event
            window.dispatchEvent(new CustomEvent('themeChanged'));
        });
    }
}

// Initialize the application
const app = new AppManager(); 