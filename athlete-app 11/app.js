const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const ACCENT_COLORS = ['#F07020','#3870C0','#30A030','#A030A0','#C03020','#D09020'];

const S = {
  day: getTodayDayKey() || 'lundi',
  week: 1, tab: 'seance',
  focusExoIdx: 0, focusSerieIdx: 0,
  cache: {}, notes: {}, bwHistory: [], cardioLog: {}, sessionScores: {},
  achievements: [],
  gainage: { step: 0, phase: 'idle', elapsed: 0, startTime: null, interval: null, completed: 0 },
  sessionStart: null, sessionInterval: null, sessionDuration: 0,
  timer: { val: 0, startTime: null, interval: null, running: false },
  wakeLock: null, syncing: false,
  settings: { theme:'dark', accent:'#F07020', deload:true, plateau:true, balance:true, weight:93, height:193, age:32 },
  calMonth: { year: new Date().getFullYear(), month: new Date().getMonth() },
  sectionOpen: { gainage: true, abdos: true, cardio: true },
};

// ── SUPABASE ──────────────────────────────────────────────────────────────────
function saveLocal() {
  try {
    localStorage.setItem('at_cache', JSON.stringify(S.cache));
    localStorage.setItem('at_notes', JSON.stringify(S.notes));
    localStorage.setItem('at_cardio', JSON.stringify(S.cardioLog));
    localStorage.setItem('at_scores', JSON.stringify(S.sessionScores));
    localStorage.setItem('at_ach', JSON.stringify(S.achievements));
    localStorage.setItem('at_st', JSON.stringify(S.settings));
    localStorage.setItem('at_week', S.week.toString());
    localStorage.setItem('at_day', S.day);
  } catch(e) {}
}

function loadLocal() {
  try {
    const c = localStorage.getItem('at_cache'); if (c) S.cache = JSON.parse(c);
    const n = localStorage.getItem('at_notes'); if (n) S.notes = JSON.parse(n);
    const ca = localStorage.getItem('at_cardio'); if (ca) S.cardioLog = JSON.parse(ca);
    const sc = localStorage.getItem('at_scores'); if (sc) S.sessionScores = JSON.parse(sc);
    const ach = localStorage.getItem('at_ach'); if (ach) S.achievements = JSON.parse(ach);
    const st = localStorage.getItem('at_st'); if (st) S.settings = { ...S.settings, ...JSON.parse(st) };
    const w = localStorage.getItem('at_week'); if (w) S.week = parseInt(w);
    // Auto-detect today's day
    const today = getTodayDayKey();
    if (today) S.day = today;
    else { const d = localStorage.getItem('at_day'); if (d) S.day = d; }
  } catch(e) {}
}

async function loadAllData() {
  try {
    const { data: sets } = await sb.from('sets').select('*').eq('user_id', USER_ID);
    (sets || []).forEach(r => {
      const k = `${r.week}_${r.day}_${r.exo_id}_${r.serie_index}`;
      S.cache[k + '_kg'] = r.kg?.toString() || '';
      S.cache[k + '_reps'] = r.reps?.toString() || '';
    });
    const { data: bw } = await sb.from('body_weight').select('*').eq('user_id', USER_ID).order('recorded_at', { ascending: false }).limit(10);
    S.bwHistory = bw || [];
    const { data: notes } = await sb.from('exercise_notes').select('*').eq('user_id', USER_ID);
    (notes || []).forEach(r => { S.notes[r.exo_id] = r.note; });
    setSyncUI(true);
  } catch(e) { setSyncUI(false); }
}

async function upsertSet(week, day, eid, si, field, val) {
  const k = `${week}_${day}_${eid}_${si}`;
  S.cache[k + '_' + field] = val;
  saveLocal();
  S.syncing = true; setSyncUI(true, true);
  const kg = parseFloat(S.cache[k + '_kg']) || null;
  const reps = parseInt(S.cache[k + '_reps']) || null;
  try {
    await sb.from('sets').upsert({
      user_id: USER_ID, week, day, exo_id: eid, serie_index: si, kg, reps,
      is_pr: isPR(eid, week, day, si)
    }, { onConflict: 'user_id,week,day,exo_id,serie_index' });
    S.syncing = false; setSyncUI(true);
  } catch(e) { S.syncing = false; setSyncUI(false); }
}

async function saveNote(eid, note) {
  S.notes[eid] = note; saveLocal();
  try { await sb.from('exercise_notes').upsert({ user_id: USER_ID, exo_id: eid, note, updated_at: new Date().toISOString() }, { onConflict: 'user_id,exo_id' }); } catch(e) {}
}

async function saveBW(w) {
  try { await sb.from('body_weight').insert({ user_id: USER_ID, weight: w }); await loadAllData(); } catch(e) {}
}

function setSyncUI(ok, syncing) {
  const dot = document.getElementById('sync-dot');
  const lbl = document.getElementById('sync-lbl');
  if (!dot) return;
  dot.className = 'sync-dot' + (syncing ? ' sy' : ok ? '' : ' of');
  lbl.textContent = syncing ? 'Sync...' : ok ? 'Synced' : 'Offline';
}

// ── CACHE ─────────────────────────────────────────────────────────────────────
function gv(w, d, eid, si, f) { return S.cache[`${w}_${d}_${eid}_${si}_${f}`] || ''; }

function getAllSets() {
  const res = [];
  for (const [k, v] of Object.entries(S.cache)) {
    if (!k.endsWith('_kg')) continue;
    const parts = k.split('_'); parts.pop();
    const si = parseInt(parts.pop());
    const rest = parts.join('_');
    const m = rest.match(/^(\d+)_(\w+)_(.+)$/);
    if (!m) continue;
    const [, week, day, eid] = m;
    const kg = parseFloat(v) || 0;
    const reps = parseInt(gv(parseInt(week), day, eid, si, 'reps')) || 0;
    if (kg > 0 && reps > 0) res.push({ week: parseInt(week), day, eid, si, kg, reps });
  }
  return res;
}

function getTopSetPR(eid) { return getTopSetPRFromCache(eid, S.cache); }

function isPR(eid, week, day, si) {
  const kg = parseFloat(gv(week, day, eid, si, 'kg')) || 0;
  const reps = parseInt(gv(week, day, eid, si, 'reps')) || 0;
  if (!kg || !reps) return false;
  const score = kg * reps;
  let best = 0;
  for (const s of getAllSets()) {
    if (s.eid !== eid) continue;
    if (s.week === week && s.day === day && s.si === si) continue;
    best = Math.max(best, s.kg * s.reps);
  }
  return score > best && score > 0;
}

function getPrevSet(eid, week, day, si) {
  for (let w = week - 1; w >= 1; w--) {
    const kg = gv(w, day, eid, si, 'kg');
    const reps = gv(w, day, eid, si, 'reps');
    if (kg && reps) return { kg: parseFloat(kg), reps: parseInt(reps), week: w };
  }
  return null;
}

function calcVolume(week, day) {
  let vol = 0;
  const d = PROGRAM[day]; if (!d) return 0;
  const allExos = [...d.exos, ...(d.abdosExos || [])];
  allExos.forEach(exo => {
    exo.series.forEach((_, si) => {
      const kg = parseFloat(gv(week, day, exo.id, si, 'kg')) || 0;
      const reps = parseInt(gv(week, day, exo.id, si, 'reps')) || 0;
      if (kg > 0 && reps > 0) vol += kg * reps;
    });
  });
  return vol;
}

function calcScore(week, day) {
  const d = PROGRAM[day]; if (!d) return 0;
  const allExos = [...d.exos, ...(d.abdosExos || [])];
  let done = 0, total = 0, prs = 0;
  allExos.forEach(exo => {
    exo.series.forEach((_, si) => {
      total++;
      if (gv(week, day, exo.id, si, 'kg') && gv(week, day, exo.id, si, 'reps')) {
        done++;
        if (isPR(exo.id, week, day, si)) prs++;
      }
    });
  });
  return Math.min(100, Math.round(done / Math.max(total, 1) * 70) + Math.min(prs * 7, 20) + Math.min(calcStreak(), 10));
}

function calcStreak() {
  let streak = 0;
  for (let w = S.week; w >= 1; w--) {
    let has = false;
    for (const dk of Object.keys(PROGRAM)) {
      if (PROGRAM[dk].exos.some(exo => gv(w, dk, exo.id, 0, 'kg'))) { has = true; break; }
    }
    if (has) streak++; else if (w < S.week) break;
  }
  return streak;
}

function calcOverall() {
  const allSets = getAllSets();
  const kpiSets = allSets.filter(s => KPI_EXOS.some(k => k.id === s.eid));
  const force = Math.min(99, 60 + Math.floor(kpiSets.length * 1.8));
  const vol = calcVolume(S.week, S.day);
  const volume = Math.min(99, 60 + Math.floor(vol / 800));
  const streak = calcStreak();
  const regularity = Math.min(99, 60 + streak * 5);
  const endurance = S.sessionDuration > 0 ? Math.min(99, 60 + Math.floor(S.sessionDuration / 100)) : 65;
  return { overall: Math.round((force + volume + regularity + endurance) / 4), force, volume, regularity, endurance };
}

