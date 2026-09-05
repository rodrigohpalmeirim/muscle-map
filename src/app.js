/* Muscle Map — selection state, score maths, and rendering. */

const ABS_REF = 6;          // weighted sets that count as a fully worked muscle
const LEVELS = 6;

const state = {
  picked: new Map(),        // exercise id -> sets
  mode: 'relative',
  query: '',
  gear: null,
  preview: null,            // exercise id being previewed on hover
  hiMuscle: null,
  muscle: null,             // library filtered to exercises that train this
};

const EX_BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
const GEAR = [...new Set(EXERCISES.map((e) => e.gear))].sort();

const $ = (sel) => document.querySelector(sel);
const el = (tag, cls) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
};

/* ── maths ─────────────────────────────────────────────────── */

// Raw score per muscle: sum of activation x sets over everything picked.
function totals() {
  const out = {};
  for (const m of MUSCLES) out[m.id] = 0;
  for (const [id, sets] of state.picked) {
    const ex = EX_BY_ID[id];
    for (const [mid, w] of Object.entries(ex.m)) out[mid] += w * sets;
  }
  return out;
}

function previewTotals(id) {
  const out = {};
  for (const m of MUSCLES) out[m.id] = 0;
  for (const [mid, w] of Object.entries(EX_BY_ID[id].m)) out[mid] = w;
  return out;
}

// Turn raw scores into 0-1 shares under the active scale.
function shares(scores, mode) {
  const peak = Math.max(0, ...Object.values(scores));
  const denom = mode === 'absolute' ? ABS_REF : peak;
  const out = {};
  for (const m of MUSCLES) {
    out[m.id] = denom > 0 ? Math.min(1, scores[m.id] / denom) : 0;
  }
  return out;
}

const levelOf = (share) =>
  share <= 0 ? 0 : Math.min(LEVELS, Math.max(1, Math.ceil(share * LEVELS)));

