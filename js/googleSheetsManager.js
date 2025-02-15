class GoogleSheetsManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.API_KEY = 'AIza...';  // Your API key
        this.CLIENT_ID = '123...apps.googleusercontent.com';  // Your OAuth 2.0 client ID
        this.SPREADSHEET_ID = ''; // This will be set when a new spreadsheet is created
        this.SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
        this.tokenClient = null;
        this.gapiInited = false;
        this.gisInited = false;
        
        this.initializeGoogleAPI();
    }

    initializeGoogleAPI() {
        gapi.load('client', async () => {
            await gapi.client.init({
                apiKey: this.API_KEY,
                discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
            });
            this.gapiInited = true;
            this.maybeEnableButtons();
        });

        this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: this.CLIENT_ID,
            scope: this.SCOPES,
            callback: '', // defined later
        });
        this.gisInited = true;
        this.maybeEnableButtons();
    }

    maybeEnableButtons() {
        if (this.gapiInited && this.gisInited) {
            document.getElementById('exportToSheets').disabled = false;
            document.getElementById('syncFromSheets').disabled = false;
        }
    }

    async handleAuthClick() {
        try {
            // Skip if already authorized
            if (gapi.client.getToken() === null) {
                // Prompt the user to select a Google Account and ask for consent to share their data
                // when establishing a new session.
                this.tokenClient.callback = async (resp) => {
                    if (resp.error !== undefined) {
                        throw resp;
                    }
                    await this.checkAndCreateSpreadsheet();
                };

                this.tokenClient.requestAccessToken({ prompt: 'consent' });
            } else {
                this.tokenClient.requestAccessToken({ prompt: '' });
                await this.checkAndCreateSpreadsheet();
            }
        } catch (err) {
            console.error('Authentication error:', err);
            this.showNotification('Authentication failed', 'error');
        }
    }

    async checkAndCreateSpreadsheet() {
        try {
            // Try to access the spreadsheet
            await gapi.client.sheets.spreadsheets.get({
                spreadsheetId: this.SPREADSHEET_ID
            });
        } catch (err) {
            // If spreadsheet doesn't exist, create it
            await this.createNewSpreadsheet();
        }
    }

    async createNewSpreadsheet() {
        try {
            const response = await gapi.client.sheets.spreadsheets.create({
                resource: {
                    properties: {
                        title: 'Team Bandwidth Data'
                    },
                    sheets: [
                        { properties: { title: 'Users' } },
                        { properties: { title: 'Tasks' } }
                    ]
                }
            });
            this.SPREADSHEET_ID = response.result.spreadsheetId;
            this.showNotification('New spreadsheet created', 'success');
        } catch (err) {
            console.error('Error creating spreadsheet:', err);
            this.showNotification('Failed to create spreadsheet', 'error');
        }
    }

    async exportToSheets() {
        try {
            await this.handleAuthClick();
            
            // Format data for sheets
            const usersData = [
                ['Name', 'Role', 'Capacity', 'Current Load', 'ID'],
                ...this.storage.data.users.map(user => [
                    user.name,
                    user.role,
                    user.capacity,
                    user.currentLoad,
                    user.id
                ])
            ];

            const tasksData = [
                ['Name', 'Story Points', 'Assigned To', 'Priority', 'ID'],
                ...this.storage.data.tasks.map(task => [
                    task.name,
                    task.storyPoints,
                    task.assignedTo,
                    task.priority,
                    task.id
                ])
            ];

            // Update Users sheet
            await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.SPREADSHEET_ID,
                range: 'Users!A1',
                valueInputOption: 'RAW',
                resource: { values: usersData }
            });

            // Update Tasks sheet
            await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.SPREADSHEET_ID,
                range: 'Tasks!A1',
                valueInputOption: 'RAW',
                resource: { values: tasksData }
            });

            this.showNotification('Data exported to Google Sheets', 'success');
        } catch (err) {
            console.error('Export error:', err);
            this.showNotification('Failed to export to Google Sheets', 'error');
        }
    }

    async syncFromSheets() {
        try {
            await this.handleAuthClick();

            // Fetch Users data
            const usersResponse = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.SPREADSHEET_ID,
                range: 'Users!A2:E'
            });

            // Fetch Tasks data
            const tasksResponse = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.SPREADSHEET_ID,
                range: 'Tasks!A2:E'
            });

            // Parse users data
            const users = usersResponse.result.values?.map(row => ({
                name: row[0],
                role: row[1],
                capacity: parseInt(row[2]),
                currentLoad: parseInt(row[3]),
                id: row[4]
            })) || [];

            // Parse tasks data
            const tasks = tasksResponse.result.values?.map(row => ({
                name: row[0],
                storyPoints: parseInt(row[1]),
                assignedTo: row[2],
                priority: row[3],
                id: row[4]
            })) || [];

            // Update local storage
            this.storage.data = { users, tasks };
            this.storage.saveToLocalStorage();

            // Trigger UI update
            window.dispatchEvent(new CustomEvent('storageUpdated'));
            
            this.showNotification('Data synced from Google Sheets', 'success');
        } catch (err) {
            console.error('Sync error:', err);
            this.showNotification('Failed to sync from Google Sheets', 'error');
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
} 