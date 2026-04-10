class ProductivityDashboard {
    constructor() {
        this.isTimerRunning = false;
        this.timerInterval = null;
        this.timeLeft = 25 * 60; // 25 minutes in seconds
        this.userName = '';
        this.isDarkMode = false;
        this.tasks = [];
        this.links = [];
        this.sortOrder = 'added'; // 'added', 'alpha', 'completed'

        this.init();
    }

    init() {
        this.loadData();
        this.cacheDOMElements();
        this.bindEvents();
        this.updateTimeDate();
        this.updateGreeting();
        this.updateTimerDisplay();
        this.renderTasks();
        this.renderLinks();
        this.updateTaskCount();
        this.setTheme();
        
        // Update time every second
        setInterval(() => this.updateTimeDate(), 1000);
    }

    cacheDOMElements() {
        this.elements = {
            themeToggle: document.getElementById('themeToggle'),
            userName: document.getElementById('userName'),
            greetingText: document.getElementById('greetingText'),
            timerDisplay: document.getElementById('timerDisplay'),
            startTimer: document.getElementById('startTimer'),
            stopTimer: document.getElementById('stopTimer'),
            resetTimer: document.getElementById('resetTimer'),
            newTask: document.getElementById('newTask'),
            addTask: document.getElementById('addTask'),
            todoList: document.getElementById('todoList'),
            taskCount: document.getElementById('taskCount'),
            linksContainer: document.getElementById('linksContainer'),
            linkName: document.getElementById('linkName'),
            linkUrl: document.getElementById('linkUrl'),
            addLink: document.getElementById('addLink')
        };
    }

    bindEvents() {
        // Theme toggle
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Greeting
        this.elements.userName.addEventListener('input', (e) => {
            this.userName = e.target.value.trim();
            this.saveData();
            this.updateGreeting();
        });

        // Timer controls
        this.elements.startTimer.addEventListener('click', () => this.startTimer());
        this.elements.stopTimer.addEventListener('click', () => this.stopTimer());
        this.elements.resetTimer.addEventListener('click', () => this.resetTimer());

        // To-do list
        this.elements.addTask.addEventListener('click', () => this.addTask());
        this.elements.newTask.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Quick links
        this.elements.addLink.addEventListener('click', () => this.addLink());

        // Enter key for links
        this.elements.linkName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.elements.linkUrl.focus();
        });
        this.elements.linkUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addLink();
        });
    }

    // Local Storage
    saveData() {
        const data = {
            userName: this.userName,
            isDarkMode: this.isDarkMode,
            tasks: this.tasks,
            links: this.links,
            timeLeft: this.timeLeft,
            sortOrder: this.sortOrder
        };
        localStorage.setItem('productivityDashboard', JSON.stringify(data));
    }

    loadData() {
        try {
            const data = localStorage.getItem('productivityDashboard');
            if (data) {
                const parsed = JSON.parse(data);
                this.userName = parsed.userName || '';
                this.isDarkMode = parsed.isDarkMode || false;
                this.tasks = parsed.tasks || [];
                this.links = parsed.links || [];
                this.timeLeft = parsed.timeLeft || (25 * 60);
                this.sortOrder = parsed.sortOrder || 'added';
            }
        } catch (e) {
            console.error('Error loading data:', e);
        }
        // Set username in input field
        this.elements.userName.value = this.userName;
    }

    // Time and Date
    updateTimeDate() {
        const now = new Date();
        document.getElementById('currentTime').textContent = now.toLocaleTimeString('en-US', {
            hour12: true,
            hour: 'numeric',
            minute: '2-digit'
        });
        document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    updateGreeting() {
        const hour = new Date().getHours();
        const name = this.userName || 'Friend';
        let greeting = '';

        if (hour < 12) greeting = `Good morning, ${name}!`;
        else if (hour < 17) greeting = `Good afternoon, ${name}!`;
        else greeting = `Good evening, ${name}!`;

        this.elements.greetingText.textContent = greeting;
    }

    // Timer Functions
    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.elements.timerDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    startTimer() {
        if (this.isTimerRunning) return;
        
        this.isTimerRunning = true;
        this.elements.startTimer.disabled = true;
        this.elements.stopTimer.disabled = false;
        
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            this.saveData();
            
            if (this.timeLeft <= 0) {
                this.stopTimer();
                this.timerComplete();
            }
        }, 1000);
    }

    stopTimer() {
        this.isTimerRunning = false;
        clearInterval(this.timerInterval);
        this.elements.startTimer.disabled = false;
        this.elements.stopTimer.disabled = true;
    }

    resetTimer() {
        this.stopTimer();
        this.timeLeft = 25 * 60;
        this.updateTimerDisplay();
        this.saveData();
    }

    timerComplete() {
        // Visual feedback
        this.elements.timerDisplay.style.color = '#ff6b6b';
        setTimeout(() => {
            this.elements.timerDisplay.style.color = '';
        }, 1000);
        
        // Simple beep notification (works in all browsers)
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    // To-Do List Functions
    addTask() {
        const text = this.elements.newTask.value.trim();
        if (!text) return;

        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: Date.now()
        };

        this.tasks.unshift(task); // Add to beginning
        this.elements.newTask.value = '';
        this.renderTasks();
        this.updateTaskCount();
        this.saveData();
    }

    toggleTask(id) {
        this.tasks = this.tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        this.renderTasks();
        this.updateTaskCount();
        this.saveData();
    }

    editTask(id, newText) {
        this.tasks = this.tasks.map(task => 
            task.id === id ? { ...task, text: newText.trim() } : task
        );
        this.renderTasks();
        this.saveData();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.renderTasks();
        this.updateTaskCount();
        this.saveData();
    }

    renderTasks() {
        // Sort tasks
        let sortedTasks = [...this.tasks];
        if (this.sortOrder === 'alpha') {
            sortedTasks.sort((a, b) => a.text.localeCompare(b.text));
        } else if (this.sortOrder === 'completed') {
            sortedTasks.sort((a, b) => b.completed - a.completed);
        } else {
            sortedTasks.sort((a, b) => b.createdAt - a.createdAt);
        }

        this.elements.todoList.innerHTML = sortedTasks.map(task => `
            <li class="todo-item ${task.completed ? 'completed' : ''}">
                <input type="checkbox" class="todo-checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="dashboard.toggleTask(${task.id})">
                <span class="todo-text" ondblclick="dashboard.startEdit(${task.id}, this)">${task.text}</span>
                <div class="todo-buttons">
                    <button class="btn btn-secondary" onclick="dashboard.deleteTask(${task.id})" title="Delete">🗑️</button>
                </div>
            </li>
        `).join('');
    }

    startEdit(id, element) {
        const task = this.tasks.find(t => t.id === id);
        const input = document.createElement('input');
        input.type = 'text';
        input.value = task.text;
        input.className = 'todo-text editing';
        input.style.width = Math.max(200, element.offsetWidth) + 'px';
        
        input.addEventListener('blur', () => {
            this.editTask(id, input.value);
        });
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.editTask(id, input.value);
            }
        });
        
        element.replaceWith(input);
        input.focus();
        input.select();
    }

    updateTaskCount() {
        const count = this.tasks.filter(task => !task.completed).length;
        this.elements.taskCount.textContent = count;
    }

    // Quick Links Functions
    addLink() {
        const name = this.elements.linkName.value.trim();
        const url = this.elements.linkUrl.value.trim();
        
        if (!name || !url) return;

        // Ensure URL has protocol
        let fullUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            fullUrl = 'https://' + url;
        }

        const link = {
            id: Date.now(),
            name: name,
            url: fullUrl
        };

        this.links.unshift(link);
        this.elements.linkName.value = '';
        this.elements.linkUrl.value = '';
        this.renderLinks();
        this.saveData();
    }

    deleteLink(id) {
        this.links = this.links.filter(link => link.id !== id);
        this.renderLinks();
        this.saveData();
    }

    renderLinks() {
        if (this.links.length === 0) {
            this.elements.linksContainer.innerHTML = `
                <div class="link-placeholder">
                    <span>Add your first link</span>
                </div>
            `;
            return;
        }

        this.elements.linksContainer.innerHTML = this.links.map(link => `
            <div class="link-item" onclick="window.open('${link.url}', '_blank')">
                <span class="link-icon">🔗</span>
                <div>
                    <div style="font-weight: 500;">${link.name}</div>
                    <div style="font-size: 0.85rem; opacity: 0.8;">${link.url}</div>
                </div>
                <button class="btn btn-secondary" onclick="event.stopPropagation(); dashboard.deleteLink(${link.id})" title="Delete">🗑️</button>
            </div>
        `).join('');
    }

    // Theme Functions
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.body.className = this.isDarkMode ? 'dark' : 'light';
        this.elements.themeToggle.textContent = this.isDarkMode ? '☀️' : '🌙';
        this.saveData();
    }

    setTheme() {
        document.body.className = this.isDarkMode ? 'dark' : 'light';
        this.elements.themeToggle.textContent = this.isDarkMode ? '☀️' : '🌙';
        this.elements.userName.value = this.userName;
    }
}

// Initialize app when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new ProductivityDashboard();
});