function checkAchievements() {
  const allSets = getAllSets();
  const streak = calcStreak();
  const prCount = allSets.filter(s => isPR(s.eid, s.week, s.day, s.si)).length;
  const totalVol = allSets.reduce((a, s) => a + s.kg * s.reps, 0);
  const devPR = getTopSetPR('dev_couche');
  const o = calcOverall();
  const gainageCount = parseInt(S.cache['gainage_sessions'] || '0');
  const checks = {
    first_session: allSets.length > 0, streak_4: streak >= 4, streak_8: streak >= 8,
    pr_10: prCount >= 10, pr_50: prCount >= 50, vol_100t: totalVol >= 100000,
    dev_100: devPR && devPR.kg >= 100, overall_85: o.overall >= 85, overall_90: o.overall >= 90,
    gainage_10: gainageCount >= 10,
  };
  const newly = [];
  Object.entries(checks).forEach(([id, unlocked]) => {
    if (unlocked && !S.achievements.includes(id)) { S.achievements.push(id); newly.push(id); }
  });
  if (newly.length > 0) saveLocal();
  return newly;
}

function getInsights() {
  const insights = [];
  if (S.settings.deload && isDeloadWeek(S.week))
    insights.push({ type:'dl', icon:'⚠️', title:`Semaine de décharge (sem. ${S.week})`, sub:'Charges à −20% · Récupération prioritaire' });
  if (S.settings.plateau)
    KPI_EXOS.forEach(k => {
      if (detectPlateau(k.id, S.cache, S.week))
        insights.push({ type:'pl', icon:'📊', title:`Plateau : ${k.name}`, sub:'3 semaines identiques — essaie une décharge ou change le tempo' });
    });
  if (S.settings.balance) {
    const ratio = calcPushPullRatio(S.cache);
    if (ratio && (ratio.ratio > 1.4 || ratio.ratio < 0.7))
      insights.push({ type:'bal', icon:'⚖️', title:'Déséquilibre musculaire', sub:`${ratio.ratio > 1.4 ? 'Push dominant' : 'Pull dominant'} · Ratio : ${ratio.ratio.toFixed(1)}` });
  }
  KPI_EXOS.forEach(k => {
    const hd = Object.keys(PROGRAM).find(dk => PROGRAM[dk].exos.some(e => e.id === k.id));
    if (!hd) return;
    const kg = gv(S.week, hd, k.id, 0, 'kg');
    const reps = gv(S.week, hd, k.id, 0, 'reps');
    if (kg && reps && parseInt(reps) > 8)
      insights.push({ type:'pr', icon:'🎯', title:`Progression : ${k.name}`, sub:`${reps} reps à ${kg}kg → Essaie ${Math.round((parseFloat(kg) + 2.5) * 10) / 10}kg` });
  });
  return insights;
}

// ── THEME ─────────────────────────────────────────────────────────────────────
function applyTheme() {
  const st = S.settings;
  let theme = st.theme;
  if (theme === 'auto') theme = window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  const ac = st.accent || '#F07020';
  const r = document.documentElement.style;
  r.setProperty('--ac', ac);
  const dark = theme === 'dark';
  r.setProperty('--ac-d', dark ? '#1A1000' : '#FFF4EC');
  r.setProperty('--ac-b', dark ? '#2A1800' : '#FFDDC0');
}

// ── WAKE LOCK + TIMER ─────────────────────────────────────────────────────────
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      if (S.wakeLock) { try { S.wakeLock.release(); } catch(e) {} }
      S.wakeLock = await navigator.wakeLock.request('screen');
      S.wakeLock.addEventListener('release', () => {
        S.wakeLock = null;
        if (document.getElementById('focus-screen').classList.contains('on') ||
            document.getElementById('gainage-screen').classList.contains('on'))
          setTimeout(requestWakeLock, 500);
      });
    }
  } catch(e) {}
}
function releaseWakeLock() { try { if (S.wakeLock) { S.wakeLock.release(); S.wakeLock = null; } } catch(e) {} }

function startTimer() {
  clearInterval(S.timer.interval);
  S.timer.startTime = Date.now(); S.timer.val = 0; S.timer.running = true;
  S.timer.interval = setInterval(() => { S.timer.val = Math.floor((Date.now() - S.timer.startTime) / 1000); updateTimerUI(); }, 500);
  updateTimerUI();
}
function stopTimer() { clearInterval(S.timer.interval); S.timer.running = false; }
function resetTimerUI() {
  S.timer.val = 0; S.timer.startTime = null;
  const el = document.getElementById('fc-time'); if (el) { el.textContent = '0:00'; el.className = 'fc-time g'; }
  for (let i = 0; i < 6; i++) { const s = document.getElementById('fcs' + i); if (s) s.className = 'fc-s'; }
  const ths = document.getElementById('fc-ths');
  if (ths) ths.innerHTML = '<span class="fc-th th-g">90s</span><span class="fc-th th-a">2min</span><span class="fc-th th-w">3min+</span>';
}
function updateTimerUI() {
  const t = S.timer.val;
  const m = Math.floor(t / 60), s = t % 60;
  const el = document.getElementById('fc-time'); if (!el) return;
  el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
  const isBloc = PROGRAM[S.day]?.exos[S.focusExoIdx]?.isBloc;
  if (isBloc) {
    el.className = 'fc-time ' + (t <= 30 ? 'g' : t <= 45 ? 'a' : 'w');
    const ths = document.getElementById('fc-ths');
    if (ths) ths.innerHTML = '<span class="fc-th th-g">30s</span><span class="fc-th th-a">45s</span><span class="fc-th th-w">60s+</span>';
  } else {
    el.className = 'fc-time ' + (t <= 90 ? 'g' : t <= 180 ? 'a' : 'w');
  }
  const pct = isBloc ? Math.min(t / 60, 1) : Math.min(t / 180, 1);
  for (let i = 0; i < 6; i++) {
    const seg = document.getElementById('fcs' + i);
    if (seg) seg.className = 'fc-s ' + (i / 6 < pct ? (t <= (isBloc ? 30 : 90) ? 'g' : 'a') : '');
  }
}

function startSessionChrono() {
  if (S.sessionInterval) return;
  S.sessionStart = Date.now();
  S.sessionInterval = setInterval(() => { S.sessionDuration = Math.floor((Date.now() - S.sessionStart) / 1000); updateTopbar(); }, 10000);
}


// ── SONS ──────────────────────────────────────────────────────────────────────
function playBeep(freq, duration, volume) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq || 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(volume || 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (duration || 0.15));
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + (duration || 0.15));
  } catch(e) {}
}

function playCountdownBeep() { playBeep(660, 0.12, 0.25); }   // bip court countdown effort
function playEndBeep() { playBeep(1046, 0.35, 0.4); }          // bip long fin de série
function playRestCountdownBeep() { playBeep(440, 0.12, 0.2); } // bip grave countdown repos
function playStartBeep() { playBeep(880, 0.2, 0.35); }         // bip aigu départ série suivante

