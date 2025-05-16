// App Data
let habits = JSON.parse(localStorage.getItem('habits')) || [];
let currentDate = new Date();
let currentViewMonth = currentDate.getMonth();
let currentViewYear = currentDate.getFullYear();
let editingHabitId = null;
let deferredPrompt = null;

// DOM Elements
const habitListEl = document.getElementById('habit-list');
const habitForm = document.getElementById('habit-form');
const habitModal = document.getElementById('habit-modal');
const addHabitBtn = document.getElementById('add-habit-btn');
const closeModalBtn = document.getElementById('close-modal');
const cancelHabitBtn = document.getElementById('cancel-habit');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const calendarBody = document.getElementById('calendar-body');
const monthYearEl = document.getElementById('month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const statsContent = document.getElementById('stats-content');
const installBtn = document.getElementById('install-btn');
const colorPreview = document.getElementById('color-preview');
const habitColorSelect = document.getElementById('habit-color');
const installBtn = document.getElementById('install-btn');

// Habit icons based on name
const habitIcons = {
    'water': '💧',
    'workout': '🏋️',
    'read': '📚',
    'study': '📚',
    'meditate': '🧘',
    'sleep': '😴',
    'journal': '📝',
    'walk': '🚶',
    'yoga': '🧘‍♀️',
    'fruit': '🍎',
    'vegetable': '🥦',
    'code': '💻',
    'learn': '🧠',
    'guitar': '🎸',
    'piano': '🎹',
    'draw': '✏️',
    'paint': '🎨',
    'write': '✍️',
    'run': '🏃',
    'swim': '🏊',
    'cycle': '🚴',
    'default': '🌱'
};

// Initialize the app
function init() {
    renderHabits();
    renderCalendar();
    renderStats();
    setupEventListeners();
    checkInstallPrompt();
    
    // Set default date to today
    document.getElementById('habit-start-date').valueAsDate = new Date();
    
    // Update color preview when color changes
    habitColorSelect.addEventListener('change', (e) => {
        colorPreview.style.backgroundColor = e.target.value;
    });
}

// Set up event listeners
function setupEventListeners() {
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Install button
    installBtn.addEventListener('click', installPWA);

    // Before install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'flex';
    });
}


    // Habit modal
    addHabitBtn.addEventListener('click', () => openHabitModal());
    closeModalBtn.addEventListener('click', () => closeHabitModal());
    cancelHabitBtn.addEventListener('click', () => closeHabitModal());
    habitForm.addEventListener('submit', handleHabitSubmit);

    // Calendar navigation
    prevMonthBtn.addEventListener('click', () => {
        currentViewMonth--;
        if (currentViewMonth < 0) {
            currentViewMonth = 11;
            currentViewYear--;
        }
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentViewMonth++;
        if (currentViewMonth > 11) {
            currentViewMonth = 0;
            currentViewYear++;
        }
        renderCalendar();
    });

    // Install button
    installBtn.addEventListener('click', installPWA);

    // Before install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'flex';
    });
}

// Check if we should show install prompt
function checkInstallPrompt() {
    if (window.matchMedia('(display-mode: standalone)').matches) {
        installBtn.style.display = 'none';
    }
}


// Install PWA
function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
                createConfetti();
            } else {
                console.log('User dismissed the install prompt');
            }
            deferredPrompt = null;
            installBtn.style.display = 'none';
        });
    }
}

// Create confetti effect
function createConfetti() {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
    
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = Math.random() * 10 + 5 + 'px';
        confetti.style.animationDuration = Math.random() * 3 + 2 + 's';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        document.body.appendChild(confetti);
        
        // Remove confetti after animation
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
}

// Switch between tabs
function switchTab(tabId) {
    tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    tabContents.forEach(content => {
        if (content.id === tabId) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });

    if (tabId === 'calendar') {
        renderCalendar();
    } else if (tabId === 'stats') {
        renderStats();
    }
}

// Get icon for habit based on name
function getHabitIcon(name) {
    const lowerName = name.toLowerCase();
    for (const [key, icon] of Object.entries(habitIcons)) {
        if (lowerName.includes(key)) {
            return icon;
        }
    }
    return habitIcons.default;
}

