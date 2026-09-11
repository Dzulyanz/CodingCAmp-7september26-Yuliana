const STORAGE_KEY = 'todo-dashboard-items';
const THEME_KEY = 'todo-dashboard-theme';
const NAME_KEY = 'todo-dashboard-name';
const POMODORO_KEY = 'todo-dashboard-pomodoro';
const SHORT_BREAK_KEY = 'todo-dashboard-short-break';
const LONG_BREAK_KEY = 'todo-dashboard-long-break';
const ACCENT_KEY = 'todo-dashboard-accent';

const greetingEl = document.getElementById('greeting');
const dateLabelEl = document.getElementById('dateLabel');
const todoFormEl = document.getElementById('todoForm');
const todoInputEl = document.getElementById('todoInput');
const todoListEl = document.getElementById('todoList');
const todoCountEl = document.getElementById('todoCount');
const timerDisplayEl = document.getElementById('timerDisplay');
const timerStatusEl = document.getElementById('timerStatus');
const nameInputEl = document.getElementById('nameInput');
const pomodoroInputEl = document.getElementById('pomodoroInput');
const themeToggleEl = document.getElementById('themeToggle');
const timerPopupEl = document.getElementById('timerPopup');

let todos = loadTodos();
let focusDuration = getPomodoroDuration();
let shortBreakDuration = getShortBreakDuration();
let longBreakDuration = getLongBreakDuration();
let remainingSeconds = focusDuration * 60;
let timerId = null;
let isTimerRunning = false;
let currentMode = 'focus';
let alarmAudioContext = null;

function loadTodos() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [
        { id: generateId(), text: 'Review today goals', done: false },
        { id: generateId(), text: 'Complete one important task', done: false },
        { id: generateId(), text: 'Take a short break', done: true }
      ];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Unable to load todos from localStorage:', error);
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function getStoredName() {
  return localStorage.getItem(NAME_KEY) || 'Yuliana';
}

function getPomodoroDuration() {
  const savedMinutes = Number(localStorage.getItem(POMODORO_KEY));
  if (!Number.isFinite(savedMinutes) || savedMinutes < 1) {
    return 25;
  }
  return Math.min(savedMinutes, 90);
}

function savePomodoroDuration(minutes) {
  localStorage.setItem(POMODORO_KEY, String(minutes));
}

function getShortBreakDuration() {
  const savedMinutes = Number(localStorage.getItem(SHORT_BREAK_KEY));
  if (!Number.isFinite(savedMinutes) || savedMinutes < 1) {
    return 5;
  }
  return Math.min(savedMinutes, 30);
}

function saveShortBreakDuration(minutes) {
  localStorage.setItem(SHORT_BREAK_KEY, String(minutes));
}

function getLongBreakDuration() {
  const savedMinutes = Number(localStorage.getItem(LONG_BREAK_KEY));
  if (!Number.isFinite(savedMinutes) || savedMinutes < 1) {
    return 15;
  }
  return Math.min(savedMinutes, 45);
}

function saveLongBreakDuration(minutes) {
  localStorage.setItem(LONG_BREAK_KEY, String(minutes));
}

function playAlarmSound() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) {
    return;
  }

  if (!alarmAudioContext) {
    alarmAudioContext = new AudioCtor();
  }

  if (alarmAudioContext.state === 'suspended') {
    alarmAudioContext.resume();
  }

  const oscillator = alarmAudioContext.createOscillator();
  const gainNode = alarmAudioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, alarmAudioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(440, alarmAudioContext.currentTime + 0.5);

  gainNode.gain.setValueAtTime(0.0001, alarmAudioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.14, alarmAudioContext.currentTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, alarmAudioContext.currentTime + 0.8);

  oscillator.connect(gainNode);
  gainNode.connect(alarmAudioContext.destination);

  oscillator.start();
  oscillator.stop(alarmAudioContext.currentTime + 0.8);
}

function showTimerPopup(message) {
  if (!timerPopupEl) {
    return;
  }

  timerPopupEl.textContent = message;
  timerPopupEl.classList.add('show');

  clearTimeout(showTimerPopup.timeoutId);
  showTimerPopup.timeoutId = setTimeout(() => {
    timerPopupEl.classList.remove('show');
  }, 2800);
}

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function setGreeting() {
  const now = new Date();
  const hour = now.getHours();
  const name = getStoredName().trim() || 'Yuliana';

  let greetingMessage = 'Good evening';
  if (hour < 12) {
    greetingMessage = 'Good morning';
  } else if (hour < 18) {
    greetingMessage = 'Good afternoon';
  }

  greetingEl.textContent = `${greetingMessage}, ${name}`;
  nameInputEl.value = name;

  const dateText = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(now);

  dateLabelEl.textContent = dateText;
}

