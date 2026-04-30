// app.js - application script extracted from index.html
const model = window.model || "gemini-2.5-flash-preview-09-2025";

const curriculumData = window.curriculumData || [];

let state = { completedDays: new Set(), completedWeeks: new Set(), completedTasks: {}, charts: {} };

function loadState() {
    try {
        const cd = JSON.parse(localStorage.getItem('completedDays') || '[]');
        const cw = JSON.parse(localStorage.getItem('completedWeeks') || '[]');
        const ct = JSON.parse(localStorage.getItem('completedTasks') || '{}');
        state.completedDays = new Set(cd);
        state.completedWeeks = new Set(cw);
        // convert arrays to sets for quick lookup
        state.completedTasks = Object.fromEntries(Object.entries(ct).map(([k, arr]) => [k, new Set(arr)]));
    } catch (e) { state.completedDays = new Set(); state.completedWeeks = new Set(); state.completedTasks = {}; }
}

function saveState() {
    localStorage.setItem('completedDays', JSON.stringify([...state.completedDays]));
    localStorage.setItem('completedWeeks', JSON.stringify([...state.completedWeeks]));
    // convert sets to arrays for storage
    const ct = Object.fromEntries(Object.entries(state.completedTasks).map(([k, s]) => [k, [...s]]));
    localStorage.setItem('completedTasks', JSON.stringify(ct));
}