let _tTO = null;
function showToast(msg) {
  const t = document.getElementById('pr-toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(_tTO); _tTO = setTimeout(() => t.classList.remove('show'), 3200);
}

// ── TOPBAR ────────────────────────────────────────────────────────────────────
function getWeekStartDate(weekNum) {
  const today = new Date();
  const dow = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const monday = new Date(today); monday.setDate(today.getDate() - dow);
  const diff = (S.week - weekNum) * 7;
  const res = new Date(monday); res.setDate(monday.getDate() - diff);
  return res;
}

function updateTopbar() {
  const day = PROGRAM[S.day]; if (!day) return;
  const o = calcOverall();
  document.getElementById('tb-ov').textContent = o.overall;
  const vol = calcVolume(S.week, S.day);
  document.getElementById('tb-vol').textContent = `${Math.round(vol).toLocaleString()} kg`;
  const cardio = S.cardioLog[`${S.week}_${S.day}`];
  const kcal = calcEstimatedCalories(day.type, vol, S.sessionDuration, cardio);
  document.getElementById('tb-kcal').textContent = `~${kcal} kcal`;
  document.getElementById('wn-week').textContent = `Semaine ${S.week}`;
  const sd = getWeekStartDate(S.week);
  const ed = new Date(sd); ed.setDate(sd.getDate() + 6);
  const fmt = d => d.toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
  document.getElementById('wn-dates').textContent = `${fmt(sd)} → ${fmt(ed)}`;
  const dl = document.getElementById('wn-deload');
  if (dl) dl.style.display = S.settings.deload && isDeloadWeek(S.week) ? '' : 'none';
  const al = document.getElementById('tb-alert');
  if (al) { const ins = getInsights(); if (ins.length > 0) { al.style.display = ''; al.textContent = `${ins.length} alerte${ins.length > 1 ? 's' : ''}`; } else al.style.display = 'none'; }
  renderWeekStrip();
}

function renderWeekStrip() {
  const strip = document.getElementById('week-strip'); if (!strip) return;
  strip.innerHTML = Object.entries(PROGRAM).map(([dk, day]) => {
    const hasPR = day.exos.some(exo => exo.series.some((_, si) => isPR(exo.id, S.week, dk, si)));
    const hasDone = day.exos.some(exo => gv(S.week, dk, exo.id, 0, 'kg'));
    const isCur = S.day === dk;
    let cls = 'ws-day';
    if (isCur) cls += ' cur'; else if (hasPR) cls += ' pr'; else if (hasDone) cls += ' done'; else cls += ' fut';
    return `<div class="${cls}" onclick="selectDay('${dk}')">
      <div class="wsd-l">${day.label}</div>
      <div class="wsd-dots">
        ${hasPR ? '<div class="wd go"></div>' : ''}
        <div class="wd ${hasDone ? 'g' : ''}"></div>
      </div>
    </div>`;
  }).join('');
}

function selectDay(dk) { S.day = dk; saveLocal(); renderDayBar(); renderSeance(); updateTopbar(); }

async function changeWeek(delta) {
  S.week = Math.max(1, S.week + delta); saveLocal();
  updateTopbar(); renderSeance(); renderDayBar();
  loadAllData().then(() => { renderSeance(); updateTopbar(); }).catch(() => {});
}

// ── DAY BAR ───────────────────────────────────────────────────────────────────
function renderDayBar() {
  const bar = document.getElementById('day-bar'); bar.innerHTML = '';
  Object.entries(PROGRAM).forEach(([dk, day]) => {
    const d = document.createElement('div');
    d.className = 'day-chip' + (S.day === dk ? ' active' : '');
    d.innerHTML = `<div class="dc-day">${day.label}</div><div class="dc-name">${day.name}</div>`;
    d.onclick = () => selectDay(dk);
    bar.appendChild(d);
  });
}

// ── SÉANCE ────────────────────────────────────────────────────────────────────
function renderSeance() {
  const day = PROGRAM[S.day]; updateTopbar();
  const score = calcScore(S.week, S.day);
  const prevScore = S.sessionScores[`${S.week - 1}_${S.day}`] || 0;
  const m = Math.floor(S.sessionDuration / 60), sec = S.sessionDuration % 60;
  const durStr = `${m}:${sec.toString().padStart(2, '0')}`;
  const vol = calcVolume(S.week, S.day);
  const cardio = S.cardioLog[`${S.week}_${S.day}`];
  const kcal = calcEstimatedCalories(day.type, vol, S.sessionDuration, cardio);
  const deload = S.settings.deload && isDeloadWeek(S.week);

  let html = `<div class="fade-in">`;
  if (deload) html += `<div class="insight-card ic-dl" style="margin-bottom:7px"><span class="ic-icon">⚠️</span><div><div class="ic-title">Semaine de décharge</div><div class="ic-sub">Charges à −20% · Récupération active</div></div></div>`;

  // Exercices principaux
  day.exos.forEach((exo, ei) => {
    html += renderExoRow(exo, ei, 'main', deload);
  });

  // Section gainage
  if (day.gainage) {
    const gainageDone = S.cache[`gainage_${S.week}_${S.day}`];
    const open = S.sectionOpen.gainage;
    html += `<div class="section-hdr" onclick="toggleSection('gainage')">
      <span class="sh-icon">🛡️</span>
      <span class="sh-label">Gainage</span>
      <span class="sh-badge gainage">8 min · ${GAINAGE_PROTOCOL.length} exos</span>
      <span class="sh-toggle">${open ? '▲' : '▼'}</span>
    </div>
    <div class="section-body" id="sec-gainage" style="${open ? '' : 'display:none'}">
      <div class="gainage-row${gainageDone ? ' done' : ''}" onclick="openGainage()">
        <div class="gr-left">
          <div class="gr-name">${gainageDone ? 'Gainage terminé ✓' : 'Démarrer le gainage'}</div>
          <div class="gr-sub">${gainageDone ? '8 min · ' + GAINAGE_PROTOCOL.length + ' exercices complétés' : GAINAGE_PROTOCOL.slice(0, 3).map(g => g.name.split(' ').slice(0, 2).join(' ')).join(' · ') + '...'}</div>
        </div>
        <div class="gr-right">
          <span class="gr-prog">${gainageDone ? '✓' : '0/' + GAINAGE_PROTOCOL.length}</span>
          <div class="dots"><div class="dot ${gainageDone ? 'done' : ''}"></div></div>
        </div>
      </div>
    </div>`;
  }

  // Section abdos
  if (day.abdos && day.abdosExos) {
    const open = S.sectionOpen.abdos;
    html += `<div class="section-hdr" onclick="toggleSection('abdos')">
      <span class="sh-icon">💪</span>
      <span class="sh-label">Abdos</span>
      <span class="sh-badge abdos">${day.abdosExos.length} exercices</span>
      <span class="sh-toggle">${open ? '▲' : '▼'}</span>
    </div>
    <div class="section-body" id="sec-abdos" style="${open ? '' : 'display:none'}">`;
    day.abdosExos.forEach((exo, ei) => {
      html += renderExoRow(exo, day.exos.length + ei, 'abdos', deload);
    });
    html += `</div>`;
  }

  // Section cardio
  if (day.cardio) {
    const open = S.sectionOpen.cardio;
    const preset = CARDIO_PRESETS[S.day];
    const logged = S.cardioLog[`${S.week}_${S.day}`] || {};
    html += `<div class="section-hdr" onclick="toggleSection('cardio')">
      <span class="sh-icon">🏃</span>
      <span class="sh-label">Cardio</span>
      <span class="sh-badge cardio">${preset ? preset.label : 'Marche inclinée'}</span>
      <span class="sh-toggle">${open ? '▲' : '▼'}</span>
    </div>
    <div class="section-body" id="sec-cardio" style="${open ? '' : 'display:none'}">
      <div class="cardio-block">
        ${preset ? `<div class="cb-title">Marche inclinée</div><div class="cb-preset">Préconisé : ${preset.vitesse} km/h · ${preset.pente}% · ${preset.duree} min</div>` : ''}
        <div class="cb-row">
          ${['marche', 'velo'].map(t => `<div class="cb-btn${logged.type === t ? ' on' : ''}" onclick="setCardio('type','${t}')">${t === 'marche' ? 'Marche inclinée' : 'Vélo'}</div>`).join('')}
        </div>
        <div class="cb-row">
          ${['faible', 'moderee', 'intense'].map(i => `<div class="cb-btn${logged.intensity === i ? ' on' : ''}" onclick="setCardio('intensity','${i}')" style="font-size:10px">${{faible:'Faible', moderee:'Modérée', intense:'Intense'}[i]}</div>`).join('')}
        </div>
        <div class="cb-row2">
          <span style="font-size:10px;color:var(--t3);font-weight:600;flex-shrink:0">Durée</span>
          <input class="cb-in" type="number" id="cb-dur" placeholder="${preset?.duree || 'min'}" value="${logged.duration || ''}">
          <div class="cb-save" onclick="logCardio()">Enregistrer</div>
        </div>
        ${logged.type && logged.duration ? `<div class="cb-saved">✓ ${logged.type === 'marche' ? 'Marche' : 'Vélo'} · ${{faible:'Faible', moderee:'Modérée', intense:'Intense'}[logged.intensity] || '—'} · ${logged.duration}min</div>` : ''}
      </div>
    </div>`;
  }

  html += `<div class="score-row">
    <div>
      <div class="sr-label">Score</div>
      <div class="sr-score">${score}/100</div>
      ${prevScore > 0 && score - prevScore !== 0 ? `<div class="sr-vs">${score - prevScore > 0 ? '+' : ''}${score - prevScore} vs sem.${S.week - 1}</div>` : ''}
      <div class="sr-formula">séries×5 + PR×7 + streak</div>
    </div>
    <div style="text-align:right">
      <div class="sr-label">Durée</div>
      <div class="sr-time">${durStr}</div>
      <div class="sr-kcal">~${kcal} kcal</div>
    </div>
  </div>
  <button class="end-btn" onclick="showEndScreen()">Terminer la séance</button></div>`;

  document.getElementById('tab-seance').innerHTML = html;
}

function renderExoRow(exo, ei, section, deload) {
  const pr = getTopSetPR(exo.id);
  const hasPR = exo.series.some((_, si) => isPR(exo.id, S.week, S.day, si));
  const seriesDone = exo.series.filter((_, si) => gv(S.week, S.day, exo.id, si, 'kg') && gv(S.week, S.day, exo.id, si, 'reps')).length;
  const allDone = seriesDone === exo.series.length;
  const smartW = getSmartWeight(exo, S.cache, S.week);
  const deloadW = deload && pr ? getDeloadWeight(pr.kg) : null;
  const hasPlateau = S.settings.plateau && pr && detectPlateau(exo.id, S.cache, S.week);
  let meta = pr ? `Record : <span class="rec">${pr.kg}kg</span>` : 'Pas encore de record';
  if (deloadW) meta = `<span class="deload">⚠️ Décharge : ~${deloadW}kg</span>`;
  else if (smartW) meta += ` · <span class="smart">~${smartW}kg</span>`;
  if (hasPlateau) meta += ` · <span class="plateau">⚠ Plateau</span>`;
  const tags = (exo.isBarre ? `<span class="tag-b">Barre</span>` : '') + (exo.isBloc ? `<span class="tag-bloc">Bloc</span>` : '');
  return `<div class="exo-row${allDone ? ' done' : ''}" onclick="openFocus(${ei},'${section}')">
    <div style="flex:1;min-width:0">
      <div class="er-name">${exo.name}</div>
      <div class="er-meta">${meta}</div>
      ${exo.note ? `<div class="er-meta" style="color:var(--t4);font-style:italic">${exo.note}</div>` : ''}
    </div>
    <div class="er-r">
      ${hasPR ? '<div class="pr-dot"></div>' : ''}
      ${tags}
      <div class="dots">${exo.series.map((_, si) => `<div class="dot${gv(S.week, S.day, exo.id, si, 'kg') && gv(S.week, S.day, exo.id, si, 'reps') ? ' done' : ''}"></div>`).join('')}</div>
    </div>
  </div>`;
}

function toggleSection(key) {
  S.sectionOpen[key] = !S.sectionOpen[key];
  const el = document.getElementById('sec-' + key);
  if (el) el.style.display = S.sectionOpen[key] ? '' : 'none';
  renderSeance();
}

function setCardio(field, val) {
  const key = `${S.week}_${S.day}`;
  if (!S.cardioLog[key]) S.cardioLog[key] = {};
  S.cardioLog[key][field] = val;
  saveLocal(); renderSeance();
}

async function logCardio() {
  const dur = parseInt(document.getElementById('cb-dur')?.value) || 0;
  if (!dur) return;
  const key = `${S.week}_${S.day}`;
  if (!S.cardioLog[key]) S.cardioLog[key] = {};
  S.cardioLog[key].duration = dur;
  saveLocal();
  try {
    await sb.from('sessions').upsert({
      user_id: USER_ID, week: S.week, day: S.day,
      cardio_type: S.cardioLog[key].type, cardio_duration: dur, cardio_intensity: S.cardioLog[key].intensity,
    }, { onConflict: 'user_id,week,day' });
  } catch(e) {}
  renderSeance(); updateTopbar();
}

// ── GAINAGE SCREEN ────────────────────────────────────────────────────────────
function openGainage() {
  S.gainage = { step: 0, phase: 'work', elapsed: 0, startTime: null, interval: null, completed: 0 };
  requestWakeLock();
  if (!S.sessionStart) startSessionChrono();
  document.getElementById('gainage-screen').classList.add('on');
  renderGainage();
  startGainageTimer();
}

function closeGainage() {
  stopGainageTimer();
  releaseWakeLock();
  document.getElementById('gainage-screen').classList.remove('on');
  renderSeance(); updateTopbar();
}

function stopGainageTimer() {
  clearInterval(S.gainage.interval); S.gainage.interval = null;
}

function startGainageTimer() {
  stopGainageTimer();
  S.gainage.startTime = Date.now();
  S.gainage.interval = setInterval(() => {
    const now = Date.now();
    const elapsed = Math.floor((now - S.gainage.startTime) / 1000);
    const current = GAINAGE_PROTOCOL[S.gainage.step];
    if (!current) return;
    const limit = S.gainage.phase === 'work' ? current.work : current.rest;
    S.gainage.elapsed = elapsed;
    if (elapsed >= limit) advanceGainage();
    else updateGainageUI(elapsed, limit);
  }, 250);
}

function advanceGainage() {
  stopGainageTimer();
  const current = GAINAGE_PROTOCOL[S.gainage.step];
  if (S.gainage.phase === 'work') {
    playEndBeep();
    S.gainage.completed++;
    if (S.gainage.step >= GAINAGE_PROTOCOL.length - 1) {
      finishGainage(); return;
    }
    S.gainage.phase = 'rest';
    S.gainage.startTime = Date.now();
    S.gainage.elapsed = 0;
    renderGainage();
    startGainageTimer();
  } else {
    S.gainage.step++;
    S.gainage.phase = 'work';
    S.gainage.startTime = Date.now();
    S.gainage.elapsed = 0;
    playStartBeep();
    renderGainage();
    startGainageTimer();
  }
}

function finishGainage() {
  stopGainageTimer();
  S.cache['gainage_' + S.week + '_' + S.day] = '1';
  S.cache['gainage_sessions'] = String((parseInt(S.cache['gainage_sessions'] || '0')) + 1);
  saveLocal();
  showToast('🛡️ Gainage terminé — 8 min !');
  checkAchievements();
  document.getElementById('gainage-screen').classList.remove('on');
  renderSeance(); updateTopbar();
}

function skipGainageStep() {
  stopGainageTimer();
  S.gainage.step++;
  if (S.gainage.step >= GAINAGE_PROTOCOL.length) { finishGainage(); return; }
  S.gainage.phase = 'work';
  S.gainage.startTime = Date.now();
  S.gainage.elapsed = 0;
  renderGainage();
  startGainageTimer();
}

function updateGainageUI(elapsed, limit) {
  const isWork = S.gainage.phase === 'work';
  const remaining = limit - elapsed;
  const pct = elapsed / limit;
  const circumference = 329;
  const offset = circumference * (1 - pct);
  const fillEl = document.querySelector('.g-fill');
  if (fillEl) {
    fillEl.style.strokeDashoffset = offset;
    fillEl.style.stroke = isWork ? (remaining <= 10 ? 'var(--am)' : 'var(--bl)') : 'var(--gr)';
  }
  const timeEl = document.querySelector('.g-time');
  if (timeEl) {
    timeEl.textContent = remaining;
    timeEl.className = 'g-time ' + (isWork ? (remaining <= 10 ? 'warn' : '') : 'rest');
  }
  // Bips sur les 3 dernières secondes
  if (remaining === 3 || remaining === 2 || remaining === 1) {
    if (isWork) playCountdownBeep();
    else playRestCountdownBeep();
  }
}

function renderGainage() {
  const step = S.gainage.step;
  const phase = S.gainage.phase;
  const current = GAINAGE_PROTOCOL[step] || GAINAGE_PROTOCOL[GAINAGE_PROTOCOL.length - 1];
  const isWork = phase === 'work';
  const totalSteps = GAINAGE_PROTOCOL.length;
  const pctDone = step / totalSteps;

  document.getElementById('g-body').innerHTML = `
    <div class="g-prog-bar"><div class="g-prog-fill" style="width:${Math.round(pctDone * 100)}%"></div></div>
    <div class="g-phase">
      <div class="g-phase-label">${isWork ? 'Effort' : 'Repos'} · ${step + 1}/${totalSteps}</div>
      <div class="g-exo-name">${current.name}</div>
      <div class="g-exo-sub">${isWork ? `${current.work}s d'effort` : `${current.rest}s de repos · Prépare : ${GAINAGE_PROTOCOL[step + 1]?.name || 'Terminé'}`}</div>
    </div>
    <div class="g-circle-wrap">
      <svg class="g-svg" viewBox="0 0 110 110">
        <circle class="g-bg" cx="55" cy="55" r="52"/>
        <circle class="g-fill" cx="55" cy="55" r="52" style="stroke:${isWork ? 'var(--bl)' : 'var(--gr)'};stroke-dashoffset:0"/>
      </svg>
      <div class="g-center">
        <div class="g-time ${isWork ? '' : 'rest'}">${isWork ? current.work : current.rest}</div>
        <div class="g-time-l">${isWork ? 'sec' : 'repos'}</div>
      </div>
    </div>
    ${isWork ? `<div class="g-tip"><div class="g-tip-l">Position</div><div class="g-tip-t">${current.tip}</div></div>` : ''}
    <div class="g-series">
      ${GAINAGE_PROTOCOL.map((g, i) => {
        const isDone = i < step || (i === step && !isWork);
        const isAct = i === step && isWork;
        const isRest = i === step && !isWork;
        return `<div class="g-serie-row${isAct ? ' active' : isDone ? ' done' : isRest ? ' rest' : ''}">
          <span class="g-sn">${i + 1}</span>
          <span class="g-sname">${g.name}</span>
          <span class="g-sdur">${isDone ? '✓ ' + g.work + 's' : g.work + 's'}</span>
          <div class="g-sic" style="background:${isDone ? 'var(--gr-d)' : isAct ? 'var(--bl-d)' : 'var(--bg2)'};color:${isDone ? 'var(--gr)' : isAct ? 'var(--bl)' : 'var(--t4)'}">
            ${isDone ? '✓' : isAct ? '▶' : '○'}
          </div>
        </div>`;
      }).join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:4px">
      <button class="g-btn${!isWork ? ' rest-btn' : ''}" onclick="${isWork ? 'advanceGainage()' : 'advanceGainage()'}">
        ${isWork ? 'Terminer la série' : `Passer au suivant`}
      </button>
      <button style="padding:13px 12px;background:var(--bg1);border:0.5px solid var(--bd);border-radius:8px;font-size:11px;font-weight:700;color:var(--t3);cursor:pointer" onclick="skipGainageStep()">Passer</button>
    </div>`;
}

// ── FOCUS ─────────────────────────────────────────────────────────────────────
function openFocus(exoIdx, section) {
  S.focusExoIdx = exoIdx;
  S.focusSection = section || 'main';
  const day = PROGRAM[S.day];
  const allExos = section === 'abdos' ? day.abdosExos : day.exos;
  S.focusExos = allExos;
  S.focusSerieIdx = getFirstUndone(exoIdx);
  requestWakeLock();
  if (!S.sessionStart) startSessionChrono();
  resetTimerUI();
  document.getElementById('focus-screen').classList.add('on');
  renderFocus();
}

function closeFocus() {
  document.getElementById('focus-screen').classList.remove('on');
  releaseWakeLock(); stopTimer();
  renderSeance(); updateTopbar();
}

function getFirstUndone(exoIdx) {
  const exos = S.focusExos || PROGRAM[S.day].exos;
  const exo = exos[exoIdx];
  for (let i = 0; i < exo.series.length; i++) {
    if (!gv(S.week, S.day, exo.id, i, 'kg') || !gv(S.week, S.day, exo.id, i, 'reps')) return i;
  }
  return exo.series.length - 1;
}

function renderFocus() {
  const day = PROGRAM[S.day];
  const exos = S.focusExos || day.exos;
  const exo = exos[S.focusExoIdx];
  const serie = exo.series[S.focusSerieIdx];
  const pr = getTopSetPR(exo.id);
  const prKg = pr?.kg || 0;
  const nextMs = getNextMilestone(exo.id, prKg);
  const navPrev = exos[S.focusExoIdx - 1];
  const navNext = exos[S.focusExoIdx + 1];
  const isLastSerie = S.focusSerieIdx >= exo.series.length - 1;
  const isLastExo = S.focusExoIdx >= exos.length - 1;
  const deload = S.settings.deload && isDeloadWeek(S.week);

  // Topbar
  document.getElementById('f-title').textContent = exo.name;
  const ftag = document.getElementById('f-tag');
  if (exo.isBarre || exo.isBloc) {
    ftag.style.display = ''; ftag.textContent = exo.isBarre ? 'Barre libre' : 'Bloc';
    ftag.style.background = exo.isBarre ? 'var(--ac-d)' : 'var(--bl-d)';
    ftag.style.color = exo.isBarre ? 'var(--ac)' : 'var(--bl)';
    ftag.style.border = `0.5px solid ${exo.isBarre ? 'var(--ac-b)' : '#1A2440'}`;
  } else ftag.style.display = 'none';

  document.getElementById('f-nl').innerHTML = navPrev ? `← <span>${navPrev.name.split(' ').slice(0, 2).join(' ')}</span>` : '';
  document.getElementById('f-nr').innerHTML = navNext ? `<span>${navNext.name.split(' ').slice(0, 2).join(' ')}</span> →` : '';
  document.getElementById('f-npos').textContent = `${S.focusExoIdx + 1} / ${exos.length}`;

  document.getElementById('f-rv').innerHTML = prKg > 0 ? `${prKg}<small> kg</small>` : `—<small> kg</small>`;
  document.getElementById('f-rec-orm').textContent = prKg > 0 ? `1RM ~${calcORM(prKg, 7)}kg` : '';
  document.getElementById('f-recbar').onclick = () => openHist(exo.id);
  const smartW = getSmartWeight(exo, S.cache, S.week);
  const deloadW = deload && prKg ? getDeloadWeight(prKg) : null;
  document.getElementById('f-rec-right').innerHTML = `
    ${nextMs ? `<div class="f-next-l">Prochain palier</div><div class="f-next-v">${nextMs.l}</div>` : ''}
    ${smartW ? `<div class="f-smart">Léger : ~${smartW}kg</div>` : ''}
    ${deloadW ? `<div class="f-deload-b">⚠️ Décharge : ~${deloadW}kg</div>` : ''}`;

  const nextSerie = exo.series[S.focusSerieIdx + 1];
  const nextLabel = nextSerie ? getSerieInfo(nextSerie, exo).label : (navNext ? navNext.name.split(' ')[0] : 'Fin');
  document.getElementById('fc-next').textContent = nextLabel;
  const btn = document.getElementById('fc-btn');
  if (isLastSerie && isLastExo) { btn.textContent = 'Terminer la séance'; btn.className = 'fc-btn finish'; }
  else if (isLastSerie) { btn.textContent = 'Exercice suivant →'; btn.className = 'fc-btn'; }
  else { btn.textContent = `Lancer ${nextLabel}`; btn.className = 'fc-btn'; }

  if (exo.isBloc) { renderBlocFocus(exo); return; }

  const { label, cls, range } = getSerieInfo(serie, exo);
  const kg = gv(S.week, S.day, exo.id, S.focusSerieIdx, 'kg');
  const reps = gv(S.week, S.day, exo.id, S.focusSerieIdx, 'reps');
  const prev = getPrevSet(exo.id, S.week, S.day, S.focusSerieIdx);
  const hasPRSerie = isPR(exo.id, S.week, S.day, S.focusSerieIdx);
  const isDone = kg && reps;
  const orm = kg && reps ? calcORM(parseFloat(kg), parseInt(reps)) : 0;
  const progTip = kg && reps ? calcProgression(exo, kg, reps) : null;
  const suggested = deloadW || smartW || null;

  let inCls = 'f-in';
  if (cls === 'top') inCls += ' top-in';
  if (hasPRSerie) inCls += ' pr-in';
  if (isDone) inCls += ' done-in';
  if (deload && !isDone && !hasPRSerie && cls !== 'top') inCls += ' dl-in';

  const dotsHtml = exo.series.map((s, si) => {
    const d = gv(S.week, S.day, exo.id, si, 'kg') && gv(S.week, S.day, exo.id, si, 'reps');
    return `<div class="f-dot${si === S.focusSerieIdx ? ' cur' : d ? ' done' : ''}"></div>`;
  }).join('');

  document.getElementById('f-body').innerHTML = `
    <div class="f-sw">
      <div class="f-dots-row">${dotsHtml}</div>
      <div class="f-sl ${cls}">${label}</div>
      <div class="f-sr">${range[0]}-${range[1]} reps${deload ? ' · décharge −20%' : ''}</div>
      ${prev ? `<div class="f-hint prev">Sem.${prev.week} : ${prev.kg}kg × ${prev.reps}</div>` : ''}
      ${suggested && !isDone ? `<div class="f-hint smart">Préconisé : ~${suggested}kg</div>` : ''}
      <div class="f-inputs">
        <div class="f-ig">
          <span class="f-il">Kg</span>
          <input class="${inCls}" type="number" step="0.5" inputmode="decimal" id="f-in-kg" value="${kg}"
            placeholder="${suggested || prev?.kg || 'kg'}" onchange="handleInput('kg',this.value)" onfocus="this.select()">
        </div>
        <div class="f-ig">
          <span class="f-il">Reps</span>
          <input class="${inCls}" type="number" inputmode="numeric" id="f-in-reps" value="${reps}"
            placeholder="${range[0]}-${range[1]}" onchange="handleInput('reps',this.value)" onfocus="this.select()">
          <div class="f-orm">${orm > 0 ? `1RM ~${orm}kg` : ''}</div>
        </div>
      </div>
      <div class="f-status">
        ${hasPRSerie ? '<span class="f-badge fb-pr">PR — Nouveau record !</span>' : isDone ? '<span class="f-badge fb-ok">✓ Série validée</span>' : ''}
      </div>
      ${progTip ? `<div class="f-prog">🎯 Semaine prochaine : ~${progTip}kg</div>` : ''}
    </div>
    <div class="f-note-wrap">
      <textarea class="f-note" placeholder="Notes techniques..." onblur="saveNote('${exo.id}',this.value)">${S.notes[exo.id] || ''}</textarea>
    </div>`;

  setTimeout(() => {
    const kEl = document.getElementById('f-in-kg');
    const rEl = document.getElementById('f-in-reps');
    if (kEl && !kEl.value) kEl.focus(); else if (rEl && !rEl.value) rEl.focus();
  }, 80);
}

function renderBlocFocus(exo) {
  const allReps = exo.series.map((_, si) => parseInt(gv(S.week, S.day, exo.id, si, 'reps')) || 0);
  const reco = calcBlocReco(allReps);
  const tonnage = exo.series.reduce((a, _, si) => {
    const k = parseFloat(gv(S.week, S.day, exo.id, si, 'kg')) || 0;
    const r = parseInt(gv(S.week, S.day, exo.id, si, 'reps')) || 0;
    return a + k * r;
  }, 0);
  const prevTon = exo.series.reduce((a, _, si) => {
    const k = parseFloat(gv(S.week - 1, S.day, exo.id, si, 'kg')) || 0;
    const r = parseInt(gv(S.week - 1, S.day, exo.id, si, 'reps')) || 0;
    return a + k * r;
  }, 0);
  const firstKg = gv(S.week, S.day, exo.id, 0, 'kg') || '';
  document.getElementById('f-body').innerHTML = `
    <div class="f-bloc-hdr">
      <div class="fbh-title">Mode bloc · Hypertrophie</div>
      <div class="fbh-sub">${exo.isBarre ? 'Barre libre · ' : ''}4 séries · 30-45s repos · fatigue musculaire</div>
      <div class="fbh-row">
        <div><div class="fbh-kg-l">Charge</div>
          <input class="fbh-kg-in" type="number" step="0.5" inputmode="decimal" id="bloc-kg" value="${firstKg}" placeholder="kg" onchange="setBlocKg(this.value)">
        </div>
        <div style="text-align:right">
          <div class="fbh-t-l">Tonnage</div>
          <div class="fbh-t">${tonnage > 0 ? Math.round(tonnage).toLocaleString() + ' kg' : '—'}</div>
          ${tonnage > 0 && prevTon > 0 ? `<div class="fbh-vs">${tonnage - prevTon > 0 ? '+' : ''}${Math.round(tonnage - prevTon)}kg vs sem.${S.week - 1}</div>` : ''}
        </div>
      </div>
    </div>
    <div class="f-bloc-series">
      ${exo.series.map((s, si) => {
        const repVal = gv(S.week, S.day, exo.id, si, 'reps');
        const isDone = gv(S.week, S.day, exo.id, si, 'kg') && repVal;
        const isAct = si === S.focusSerieIdx;
        const zone = exo.blocZones ? exo.blocZones[si] : [6, 15];
        return `<div class="fbs-row${isAct ? ' active' : isDone ? ' done' : ''}">
          <span class="fbs-l">S${s.l}</span>
          <input class="fbs-in" type="number" inputmode="numeric" value="${repVal}" placeholder="reps" onchange="handleBlocInput(${si},this.value)">
          <span class="fbs-zone">Zone : ${zone[0]}-${zone[1]}</span>
          <div class="fbs-ic ${isDone ? 'ic-ok' : 'ic-e'}">${isDone ? '✓' : '○'}</div>
        </div>`;
      }).join('')}
      ${reco ? `<div class="f-bloc-reco fbr-${reco.type}">
        <span style="font-size:16px">${reco.type === 'ok' ? '✅' : reco.type === 'up' ? '⬆️' : '⬇️'}</span>
        <div><div class="fbr-t">${reco.text}</div><div class="fbr-s">${reco.sub}</div></div>
      </div>` : ''}
    </div>`;
}

function setBlocKg(val) {
  const exos = S.focusExos || PROGRAM[S.day].exos;
  const exo = exos[S.focusExoIdx];
  exo.series.forEach((_, si) => { if (!gv(S.week, S.day, exo.id, si, 'kg')) upsertSet(S.week, S.day, exo.id, si, 'kg', val); });
  renderFocus(); updateTopbar();
}

async function handleBlocInput(si, val) {
  const exos = S.focusExos || PROGRAM[S.day].exos;
  const exo = exos[S.focusExoIdx];
  if (!S.sessionStart) startSessionChrono();
  const kg = document.getElementById('bloc-kg')?.value || gv(S.week, S.day, exo.id, 0, 'kg');
  if (kg) await upsertSet(S.week, S.day, exo.id, si, 'kg', kg);
  await upsertSet(S.week, S.day, exo.id, si, 'reps', val);
  if (val) { stopTimer(); startTimer(); }
  S.focusSerieIdx = si; renderFocus(); updateTopbar();
}

async function handleInput(field, val) {
  const exos = S.focusExos || PROGRAM[S.day].exos;
  const exo = exos[S.focusExoIdx];
  if (!S.sessionStart) startSessionChrono();
  await upsertSet(S.week, S.day, exo.id, S.focusSerieIdx, field, val);
  if (field === 'reps' && val) {
    stopTimer(); startTimer();
    if (isPR(exo.id, S.week, S.day, S.focusSerieIdx)) {
      showToast(`PR — ${exo.name} !`);
      const newly = checkAchievements();
      if (newly.length) showToast(`🏅 ${ACHIEVEMENTS.find(a => a.id === newly[0])?.name || ''}`);
    }
  }
  renderFocus(); updateTopbar();
}

function advanceSerie() {
  const exos = S.focusExos || PROGRAM[S.day].exos;
  const exo = exos[S.focusExoIdx];
  const isLastSerie = S.focusSerieIdx >= exo.series.length - 1;
  const isLastExo = S.focusExoIdx >= exos.length - 1;
  if (isLastSerie && isLastExo) { closeFocus(); showEndScreen(); return; }
  if (isLastSerie) { S.focusExoIdx++; S.focusSerieIdx = getFirstUndone(S.focusExoIdx); }
  else S.focusSerieIdx++;
  stopTimer(); resetTimerUI(); renderFocus();
}

// Swipe
let _tx = 0;
document.addEventListener('touchstart', e => { _tx = e.touches[0].clientX; }, { passive: true });
document.addEventListener('touchend', e => {
  if (!document.getElementById('focus-screen').classList.contains('on')) return;
  const dx = e.changedTouches[0].clientX - _tx;
  if (Math.abs(dx) < 60) return;
  const exos = S.focusExos || PROGRAM[S.day].exos;
  if (dx < 0 && S.focusExoIdx < exos.length - 1) { S.focusExoIdx++; S.focusSerieIdx = getFirstUndone(S.focusExoIdx); }
  else if (dx > 0 && S.focusExoIdx > 0) { S.focusExoIdx--; S.focusSerieIdx = getFirstUndone(S.focusExoIdx); }
  else return;
  stopTimer(); resetTimerUI(); renderFocus();
}, { passive: true });

// ── HISTORY ───────────────────────────────────────────────────────────────────
function openHist(eid) {
  const exoName = Object.values(PROGRAM).flatMap(d => [...d.exos, ...(d.abdosExos || [])]).find(e => e.id === eid)?.name || eid;
  document.getElementById('hist-name').textContent = exoName;
  const allSets = getAllSets().filter(s => s.eid === eid);
  const pr = getTopSetPR(eid);
  const wData = [];
  for (let w = Math.max(1, S.week - 7); w <= S.week; w++) {
    const sets = allSets.filter(s => s.week === w);
    const maxKg = sets.length ? Math.max(...sets.map(s => s.kg)) : 0;
    const maxReps = sets.find(s => s.kg === maxKg)?.reps || 0;
    wData.push({ w, kg: maxKg, orm: calcORM(maxKg, maxReps) });
  }
  const maxKg = Math.max(...wData.map(d => d.kg), 1);
  const first = wData.find(d => d.kg > 0);
  const last = wData[wData.length - 1];
  const plateau = detectPlateau(eid, S.cache, S.week);
  document.getElementById('hist-body').innerHTML = `
    <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:3px">
      <span class="h-val">${pr ? pr.kg : 0} kg</span>
      <span style="font-size:10px;color:var(--t3)">Record · Sem.${pr?.week || '—'}</span>
    </div>
    ${plateau ? `<div style="font-size:11px;color:var(--am);font-weight:700;margin-bottom:6px">⚠️ Plateau détecté — 3 semaines identiques</div>` : ''}
    <div class="h-chart">
      ${wData.map(d => {
        const pct = d.kg > 0 ? Math.round(d.kg / maxKg * 100) : 0;
        const isCur = d.w === S.week;
        return `<div class="hc-col">
          <div class="hc-bar" style="height:${pct}%;background:${isCur ? 'var(--ac)' : d.kg > 0 ? 'var(--ac-b)' : 'var(--bg3)'}"></div>
          <div class="hc-lbl" style="color:${isCur ? 'var(--ac)' : ''}">${d.w}</div>
          <div class="hc-val" style="color:${isCur ? 'var(--ac)' : 'var(--t3)'}">${d.kg > 0 ? d.kg : '—'}</div>
        </div>`;
      }).join('')}
    </div>
    ${first && last.kg > first.kg ? `<div style="background:var(--gr-d);border:0.5px solid #1A3A1A;border-radius:8px;padding:9px 11px;margin-top:8px">
      <div style="font-size:9px;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Progression 1RM</div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:12px;font-weight:700;color:var(--bl)">S${first.w}: ~${first.orm}kg → S${last.w}: ~${last.orm}kg</span>
        <span style="font-size:11px;color:var(--gr);font-weight:700">+${last.orm - first.orm}kg</span>
      </div>
    </div>` : ''}`;
  document.getElementById('hist-screen').classList.add('on');
}
function closeHist() { document.getElementById('hist-screen').classList.remove('on'); }

// ── END SCREEN ────────────────────────────────────────────────────────────────
function showEndScreen() {
  releaseWakeLock();
  if (S.sessionInterval) { clearInterval(S.sessionInterval); S.sessionInterval = null; }
  const day = PROGRAM[S.day];
  const score = calcScore(S.week, S.day);
  const prevScore = S.sessionScores[`${S.week - 1}_${S.day}`] || 0;
  const vol = Math.round(calcVolume(S.week, S.day));
  const m = Math.floor(S.sessionDuration / 60), sec = S.sessionDuration % 60;
  const durStr = `${m}:${sec.toString().padStart(2, '0')}`;
  const allExos = [...day.exos, ...(day.abdosExos || [])];
  let done = 0, total = 0;
  allExos.forEach(exo => exo.series.forEach((_, si) => { total++; if (gv(S.week, S.day, exo.id, si, 'kg') && gv(S.week, S.day, exo.id, si, 'reps')) done++; }));
  const prs = [];
  allExos.forEach(exo => {
    exo.series.forEach((_, si) => {
      if (isPR(exo.id, S.week, S.day, si)) {
        const kg = gv(S.week, S.day, exo.id, si, 'kg'), reps = gv(S.week, S.day, exo.id, si, 'reps');
        if (kg && reps && !prs.find(p => p.name === exo.name)) prs.push({ name: exo.name, val: `${kg}kg × ${reps}` });
      }
    });
  });
  const o = calcOverall();
  const newly = checkAchievements();
  const cardio = S.cardioLog[`${S.week}_${S.day}`];
  const kcal = calcEstimatedCalories(day.type, vol, S.sessionDuration, cardio);
  S.sessionScores[`${S.week}_${S.day}`] = score;
  saveLocal();
  document.getElementById('end-sub').textContent = `${day.label} · ${day.name} · ${durStr}`;
  document.getElementById('end-body').innerHTML = `
    <div class="end-score-wrap">
      <div class="end-score">${score}</div>
      <div class="end-slbl">Score séance</div>
      ${score - prevScore !== 0 && prevScore > 0 ? `<div class="end-vs">${score - prevScore > 0 ? '+' : ''}${score - prevScore} vs sem.${S.week - 1}</div>` : ''}
      <div class="end-formula">${done} séries × 5 + ${prs.length} PR × 7 + streak ${calcStreak()}</div>
    </div>
    <div class="end-stats">
      <div class="end-stat"><div class="es-l">Volume</div><div class="es-v">${vol.toLocaleString()}<span style="font-size:11px;color:var(--t3)"> kg</span></div></div>
      <div class="end-stat"><div class="es-l">Complétion</div><div class="es-v">${done}/${total}</div><div class="es-sub">${Math.round(done / Math.max(total, 1) * 100)}%</div></div>
      <div class="end-stat"><div class="es-l">Durée</div><div class="es-v">${durStr}</div></div>
      <div class="end-stat"><div class="es-l">PR battus</div><div class="es-v" style="color:var(--ac)">${prs.length}</div></div>
    </div>
    ${prs.length > 0 ? `<div class="end-prs"><div class="ep-title">PR battus</div>${prs.map(p => `<div class="ep-item"><span class="ep-name">${p.name}</span><span class="ep-val">${p.val}</span></div>`).join('')}</div>` : ''}
    ${newly.length > 0 ? `<div class="end-prs"><div class="ep-title">🏅 Hauts faits débloqués</div>${newly.map(id => { const a = ACHIEVEMENTS.find(x => x.id === id); return a ? `<div class="ep-item"><span class="ep-name">${a.icon} ${a.name}</span><span style="font-size:10px;color:var(--t3)">${a.desc}</span></div>` : ''; }).join('')}</div>` : ''}
    <div class="end-kcal"><div><div style="font-size:9px;color:var(--t3);margin-bottom:2px">Calories brûlées</div><div class="ek-v">${kcal} kcal</div></div><div style="text-align:right"><div style="font-size:9px;color:var(--t3)">BMR</div><div style="font-size:13px;font-weight:700;color:var(--t2)">${PROFILE.bmr} kcal/j</div></div></div>
    <div class="end-overall"><div><div style="font-size:9px;color:var(--t3);margin-bottom:2px">Overall</div><div class="eo-v">${o.overall}</div></div><div style="text-align:right"><div style="font-size:9px;color:var(--t3)">Vers Avancé</div><div style="font-size:13px;font-weight:700;color:var(--t2)">${o.overall} / 90</div></div></div>
    <div class="end-cta" onclick="closeEndScreen()">Retour au dashboard</div>`;
  document.getElementById('end-screen').classList.add('on');
}

function closeEndScreen() {
  document.getElementById('end-screen').classList.remove('on');
  S.sessionStart = null; S.sessionDuration = 0;
  renderSeance(); updateTopbar();
}

// ── STATS ─────────────────────────────────────────────────────────────────────
function renderStats() {
  const o = calcOverall();
  const streak = calcStreak();
  const allSets = getAllSets();
  const totalVol = Math.round(allSets.reduce((a, s) => a + s.kg * s.reps, 0) / 1000);
  const insights = getInsights();
  const balance = calcPushPullRatio(S.cache);

  let html = `<div class="fade-in">
  <div class="a-card">
    <div class="ac-hd">
      <div class="ac-row">
        <div class="ac-av">💪</div>
        <div class="ac-name">${PROFILE.name}</div>
        <div style="text-align:right;flex-shrink:0">
          <div class="ac-ov">${o.overall}</div>
          <div class="ac-ovl">Overall</div>
          <div class="ac-ovn">→ <span>90</span> Avancé</div>
        </div>
      </div>
      <div class="ac-attrs">
        <div class="at-row"><span class="at-name">Force</span><div class="at-track"><div class="at-fill af-f" style="width:${o.force}%"></div></div><span class="at-val">${o.force}</span></div>
        <div class="at-row"><span class="at-name">Volume</span><div class="at-track"><div class="at-fill af-v" style="width:${o.volume}%"></div></div><span class="at-val">${o.volume}</span></div>
        <div class="at-row"><span class="at-name">Régularité</span><div class="at-track"><div class="at-fill af-r" style="width:${o.regularity}%"></div></div><span class="at-val">${o.regularity}</span></div>
        <div class="at-row"><span class="at-name">Endurance</span><div class="at-track"><div class="at-fill af-e" style="width:${o.endurance}%"></div></div><span class="at-val">${o.endurance}</span></div>
      </div>
    </div>
    <div class="ac-prog">
      <span class="ap-lbl">Progression</span>
      <div class="ap-track"><div class="ap-fill" style="width:${Math.round((o.overall - 60) / 30 * 100)}%"></div></div>
      <span class="ap-next">→ <span>90</span></span>
    </div>
    <div class="ac-recs">
      ${KPI_EXOS.slice(0, 4).map(k => {
        const pr = getTopSetPR(k.id);
        return `<div class="rec-box" onclick="openHist('${k.id}')">
          <div class="rec-lbl">${k.name}</div>
          <div class="rec-v">${pr ? pr.kg + 'kg' : '—'}</div>
          <div class="rec-orm">${pr ? '1RM ~' + calcORM(pr.kg, 7) + 'kg' : ''}</div>
        </div>`;
      }).join('')}
    </div>
  </div>`;

  if (insights.length > 0) {
    html += `<div class="sec-head">Alertes intelligentes</div>`;
    insights.forEach(ins => {
      html += `<div class="insight-card ic-${ins.type}"><span class="ic-icon">${ins.icon}</span><div><div class="ic-title">${ins.title}</div><div class="ic-sub">${ins.sub}</div></div></div>`;
    });
  }

  html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:8px">
    <div class="bw-card" style="margin-bottom:0"><div style="font-size:9px;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Streak</div><div style="font-size:24px;font-weight:700;color:var(--ac)">${streak}</div><div style="font-size:9px;color:var(--t3)">sem. consécutives</div></div>
    <div class="bw-card" style="margin-bottom:0"><div style="font-size:9px;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Volume total</div><div style="font-size:24px;font-weight:700;color:var(--go)">${totalVol}t</div><div style="font-size:9px;color:var(--t3)">cumulé</div></div>
  </div>`;

  if (balance) {
    html += `<div class="insight-card ic-bal" style="margin-bottom:8px">
      <span class="ic-icon">⚖️</span>
      <div><div class="ic-title">Équilibre push / pull</div><div class="ic-sub">Push : ${Math.round(balance.push / 1000 * 10) / 10}t · Pull : ${Math.round(balance.pull / 1000 * 10) / 10}t · Ratio : ${balance.ratio.toFixed(2)}</div></div>
    </div>`;
  }

  html += `<div class="sec-head">Calendrier</div>${renderCalendar()}`;

  html += `<div class="sec-head">KPI — Progression 8 semaines</div>`;
  KPI_EXOS.forEach(k => {
    const allSetsK = getAllSets().filter(s => s.eid === k.id);
    const wData = [];
    for (let w = Math.max(1, S.week - 7); w <= S.week; w++) {
      const sets = allSetsK.filter(s => s.week === w);
      const maxKg = sets.length ? Math.max(...sets.map(s => s.kg)) : 0;
      wData.push({ w, kg: maxKg });
    }
    const maxKg = Math.max(...wData.map(d => d.kg), 1);
    const cur = wData[wData.length - 1];
    const plateau = detectPlateau(k.id, S.cache, S.week);
    html += `<div class="kpi-card">
      <div class="kc-head"><span class="kc-name">${k.name}${plateau ? ' ⚠️' : ''}</span><span class="kc-val">${cur.kg > 0 ? cur.kg + 'kg · 1RM ~' + calcORM(cur.kg, 7) + 'kg' : '—'}</span></div>
      ${wData.map(d => `<div class="kb-row"><span class="kb-w">Sem. ${d.w}</span><div class="kb-track"><div class="kb-fill" style="width:${d.kg > 0 ? Math.round(d.kg / maxKg * 100) : 0}%;background:${d.w === S.week ? 'var(--ac)' : 'var(--ac-b)'}"></div></div><span class="kb-v">${d.kg > 0 ? d.kg + 'kg' : '—'}</span></div>`).join('')}
    </div>`;
  });

  // Poids de corps
  const bwLast = S.bwHistory[0];
  html += `<div class="sec-head">Poids de corps</div>
  <div class="bw-card">
    ${bwLast ? `<div class="bw-val">${bwLast.weight} kg <span style="font-size:11px;color:var(--t3)">· ${new Date(bwLast.recorded_at).toLocaleDateString('fr-FR')}</span></div>` : '<div style="color:var(--t3);font-size:12px;margin-bottom:6px">Aucune mesure</div>'}
    <div class="bw-row"><input class="bw-in" type="number" step="0.1" id="bw-input" placeholder="kg"><button class="bw-btn" onclick="logBW()">Enregistrer</button></div>
  </div>`;

  // Hauts faits
  html += `<div class="sec-head">Hauts faits</div>`;
  ACHIEVEMENTS.forEach(a => {
    const on = S.achievements.includes(a.id);
    html += `<div class="ach-item${on ? ' on' : ''}">
      <div class="ai-icon">${a.icon}</div>
      <div><div class="ai-name">${a.name}</div><div class="ai-desc">${a.desc}</div></div>
      ${on ? '' : '<div style="font-size:16px;color:var(--t4)">🔒</div>'}
    </div>`;
  });

  html += `</div>`;
  document.getElementById('tab-stats').innerHTML = html;
}

// ── CALENDRIER ────────────────────────────────────────────────────────────────
function renderCalendar() {
  const { year, month } = S.calMonth;
  const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const today = new Date();
  const workDow = { 1:'lundi', 2:'mardi', 3:'mercredi', 5:'vendredi', 6:'samedi', 0:'dimanche' };

  // Semaine de référence
  const todayDow = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const monday = new Date(today); monday.setDate(today.getDate() - todayDow);

  let cells = `<div class="cal-nav">
    <span class="cal-arr" onclick="calPrev()">←</span>
    <span class="cal-title">${months[month]} ${year}</span>
    <span class="cal-arr" onclick="calNext()">→</span>
  </div>
  <div class="cal-grid-h">${['L','M','M','J','V','S','D'].map(d => `<div class="cgh">${d}</div>`).join('')}</div>
  <div class="cal-grid">`;

  for (let i = 0; i < startDow; i++) cells += `<div class="cc empty"></div>`;

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    const dayKey = workDow[dow];
    const isToday = date.toDateString() === today.toDateString();
    const diffMs = date - monday;
    const weekNum = S.week + Math.round(diffMs / (7 * 24 * 3600 * 1000));

    let cls = 'cc';
    let dot = '';
    if (!dayKey) cls += ' empty';
    else {
      const hasPR = PROGRAM[dayKey]?.exos.some(exo => exo.series.some((_, si) => isPR(exo.id, weekNum, dayKey, si)));
      const hasDone = PROGRAM[dayKey]?.exos.some(exo => gv(weekNum, dayKey, exo.id, 0, 'kg'));
      if (isToday) cls += ' today';
      else if (hasPR) cls += ' pr-d';
      else if (hasDone) cls += ' done';
      else if (date > today) cls += ' fut';
      if (hasPR) dot = `<div class="cc-dot d-go"></div>`;
      else if (hasDone) dot = `<div class="cc-dot d-g"></div>`;
      else if (isToday) dot = `<div class="cc-dot d-o"></div>`;
    }
    cells += `<div class="${cls}" onclick="${dayKey ? `loadWeek(${weekNum},'${dayKey}')` : ''}"><div class="cc-n">${d}</div>${dot}</div>`;
  }
  cells += `</div>`;

  // Info semaine courante
  cells += `<div class="cwi">
    <div class="cwi-title">Sem. ${S.week}</div>
    <div class="cwi-days">
      ${Object.entries(PROGRAM).map(([dk, day]) => {
        const hasPR = day.exos.some(exo => exo.series.some((_, si) => isPR(exo.id, S.week, dk, si)));
        const hasDone = day.exos.some(exo => gv(S.week, dk, exo.id, 0, 'kg'));
        const isCur = S.day === dk;
        const score = calcScore(S.week, dk);
        let cls = 'cwi-day';
        if (isCur) cls += ' cur'; else if (hasPR) cls += ' pr'; else if (hasDone) cls += ' done'; else cls += ' skip';
        return `<div class="${cls}" onclick="loadWeek(${S.week},'${dk}')">
          <div class="cwid-l">${day.label}</div>
          <div class="cwid-s">${hasDone ? score : '—'}</div>
        </div>`;
      }).join('')}
    </div>
    <div class="cwi-btn" onclick="loadWeek(${S.week},'${S.day}')">Séance courante</div>
  </div>`;

  return cells;
}

function calPrev() { if (S.calMonth.month === 0) { S.calMonth.month = 11; S.calMonth.year--; } else S.calMonth.month--; renderStats(); }
function calNext() { if (S.calMonth.month === 11) { S.calMonth.month = 0; S.calMonth.year++; } else S.calMonth.month++; renderStats(); }

async function loadWeek(week, day) {
  S.week = week; S.day = day || S.day; saveLocal();
  await loadAllData();
  switchTab('seance');
  renderDayBar(); updateTopbar(); renderSeance();
}

// ── RECORDS ───────────────────────────────────────────────────────────────────
function renderRecords() {
  const seen = new Set();
  const allExos = [];
  Object.values(PROGRAM).forEach(day => {
    [...day.exos, ...(day.abdosExos || [])].forEach(exo => {
      if (!seen.has(exo.id)) { seen.add(exo.id); allExos.push(exo); }
    });
  });
  let html = `<div class="fade-in"><div class="sec-head">Records personnels</div>`;
  let has = false;
  allExos.forEach(exo => {
    const pr = getTopSetPR(exo.id); if (!pr) return;
    has = true;
    const plateau = detectPlateau(exo.id, S.cache, S.week);
    html += `<div class="ach-item" style="cursor:pointer" onclick="openHist('${exo.id}')">
      <div class="ai-icon" style="background:var(--ac-d);border-color:var(--ac-b)">💪</div>
      <div style="flex:1"><div class="ai-name" style="color:var(--t0)">${exo.name}${plateau ? ' ⚠️' : ''}</div><div class="ai-desc">Sem. ${pr.week}</div></div>
      <div style="text-align:right"><div style="font-size:18px;font-weight:700;color:var(--ac)">${pr.kg}kg</div><div style="font-size:9px;color:var(--bl)">1RM ~${calcORM(pr.kg, 7)}kg</div></div>
    </div>`;
  });
  if (!has) html += `<div style="text-align:center;padding:40px;color:var(--t3);font-size:13px">Aucun record encore.<br><br>Lance ta première séance !</div>`;
  html += `</div>`;
  document.getElementById('tab-records').innerHTML = html;
}

async function logBW() {
  const input = document.getElementById('bw-input');
  const w = parseFloat(input.value);
  if (!w || w < 30 || w > 300) return;
  await saveBW(w); input.value = ''; renderStats();
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function openSettings() { renderSettingsBody(); document.getElementById('settings-screen').classList.add('on'); }
function closeSettings() { document.getElementById('settings-screen').classList.remove('on'); applyTheme(); renderSeance(); updateTopbar(); }

function renderSettingsBody() {
  const st = S.settings;
  document.getElementById('settings-body').innerHTML = `
    <div class="set-section">Apparence</div>
    <div class="theme-row">
      ${[['dark','🌑','Dark'],['light','☀️','Light'],['auto','⚙️','Auto']].map(([v, ic, lb]) =>
        `<div class="theme-btn${st.theme === v ? ' active' : ''}" onclick="setSetting('theme','${v}')"><span class="theme-ico">${ic}</span><span class="theme-lbl">${lb}</span></div>`).join('')}
    </div>
    <div style="font-size:9px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:7px">Couleur d'accent</div>
    <div class="accent-row">
      ${ACCENT_COLORS.map(c => `<div class="accent-dot${st.accent === c ? ' active' : ''}" style="background:${c}" onclick="setSetting('accent','${c}')"></div>`).join('')}
    </div>
    <div class="set-section">Profil</div>
    <div class="set-row"><div><div class="set-label">Poids</div><div class="set-sub">Recalcule les calories</div></div><input class="set-input" type="number" step="0.5" value="${st.weight}" onchange="setSetting('weight',parseFloat(this.value))"></div>
    <div class="set-row"><div><div class="set-label">Taille</div></div><input class="set-input" type="number" value="${st.height}" onchange="setSetting('height',parseInt(this.value))"></div>
    <div class="set-row"><div><div class="set-label">Âge</div></div><input class="set-input" type="number" value="${st.age}" onchange="setSetting('age',parseInt(this.value))"></div>
    <div class="set-section">Programme</div>
    <div class="set-row"><div><div class="set-label">Décharge automatique</div><div class="set-sub">Semaine 8 → −20% charges</div></div><div class="toggle${st.deload ? ' on' : ''}" onclick="toggleSetting('deload')"><div class="toggle-knob"></div></div></div>
    <div class="set-row"><div><div class="set-label">Détection plateau</div><div class="set-sub">Alerte si 3 sem. identiques</div></div><div class="toggle${st.plateau ? ' on' : ''}" onclick="toggleSetting('plateau')"><div class="toggle-knob"></div></div></div>
    <div class="set-row"><div><div class="set-label">Équilibre push/pull</div><div class="set-sub">Ratio volume musculaire</div></div><div class="toggle${st.balance ? ' on' : ''}" onclick="toggleSetting('balance')"><div class="toggle-knob"></div></div></div>
    <div class="set-section">Données</div>
    <div class="set-row" onclick="exportCSV()"><div><div class="set-label">Exporter en CSV</div><div class="set-sub">Toutes tes séances</div></div><span style="font-size:16px;color:var(--t3)">›</span></div>
    <div class="set-row" onclick="confirmReset()" style="margin-bottom:30px"><div><div class="set-label">Réinitialiser la semaine</div><div class="set-sub">Efface les données sem. ${S.week}</div></div><span style="font-size:16px;color:var(--re)">›</span></div>`;
}

function setSetting(key, val) { S.settings[key] = val; saveLocal(); applyTheme(); renderSettingsBody(); }
function toggleSetting(key) { S.settings[key] = !S.settings[key]; saveLocal(); renderSettingsBody(); }

function exportCSV() {
  const rows = [['Semaine','Jour','Exercice','Série','Kg','Reps']];
  getAllSets().forEach(s => rows.push([s.week, s.day, s.eid, s.si, s.kg, s.reps]));
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `athlete_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

function confirmReset() {
  if (!confirm(`Effacer toutes les données de la semaine ${S.week} ?`)) return;
  for (const k of Object.keys(S.cache)) { if (k.startsWith(`${S.week}_`)) delete S.cache[k]; }
  saveLocal();
  sb.from('sets').delete().eq('user_id', USER_ID).eq('week', S.week).then(() => {}).catch(() => {});
  renderSeance(); updateTopbar();
}

// ── NAV ───────────────────────────────────────────────────────────────────────
function switchTab(tab) {
  S.tab = tab;
  ['seance','stats','records'].forEach(t => {
    document.getElementById('tab-' + t).style.display = t === tab ? 'block' : 'none';
    document.getElementById('bn-' + t).classList.toggle('on', t === tab);
  });
  document.getElementById('day-bar').style.display = tab === 'seance' ? 'flex' : 'none';
  if (tab === 'stats') renderStats();
  if (tab === 'records') renderRecords();
}

// ── INIT ──────────────────────────────────────────────────────────────────────
async function init() {
  try { loadLocal(); } catch(e) {}
  applyTheme();
  renderDayBar(); updateTopbar(); renderSeance();

  loadAllData().then(() => { renderSeance(); updateTopbar(); }).catch(() => setSyncUI(false));

  setTimeout(() => {
    const el = document.getElementById('tab-seance');
    if (el && el.innerHTML.includes('Chargement')) { try { renderDayBar(); renderSeance(); updateTopbar(); } catch(e) {} }
  }, 3000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (S.timer.running && S.timer.startTime) {
        S.timer.val = Math.floor((Date.now() - S.timer.startTime) / 1000); updateTimerUI();
      }
      if (!S.wakeLock && (
        document.getElementById('focus-screen').classList.contains('on') ||
        document.getElementById('gainage-screen').classList.contains('on')
      )) requestWakeLock();
    }
  });

  if (window.matchMedia)
    window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change', () => { if (S.settings.theme === 'auto') applyTheme(); });
}

init();
