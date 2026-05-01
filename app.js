// app.js — Data Mastery Dashboard with Gamification
const model = window.model || "gemini-2.5-flash-preview-09-2025";
const curriculumData = window.curriculumData || [];
let state = { completedDays: new Set(), completedWeeks: new Set(), completedTasks: {}, activeWeek: 1, xp: 0, prevLevel: 1, badges: new Set(), streakFreeze: false, timerSessions: 0 };

// ─── QUOTES ─────────────────────────────────────────────────
const QUOTES = [
  { text: "The goal is to turn data into information, and information into insight.", author: "Carly Fiorina" },
  { text: "Without data, you're just another person with an opinion.", author: "W. Edwards Deming" },
  { text: "Data is the new oil. It's valuable, but if unrefined it cannot really be used.", author: "Clive Humby" },
  { text: "In God we trust; all others must bring data.", author: "W. Edwards Deming" },
  { text: "Information is the oil of the 21st century, and analytics is the combustion engine.", author: "Peter Sondergaard" },
  { text: "What gets measured gets managed.", author: "Peter Drucker" },
  { text: "The world is one big data problem.", author: "Andrew McAfee" },
  { text: "Torture the data, and it will confess to anything.", author: "Ronald Coase" },
  { text: "Data are just summaries of thousands of stories — tell a few of those stories.", author: "Chip Heath" },
  { text: "It is a capital mistake to theorize before one has data.", author: "Arthur Conan Doyle" },
  { text: "You can have data without information, but you cannot have information without data.", author: "Daniel Keys Moran" },
  { text: "Numbers have an important story to tell. They rely on you to give them a voice.", author: "Stephen Few" },
  { text: "The price of light is less than the cost of darkness.", author: "Arthur C. Nielsen" },
  { text: "Every day, three times per second, we produce the equivalent of the Library of Congress.", author: "Eric Schmidt" },
  { text: "Statistics are like bikinis. What they reveal is suggestive, but what they conceal is vital.", author: "Aaron Levenstein" },
  { text: "Big data is at the foundation of all the megatrends that are happening.", author: "Chris Lynch" },
  { text: "Data beats emotions.", author: "Sean Rad" },
  { text: "A data scientist is someone who is better at statistics than any software engineer.", author: "Josh Wills" },
  { text: "Errors using inadequate data are much less than those using no data at all.", author: "Charles Babbage" },
  { text: "If we have data, let's look at data. If all we have are opinions, let's go with mine.", author: "Jim Barksdale" },
  { text: "Data is a precious thing and will last longer than the systems themselves.", author: "Tim Berners-Lee" },
  { text: "The greatest value of a picture is when it forces us to notice what we never expected to see.", author: "John Tukey" },
  { text: "Think analytically, rigorously, and systematically about a business problem.", author: "Michael O'Connell" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "An approximate answer to the right problem is worth a good deal more than an exact answer to an approximate problem.", author: "John Tukey" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" }
];

// ─── BADGES DEFINITIONS ─────────────────────────────────────
const BADGE_DEFS = [
  { id: 'first_spark', icon: '🔥', name: 'First Spark', desc: 'Complete your first day', check: () => state.completedDays.size >= 1 },
  { id: 'week_warrior', icon: '📊', name: 'Week Warrior', desc: 'Complete a full week', check: () => state.completedWeeks.size >= 1 },
  { id: 'halfway', icon: '🎯', name: 'Halfway Hero', desc: 'Reach 50% completion', check: () => (completedTasksCount() / totalTasksCount() * 100) >= 50 },
  { id: 'streak7', icon: '🧠', name: 'Streak Master', desc: 'Hit a 7-day streak', check: () => calculateStreak() >= 7 },
  { id: 'complete', icon: '💎', name: 'Completionist', desc: '100% all tasks', check: () => completedTasksCount() === totalTasksCount() && totalTasksCount() > 0 },
  { id: 'ai_user', icon: '✨', name: 'AI Explorer', desc: 'Use AI Storyteller', check: () => state.badges.has('ai_user') }
];

// ─── LEVEL SYSTEM ────────────────────────────────────────────
const LEVELS = [
  { level: 1, title: 'Rookie', xp: 0 },
  { level: 2, title: 'Analyst', xp: 100 },
  { level: 3, title: 'Strategist', xp: 300 },
  { level: 4, title: 'Architect', xp: 600 },
  { level: 5, title: 'Data Sage', xp: 1000 }
];
function getLevel(xp) { for (let i = LEVELS.length - 1; i >= 0; i--) { if (xp >= LEVELS[i].xp) return LEVELS[i]; } return LEVELS[0]; }
function getNextLevel(xp) { const cur = getLevel(xp); const idx = LEVELS.findIndex(l => l.level === cur.level); return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null; }

// ─── STATE PERSISTENCE ──────────────────────────────────────
function loadState() {
  try {
    state.completedDays = new Set(JSON.parse(localStorage.getItem('completedDays') || '[]'));
    state.completedWeeks = new Set(JSON.parse(localStorage.getItem('completedWeeks') || '[]'));
    const ct = JSON.parse(localStorage.getItem('completedTasks') || '{}');
    state.completedTasks = Object.fromEntries(Object.entries(ct).map(([k, arr]) => [k, new Set(arr)]));
    state.xp = parseInt(localStorage.getItem('xp') || '0');
    state.prevLevel = getLevel(state.xp).level;
    state.badges = new Set(JSON.parse(localStorage.getItem('badges') || '[]'));
    state.streakFreeze = localStorage.getItem('streakFreeze') === 'true';
    state.timerSessions = parseInt(localStorage.getItem('timerSessions') || '0');
  } catch (e) { state.completedDays = new Set(); state.completedWeeks = new Set(); state.completedTasks = {}; state.xp = 0; state.badges = new Set(); }
}
function saveState() {
  localStorage.setItem('completedDays', JSON.stringify([...state.completedDays]));
  localStorage.setItem('completedWeeks', JSON.stringify([...state.completedWeeks]));
  const ct = Object.fromEntries(Object.entries(state.completedTasks).map(([k, s]) => [k, [...s]]));
  localStorage.setItem('completedTasks', JSON.stringify(ct));
  localStorage.setItem('xp', state.xp);
  localStorage.setItem('badges', JSON.stringify([...state.badges]));
  localStorage.setItem('streakFreeze', state.streakFreeze);
  localStorage.setItem('timerSessions', state.timerSessions);
}

// ─── CALCULATIONS ───────────────────────────────────────────
function totalTasksCount() { return curriculumData.reduce((a, w) => a + w.days.reduce((b, d) => b + (d.tasks ? d.tasks.length : 0), 0), 0); }
function completedTasksCount() { return Object.values(state.completedTasks || {}).reduce((a, s) => a + (s ? s.size : 0), 0); }
function calculateStreak() {
  const allDays = curriculumData.flatMap(w => w.days).map(d => d.day).sort((a, b) => a - b);
  let streak = 0;
  for (let i = allDays.length - 1; i >= 0; i--) { if (state.completedDays.has(allDays[i])) streak++; else break; }
  if (streak === 0) { for (let i = 0; i < allDays.length; i++) { if (state.completedDays.has(allDays[i])) streak++; else break; } }
  return streak;
}
function weekProgress(w) {
  const total = w.days.reduce((a, d) => a + (d.tasks ? d.tasks.length : 0), 0);
  const done = w.days.reduce((a, d) => a + ((state.completedTasks[String(d.day)] && state.completedTasks[String(d.day)].size) || 0), 0);
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

// ─── XP SYSTEM ──────────────────────────────────────────────
function addXP(amount, label) {
  const oldLevel = getLevel(state.xp).level;
  state.xp += amount;
  saveState();
  const newLevel = getLevel(state.xp).level;
  showToast(`+${amount} XP — ${label}`, 'xp', 2000);
  if (newLevel > oldLevel) { setTimeout(() => showLevelUpModal(getLevel(state.xp)), 500); }
  updateXPBar();
}
function updateXPBar() {
  const cur = getLevel(state.xp);
  const next = getNextLevel(state.xp);
  const badge = document.getElementById('xpLevelBadge');
  const fill = document.getElementById('xpBarFill');
  const text = document.getElementById('xpText');
  if (badge) badge.textContent = `Lv.${cur.level} ${cur.title}`;
  if (text) text.textContent = `${state.xp} XP`;
  if (fill) {
    if (next) { const pct = ((state.xp - cur.xp) / (next.xp - cur.xp)) * 100; fill.style.width = pct + '%'; }
    else { fill.style.width = '100%'; }
  }
}

// ─── BADGES ─────────────────────────────────────────────────
function checkBadges() {
  BADGE_DEFS.forEach(b => {
    if (!state.badges.has(b.id) && b.check()) {
      state.badges.add(b.id);
      saveState();
      showToast(`🏆 Badge Unlocked: ${b.name}!`, 'success', 4000);
      launchConfetti();
    }
  });
  renderBadges();
}
function renderBadges() {
  const el = document.getElementById('badgesSection');
  if (!el) return;
  const unlocked = state.badges.size;
  el.innerHTML = `<div class="badges-section-header"><h3>🏆 Achievements</h3><span class="badges-count">${unlocked} / ${BADGE_DEFS.length} Unlocked</span></div>
  <div class="badges-grid">${BADGE_DEFS.map(b => {
    const isUnlocked = state.badges.has(b.id);
    return `<div class="badge-item ${isUnlocked ? 'unlocked' : 'locked'}"><span class="badge-icon">${b.icon}</span><div class="badge-name">${b.name}</div><div class="badge-desc">${b.desc}</div></div>`;
  }).join('')}</div>`;
}

// ─── QUOTE ──────────────────────────────────────────────────
function renderQuote() {
  const idx = Math.floor((Date.now() / 86400000)) % QUOTES.length;
  const q = QUOTES[idx];
  const el = document.getElementById('quoteText');
  const auth = document.getElementById('quoteAuthor');
  if (el) el.textContent = `"${q.text}"`;
  if (auth) auth.textContent = `— ${q.author}`;
}

// ─── CONFETTI ───────────────────────────────────────────────
function launchConfetti() {
  const c = document.getElementById('confetti-container');
  if (!c) return;
  const colors = ['#7c3aed', '#14b8a6', '#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#ec4899'];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = Math.random() * 100 + '%';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.setProperty('--fall-duration', (2 + Math.random() * 2) + 's');
    p.style.animationDelay = Math.random() * 0.5 + 's';
    p.style.width = (6 + Math.random() * 8) + 'px';
    p.style.height = (6 + Math.random() * 8) + 'px';
    c.appendChild(p);
    setTimeout(() => p.remove(), 5000);
  }
}

// ─── LEVEL UP MODAL ─────────────────────────────────────────
function showLevelUpModal(level) {
  launchConfetti();
  const modal = document.getElementById('levelupModal');
  const title = document.getElementById('levelupTitle');
  const sub = document.getElementById('levelupSub');
  if (title) title.textContent = `Level ${level.level}: ${level.title}!`;
  if (sub) sub.textContent = `You've reached the rank of ${level.title}. Keep pushing!`;
  if (modal) modal.style.display = 'flex';
}
function closeLevelUp() {
  const modal = document.getElementById('levelupModal');
  if (modal) { modal.classList.add('hiding'); setTimeout(() => { modal.style.display = 'none'; modal.classList.remove('hiding'); }, 300); }
}

// ─── FOCUS TIMER ────────────────────────────────────────────
let timerInterval = null, timerSeconds = 25 * 60, timerRunning = false, timerIsBreak = false;
function openTimer() { document.getElementById('timerPanel').classList.remove('collapsed'); document.getElementById('timerToggle').classList.add('active'); }
function closeTimer() { document.getElementById('timerPanel').classList.add('collapsed'); document.getElementById('timerToggle').classList.remove('active'); }
function toggleTimer() {
  if (timerRunning) { clearInterval(timerInterval); timerRunning = false; document.getElementById('timerStartBtn').textContent = 'Resume'; }
  else { timerRunning = true; document.getElementById('timerStartBtn').textContent = 'Pause'; timerInterval = setInterval(timerTick, 1000); }
}
function timerTick() {
  timerSeconds--;
  if (timerSeconds <= 0) {
    clearInterval(timerInterval); timerRunning = false;
    if (!timerIsBreak) { state.timerSessions++; saveState(); addXP(15, 'Focus session'); showToast('Focus session complete! Take a break 🎉', 'success'); timerIsBreak = true; timerSeconds = 5 * 60; }
    else { showToast('Break over — ready for another round?', 'info'); timerIsBreak = false; timerSeconds = 25 * 60; }
    document.getElementById('timerStartBtn').textContent = 'Start';
  }
  updateTimerDisplay();
}
function resetTimer() { clearInterval(timerInterval); timerRunning = false; timerIsBreak = false; timerSeconds = 25 * 60; document.getElementById('timerStartBtn').textContent = 'Start'; updateTimerDisplay(); }
function updateTimerDisplay() {
  const m = Math.floor(timerSeconds / 60), s = timerSeconds % 60;
  const display = document.getElementById('timerDisplay');
  const label = document.getElementById('timerLabel');
  const sessions = document.getElementById('timerSessions');
  if (display) { display.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; display.className = 'timer-display' + (timerIsBreak ? ' break-mode' : ''); }
  if (label) label.textContent = timerIsBreak ? 'Break Time' : 'Focus Session';
  if (sessions) sessions.textContent = state.timerSessions;
}

// ─── RENDER ─────────────────────────────────────────────────
function renderWeekTabs() {
  const el = document.getElementById('weekTabs');
  if (!el) return;
  el.innerHTML = curriculumData.map(w => {
    const wp = weekProgress(w);
    return `<button class="week-tab ${state.activeWeek === w.week ? 'active' : ''}" onclick="switchWeekTab(${w.week})">Week ${w.week}<span class="tab-progress">${wp.pct}%</span></button>`;
  }).join('');
}
function switchWeekTab(n) { state.activeWeek = n; renderWeekTabs(); renderCurriculum(); }
function renderCurriculum() {
  const c = document.getElementById('curriculum');
  if (!c) return;
  c.innerHTML = curriculumData.map(w => {
    const wp = weekProgress(w);
    return `<div class="week-panel ${state.activeWeek === w.week ? 'active' : ''}">
      <div class="week-panel-header"><div class="week-meta"><h3>${w.title}</h3><p>${w.goal}</p><div class="week-progress-bar"><div class="week-progress-fill" style="width:${wp.pct}%"></div></div></div>
      <button onclick="toggleWeek(${w.week})" class="week-toggle-btn ${state.completedWeeks.has(w.week) ? 'completed' : ''}">${wp.done === wp.total ? '✅ Week Complete' : `${wp.done} / ${wp.total} tasks`}</button></div>
      <div class="days-grid">${w.days.map(d => renderDayCard(d)).join('')}</div></div>`;
  }).join('');
}
function renderDayCard(d) {
  const isDone = state.completedDays.has(d.day);
  const dt = state.completedTasks[String(d.day)];
  return `<div role="button" tabindex="0" aria-pressed="${isDone}" class="day-card ${isDone ? 'completed' : ''}" onclick="toggleDay(${d.day})" onkeypress="if(event.key==='Enter'){toggleDay(${d.day})}">
    <div class="day-card-top"><span class="day-num">Day ${d.day < 10 ? '0' + d.day : d.day}</span><span class="day-check">${isDone ? '✓' : ''}</span></div>
    <div class="day-topic">${d.topic}</div>
    <ul class="task-list">${d.tasks.map((t, i) => { const ck = dt && dt.has(i); return `<li class="task-item ${ck ? 'done' : ''}"><input aria-label="Task ${i + 1}" onclick="event.stopPropagation();toggleTask(${d.day},${i})" type="checkbox" ${ck ? 'checked' : ''}/><span class="task-text">${t}</span></li>`; }).join('')}</ul>
    <div class="resource-list">${d.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener" onclick="event.stopPropagation()" class="resource-link"><span class="resource-name">${l.name}</span><span class="resource-badge badge-${l.type}">${l.type === 'yt' ? 'YouTube' : l.type === 'read' ? 'Read' : 'Practice'}</span></a>`).join('')}</div></div>`;
}
function render() { renderQuote(); renderBadges(); renderWeekTabs(); renderCurriculum(); updateXPBar(); updateTimerDisplay(); update(); }

// ─── UPDATE STATS ───────────────────────────────────────────
function update() {
  const total = totalTasksCount(), done = completedTasksCount();
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const streak = calculateStreak();
  const el = (id) => document.getElementById(id);
  if (el('globalPct')) el('globalPct').innerText = `${pct}% Complete`;
  if (el('statDays')) el('statDays').innerText = `${state.completedDays.size} / 28`;
  if (el('statTasks')) el('statTasks').innerText = `${done}`;
  if (el('statStreak')) {
    const fire = streak >= 14 ? '🔥🔥🔥' : streak >= 7 ? '🔥🔥' : '🔥';
    el('statStreak').innerHTML = `${fire} ${streak} day${streak !== 1 ? 's' : ''}`;
  }
  if (el('statOverall')) el('statOverall').innerText = `${pct}%`;
  const ring = el('progressRing'), ringPct = el('ringPct');
  if (ring) { const c = 2 * Math.PI * 20; ring.style.strokeDasharray = c; ring.style.strokeDashoffset = c - (pct / 100) * c; }
  if (ringPct) ringPct.innerText = `${pct}%`;
}

// ─── TOGGLE ACTIONS ─────────────────────────────────────────
function toggleDay(d) {
  const key = String(d), dayObj = curriculumData.flatMap(w => w.days).find(x => x.day === d);
  if (!dayObj) return;
  if (state.completedDays.has(d)) { state.completedDays.delete(d); state.completedTasks[key] = new Set(); }
  else { state.completedDays.add(d); state.completedTasks[key] = new Set(Array.from({ length: dayObj.tasks.length }, (_, i) => i)); addXP(50, 'Day completed'); launchConfetti(); }
  saveState(); checkBadges(); render();
}
function toggleWeek(wNum) {
  const w = curriculumData.find(v => v.week === wNum);
  if (!w) return;
  if (state.completedWeeks.has(wNum)) { state.completedWeeks.delete(wNum); w.days.forEach(d => { state.completedDays.delete(d.day); state.completedTasks[String(d.day)] = new Set(); }); }
  else { state.completedWeeks.add(wNum); w.days.forEach(d => { state.completedDays.add(d.day); state.completedTasks[String(d.day)] = new Set(Array.from({ length: d.tasks.length }, (_, i) => i)); }); addXP(200, 'Week completed'); launchConfetti(); }
  saveState(); checkBadges(); render();
  if (w) { const allDone = w.days.every(d => (state.completedTasks[String(d.day)] && state.completedTasks[String(d.day)].size === d.tasks.length)); if (allDone) showToast(`Week ${wNum} complete 🎉`, 'success'); }
}
function toggleTask(day, idx) {
  const key = String(day);
  if (!state.completedTasks[key]) state.completedTasks[key] = new Set();
  const wasChecked = state.completedTasks[key].has(idx);
  if (wasChecked) state.completedTasks[key].delete(idx); else { state.completedTasks[key].add(idx); addXP(10, 'Task completed'); }
  const dayObj = curriculumData.flatMap(w => w.days).find(x => x.day === day);
  if (state.completedTasks[key].size === dayObj.tasks.length) state.completedDays.add(day); else state.completedDays.delete(day);
  const weekObj = curriculumData.find(w => w.days.some(d => d.day === day));
  if (weekObj) { const allDone = weekObj.days.every(d => (state.completedTasks[String(d.day)] && state.completedTasks[String(d.day)].size === d.tasks.length)); if (allDone) { state.completedWeeks.add(weekObj.week); showToast(`Week ${weekObj.week} complete 🎉`, 'success'); } else state.completedWeeks.delete(weekObj.week); }
  saveState(); checkBadges(); render();
}

// ─── TOAST ──────────────────────────────────────────────────
function showToast(message, type = 'info', timeout = 3000) {
  const c = document.getElementById('toast-container'); if (!c) return;
  const el = document.createElement('div'); el.className = `toast ${type}`; el.innerHTML = `<div>${message}</div>`;
  c.appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity 200ms, transform 200ms'; el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; setTimeout(() => el.remove(), 220); }, timeout);
}

// ─── AI ─────────────────────────────────────────────────────
async function askAI() {
  const val = document.getElementById('aiInput').value.trim(); if (!val) return;
  const out = document.getElementById('aiResponse'), spin = document.getElementById('spin'), btn = document.getElementById('aiBtn');
  if (btn) { btn.disabled = true; } spin.classList.remove('hidden'); out.classList.add('opacity-40');
  try {
    const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: val, model }) });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json(); out.innerText = data.text || 'No response';
    if (!state.badges.has('ai_user')) { state.badges.add('ai_user'); saveState(); checkBadges(); }
  } catch (e) { out.innerText = `Error: ${e.message}`; }
  finally { spin.classList.add('hidden'); out.classList.remove('opacity-40'); if (btn) btn.disabled = false; }
}

// ─── EXPOSE & BOOT ──────────────────────────────────────────
window.toggleDay = toggleDay; window.toggleWeek = toggleWeek; window.toggleTask = toggleTask;
window.switchWeekTab = switchWeekTab; window.askAI = askAI;
window.openTimer = openTimer; window.closeTimer = closeTimer; window.toggleTimer = toggleTimer; window.resetTimer = resetTimer;
window.closeLevelUp = closeLevelUp;
loadState(); window.onload = () => { render(); };