function render() {
    const container = document.getElementById('curriculum');
    container.innerHTML = curriculumData.map(w => `
        <div class="space-y-8">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6">
                <div class="space-y-2">
                    <span class="text-teal-500 font-black text-xs uppercase tracking-widest">Mastery Block 0${w.week}</span>
                    <h2 class="text-3xl font-black text-white">${w.title}</h2>
                    <p class="text-sm text-slate-400 max-w-2xl">${w.goal}</p>
                </div>
                <button onclick="toggleWeek(${w.week})" class="px-4 py-2 rounded-2xl font-black text-xs transition-all ${state.completedWeeks.has(w.week) ? 'bg-teal-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}">
                    <span class="week-badge">
                        ${(() => {
                            const total = w.days.reduce((a,d) => a + (d.tasks?d.tasks.length:0), 0);
                            const done = w.days.reduce((a,d) => a + ((state.completedTasks[String(d.day)] && state.completedTasks[String(d.day)].size) || 0), 0);
                            return done === total ? '✅ WEEK DONE' : `WEEK ${done}/${total}`;
                        })()}
                        <span class="week-progress" aria-hidden="true"><i style="width:${(() => { const total = w.days.reduce((a,d) => a + (d.tasks?d.tasks.length:0), 0); const done = w.days.reduce((a,d) => a + ((state.completedTasks[String(d.day)] && state.completedTasks[String(d.day)].size) || 0), 0); return total? Math.round((done/total)*100) + '%':'0%'; })()}"></i></span>
                    </span>
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                ${w.days.map(d => `
                    <div role="button" tabindex="0" aria-pressed="${state.completedDays.has(d.day)}" class="day-card rounded-2xl p-5 flex flex-col h-full bg-slate-900/30 ${state.completedDays.has(d.day) ? 'day-completed' : ''}" onclick="toggleDay(${d.day})" onkeypress="if(event.key==='Enter'){toggleDay(${d.day})}">
                        <div class="flex justify-between items-start mb-4">
                            <span class="text-[10px] font-black text-slate-500 uppercase">Day ${d.day < 10 ? '0'+d.day : d.day}</span>
                            ${state.completedDays.has(d.day) ? '<span class="text-teal-500 text-xs font-bold">Done</span>' : ''}
                        </div>
                        <h4 class="text-sm font-black text-white leading-tight mb-3">${d.topic}</h4>
                        <ul class="space-y-1 flex-grow mb-4">
                            ${d.tasks.map((t, ti) => {
                                const checked = (state.completedTasks[d.day] && state.completedTasks[d.day].has(ti)) ? 'checked' : '';
                                return `<li class="text-[9px] text-slate-400 flex items-start gap-2">` +
                                    `<input aria-label="Mark task ${ti+1} complete" onclick="event.stopPropagation(); toggleTask(${d.day}, ${ti});" type="checkbox" ${checked} class="mt-1 w-3 h-3" />` +
                                    `<span class="truncate">${t}</span>` +
                                    `</li>`;
                            }).join('')}
                        </ul>
                        <div class="space-y-2">
                            ${d.links.map(l => `
                                <a href="${l.url}" target="_blank" onclick="event.stopPropagation()" class="flex items-center justify-between p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors">
                                    <span class="text-[8px] font-bold text-slate-300 truncate">${l.name}</span>
                                    <span class="tag ${l.type === 'yt' ? 'tag-yt' : (l.type === 'read' ? 'tag-read' : 'tag-practice')}">${l.type}</span>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    // initialize chart if needed
    if (!state.charts.p) {
        const ctx = document.getElementById('progressChart');
        if (ctx) {
            const total = totalTasksCount();
            state.charts.p = new Chart(ctx, { type: 'doughnut', data: { datasets: [{ data: [0, total], backgroundColor: ['#14b8a6', '#1e293b'], borderWidth: 0, cutout: '85%' }] }, options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } } });
        }
    }
    update();
}

function totalTasksCount() {
    return curriculumData.reduce((acc, w) => acc + w.days.reduce((dacc, d) => dacc + (d.tasks ? d.tasks.length : 0), 0), 0);
}

function completedTasksCount() {
    return Object.values(state.completedTasks || {}).reduce((acc, s) => acc + (s ? s.size : 0), 0);
}

function toggleDay(d) {
    // toggle all tasks for the day
    const key = String(d);
    const dayObj = curriculumData.flatMap(w => w.days).find(x => x.day === d);
    if (!dayObj) return;
    const taskCount = dayObj.tasks ? dayObj.tasks.length : 0;
    if (state.completedDays.has(d)) {
        state.completedDays.delete(d);
        state.completedTasks[key] = new Set();
    } else {
        state.completedDays.add(d);
        state.completedTasks[key] = new Set(Array.from({ length: taskCount }, (_, i) => i));
    }
    saveState(); update(); render();
}

function toggleWeek(wNum) {
    const w = curriculumData.find(v => v.week === wNum);
    if (!w) return;
    if (state.completedWeeks.has(wNum)) {
        state.completedWeeks.delete(wNum);
        w.days.forEach(d => { state.completedDays.delete(d.day); state.completedTasks[String(d.day)] = new Set(); });
    } else {
        state.completedWeeks.add(wNum);
        w.days.forEach(d => { state.completedDays.add(d.day); state.completedTasks[String(d.day)] = new Set(Array.from({ length: d.tasks.length }, (_, i) => i)); });
    }
    saveState(); update(); render();
    if (w) {
        const allDone = w.days.every(d => (state.completedTasks[String(d.day)] && state.completedTasks[String(d.day)].size === d.tasks.length));
        if (allDone) showToast(`Week ${wNum} complete 🎉`, 'success');
    }
}

function showToast(message, type = 'info', timeout = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14"/></svg><div>${message}</div>`;
    container.appendChild(el);
    setTimeout(() => { el.style.transition = 'opacity 200ms, transform 200ms'; el.style.opacity = '0'; el.style.transform = 'translateY(8px) scale(.98)'; setTimeout(() => el.remove(), 220); }, timeout);
}

function toggleTask(day, idx) {
    const key = String(day);
    if (!state.completedTasks[key]) state.completedTasks[key] = new Set();
    if (state.completedTasks[key].has(idx)) state.completedTasks[key].delete(idx);
    else state.completedTasks[key].add(idx);
    // update day completed status
    const dayObj = curriculumData.flatMap(w => w.days).find(x => x.day === day);
    const total = dayObj.tasks.length;
    if (state.completedTasks[key].size === total) state.completedDays.add(day);
    else state.completedDays.delete(day);
    // update week completed status and show toast when a week becomes fully complete
    const weekObj = curriculumData.find(w => w.days.some(d => d.day === day));
    if (weekObj) {
        const allDone = weekObj.days.every(d => (state.completedTasks[String(d.day)] && state.completedTasks[String(d.day)].size === d.tasks.length));
        if (allDone) { state.completedWeeks.add(weekObj.week); showToast(`Week ${weekObj.week} complete 🎉`, 'success'); }
        else { state.completedWeeks.delete(weekObj.week); }
    }
    saveState(); update(); render();
}
function update() {
    const total = totalTasksCount();
    const done = completedTasksCount();
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    const globalPct = document.getElementById('globalPct');
    const chartPct = document.getElementById('chartPct');
    if (globalPct) globalPct.innerText = `${pct}% COMPLETE`;
    if (chartPct) chartPct.innerText = `${pct}%`;
    if (state.charts.p) {
        state.charts.p.data.datasets[0].data = [done, Math.max(0, total - done)];
        state.charts.p.update();
    }
    // animate week progress bars
    document.querySelectorAll('.week-progress > i').forEach(el => {
        const width = el.style.width || '0%';
        el.style.width = width; // ensures style exists
    });
}

async function askAI() {
    const val = document.getElementById('aiInput').value.trim(); if(!val) return;
    const out = document.getElementById('aiResponse'); const spin = document.getElementById('spin');
    const btn = document.getElementById('aiBtn');
    if (btn) { btn.disabled = true; btn.setAttribute('aria-disabled','true'); }
    spin.classList.remove('hidden'); out.classList.add('opacity-40');
    try {
        const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: val, model }) });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        out.innerText = data.text || 'No response';
    } catch (e) { out.innerText = `Error: ${e.message}`; }
    finally { spin.classList.add('hidden'); out.classList.remove('opacity-40'); if (btn) { btn.disabled = false; btn.removeAttribute('aria-disabled'); } }
}

// expose to global for inline handlers
window.toggleDay = toggleDay;
window.toggleWeek = toggleWeek;
window.askAI = askAI;

// bootstrap
loadState();
window.curriculumData = curriculumData.length ? curriculumData : window.curriculumData;
window.onload = () => { render(); };