// Render all habits
function renderHabits() {
    if (habits.length === 0) {
        habitListEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏠</div>
                <div class="empty-state-text">Your habit nest is empty. Start building your daily routine!</div>
                <button class="btn btn-primary" id="add-first-habit">Add Your First Habit</button>
            </div>
        `;
        document.getElementById('add-first-habit').addEventListener('click', () => openHabitModal());
        return;
    }

    habitListEl.innerHTML = '';
    
    // Sort habits by streak length (descending)
    const sortedHabits = [...habits].sort((a, b) => {
        return calculateCurrentStreak(b) - calculateCurrentStreak(a);
    });
    
    sortedHabits.forEach((habit, index) => {
        const today = new Date().toISOString().split('T')[0];
        const todayLog = habit.logs.find(log => log.date === today) || { completed: 0 };
        const progress = (todayLog.completed / habit.target) * 100;
        const streak = calculateCurrentStreak(habit);
        const icon = getHabitIcon(habit.name);

        // Add animation delay based on index
        const delay = index * 0.1;
        
        const habitCard = document.createElement('div');
        habitCard.className = 'habit-card';
        habitCard.style.animationDelay = `${delay}s`;
        habitCard.innerHTML = `
            <div class="habit-name">
                <span class="habit-name-icon">${icon}</span>
                ${habit.name}
            </div>
            <div class="habit-streak">
                <span class="streak-count">
                    <span class="icon">🔥</span>
                    ${streak} day${streak !== 1 ? 's' : ''}
                </span>
                <span>current streak</span>
            </div>
            <div class="habit-progress">
                <div class="progress-header">
                    <span>Today's progress</span>
                    <span>${todayLog.completed || 0}/${habit.target}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
            <div class="habit-actions">
                <button class="btn btn-success btn-complete" data-id="${habit.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Complete
                </button>
                <div>
                    <button class="btn btn-edit btn-edit-habit" data-id="${habit.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn btn-danger btn-delete-habit" data-id="${habit.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        // Set the accent color
        habitCard.style.setProperty('--primary', habit.color);
        habitCard.style.setProperty('--primary-dark', shadeColor(habit.color, -20));
        
        habitListEl.appendChild(habitCard);
    });

    // Add event listeners to buttons
    document.querySelectorAll('.btn-complete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const habitId = e.target.closest('button').getAttribute('data-id');
            logHabitCompletion(habitId);
        });
    });

    document.querySelectorAll('.btn-edit-habit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const habitId = e.target.closest('button').getAttribute('data-id');
            editHabit(habitId);
        });
    });

    document.querySelectorAll('.btn-delete-habit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const habitId = e.target.closest('button').getAttribute('data-id');
            deleteHabit(habitId);
        });
    });
}