// Which picked exercises feed a muscle, biggest contribution first.
function contributors(mid) {
  return [...state.picked]
    .map(([id, sets]) => ({ ex: EX_BY_ID[id], amount: (EX_BY_ID[id].m[mid] || 0) * sets }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

/* ── library ───────────────────────────────────────────────── */

function matches(ex) {
  const q = state.query;
  if (state.gear && ex.gear !== state.gear) return false;
  if (state.muscle && !ex.m[state.muscle]) return false;
  if (!q) return true;
  return (ex.name + ' ' + ex.group + ' ' + ex.gear).toLowerCase().includes(q);
}

function buildGearFilters() {
  const wrap = $('#gear');
  const add = (label, value) => {
    const b = el('button');
    b.type = 'button';
    b.textContent = label;
    b.dataset.gear = value ?? '';
    b.setAttribute('aria-pressed', String(state.gear === value));
    b.addEventListener('click', () => {
      state.gear = state.gear === value ? null : value;
      [...wrap.children].forEach((c) =>
        c.setAttribute('aria-pressed', String((c.dataset.gear || null) === state.gear)));
      renderLibrary();
    });
    wrap.append(b);
  };
  GEAR.forEach((g) => add(g, g));
}

function exRow(ex) {
  const li = el('li');
  const lab = el('label', 'ex');
  lab.dataset.ex = ex.id;

  const cb = el('input');
  cb.type = 'checkbox';
  cb.checked = state.picked.has(ex.id);
  cb.addEventListener('change', () => toggle(ex.id, cb.checked));

  const box = el('span', 'box');
  const name = el('span', 'lab');
  name.textContent = ex.name;
  const tag = el('span', 'gear-tag');

  if (state.muscle) {
    // Ranked by muscle: the trailing figure is how hard this lift hits it.
    const w = ex.m[state.muscle];
    tag.textContent = w.toFixed(2).replace(/0$/, '');
    tag.classList.add('lv-' + levelOf(w));
  } else {
    tag.textContent = ex.gear;
  }

  lab.append(cb, box, name, tag);
  lab.addEventListener('mouseenter', () => setPreview(ex.id));
  lab.addEventListener('mouseleave', () => setPreview(null));
  cb.addEventListener('focus', () => setPreview(ex.id));
  cb.addEventListener('blur', () => setPreview(null));
  li.append(lab);
  return li;
}

function renderLibrary() {
  const box = $('#library');
  box.textContent = '';

  // Filtering by muscle replaces the grouping with one hardest-first ranking.
  if (state.muscle) {
    const items = EXERCISES.filter(matches)
      .sort((a, b) => b.m[state.muscle] - a.m[state.muscle]);
    const ul = el('ul', 'ex-list');
    items.forEach((ex) => ul.append(exRow(ex)));
    box.append(ul);
    if (!items.length) box.append(emptyNote());
    return;
  }

  let shown = 0;
  for (const group of GROUPS) {
    const items = EXERCISES.filter((e) => e.group === group && matches(e));
    if (!items.length) continue;
    shown += items.length;

    const h = el('h3', 'group-h');
    h.textContent = group;
    const count = el('span');
    count.textContent = items.length;
    h.append(count);
    box.append(h);

    const ul = el('ul', 'ex-list');
    items.forEach((ex) => ul.append(exRow(ex)));
    box.append(ul);
  }

  if (!shown) box.append(emptyNote());
}

function emptyNote() {
  const p = el('p', 'empty');
  p.textContent = 'No exercise matches that. Try a muscle name, a lift, or clear the filters.';
  return p;
}

/* ── session column ───────────────────────────────────────── */

function renderSession() {
  const wrap = $('#session-wrap');
  const list = $('#session-list');
  wrap.hidden = state.picked.size === 0;
  list.textContent = '';

  for (const [id, sets] of state.picked) {
    const ex = EX_BY_ID[id];
    const li = el('li', 'session-row');

    const nm = el('span', 'nm');
    nm.textContent = ex.name;

    const setsBox = el('span', 'sets');
    const minus = el('button', 'stepper');
    minus.type = 'button';
    minus.textContent = '−';
    minus.disabled = sets <= 1;
    minus.setAttribute('aria-label', `One set fewer of ${ex.name}`);
    minus.addEventListener('click', () => setSets(id, sets - 1));

    const num = el('span', 'setnum');
    num.textContent = `${sets}×`;

    const plus = el('button', 'stepper');
    plus.type = 'button';
    plus.textContent = '+';
    plus.disabled = sets >= 12;
    plus.setAttribute('aria-label', `One set more of ${ex.name}`);
    plus.addEventListener('click', () => setSets(id, sets + 1));
    setsBox.append(minus, num, plus);

    const drop = el('button', 'drop');
    drop.type = 'button';
    drop.textContent = '×';
    drop.setAttribute('aria-label', `Remove ${ex.name}`);
    drop.addEventListener('click', () => toggle(id, false));

    li.append(nm, setsBox, drop);
    li.addEventListener('mouseenter', () => setPreview(id));
    li.addEventListener('mouseleave', () => setPreview(null));
    list.append(li);
  }
}

/* ── figures + ledger ─────────────────────────────────────── */

function paintFigures(share) {
  document.querySelectorAll('.figure .muscle').forEach((p) => {
    const lv = levelOf(share[p.dataset.muscle] || 0);
    p.classList.remove('lv-1', 'lv-2', 'lv-3', 'lv-4', 'lv-5', 'lv-6');
    if (lv) p.classList.add('lv-' + lv);
    p.classList.toggle('hi', state.hiMuscle === p.dataset.muscle);
  });
}

function buildMeters() {
  const ol = $('#meters');
  ol.textContent = '';
  for (const m of MUSCLES) {
    const li = el('li', 'meter');
    li.dataset.muscle = m.id;

    const row = el('button', 'm-row');
    row.type = 'button';
    row.setAttribute('aria-pressed', 'false');
    row.title = `Show exercises that train the ${m.name.toLowerCase()}`;
    const name = el('span', 'm-name');
    name.textContent = m.name;
    const val = el('span', 'm-val');
    row.append(name, val);

    const track = el('span', 'm-track');
    const fill = el('span', 'm-fill');
    track.append(fill);

    li.append(row, track);
    row.addEventListener('click', () => filterByMuscle(m.id));
    li.addEventListener('mouseenter', () => highlight(m.id));
    li.addEventListener('mouseleave', () => highlight(null));
    ol.append(li);
  }
}

function renderLedger(scores, share) {
  const ol = $('#meters');
  const rows = [...ol.children];
  const ranked = MUSCLES.slice().sort((a, b) => scores[b.id] - scores[a.id]);
  const cold = [];

  ranked.forEach((m, i) => {
    const li = rows.find((r) => r.dataset.muscle === m.id);
    li.style.order = i;
    const score = scores[m.id];
    li.hidden = score <= 0;
    li.classList.toggle('on', score > 0);
    if (score <= 0) { cold.push(m); return; }

    li.querySelector('.m-val').textContent = score.toFixed(1);
    const fill = li.querySelector('.m-fill');
    fill.style.width = Math.max(2, share[m.id] * 100) + '%';
    fill.className = 'm-fill' + (levelOf(share[m.id]) ? ' lv-' + levelOf(share[m.id]) : '');
  });

  rows.forEach((r) => r.querySelector('.m-row')
    .setAttribute('aria-pressed', String(r.dataset.muscle === state.muscle)));

  const box = $('#untouched');
  box.hidden = state.picked.size === 0 || cold.length === 0;
  const list = $('#untouched-list');
  list.textContent = '';
  cold.forEach((m, i) => {
    const b = el('button', 'chip');
    b.type = 'button';
    b.textContent = m.name;
    b.addEventListener('click', () => filterByMuscle(m.id));
    list.append(b);
    if (i < cold.length - 1) list.append(document.createTextNode(', '));
  });
  $('#untouched h3').textContent =
    cold.length === MUSCLES.length ? 'Nothing trained yet' : `Untouched (${cold.length})`;
}

/* ── tooltip ──────────────────────────────────────────────── */

const tip = $('#tip');

function showTip(mid, x, y) {
  const m = MUSCLE_BY_ID[mid];
  const scores = totals();
  const feeders = contributors(mid);
  tip.textContent = '';

  const n = el('div', 't-name');
  n.textContent = m.name;
  const s = el('div', 't-score');
  s.textContent = state.picked.size
    ? `${scores[mid].toFixed(1)} of ${Math.max(...Object.values(scores)).toFixed(1)} — ${m.region}`
    : m.region;
  tip.append(n, s);

  if (feeders.length) {
    const ul = el('ul');
    for (const c of feeders.slice(0, 5)) {
      const li = el('li');
      const a = el('em');
      a.style.fontStyle = 'normal';
      a.textContent = c.ex.name;
      const b = el('span');
      b.textContent = c.amount.toFixed(1);
      li.append(a, b);
      ul.append(li);
    }
    if (feeders.length > 5) {
      const li = el('li');
      li.append(document.createTextNode(`+${feeders.length - 5} more`));
      ul.append(li);
    }
    tip.append(ul);
  } else if (state.picked.size) {
    const p = el('div', 't-score');
    p.style.margin = '0';
    p.textContent = 'Nothing in this session works it.';
    tip.append(p);
  }

  const hint = el('div', 't-score');
  hint.style.margin = '5px 0 0';
  hint.textContent = state.muscle === mid ? 'Click to stop filtering' : 'Click to see what trains it';
  tip.append(hint);

  tip.hidden = false;
  const pad = 14;
  const r = tip.getBoundingClientRect();
  tip.style.left = Math.min(x + pad, innerWidth - r.width - 8) + 'px';
  tip.style.top = Math.min(y + pad, innerHeight - r.height - 8) + 'px';
}

function wireFigureHover() {
  document.querySelectorAll('.figure').forEach((svg) => {
    svg.addEventListener('mousemove', (e) => {
      const p = e.target.closest('.muscle');
      if (!p) { tip.hidden = true; highlight(null); return; }
      highlight(p.dataset.muscle);
      showTip(p.dataset.muscle, e.clientX, e.clientY);
    });
    svg.addEventListener('click', (e) => {
      const p = e.target.closest('.muscle');
      if (p) filterByMuscle(p.dataset.muscle);
    });
    svg.addEventListener('mouseleave', () => { tip.hidden = true; highlight(null); });
  });
}

/* ── state changes ────────────────────────────────────────── */

function toggle(id, on) {
  if (on) state.picked.set(id, state.picked.get(id) || 1);
  else state.picked.delete(id);
  renderLibrary();
  render();
}

function setSets(id, n) {
  state.picked.set(id, Math.min(12, Math.max(1, n)));
  render();
}

function setPreview(id) {
  if (state.preview === id) return;
  state.preview = id;
  render();
}

function highlight(mid) {
  if (state.hiMuscle === mid) return;
  state.hiMuscle = mid;
  document.querySelectorAll('.figure .muscle').forEach((p) =>
    p.classList.toggle('hi', p.dataset.muscle === mid));
}

function filterByMuscle(mid) {
  state.muscle = state.muscle === mid ? null : mid;
  const box = $('#mfilter');
  box.hidden = !state.muscle;
  if (state.muscle) {
    $('#mfilter-label').textContent =
      `Exercises for the ${MUSCLE_BY_ID[state.muscle].name.toLowerCase()}, hardest first`;
  }
  renderLibrary();
  render();
  if (state.muscle) $('#library').scrollIntoView({ block: 'nearest' });
}

function setMode(mode) {
  state.mode = mode;
  $('#mfilter-clear').addEventListener('click', () => filterByMuscle(state.muscle));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.muscle) filterByMuscle(state.muscle);
});

document.querySelectorAll('.modes button').forEach((b) =>
    b.setAttribute('aria-checked', String(b.dataset.mode === mode)));
  $('#mode-hint').textContent = mode === 'absolute'
    ? `Shading is fixed to real volume: a muscle turns fully hot at ${ABS_REF} hard sets, so light shading means light work.`
    : 'Shading compares muscles inside this session: the hottest muscle sets the top of the scale.';
  render();
}