function renderTodos() {
  const remainingTasks = todos.filter((task) => !task.done).length;
  todoCountEl.textContent = `${remainingTasks} task${remainingTasks === 1 ? '' : 's'} left`;

  if (!todos.length) {
    todoListEl.innerHTML = '<li class="todo-item"><span class="todo-text">No tasks yet. Add one above.</span></li>';
    return;
  }

  todoListEl.innerHTML = todos
    .map(
      (task) => `
        <li class="todo-item ${task.done ? 'done' : ''}">
          <label class="todo-checkbox">
            <input type="checkbox" data-id="${task.id}" ${task.done ? 'checked' : ''} />
          </label>
          <span class="todo-text">${escapeHtml(task.text)}</span>
          <button class="delete-btn" type="button" data-id="${task.id}" aria-label="Delete task">×</button>
        </li>
      `
    )
    .join('');
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function addTodo(taskText) {
  const trimmedText = taskText.trim();
  if (!trimmedText) {
    todoInputEl.focus();
    return;
  }

  todos.unshift({
    id: generateId(),
    text: trimmedText,
    done: false
  });

  saveTodos();
  renderTodos();
  todoFormEl.reset();
  todoInputEl.focus();
}

function toggleTodo(taskId) {
  todos = todos.map((task) =>
    task.id === taskId ? { ...task, done: !task.done } : task
  );

  saveTodos();
  renderTodos();
}

function deleteTodo(taskId) {
  todos = todos.filter((task) => task.id !== taskId);
  saveTodos();
  renderTodos();
}

function updateTimerDisplay() {
  const minutes = Math.floor(remainingSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (remainingSeconds % 60).toString().padStart(2, '0');
  timerDisplayEl.textContent = `${minutes}:${seconds}`;
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark-mode', isDark);
  themeToggleEl.querySelector('.theme-icon').textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem(THEME_KEY, theme);
  applyAccent(getStoredAccent());
}

function getStoredAccent() {
  return localStorage.getItem(ACCENT_KEY) || '#5b6cff';
}

function applyAccent(color) {
  const normalized = color || '#5b6cff';
  document.documentElement.style.setProperty('--primary', normalized);
  document.documentElement.style.setProperty('--primary-dark', normalized);
  localStorage.setItem(ACCENT_KEY, normalized);

  document.querySelectorAll('.color-swatch').forEach((swatch) => {
    swatch.classList.toggle('active', swatch.dataset.accent === normalized);
  });
}

function getModeDuration(mode) {
  if (mode === 'short') return shortBreakDuration * 60;
  if (mode === 'long') return longBreakDuration * 60;
  return focusDuration * 60;
}

function getModeLabel(mode) {
  if (mode === 'short') return 'Short break in progress';
  if (mode === 'long') return 'Long break in progress';
  return 'Focus session in progress';
}

function setTimerMode(mode) {
  currentMode = mode;
  remainingSeconds = getModeDuration(mode);
  updateTimerDisplay();

  document.querySelectorAll('.mode-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === mode);
  });

  if (!isTimerRunning) {
    timerStatusEl.textContent = mode === 'focus' ? 'Ready to work' : mode === 'short' ? 'Ready for a short break' : 'Ready for a long break';
  } else {
    timerStatusEl.textContent = getModeLabel(mode);
  }
}

function syncTimerInputs() {
  pomodoroInputEl.value = String(focusDuration);
  remainingSeconds = getModeDuration(currentMode);
  updateTimerDisplay();
}

function startTimer() {
  if (isTimerRunning) {
    return;
  }

  isTimerRunning = true;
  timerStatusEl.textContent = getModeLabel(currentMode);

  timerId = setInterval(() => {
    remainingSeconds -= 1;
    updateTimerDisplay();

    if (remainingSeconds <= 0) {
      pauseTimer();
      playAlarmSound();

      const message = currentMode === 'focus'
        ? 'Focus session finished! Time for a break.'
        : 'Break finished! Ready to focus again.';

      timerStatusEl.textContent = currentMode === 'focus' ? 'Time is up — take a break' : 'Break complete — back to focus';
      showTimerPopup(message);
      timerDisplayEl.classList.add('alert');
      setTimeout(() => {
        timerDisplayEl.classList.remove('alert');
      }, 700);
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerId);
  isTimerRunning = false;
  timerStatusEl.textContent = 'Paused';
}

function resetTimer() {
  clearInterval(timerId);
  isTimerRunning = false;
  remainingSeconds = getModeDuration(currentMode);
  updateTimerDisplay();
  timerStatusEl.textContent = currentMode === 'focus' ? 'Ready to work' : currentMode === 'short' ? 'Ready for a short break' : 'Ready for a long break';
}

todoFormEl.addEventListener('submit', (event) => {
  event.preventDefault();
  addTodo(todoInputEl.value);
});

todoListEl.addEventListener('change', (event) => {
  const input = event.target;
  if (input.matches('input[type="checkbox"]')) {
    toggleTodo(input.dataset.id);
  }
});

todoListEl.addEventListener('click', (event) => {
  const button = event.target.closest('.delete-btn');
  if (!button) {
    return;
  }

  deleteTodo(button.dataset.id);
});

document.querySelectorAll('[data-action]').forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.action;

    if (action === 'start') {
      startTimer();
    } else if (action === 'pause') {
      pauseTimer();
    } else if (action === 'reset') {
      resetTimer();
    }
  });
});

nameInputEl.addEventListener('input', (event) => {
  const value = event.target.value.trim() || 'Yuliana';
  localStorage.setItem(NAME_KEY, value);
  setGreeting();
});

pomodoroInputEl.addEventListener('change', (event) => {
  const minutes = Number(event.target.value);
  if (!Number.isFinite(minutes) || minutes < 1) {
    syncTimerInputs();
    return;
  }

  focusDuration = Math.min(Math.floor(minutes), 90);
  savePomodoroDuration(focusDuration);
  syncTimerInputs();
  resetTimer();
});

document.querySelectorAll('.mode-btn').forEach((button) => {
  button.addEventListener('click', () => {
    setTimerMode(button.dataset.mode);
  });
});

document.querySelectorAll('.color-swatch').forEach((button) => {
  button.addEventListener('click', () => {
    applyAccent(button.dataset.accent);
  });
});

themeToggleEl.addEventListener('click', () => {
  const isDark = document.body.classList.contains('dark-mode');
  applyTheme(isDark ? 'light' : 'dark');
});

const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
applyTheme(savedTheme);
applyAccent(getStoredAccent());
setGreeting();
syncTimerInputs();
setTimerMode(currentMode);
renderTodos();