// Helper function to shade colors
function shadeColor(color, percent) {
    let R = parseInt(color.substring(1,3), 16);
    let G = parseInt(color.substring(3,5), 16);
    let B = parseInt(color.substring(5,7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    R = Math.round(R);
    G = Math.round(G);
    B = Math.round(B);

    const RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    const GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    const BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}

// Log habit completion for today
function logHabitCompletion(habitId) {
    const today = new Date().toISOString().split('T')[0];
    const habitIndex = habits.findIndex(h => h.id === habitId);
    
    if (habitIndex === -1) return;
    
    const habit = habits[habitIndex];
    const todayLogIndex = habit.logs.findIndex(log => log.date === today);
    
    if (todayLogIndex === -1) {
        // No log for today, add one
        habit.logs.push({ date: today, completed: 1 });
    } else {
        // Increment completed count, but don't exceed target
        const todayLog = habit.logs[todayLogIndex];
        if (todayLog.completed < habit.target) {
            todayLog.completed++;
        } else {
            // Already completed target for today
            return;
        }
    }
    
    // Save and re-render
    saveHabits();
    renderHabits();
    
    // If on calendar view, update that too
    if (document.querySelector('.tab.active').getAttribute('data-tab') === 'calendar') {
        renderCalendar();
    }
    
    // If completed target, show celebration
    const todayLog = habit.logs.find(log => log.date === today);
    if (todayLog && todayLog.completed >= habit.target) {
        createConfetti();
    }
}

// Open habit modal for adding/editing
function openHabitModal(habit = null) {
    document.getElementById('modal-title').textContent = habit ? 'Edit Habit' : 'Add New Habit';
    document.getElementById('habit-id').value = habit ? habit.id : '';
    document.getElementById('habit-name').value = habit ? habit.name : '';
    document.getElementById('habit-target').value = habit ? habit.target : 1;
    document.getElementById('habit-start-date').value = habit ? habit.startDate : new Date().toISOString().split('T')[0];
    const color = habit ? habit.color : '#6366f1';
    document.getElementById('habit-color').value = color;
    colorPreview.style.backgroundColor = color;
    
    habitModal.style.display = 'flex';
    document.getElementById('habit-name').focus();
}

// Close habit modal
function closeHabitModal() {
    habitModal.style.display = 'none';
    habitForm.reset();
    editingHabitId = null;
}

// Handle habit form submission
function handleHabitSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('habit-id').value || generateId();
    const name = document.getElementById('habit-name').value;
    const target = parseInt(document.getElementById('habit-target').value);
    const startDate = document.getElementById('habit-start-date').value;
    const color = document.getElementById('habit-color').value;
    
    const habitData = {
        id,
        name,
        target,
        startDate,
        color,
        logs: []
    };
    
    // Check if we're editing or adding
    const existingHabitIndex = habits.findIndex(h => h.id === id);
    
    if (existingHabitIndex !== -1) {
        // Editing - preserve logs
        habitData.logs = habits[existingHabitIndex].logs;
        habits[existingHabitIndex] = habitData;
    } else {
        // Adding new habit
        habits.push(habitData);
    }
    
    saveHabits();
    renderHabits();
    closeHabitModal();
}

// Edit a habit
function editHabit(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
        openHabitModal(habit);
    }
}

// Delete a habit
function deleteHabit(habitId) {
    if (confirm('Are you sure you want to delete this habit? All progress will be lost.')) {
        habits = habits.filter(h => h.id !== habitId);
        saveHabits();
        renderHabits();
        
        // If on calendar view, update that too
        if (document.querySelector('.tab.active').getAttribute('data-tab') === 'calendar') {
            renderCalendar();
        }
    }
}

// Save habits to localStorage
function saveHabits() {
    localStorage.setItem('habits', JSON.stringify(habits));
}

// Generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Render the calendar view
function renderCalendar() {
    const firstDay = new Date(currentViewYear, currentViewMonth, 1);
    const lastDay = new Date(currentViewYear, currentViewMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Set month/year display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    monthYearEl.textContent = `${monthNames[currentViewMonth]} ${currentViewYear}`;
    
    // Clear previous calendar
    calendarBody.innerHTML = '';
    
    // Calculate starting day (0 = Sunday, 6 = Saturday)
    let startingDay = firstDay.getDay();
    
    // Create calendar rows
    let date = 1;
    for (let i = 0; i < 6; i++) {
        // Stop if we've gone past the last day of the month
        if (date > daysInMonth) break;
        
        const row = document.createElement('tr');
        
        // Create cells for each day of the week
        for (let j = 0; j < 7; j++) {
            const cell = document.createElement('td');
            
            if (i === 0 && j < startingDay) {
                // Days from previous month
                const prevMonthLastDay = new Date(currentViewYear, currentViewMonth, 0).getDate();
                const prevDate = prevMonthLastDay - (startingDay - j - 1);
                cell.innerHTML = `<div class="calendar-day day-outside-month">${prevDate}</div>`;
                cell.classList.add('day-outside-month');
            } else if (date > daysInMonth) {
                // Days from next month
                const nextDate = date - daysInMonth;
                cell.innerHTML = `<div class="calendar-day day-outside-month">${nextDate}</div>`;
                cell.classList.add('day-outside-month');
                date++;
            } else {
                // Current month days
                const currentDateStr = `${currentViewYear}-${String(currentViewMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                
                // Check if this is today
                const today = new Date();
                if (today.getFullYear() === currentViewYear && 
                    today.getMonth() === currentViewMonth && 
                    today.getDate() === date) {
                    cell.classList.add('today');
                }
                
                cell.innerHTML = `<div class="calendar-day">${date}</div>`;
                
                // Add habit indicators
                const indicatorsContainer = document.createElement('div');
                indicatorsContainer.className = 'habit-indicators';
                
                habits.forEach(habit => {
                    const habitLog = habit.logs.find(log => log.date === currentDateStr);
                    if (habitLog) {
                        const indicator = document.createElement('div');
                        indicator.className = 'habit-indicator';
                        indicator.style.backgroundColor = habit.color;
                        
                        if (habitLog.completed >= habit.target) {
                            indicator.classList.add('completed');
                            indicator.setAttribute('data-tooltip', `${habit.name}: Completed`);
                        } else if (habitLog.completed > 0) {
                            indicator.classList.add('partial');
                            indicator.setAttribute('data-tooltip', `${habit.name}: Partial (${habitLog.completed}/${habit.target})`);
                        } else {
                            indicator.classList.add('missed');
                            indicator.setAttribute('data-tooltip', `${habit.name}: Missed`);
                        }
                        
                        // Check if this is part of a streak
                        if (isPartOfStreak(habit, currentDateStr)) {
                            indicator.classList.add('streak-day');
                        }
                        
                        indicatorsContainer.appendChild(indicator);
                    }
                });
                
                cell.appendChild(indicatorsContainer);
                date++;
            }
            
            row.appendChild(cell);
        }
        
        calendarBody.appendChild(row);
    }
}

// Render stats view
function renderStats() {
    if (habits.length === 0) {
        statsContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <div class="empty-state-text">No habits to show stats for yet. Start tracking to see your progress!</div>
            </div>
        `;
        return;
    }
    
    let html = '<div class="stats-grid">';
    
    // Overall completion rate
    const totalPossible = habits.reduce((sum, habit) => sum + habit.logs.length * habit.target, 0);
    const totalCompleted = habits.reduce((sum, habit) => {
        return sum + habit.logs.reduce((logSum, log) => logSum + log.completed, 0);
    }, 0);
    const completionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    
    // Calculate completion rate for last 7 days
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const last7DaysStr = last7Days.toISOString().split('T')[0];
    
    const recentHabits = habits.filter(habit => {
        return habit.logs.some(log => log.date >= last7DaysStr);
    });
    
    const recentCompletionRate = recentHabits.length > 0 ? 
        Math.round(recentHabits.reduce((sum, habit) => {
            const recentLogs = habit.logs.filter(log => log.date >= last7DaysStr);
            const possible = recentLogs.length * habit.target;
            const completed = recentLogs.reduce((sum, log) => sum + log.completed, 0);
            return sum + (possible > 0 ? (completed / possible) * 100 : 0);
        }, 0) / recentHabits.length) : 0;
    
    // Longest streak
    let longestStreak = 0;
    habits.forEach(habit => {
        const streak = calculateLongestStreak(habit);
        if (streak > longestStreak) {
            longestStreak = streak;
        }
    });
    
    // Most consistent habit (highest completion rate)
    let mostConsistentHabit = null;
    let highestCompletionRate = 0;
    
    habits.forEach(habit => {
        const rate = calculateHabitCompletionRate(habit);
        if (rate > highestCompletionRate) {
            highestCompletionRate = rate;
            mostConsistentHabit = habit;
        }
    });
    
    html += `
        <div class="stat-card">
            <h3>Overall Completion</h3>
            <div class="stat-value">${completionRate}%</div>
            <div class="stat-detail">${totalCompleted} of ${totalPossible} targets met across all habits</div>
        </div>
        
        <div class="stat-card">
            <h3>Recent Progress</h3>
            <div class="stat-value">${recentCompletionRate}%</div>
            <div class="stat-detail">Completion rate for the last 7 days</div>
        </div>
        
        <div class="stat-card">
            <h3>Longest Streak</h3>
            <div class="stat-value">${longestStreak}</div>
            <div class="stat-detail">Your best streak across all habits</div>
        </div>
    `;
    
    if (mostConsistentHabit) {
        html += `
            <div class="stat-card">
                <h3>Most Consistent</h3>
                <div class="stat-value" style="color: ${mostConsistentHabit.color}">${mostConsistentHabit.name}</div>
                <div class="stat-detail">${highestCompletionRate}% completion rate</div>
            </div>
        `;
    }
    
    // Habit-specific stats
    habits.forEach(habit => {
        const currentStreak = calculateCurrentStreak(habit);
        const longestStreak = calculateLongestStreak(habit);
        const completionRate = calculateHabitCompletionRate(habit);
        
        html += `
            <div class="stat-card" style="border-left: 4px solid ${habit.color}">
                <h3>${habit.name}</h3>
                <div class="stat-row">
                    <span class="stat-row-label">Current Streak:</span>
                    <span class="stat-row-value">${currentStreak} day${currentStreak !== 1 ? 's' : ''}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-row-label">Longest Streak:</span>
                    <span class="stat-row-value">${longestStreak} day${longestStreak !== 1 ? 's' : ''}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-row-label">Completion Rate:</span>
                    <span class="stat-row-value">${completionRate}%</span>
                </div>
                <div class="stat-row">
                    <span class="stat-row-label">Total Completed:</span>
                    <span class="stat-row-value">${habit.logs.reduce((sum, log) => sum + log.completed, 0)}</span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    statsContent.innerHTML = html;
}

// Calculate current streak for a habit
function calculateCurrentStreak(habit) {
    if (habit.logs.length === 0) return 0;
    
    // Sort logs by date (newest first)
    const sortedLogs = [...habit.logs].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let streak = 0;
    let currentDate = new Date();
    
    // Adjust to start from yesterday if today isn't completed yet
    const todayStr = currentDate.toISOString().split('T')[0];
    const todayLog = sortedLogs.find(log => log.date === todayStr);
    
    if (!todayLog || todayLog.completed < habit.target) {
        currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Check consecutive days
    while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const log = sortedLogs.find(l => l.date === dateStr);
        
        if (log && log.completed >= habit.target) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    return streak;
}

// Calculate longest streak for a habit
function calculateLongestStreak(habit) {
    if (habit.logs.length === 0) return 0;
    
    // Sort logs by date (oldest first)
    const sortedLogs = [...habit.logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let longestStreak = 0;
    let currentStreak = 0;
    let prevDate = null;
    
    sortedLogs.forEach(log => {
        if (log.completed >= habit.target) {
            const logDate = new Date(log.date);
            
            if (prevDate === null) {
                // First log
                currentStreak = 1;
            } else {
                // Check if consecutive
                const expectedDate = new Date(prevDate);
                expectedDate.setDate(expectedDate.getDate() + 1);
                
                if (logDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
                    currentStreak++;
                } else {
                    // Not consecutive, reset streak
                    currentStreak = 1;
                }
            }
            
            if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
            }
            
            prevDate = log.date;
        } else {
            // Missed day, reset streak
            currentStreak = 0;
            prevDate = null;
        }
    });
    
    return longestStreak;
}

// Calculate completion rate for a habit
function calculateHabitCompletionRate(habit) {
    if (habit.logs.length === 0) return 0;
    
    const totalPossible = habit.logs.length * habit.target;
    const totalCompleted = habit.logs.reduce((sum, log) => sum + log.completed, 0);
    
    return Math.round((totalCompleted / totalPossible) * 100);
}

// Check if a date is part of a streak for a habit
function isPartOfStreak(habit, dateStr) {
    const date = new Date(dateStr);
    const prevDay = new Date(date);
    prevDay.setDate(prevDay.getDate() - 1);
    const prevDayStr = prevDay.toISOString().split('T')[0];
    
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0];
    
    // Check previous day
    const prevLog = habit.logs.find(log => log.date === prevDayStr);
    const hasPrev = prevLog && prevLog.completed >= habit.target;
    
    // Check next day
    const nextLog = habit.logs.find(log => log.date === nextDayStr);
    const hasNext = nextLog && nextLog.completed >= habit.target;
    
    // Current day
    const currentLog = habit.logs.find(log => log.date === dateStr);
    const hasCurrent = currentLog && currentLog.completed >= habit.target;
    
    return hasCurrent && (hasPrev || hasNext);
}

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(registration => {
            console.log('ServiceWorker registration successful');
        }).catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);