const STORE = 'muscle-map/session';

function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify({
      picked: [...state.picked], mode: state.mode,
    }));
  } catch (e) { /* private browsing: session just won't persist */ }
}

function restore() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (!raw) return;
    for (const [id, sets] of raw.picked || []) {
      if (EX_BY_ID[id]) state.picked.set(id, Math.min(12, Math.max(1, sets)));
    }
    if (raw.mode === 'absolute') state.mode = 'absolute';
  } catch (e) { /* ignore a corrupt entry */ }
}

function render() {
  const sets = [...state.picked.values()].reduce((a, b) => a + b, 0);
  $('#tally-ex').textContent = state.picked.size;
  $('#tally-sets').textContent = sets;
  $('#clear').hidden = state.picked.size === 0;

  const scores = totals();
  const share = shares(scores, state.mode);

  // Hovering an exercise previews it on its own, normalised to itself.
  const figureShare = state.preview
    ? shares(previewTotals(state.preview), 'relative')
    : share;
  paintFigures(figureShare);
  document.querySelectorAll('.figure .muscle').forEach((p) =>
    p.classList.toggle('picked', p.dataset.muscle === state.muscle));

  const note = $('#stage-note');
  if (state.preview) {
    note.innerHTML = 'Previewing <b></b> on its own';
    note.querySelector('b').textContent = EX_BY_ID[state.preview].name;
  } else if (!state.picked.size) {
    note.textContent = 'Nothing selected yet — pick an exercise to light up the map.';
  } else {
    const top = MUSCLES.slice().sort((a, b) => scores[b.id] - scores[a.id])[0];
    note.innerHTML = 'Working hardest: <b></b>';
    note.querySelector('b').textContent = MUSCLE_BY_ID[top.id].name;
  }

  renderSession();
  renderLedger(scores, share);
  if (!state.preview) save();
}

/* ── boot ─────────────────────────────────────────────────── */

$('#slot-front').innerHTML = FIGURES.front;
$('#slot-back').innerHTML = FIGURES.back;

$('#legend .ramp').innerHTML =
  [1, 2, 3, 4, 5, 6].map((i) => `<i style="background:var(--lv-${i})"></i>`).join('');

$('#search').placeholder = `Search ${EXERCISES.length} exercises`;
$('#search').addEventListener('input', (e) => {
  state.query = e.target.value.trim().toLowerCase();
  renderLibrary();
});

$('#clear').addEventListener('click', () => {
  state.picked.clear();
  renderLibrary();
  render();
});

$('#mfilter-clear').addEventListener('click', () => filterByMuscle(state.muscle));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.muscle) filterByMuscle(state.muscle);
});

document.querySelectorAll('.modes button').forEach((b) =>
  b.addEventListener('click', () => setMode(b.dataset.mode)));

buildGearFilters();
buildMeters();
restore();
renderLibrary();
wireFigureHover();
setMode(state.mode);
