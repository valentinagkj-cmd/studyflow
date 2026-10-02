/**
 * StudyFlow — Academic Command Center
 * Vanilla JavaScript (No Frameworks, No Libraries)
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. STORAGE & STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  const STORAGE_KEY = 'studyflow_academic_data_v1';

  // Helper to format Date as YYYY-MM-DD
  function getLocalDateString(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Get a future date string for default exam countdown (18 days ahead)
  function getDefaultExamDate() {
    const d = new Date();
    d.setDate(d.getDate() + 18);
    d.setHours(9, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T09:00`;
  }

  // Initial Sample State (Rich, lived-in feel)
  function createDefaultState() {
    const today = getLocalDateString();
    
    // Sample past week study log for chart
    const sampleWeeklyLog = {};
    const curr = new Date();
    // Monday of current week
    const dayOfWeek = curr.getDay(); // 0 is Sun, 1 is Mon...
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - distanceToMonday);

    const sampleMins = [90, 140, 110, 175, 60, 45, 0];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = getLocalDateString(d);
      sampleWeeklyLog[key] = {
        minutes: sampleMins[i] || 0,
        sessions: Math.ceil((sampleMins[i] || 0) / 30)
      };
    }

    return {
      dailyGoalHours: 3.0,
      soundEnabled: true,
      streak: {
        count: 5,
        lastActiveDate: today
      },
      todayFocus: {
        title: 'Review Graph Algorithms & Dijkstra Implementations',
        subject: 'Algorithms & Data Structures',
        note: 'Complete 3 problem sets and trace shortest-path edge cases before evening review.',
        duration: 90,
        status: 'In Progress'
      },
      exam: {
        title: 'Algorithms & Data Structures Comprehensive',
        subject: 'CS-201 Final Exam',
        date: getDefaultExamDate()
      },
      subjects: [
        {
          id: 'sub_1',
          name: 'Algorithms & Data Structures',
          code: 'CS-201',
          progress: 75,
          color: '#B98282'
        },
        {
          id: 'sub_2',
          name: 'Operating Systems & Concurrency',
          code: 'CS-304',
          progress: 55,
          color: '#BC6C52'
        },
        {
          id: 'sub_3',
          name: 'Linear Algebra & Vector Spaces',
          code: 'MATH-210',
          progress: 80,
          color: '#778B79'
        },
        {
          id: 'sub_4',
          name: 'Computer Architecture & Assembly',
          code: 'CS-240',
          progress: 40,
          color: '#B88E50'
        }
      ],
      tasks: [
        {
          id: 'task_1',
          title: 'Implement Dijkstra priority queue and benchmark performance',
          subjectId: 'sub_1',
          priority: 'High',
          estMinutes: 45,
          completed: false,
          createdAt: Date.now() - 3600000 * 2
        },
        {
          id: 'task_2',
          title: 'Synthesize lecture notes on virtual memory & page tables',
          subjectId: 'sub_2',
          priority: 'Medium',
          estMinutes: 30,
          completed: false,
          createdAt: Date.now() - 3600000 * 4
        },
        {
          id: 'task_3',
          title: 'Solve exercise set 4: Orthogonal projections and Gram-Schmidt',
          subjectId: 'sub_3',
          priority: 'High',
          estMinutes: 50,
          completed: false,
          createdAt: Date.now() - 3600000 * 6
        },
        {
          id: 'task_4',
          title: 'Review pipeline hazard mitigation & forwarding paths',
          subjectId: 'sub_4',
          priority: 'Low',
          estMinutes: 25,
          completed: true,
          createdAt: Date.now() - 3600000 * 24
        }
      ],
      weeklyLog: sampleWeeklyLog,
      sessionsToday: 3
    };
  }

  // Load state from localStorage or initialize with defaults
  let state = (function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Object.assign(createDefaultState(), parsed);
      }
    } catch (e) {
      console.warn('StudyFlow: Error loading saved state, falling back to defaults.', e);
    }
    return createDefaultState();
  })();

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('StudyFlow: Failed to save state to localStorage', e);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. AUDIO SYNTHESIZER (WEB AUDIO API — NO EXTERNAL ASSETS)
  // ---------------------------------------------------------------------------
  let audioCtx = null;

  function playSereneChime() {
    if (!state.soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtx) {
        audioCtx = new AudioContextClass();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      // Elegant triad chord: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz)
      const freqs = [523.25, 659.25, 783.99];
      const now = audioCtx.currentTime;

      freqs.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        // Smooth bell curve envelope
        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 1.6);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 1.7);
      });
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  // ---------------------------------------------------------------------------
  // 3. TOAST NOTIFICATIONS
  // ---------------------------------------------------------------------------
  let toastTimer = null;
  function showToast(message) {
    const el = document.getElementById('toastNotification');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('show');
    }, 2800);
  }

  // ---------------------------------------------------------------------------
  // 4. FOCUS TIMER ENGINE
  // ---------------------------------------------------------------------------
  const timerRingCircumference = 2 * Math.PI * 88; // ~552.92
  let timerInterval = null;
  let timerTotalSeconds = 25 * 60;
  let timerRemainingSeconds = 25 * 60;
  let timerIsRunning = false;
  let timerCurrentMode = 'pomodoro';

  const timerDigitsEl = document.getElementById('timerDigits');
  const timerStatusTextEl = document.getElementById('timerStatusText');
  const timerToggleBtn = document.getElementById('timerToggleBtn');
  const timerResetBtn = document.getElementById('timerResetBtn');
  const timerRingFill = document.getElementById('timerRingFill');
  const timerModesEl = document.getElementById('timerModes');
  const sessionCountEl = document.getElementById('sessionCount');
  const sessionDotsContainer = document.getElementById('sessionDotsContainer');
  const timerSubjectTag = document.getElementById('timerSubjectTag');

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function updateTimerDisplay() {
    timerDigitsEl.textContent = formatTime(timerRemainingSeconds);

    // Update circular SVG stroke
    const progress = (timerTotalSeconds - timerRemainingSeconds) / timerTotalSeconds;
    const offset = timerRingCircumference * (1 - progress);
    timerRingFill.style.strokeDashoffset = offset;

    // Document title feedback
    if (timerIsRunning) {
      document.title = `(${formatTime(timerRemainingSeconds)}) StudyFlow`;
    } else {
      document.title = 'StudyFlow — Academic Command Center';
    }
  }

  function startTimer() {
    if (timerIsRunning) return;
    timerIsRunning = true;
    timerToggleBtn.textContent = 'Pause Session';
    timerToggleBtn.classList.remove('btn-primary');
    timerToggleBtn.classList.add('btn-outline');
    timerStatusTextEl.textContent = 'Focusing in session';

    timerInterval = setInterval(() => {
      if (timerRemainingSeconds > 0) {
        timerRemainingSeconds--;
        updateTimerDisplay();
      } else {
        handleTimerComplete();
      }
    }, 1000);
  }

  function pauseTimer() {
    if (!timerIsRunning) return;
    timerIsRunning = false;
    clearInterval(timerInterval);
    timerToggleBtn.textContent = 'Resume Session';
    timerToggleBtn.classList.remove('btn-outline');
    timerToggleBtn.classList.add('btn-primary');
    timerStatusTextEl.textContent = 'Session paused';
    updateTimerDisplay();
  }

  function resetTimer() {
    pauseTimer();
    timerRemainingSeconds = timerTotalSeconds;
    timerToggleBtn.textContent = 'Start Session';
    timerToggleBtn.classList.remove('btn-outline');
    timerToggleBtn.classList.add('btn-primary');
    timerStatusTextEl.textContent = 'Ready to start';
    updateTimerDisplay();
  }

  function handleTimerComplete() {
    pauseTimer();
    playSereneChime();
    showToast('✦ Focus session finished! Great work.');

    // Log study time if it was a focus session (pomodoro or deep)
    if (timerCurrentMode === 'pomodoro' || timerCurrentMode === 'deep') {
      const minutesLogged = Math.round(timerTotalSeconds / 60);
      recordStudySession(minutesLogged);
    }

    timerRemainingSeconds = timerTotalSeconds;
    timerToggleBtn.textContent = 'Start Session';
    timerToggleBtn.classList.remove('btn-outline');
    timerToggleBtn.classList.add('btn-primary');
    timerStatusTextEl.textContent = 'Session complete!';
    updateTimerDisplay();
  }

  function setTimerMode(mode, mins) {
    timerCurrentMode = mode;
    timerTotalSeconds = mins * 60;
    timerRemainingSeconds = timerTotalSeconds;
    pauseTimer();
    timerToggleBtn.textContent = 'Start Session';
    timerToggleBtn.classList.remove('btn-outline');
    timerToggleBtn.classList.add('btn-primary');
    timerStatusTextEl.textContent = `Set to ${mins}m`;

    // Update active tab button
    timerModesEl.querySelectorAll('.timer-mode-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    updateTimerDisplay();
  }

  function recordStudySession(minutes) {
    const today = getLocalDateString();
    
    // Update daily session counter
    state.sessionsToday = (state.sessionsToday || 0) + 1;

    // Update weekly log
    if (!state.weeklyLog) state.weeklyLog = {};
    if (!state.weeklyLog[today]) {
      state.weeklyLog[today] = { minutes: 0, sessions: 0 };
    }
    state.weeklyLog[today].minutes += minutes;
    state.weeklyLog[today].sessions += 1;

    // Check streak
    updateStreakOnActivity(today);

    saveState();
    renderHeaderStats();
    renderSessionDots();
    renderWeeklyStats();
  }

  function updateStreakOnActivity(todayStr) {
    if (!state.streak) {
      state.streak = { count: 1, lastActiveDate: todayStr };
      return;
    }
    if (state.streak.lastActiveDate === todayStr) {
      return; // Already counted today
    }

    // Check if lastActiveDate was yesterday
    const last = new Date(state.streak.lastActiveDate);
    const curr = new Date(todayStr);
    const diffDays = Math.round((curr - last) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      state.streak.count += 1;
    } else if (diffDays > 1) {
      state.streak.count = 1; // Reset streak
    }
    state.streak.lastActiveDate = todayStr;
  }

  function renderSessionDots() {
    sessionCountEl.textContent = state.sessionsToday || 0;
    sessionDotsContainer.innerHTML = '';
    const totalSlots = Math.max(5, (state.sessionsToday || 0) + 1);

    for (let i = 1; i <= totalSlots; i++) {
      const dot = document.createElement('div');
      dot.className = 'session-dot' + (i <= state.sessionsToday ? ' filled' : '');
      dot.title = `Session ${i}`;
      sessionDotsContainer.appendChild(dot);
    }
  }

  // ---------------------------------------------------------------------------
  // 5. TODAY'S PRIMARY FOCUS SECTION
  // ---------------------------------------------------------------------------
  const focusTitleDisplay = document.getElementById('focusTitleDisplay');
  const focusSubjectPill = document.getElementById('focusSubjectPill');
  const focusNoteDisplay = document.getElementById('focusNoteDisplay');
  const focusDuration = document.getElementById('focusDuration');
  const focusStatus = document.getElementById('focusStatus');
  const launchTimerForFocusBtn = document.getElementById('launchTimerForFocusBtn');

  function renderTodayFocus() {
    const f = state.todayFocus || {};
    focusTitleDisplay.textContent = f.title || 'Set your primary academic objective';
    focusSubjectPill.textContent = f.subject || 'Academic Focus';
    focusNoteDisplay.textContent = f.note || 'Prioritize one meaningful concept or deliverable to conquer today.';
    focusDuration.textContent = `${f.duration || 60} mins`;
    focusStatus.textContent = f.status || 'Active';

    // Also update label on the timer card
    timerSubjectTag.textContent = f.subject ? `${f.subject} (${f.title.slice(0, 26)}...)` : 'Self-Directed Study';
  }

  // ---------------------------------------------------------------------------
  // 6. TASKS & AGENDA
  // ---------------------------------------------------------------------------
  let currentFilter = 'all';
  const taskListContainer = document.getElementById('taskListContainer');
  const tasksEmptyState = document.getElementById('tasksEmptyState');
  const countAll = document.getElementById('countAll');
  const countActive = document.getElementById('countActive');
  const countCompleted = document.getElementById('countCompleted');
  const taskSubjectSelect = document.getElementById('taskSubjectSelect');
  const addTaskForm = document.getElementById('addTaskForm');

  function getSubjectById(id) {
    return state.subjects.find((s) => s.id === id);
  }

  function renderTaskSubjectOptions() {
    taskSubjectSelect.innerHTML = '';
    state.subjects.forEach((subj) => {
      const opt = document.createElement('option');
      opt.value = subj.id;
      opt.textContent = `${subj.code} — ${subj.name}`;
      taskSubjectSelect.appendChild(opt);
    });

    // Also update focus modal subject select
    const focusSubjSelect = document.getElementById('focusSubjectSelect');
    if (focusSubjSelect) {
      focusSubjSelect.innerHTML = '';
      state.subjects.forEach((subj) => {
        const opt = document.createElement('option');
        opt.value = subj.name;
        opt.textContent = subj.name;
        focusSubjSelect.appendChild(opt);
      });
    }
  }

  function renderTasks() {
    taskListContainer.innerHTML = '';

    const all = state.tasks || [];
    const active = all.filter((t) => !t.completed);
    const completed = all.filter((t) => t.completed);

    countAll.textContent = all.length;
    countActive.textContent = active.length;
    countCompleted.textContent = completed.length;

    let filtered = all;
    if (currentFilter === 'active') filtered = active;
    if (currentFilter === 'completed') filtered = completed;

    if (filtered.length === 0) {
      tasksEmptyState.style.display = 'block';
    } else {
      tasksEmptyState.style.display = 'none';

      filtered.forEach((task) => {
        const subj = getSubjectById(task.subjectId) || { name: 'General', code: 'GEN' };

        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;

        li.innerHTML = `
          <div class="task-left">
            <button class="task-checkbox-btn" aria-label="Toggle task completion">
              ${task.completed ? '✓' : ''}
            </button>
            <div class="task-info">
              <span class="task-text">${escapeHtml(task.title)}</span>
              <div class="task-tags">
                <span class="tag-badge tag-subject" style="border-left: 3px solid ${subj.color || '#B98282'}">
                  ${escapeHtml(subj.code)}
                </span>
                <span class="tag-badge tag-priority-${escapeHtml(task.priority)}">
                  ${escapeHtml(task.priority)}
                </span>
                <span class="tag-est">${task.estMinutes}m</span>
              </div>
            </div>
          </div>
          <div class="task-right">
            <button class="task-action-btn set-focus-btn" title="Make this today's primary focus">Focus</button>
            <button class="task-action-btn delete-btn" title="Delete task">&times;</button>
          </div>
        `;

        // Toggle Complete
        li.querySelector('.task-checkbox-btn').addEventListener('click', () => {
          task.completed = !task.completed;
          saveState();
          renderTasks();
          showToast(task.completed ? '✓ Task completed' : 'Task marked active');
        });

        // Set as Today's Focus
        li.querySelector('.set-focus-btn').addEventListener('click', () => {
          state.todayFocus = {
            title: task.title,
            subject: subj.name,
            note: `Dedicated focus on "${task.title}". Priority: ${task.priority}.`,
            duration: task.estMinutes || 45,
            status: task.completed ? 'Completed' : 'In Progress'
          };
          saveState();
          renderTodayFocus();
          showToast('✦ Set as today’s primary focus');
        });

        // Delete Task
        li.querySelector('.delete-btn').addEventListener('click', () => {
          state.tasks = state.tasks.filter((t) => t.id !== task.id);
          saveState();
          renderTasks();
          showToast('Task removed from queue');
        });

        taskListContainer.appendChild(li);
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 7. SUBJECTS & EDITABLE PROGRESS
  // ---------------------------------------------------------------------------
  const subjectsGridContainer = document.getElementById('subjectsGridContainer');
  const subjectsEmptyState = document.getElementById('subjectsEmptyState');

  function renderSubjects() {
    subjectsGridContainer.innerHTML = '';
    const list = state.subjects || [];

    if (list.length === 0) {
      subjectsEmptyState.style.display = 'block';
    } else {
      subjectsEmptyState.style.display = 'none';

      list.forEach((subj) => {
        const card = document.createElement('div');
        card.className = 'subject-item-card';
        card.style.borderTop = `3px solid ${subj.color || '#B98282'}`;

        card.innerHTML = `
          <div>
            <div class="subject-header-row">
              <span class="subject-code-tag">${escapeHtml(subj.code)}</span>
              <button class="subject-delete-btn" title="Delete subject">&times;</button>
            </div>
            <h4 class="subject-name">${escapeHtml(subj.name)}</h4>
          </div>

          <div>
            <div class="subject-progress-track">
              <div class="subject-progress-fill" style="width: ${subj.progress}%; background-color: ${subj.color || '#B98282'};"></div>
            </div>

            <div class="subject-control-row" style="margin-top: 10px;">
              <button class="subject-stepper-btn dec-btn" title="Decrease progress by 5%">−5%</button>
              
              <div class="progress-input-wrapper">
                <input 
                  type="number" 
                  class="progress-number-input" 
                  value="${subj.progress}" 
                  min="0" 
                  max="100" 
                  aria-label="Mastery percentage"
                >
                <span class="progress-percent-symbol">%</span>
              </div>

              <button class="subject-stepper-btn inc-btn" title="Increase progress by 5%">+5%</button>
            </div>
          </div>
        `;

        const fillEl = card.querySelector('.subject-progress-fill');
        const numInput = card.querySelector('.progress-number-input');

        function updateProgress(newVal) {
          const clamped = Math.max(0, Math.min(100, newVal));
          subj.progress = clamped;
          numInput.value = clamped;
          fillEl.style.width = `${clamped}%`;
          saveState();
        }

        // Stepper: -5%
        card.querySelector('.dec-btn').addEventListener('click', () => {
          updateProgress(subj.progress - 5);
          showToast(`Updated ${subj.code} to ${subj.progress}%`);
        });

        // Stepper: +5%
        card.querySelector('.inc-btn').addEventListener('click', () => {
          updateProgress(subj.progress + 5);
          showToast(`Updated ${subj.code} to ${subj.progress}%`);
        });

        // Direct input change
        numInput.addEventListener('change', (e) => {
          const val = parseInt(e.target.value, 10);
          updateProgress(isNaN(val) ? 0 : val);
          showToast(`Updated ${subj.code} to ${subj.progress}%`);
        });

        // Delete Subject
        card.querySelector('.subject-delete-btn').addEventListener('click', () => {
          if (confirm(`Remove "${subj.name}" from your curriculum?`)) {
            state.subjects = state.subjects.filter((s) => s.id !== subj.id);
            saveState();
            renderSubjects();
            renderTaskSubjectOptions();
            showToast('Subject removed');
          }
        });

        subjectsGridContainer.appendChild(card);
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 8. EXAM COUNTDOWN
  // ---------------------------------------------------------------------------
  const countdownDays = document.getElementById('countdownDays');
  const countdownHours = document.getElementById('countdownHours');
  const countdownMinutes = document.getElementById('countdownMinutes');
  const countdownSeconds = document.getElementById('countdownSeconds');
  const examSubjectBadge = document.getElementById('examSubjectBadge');
  const examNameDisplay = document.getElementById('examNameDisplay');
  const examDateDisplay = document.getElementById('examDateDisplay');
  const examContentDisplay = document.getElementById('examContentDisplay');
  const examEmptyState = document.getElementById('examEmptyState');

  let countdownInterval = null;

  function renderExamCountdown() {
    const exam = state.exam;
    if (!exam || !exam.date) {
      examContentDisplay.style.display = 'none';
      examEmptyState.style.display = 'block';
      return;
    }

    examContentDisplay.style.display = 'block';
    examEmptyState.style.display = 'none';

    examSubjectBadge.textContent = exam.subject || 'Target Milestone';
    examNameDisplay.textContent = exam.title || 'Major Academic Assessment';

    const targetDate = new Date(exam.date);
    if (isNaN(targetDate.getTime())) {
      examDateDisplay.textContent = 'Date: Not specified';
      return;
    }

    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    examDateDisplay.textContent = `Target: ${targetDate.toLocaleDateString(undefined, options)}`;

    function tick() {
      const now = new Date();
      const diffMs = targetDate - now;

      if (diffMs <= 0) {
        countdownDays.textContent = '00';
        countdownHours.textContent = '00';
        countdownMinutes.textContent = '00';
        countdownSeconds.textContent = '00';
        examDateDisplay.textContent = 'Exam window reached / in progress';
        return;
      }

      const totalSecs = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSecs / 86400);
      const hours = Math.floor((totalSecs % 86400) / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;

      countdownDays.textContent = String(days).padStart(2, '0');
      countdownHours.textContent = String(hours).padStart(2, '0');
      countdownMinutes.textContent = String(minutes).padStart(2, '0');
      countdownSeconds.textContent = String(seconds).padStart(2, '0');
    }

    tick();
    clearInterval(countdownInterval);
    countdownInterval = setInterval(tick, 1000);
  }

  // ---------------------------------------------------------------------------
  // 9. WEEKLY STATISTICS & PURE CSS BAR CHART
  // ---------------------------------------------------------------------------
  const weeklyBarChart = document.getElementById('weeklyBarChart');
  const statWeeklyTotal = document.getElementById('statWeeklyTotal');
  const statDailyAvg = document.getElementById('statDailyAvg');
  const statBestDay = document.getElementById('statBestDay');
  const currentWeekRange = document.getElementById('currentWeekRange');

  function renderWeeklyStats() {
    weeklyBarChart.innerHTML = '';

    const curr = new Date();
    const dayOfWeek = curr.getDay(); // 0 is Sun, 1 is Mon...
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - distanceToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const fmtMonthDay = (d) => `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
    currentWeekRange.textContent = `${fmtMonthDay(monday)} – ${fmtMonthDay(sunday)}`;

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekData = [];
    let totalMinutes = 0;
    let maxMinutes = 60; // baseline scale floor
    let bestDayObj = { day: '—', minutes: 0 };

    const todayStr = getLocalDateString(curr);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateKey = getLocalDateString(d);
      const log = (state.weeklyLog && state.weeklyLog[dateKey]) || { minutes: 0, sessions: 0 };

      totalMinutes += log.minutes;
      if (log.minutes > maxMinutes) maxMinutes = log.minutes;
      if (log.minutes > bestDayObj.minutes) {
        bestDayObj = { day: dayNames[i], minutes: log.minutes };
      }

      weekData.push({
        dayName: dayNames[i],
        dateKey: dateKey,
        minutes: log.minutes,
        sessions: log.sessions,
        isToday: dateKey === todayStr
      });
    }

    // Populate columns
    weekData.forEach((item) => {
      const heightPercent = Math.max(6, Math.round((item.minutes / maxMinutes) * 100));

      const col = document.createElement('div');
      col.className = `chart-col ${item.isToday ? 'is-today' : ''}`;

      col.innerHTML = `
        <div class="chart-bar-container">
          <div 
            class="chart-bar" 
            style="height: ${heightPercent}%;" 
            data-tooltip="${item.minutes} mins (${item.sessions} sessions)"
          ></div>
        </div>
        <span class="chart-day-label">${item.dayName}</span>
      `;

      weeklyBarChart.appendChild(col);
    });

    const totalHours = (totalMinutes / 60).toFixed(1);
    const dailyAvgHours = (totalMinutes / 7 / 60).toFixed(1);

    statWeeklyTotal.textContent = `${totalHours}h`;
    statDailyAvg.textContent = `${dailyAvgHours}h`;
    statBestDay.textContent = bestDayObj.minutes > 0 ? `${bestDayObj.day} (${Math.round(bestDayObj.minutes)}m)` : '—';
  }

  // ---------------------------------------------------------------------------
  // 10. HEADER STATS & GOALS
  // ---------------------------------------------------------------------------
  const streakCountEl = document.getElementById('streakCount');
  const dailyHoursLoggedEl = document.getElementById('dailyHoursLogged');
  const dailyGoalTargetEl = document.getElementById('dailyGoalTarget');
  const soundIconEl = document.getElementById('soundIcon');
  const soundToggleBtn = document.getElementById('soundToggleBtn');

  function renderHeaderStats() {
    streakCountEl.textContent = state.streak ? state.streak.count : 0;

    const todayStr = getLocalDateString();
    const todayLog = (state.weeklyLog && state.weeklyLog[todayStr]) || { minutes: 0 };
    const hoursToday = (todayLog.minutes / 60).toFixed(1);

    dailyHoursLoggedEl.textContent = hoursToday;
    dailyGoalTargetEl.textContent = (state.dailyGoalHours || 3.0).toFixed(1);
    soundIconEl.textContent = state.soundEnabled ? '🔔' : '🔕';
  }

  // ---------------------------------------------------------------------------
  // 11. MODAL CONTROLS & EVENT BINDINGS
  // ---------------------------------------------------------------------------
  function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('open');
  }

  function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('open');
  }

  // Modal Backdrop click to close
  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.remove('open');
    });
  });

  // Sound toggle button
  soundToggleBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    saveState();
    renderHeaderStats();
    showToast(state.soundEnabled ? 'Chime sound enabled' : 'Chime muted');
  });

  // Reset sample data button
  document.getElementById('resetDataBtn').addEventListener('click', () => {
    if (confirm('Restore default sample subjects, tasks, and timer history?')) {
      state = createDefaultState();
      saveState();
      initDashboard();
      showToast('Sample data refreshed');
    }
  });

  // Quick Add Button in header opens task field
  document.getElementById('quickAddBtn').addEventListener('click', () => {
    const input = document.getElementById('taskTitleInput');
    input.focus();
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // Task Filter Tabs
  document.querySelectorAll('.filter-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach((b) => b.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderTasks();
    });
  });

  // Add Task Form submission
  addTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('taskTitleInput');
    const prioritySelect = document.getElementById('taskPrioritySelect');
    const minsInput = document.getElementById('taskEstMinutesInput');

    const title = titleInput.value.trim();
    if (!title) return;

    const newTask = {
      id: 'task_' + Date.now(),
      title: title,
      subjectId: taskSubjectSelect.value || (state.subjects[0] ? state.subjects[0].id : ''),
      priority: prioritySelect.value,
      estMinutes: parseInt(minsInput.value, 10) || 30,
      completed: false,
      createdAt: Date.now()
    };

    state.tasks.unshift(newTask);
    saveState();
    renderTasks();
    titleInput.value = '';
    showToast('Task added to agenda');
  });

  // Subject Modal interactions
  const openAddSubjectBtn = document.getElementById('openAddSubjectBtn');
  const emptyAddSubjectBtn = document.getElementById('emptyAddSubjectBtn');
  const closeSubjectModalBtn = document.getElementById('closeSubjectModalBtn');
  const cancelSubjectModalBtn = document.getElementById('cancelSubjectModalBtn');
  const subjectForm = document.getElementById('subjectForm');

  [openAddSubjectBtn, emptyAddSubjectBtn].forEach((btn) => {
    if (btn) {
      btn.addEventListener('click', () => openModal('subjectModal'));
    }
  });

  [closeSubjectModalBtn, cancelSubjectModalBtn].forEach((btn) => {
    if (btn) {
      btn.addEventListener('click', () => closeModal('subjectModal'));
    }
  });

  subjectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('subjectNameInput').value.trim();
    const code = document.getElementById('subjectCodeInput').value.trim().toUpperCase();
    const progress = parseInt(document.getElementById('subjectProgressInput').value, 10) || 0;
    const colorChoice = document.querySelector('input[name="subjectColor"]:checked');
    const color = colorChoice ? colorChoice.value : '#B98282';

    if (!name || !code) return;

    const newSubj = {
      id: 'sub_' + Date.now(),
      name,
      code,
      progress: Math.max(0, Math.min(100, progress)),
      color
    };

    state.subjects.push(newSubj);
    saveState();
    renderSubjects();
    renderTaskSubjectOptions();
    closeModal('subjectModal');
    subjectForm.reset();
    showToast(`Added ${code} to subjects`);
  });

  // Today's Focus Modal interactions
  const editFocusBtn = document.getElementById('editFocusBtn');
  const closeFocusModalBtn = document.getElementById('closeFocusModalBtn');
  const cancelFocusModalBtn = document.getElementById('cancelFocusModalBtn');
  const focusForm = document.getElementById('focusForm');

  editFocusBtn.addEventListener('click', () => {
    const f = state.todayFocus || {};
    document.getElementById('focusTitleInput').value = f.title || '';
    document.getElementById('focusNoteInput').value = f.note || '';
    document.getElementById('focusDurationInput').value = f.duration || 60;
    const focusSubjSelect = document.getElementById('focusSubjectSelect');
    if (focusSubjSelect && f.subject) {
      focusSubjSelect.value = f.subject;
    }
    openModal('focusModal');
  });

  [closeFocusModalBtn, cancelFocusModalBtn].forEach((btn) => {
    if (btn) {
      btn.addEventListener('click', () => closeModal('focusModal'));
    }
  });

  focusForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('focusTitleInput').value.trim();
    const note = document.getElementById('focusNoteInput').value.trim();
    const duration = parseInt(document.getElementById('focusDurationInput').value, 10) || 60;
    const subject = document.getElementById('focusSubjectSelect').value;

    state.todayFocus = {
      title,
      note,
      duration,
      subject,
      status: 'In Progress'
    };

    saveState();
    renderTodayFocus();
    closeModal('focusModal');
    showToast('✦ Updated today’s primary focus');
  });

  // Launch Timer for Focus button
  launchTimerForFocusBtn.addEventListener('click', () => {
    const f = state.todayFocus || {};
    timerSubjectTag.textContent = f.subject || 'Today’s Focus';
    setTimerMode('pomodoro', 25);
    startTimer();
    showToast(`Timer started: ${f.title.slice(0, 30)}...`);
    document.getElementById('timerDigits').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // Timer mode switcher buttons
  timerModesEl.querySelectorAll('.timer-mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      const mins = parseInt(btn.dataset.mins, 10);
      setTimerMode(mode, mins);
    });
  });

  timerToggleBtn.addEventListener('click', () => {
    if (timerIsRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  timerResetBtn.addEventListener('click', resetTimer);

  // Exam Modal interactions
  const editExamBtn = document.getElementById('editExamBtn');
  const emptySetExamBtn = document.getElementById('emptySetExamBtn');
  const closeExamModalBtn = document.getElementById('closeExamModalBtn');
  const cancelExamModalBtn = document.getElementById('cancelExamModalBtn');
  const examForm = document.getElementById('examForm');

  function openExamModal() {
    const exam = state.exam || {};
    document.getElementById('examTitleInput').value = exam.title || '';
    document.getElementById('examCategoryInput').value = exam.subject || '';
    document.getElementById('examDateInput').value = exam.date || getDefaultExamDate();
    openModal('examModal');
  }

  [editExamBtn, emptySetExamBtn].forEach((btn) => {
    if (btn) btn.addEventListener('click', openExamModal);
  });

  [closeExamModalBtn, cancelExamModalBtn].forEach((btn) => {
    if (btn) btn.addEventListener('click', () => closeModal('examModal'));
  });

  examForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('examTitleInput').value.trim();
    const subject = document.getElementById('examCategoryInput').value.trim();
    const date = document.getElementById('examDateInput').value;

    state.exam = { title, subject, date };
    saveState();
    renderExamCountdown();
    closeModal('examModal');
    showToast('Countdown updated');
  });

  // Goal Modal interactions
  const dailyGoalBadge = document.getElementById('dailyGoalBadge');
  const closeGoalModalBtn = document.getElementById('closeGoalModalBtn');
  const cancelGoalModalBtn = document.getElementById('cancelGoalModalBtn');
  const goalForm = document.getElementById('goalForm');

  dailyGoalBadge.addEventListener('click', () => {
    document.getElementById('goalHoursInput').value = state.dailyGoalHours || 3.0;
    openModal('goalModal');
  });

  [closeGoalModalBtn, cancelGoalModalBtn].forEach((btn) => {
    if (btn) btn.addEventListener('click', () => closeModal('goalModal'));
  });

  goalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = parseFloat(document.getElementById('goalHoursInput').value);
    state.dailyGoalHours = isNaN(val) ? 3.0 : Math.max(0.5, Math.min(14, val));
    saveState();
    renderHeaderStats();
    closeModal('goalModal');
    showToast(`Daily goal updated to ${state.dailyGoalHours.toFixed(1)}h`);
  });

  // Utility to prevent XSS in text injection
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ---------------------------------------------------------------------------
  // 12. INITIALIZATION
  // ---------------------------------------------------------------------------
  function initDashboard() {
    renderHeaderStats();
    renderTodayFocus();
    renderTaskSubjectOptions();
    renderTasks();
    renderSubjects();
    renderExamCountdown();
    renderWeeklyStats();
    renderSessionDots();
    updateTimerDisplay();
  }

  // Kick off application
  initDashboard();
})();
