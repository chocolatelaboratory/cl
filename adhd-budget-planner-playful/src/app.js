  /* ============================================================
     APP: ADHD Budget Planner (Playful)
     ============================================================ */
  var NAV = [
    { view:'home', label:'Today', icon:'home' },
    { view:'bills', label:'Bills', icon:'receipt_long' },
    { view:'money', label:'Money', icon:'savings' },
    { view:'goals', label:'Goals', icon:'flag' },
    { view:'settings', label:'Settings', icon:'settings', sideOnly:true }
  ];
  var GENTLE_LINES = [
    "No guilt, just numbers. You've got this.",
    "Small check-ins beat big budgets.",
    "Future you says thanks. 💛",
    "One tap at a time.",
    "Progress, not perfection."
  ];
  var BILL_EMOJI = ['🏠','⚡','📱','🌐','🚗','📺','🛡️','💳','🐶','💧','🏋️','🧾'];
  var CAT_EMOJI = ['🛒','🍔','☕','⛽','🎮','🧺','🐶','✨','💊','👕','🎁','🚌'];
  var GOAL_EMOJI = ['🛟','🏖️','👓','🎄','🚗','🏡','🎓','💻'];
  var DEBT_EMOJI = ['💳','🚗','💻','🎓','🏥','🛋️','📱','🧾'];
  var TONES = ['teal','coral','sun','grape','sky','pink','lime','sand'];
  var FREQ = { monthly:'Once a month', twice:'Two days a month', biweekly:'Every 2 weeks', weekly:'Every week', months:'Every few months', once:'Just once' };
  var SHORTFREQ = { monthly:'Monthly', twice:'Twice a month', biweekly:'Every 2 weeks', weekly:'Weekly', months:'Every few months', once:'One-off' };
  var PAYFREQ = { biweekly:'Every 2 weeks', weekly:'Every week', twice:'Twice a month', monthly:'Once a month' };

  /* ---------- small helpers ---------- */
  function $(id){ return document.getElementById(id); }
  function addDays(s, n){ var d = parseLocalDate(s); d.setDate(d.getDate() + n); return formatDateLocal(d); }
  function daysBetween(a, b){ return Math.round((parseLocalDate(b) - parseLocalDate(a)) / 864e5); }
  function lastDay(y, m){ return new Date(y, m + 1, 0).getDate(); }
  function monthDate(y, m, day){ var first = new Date(y, m, 1); return formatDateLocal(new Date(first.getFullYear(), first.getMonth(), Math.min(day, lastDay(first.getFullYear(), first.getMonth())))); }
  function dayName(s){ return parseLocalDate(s).toLocaleDateString(undefined, { weekday:'short' }); }
  function fmtDay(s){ return parseLocalDate(s).toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' }); }
  function cur(){ return state.profile.currency || '$'; }
  function money0(n){ var neg = n < 0; return (neg ? '−' : '') + cur() + Math.round(Math.abs(n)).toLocaleString('en-US'); }
  function money2(n){ var neg = n < 0; return (neg ? '−' : '') + cur() + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 }); }
  function num(v){ var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; }
  function r2(n){ return Math.round(n * 100) / 100; }
  function sum(a, f){ return a.reduce(function(t, x){ return t + (f ? f(x) : x); }, 0); }
  function byId(list, id){ return list.filter(function(x){ return x.id === id; })[0]; }
  function nowTs(){ return Date.now(); }
  function relDay(s){ var d = daysBetween(todayStr(), s); return d === 0 ? 'today' : d === 1 ? 'tomorrow' : d === -1 ? 'yesterday' : d < 0 ? (-d) + ' days ago' : 'in ' + d + ' days'; }
  function tone(t){ t = TONES.indexOf(t) >= 0 ? t : 'teal'; return 'background:var(--t-' + t + '-bg);color:var(--t-' + t + ')'; }
  function toneBg(t){ t = TONES.indexOf(t) >= 0 ? t : 'teal'; return 'background:var(--t-' + t + '-bg)'; }

  /* ============================================================
     STATE
     ============================================================ */
  function defaultState(){
    return {
      version: 1,
      profile: { name:'', currency:'$' },
      balance: { amount:0, ts:0, set:false },
      bills: [], paid: {}, pays: [], cats: defaultCats(),
      spends: [], incomes: [], debts: [], debtOrder:'snowball', goals: [], wait: [],
      nowDone: {}, lastOpen: ''
    };
  }
  function defaultCats(){
    return [
      { id:'groceries', name:'Groceries', emoji:'🛒', cap:400, tone:'teal' },
      { id:'eating', name:'Eating out', emoji:'🍔', cap:150, tone:'coral' },
      { id:'coffee', name:'Coffee', emoji:'☕', cap:40, tone:'sun' },
      { id:'gas', name:'Gas', emoji:'⛽', cap:160, tone:'sky' },
      { id:'fun', name:'Fun', emoji:'🎮', cap:100, tone:'grape' },
      { id:'home', name:'Household', emoji:'🧺', cap:80, tone:'lime' },
      { id:'pets', name:'Pets', emoji:'🐶', cap:60, tone:'pink' },
      { id:'other', name:'Other', emoji:'✨', cap:0, tone:'sand' }
    ];
  }
  function normalize(raw){
    raw = raw && typeof raw === 'object' ? raw : {};
    function arr(v){ return Array.isArray(v) ? v : []; }
    function str(v, d){ return v == null ? (d || '') : String(v); }
    function dt(v, d){ return /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v) : (d || todayStr()); }
    var t = todayStr();
    var cats = arr(raw.cats).map(function(c){ return { id: str(c.id) || uid(), name: str(c.name, 'Spending').slice(0, 30), emoji: str(c.emoji, '✨'), cap: Math.max(0, num(c.cap)), tone: TONES.indexOf(c.tone) >= 0 ? c.tone : 'teal' }; });
    if(!cats.length) cats = defaultCats();
    var p = raw.profile || {}, b = raw.balance || {};
    return {
      version: 1,
      profile: { name: str(p.name).slice(0, 30), currency: str(p.currency, '$').slice(0, 4) || '$' },
      balance: { amount: num(b.amount), ts: Number(b.ts) || 0, set: !!b.set },
      bills: arr(raw.bills).map(function(x){ return { id: str(x.id) || uid(), name: str(x.name, 'Bill').slice(0, 40), emoji: str(x.emoji, '🧾'), amount: Math.max(0, num(x.amount)), freq: FREQ[x.freq] ? x.freq : 'monthly', day: Math.min(31, Math.max(1, Math.round(num(x.day)) || 1)), day2: Math.min(31, Math.max(1, Math.round(num(x.day2)) || 15)), every: Math.min(12, Math.max(2, Math.round(num(x.every)) || 6)), anchor: dt(x.anchor, t), setAside: !!x.setAside, since: dt(x.since, t) }; }),
      paid: raw.paid && typeof raw.paid === 'object' && !Array.isArray(raw.paid) ? raw.paid : {},
      pays: arr(raw.pays).map(function(x){ return { id: str(x.id) || uid(), name: str(x.name, 'Paycheck').slice(0, 40), amount: Math.max(0, num(x.amount)), freq: PAYFREQ[x.freq] ? x.freq : 'biweekly', anchor: dt(x.anchor, t), day: Math.min(31, Math.max(1, Math.round(num(x.day)) || 1)), day2: Math.min(31, Math.max(1, Math.round(num(x.day2)) || 15)), early: !!x.early }; }),
      cats: cats,
      spends: arr(raw.spends).map(function(x){ return { id: str(x.id) || uid(), amount: Math.max(0, num(x.amount)), cat: str(x.cat, 'other'), note: str(x.note).slice(0, 200), date: dt(x.date, t), ts: Number(x.ts) || nowTs() }; }),
      incomes: arr(raw.incomes).map(function(x){ return { id: str(x.id) || uid(), amount: Math.max(0, num(x.amount)), note: str(x.note, 'Money in').slice(0, 200), date: dt(x.date, t), ts: Number(x.ts) || nowTs() }; }),
      debts: arr(raw.debts).map(function(x){ var bal = Math.max(0, num(x.balance)); return { id: str(x.id) || uid(), name: str(x.name, 'Debt').slice(0, 40), emoji: str(x.emoji, '💳'), start: Math.max(bal, num(x.start)), balance: bal, rate: Math.max(0, num(x.rate)), min: Math.max(0, num(x.min)), dueDay: Math.min(31, Math.max(0, Math.round(num(x.dueDay)))), since: dt(x.since, t), payments: arr(x.payments).map(function(pm){ return { id: str(pm.id) || uid(), amount: Math.max(0, num(pm.amount)), date: dt(pm.date, t), ts: Number(pm.ts) || nowTs(), key: pm.key ? String(pm.key) : '' }; }) }; }),
      debtOrder: raw.debtOrder === 'avalanche' ? 'avalanche' : 'snowball',
      goals: arr(raw.goals).map(function(x){ return { id: str(x.id) || uid(), name: str(x.name, 'Goal').slice(0, 40), emoji: str(x.emoji, '🎯'), target: Math.max(1, num(x.target)), saved: Math.max(0, num(x.saved)), adds: arr(x.adds).map(function(a){ return { amount: num(a.amount), date: dt(a.date, t), ts: Number(a.ts) || nowTs() }; }) }; }),
      wait: arr(raw.wait).map(function(x){ return { id: str(x.id) || uid(), name: str(x.name, 'Something').slice(0, 60), price: Math.max(0, num(x.price)), addedAt: Number(x.addedAt) || nowTs(), status: ['waiting','skipped','bought'].indexOf(x.status) >= 0 ? x.status : 'waiting', decidedAt: Number(x.decidedAt) || 0 }; }),
      nowDone: raw.nowDone && typeof raw.nowDone === 'object' && !Array.isArray(raw.nowDone) ? raw.nowDone : {},
      lastOpen: str(raw.lastOpen)
    };
  }
  function load(){
    try{ var raw = localStorage.getItem(STORAGE_KEY); return raw ? normalize(JSON.parse(raw)) : defaultState(); }
    catch(e){ return defaultState(); }
  }
  function save(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch(e){ toast('Could not save. Your browser storage may be full or turned off.'); }
  }
  function isEmpty(){ return !state.bills.length && !state.spends.length && !state.pays.length && !state.debts.length && !state.goals.length && !state.balance.set; }

  var state = load();
  var currentView = 'home';
  var ui = { billTab:'soon', moneyTab:'env', goalTab:'debt', calMonth: todayStr().slice(0, 7), calSel: todayStr(), away: false };

  /* ============================================================
     MONEY ENGINE
     ============================================================ */
  // Every date a schedule lands on between from and to (inclusive, YYYY-MM-DD).
  function occurrences(s, from, to){
    var out = [], f = parseLocalDate(from), t = parseLocalDate(to);
    if(s.freq === 'monthly' || s.freq === 'twice'){
      var days = s.freq === 'twice' ? [s.day, s.day2] : [s.day];
      var c = new Date(f.getFullYear(), f.getMonth(), 1);
      while(c <= t){
        days.forEach(function(d){ var x = monthDate(c.getFullYear(), c.getMonth(), d); if(x >= from && x <= to && out.indexOf(x) < 0) out.push(x); });
        c.setMonth(c.getMonth() + 1);
      }
    } else if(s.freq === 'weekly' || s.freq === 'biweekly'){
      var step = s.freq === 'weekly' ? 7 : 14, k = Math.ceil(daysBetween(s.anchor, from) / step), d0 = addDays(s.anchor, k * step), guard = 0;
      while(d0 <= to && guard++ < 400){ out.push(d0); d0 = addDays(d0, step); }
    } else if(s.freq === 'months'){
      var a = parseLocalDate(s.anchor), n = s.every || 6, mo = (f.getFullYear() - a.getFullYear()) * 12 + (f.getMonth() - a.getMonth()), k2 = Math.floor(mo / n) - 1;
      for(var g = 0; g < 40; g++, k2++){ var x2 = monthDate(a.getFullYear(), a.getMonth() + k2 * n, a.getDate()); if(x2 > to) break; if(x2 >= from) out.push(x2); }
    } else if(s.freq === 'once'){
      if(s.anchor >= from && s.anchor <= to) out.push(s.anchor);
    }
    return out.sort();
  }
  function payDates(p, from, to){
    // Paid early when payday lands on a weekend (Friday before)
    var raw = occurrences(p, addDays(from, -3), addDays(to, 3));
    return raw.map(function(d){ if(!p.early) return d; var w = parseLocalDate(d).getDay(); return w === 6 ? addDays(d, -1) : w === 0 ? addDays(d, -2) : d; })
      .filter(function(d){ return d >= from && d <= to; });
  }
  function nextPayday(){
    var t = todayStr(), best = null;
    state.pays.forEach(function(p){ var ds = payDates(p, addDays(t, 1), addDays(t, 70)); if(ds.length && (!best || ds[0] < best.date)) best = { date: ds[0], pay: p }; });
    return best;
  }
  // Everything that has to go out: bills, monthly set-asides, the big bill itself (covered by the set-aside) and debt minimums.
  function dueItems(from, to){
    var items = [];
    state.bills.forEach(function(b){
      var f = from < b.since ? b.since : from;
      if(f > to) return;
      if(b.freq === 'months' && b.setAside){
        var share = r2(b.amount / b.every), aday = parseLocalDate(b.anchor).getDate();
        occurrences({ freq:'monthly', day: aday }, f, to).forEach(function(d){ items.push(mk(b, 'aside', d, share)); });
        occurrences(b, f, to).forEach(function(d){ items.push(mk(b, 'lump', d, b.amount)); });
      } else {
        occurrences(b, f, to).forEach(function(d){ items.push(mk(b, 'bill', d, b.amount)); });
      }
    });
    state.debts.forEach(function(dbt){
      if(!dbt.min || !dbt.dueDay || dbt.balance <= 0) return;
      var f = from < dbt.since ? dbt.since : from; if(f > to) return;
      occurrences({ freq:'monthly', day: dbt.dueDay }, f, to).forEach(function(d){
        var key = 'debt:' + dbt.id + '|debt|' + d;
        items.push({ key:key, kind:'debt', ref: dbt.id, name: dbt.name, emoji: dbt.emoji, amount: Math.min(dbt.min, dbt.balance), date:d, paid: !!state.paid[key] });
      });
    });
    function mk(b, kind, d, amt){ var key = b.id + '|' + kind + '|' + d; return { key:key, kind:kind, ref:b.id, name: b.name, emoji:b.emoji, amount:amt, date:d, paid: kind === 'lump' ? true : !!state.paid[key] }; }
    return items.sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : a.name < b.name ? -1 : 1; });
  }
  function paidKeyAmount(key){
    var parts = key.split('|'), b = byId(state.bills, parts[0]);
    if(!b) return 0;
    return parts[1] === 'aside' ? r2(b.amount / b.every) : b.amount;
  }
  // What's in the account now: the balance typed in, plus/minus everything logged after it.
  function currentBalance(){
    var ts = state.balance.ts, bal = state.balance.amount;
    bal += sum(state.incomes.filter(function(x){ return x.ts > ts; }), function(x){ return x.amount; });
    bal -= sum(state.spends.filter(function(x){ return x.ts > ts; }), function(x){ return x.amount; });
    Object.keys(state.paid).forEach(function(k){ if(k.indexOf('debt:') !== 0 && state.paid[k] > ts) bal -= paidKeyAmount(k); });
    state.debts.forEach(function(d){ d.payments.forEach(function(p){ if(p.ts > ts) bal -= p.amount; }); });
    state.goals.forEach(function(g){ g.adds.forEach(function(a){ if(a.ts > ts) bal -= a.amount; }); });
    return r2(bal);
  }
  function budget(){
    var t = todayStr(), np = nextPayday(), payday = np ? np.date : addDays(t, 14);
    var days = Math.max(1, daysBetween(t, payday));
    var items = dueItems(addDays(t, -31), addDays(payday, -1));
    var owed = items.filter(function(x){ return x.kind !== 'lump' && !x.paid; });
    var owedTotal = r2(sum(owed, function(x){ return x.amount; }));
    var bal = currentBalance();
    var spentToday = r2(sum(state.spends.filter(function(x){ return x.date === t; }), function(x){ return x.amount; }));
    var safe = r2(bal - owedTotal);
    var perDay = Math.max(0, (safe + spentToday) / days);
    var left = r2(perDay - spentToday);
    return { today:t, payday:payday, pay: np && np.pay, days:days, items:items, owed:owed, owedTotal:owedTotal, bal:bal, spentToday:spentToday, safe:safe, perDay:perDay, left:left };
  }
  function monthSpent(catId, ym){ ym = ym || todayStr().slice(0, 7); return r2(sum(state.spends.filter(function(x){ return x.date.slice(0, 7) === ym && (!catId || x.cat === catId); }), function(x){ return x.amount; })); }
  function catOf(id){ return byId(state.cats, id) || byId(state.cats, 'other') || state.cats[state.cats.length - 1]; }
  function debtsOrdered(){
    var list = state.debts.slice();
    list.sort(function(a, b){
      if((a.balance <= 0) !== (b.balance <= 0)) return a.balance <= 0 ? -1 : 1;
      return state.debtOrder === 'avalanche' ? (b.rate - a.rate) || (a.balance - b.balance) : (a.balance - b.balance) || (b.rate - a.rate);
    });
    return list;
  }

  /* ============================================================
     PARTY: sparks on check-offs, emoji confetti, goal screen
     ============================================================ */
  function sparks(el){
    if(reduceMotion || !el) return;
    ['✨','⭐','💸','✨','🎉','⭐'].forEach(function(s, i){
      var a = i / 6 * Math.PI * 2, sp = document.createElement('span');
      sp.className = 'spark emo'; sp.textContent = s;
      sp.style.setProperty('--dx', Math.cos(a) * 38 + 'px'); sp.style.setProperty('--dy', Math.sin(a) * 38 + 'px');
      el.appendChild(sp); setTimeout(function(){ sp.remove(); }, 850);
    });
  }
  function party(n){
    if(reduceMotion) return;
    var c = $('party-canvas'), x = c.getContext('2d'), dpr = window.devicePixelRatio || 1, W = c.width = innerWidth * dpr, H = c.height = innerHeight * dpr;
    var cols = ['#17C3B2','#43DCC7','#FF7A66','#FFC46B','#9B7BFF','#5B95FF','#FF8FB8'], em = ['🎉','⭐','💸','💚'], ps = [];
    for(var i = 0; i < n; i++) ps.push({ x: W / 2 + (Math.random() - .5) * W * .4, y: H * .62, vx: (Math.random() - .5) * 18 * dpr, vy: -(Math.random() * 20 + 10) * dpr, s: (Math.random() * 6 + 6) * dpr, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: cols[i % cols.length], e: i % 9 === 0 ? em[i % 4] : null, round: i % 3 === 0 });
    var t0 = performance.now();
    (function f(t){
      x.clearRect(0, 0, W, H); var alive = false, fade = Math.max(0, 1 - (t - t0 - 2000) / 900);
      ps.forEach(function(p){
        p.vy += .6 * dpr; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr; if(p.y < H + 40) alive = true;
        x.save(); x.globalAlpha = fade; x.translate(p.x, p.y); x.rotate(p.r);
        if(p.e){ x.font = (p.s * 2.4) + 'px "Apple Color Emoji","Noto Color Emoji",sans-serif'; x.fillText(p.e, 0, 0); }
        else { x.fillStyle = p.c; if(p.round){ x.beginPath(); x.arc(0, 0, p.s / 2, 0, 7); x.fill(); } else x.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .66 * Math.abs(Math.cos(p.r * 2)) + 2); }
        x.restore();
      });
      if(alive && fade > 0) requestAnimationFrame(f); else x.clearRect(0, 0, W, H);
    })(t0);
  }
  function goalScreen(emoji, value, title, text){
    openSheet('<div class="handle"></div><div class="celebrate"><span class="trophy emo">' + emoji + '</span>' +
      '<div class="big num" data-count="' + Math.round(value) + '" data-prefix="' + escapeHtml(cur()) + '">' + money0(value) + '</div>' +
      '<h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(text) + '</p>' +
      '<button class="btn-fun btn-wide" data-action="close-sheet" style="margin-top:20px">Keep going 🚀</button></div>');
    countUp($('sheet-body')); party(150); buzz([10, 40, 10, 40, 20]);
  }

  /* ============================================================
     SHEETS (bottom sheets for every form)
     ============================================================ */
  var sheetSubmit = null;
  function openSheet(html, onSubmit){
    $('sheet-body').innerHTML = html; sheetSubmit = onSubmit || null;
    $('sheet-overlay').classList.remove('hidden');
    $('sheet-body').scrollTop = 0;
  }
  function closeSheet(){ $('sheet-overlay').classList.add('hidden'); sheetSubmit = null; }
  function sheetHead(title){ return '<div class="handle"></div><div class="sheet-head"><h3>' + title + '</h3><button type="button" class="round-btn" data-action="close-sheet" aria-label="Close">' + icon('close') + '</button></div>'; }
  function moneyField(id, val, label, extra){
    return '<label class="fld"><span class="lbl">' + label + '</span><div class="money-in"><span class="cur">' + escapeHtml(cur()) + '</span><input type="text" inputmode="decimal" id="' + id + '" value="' + (val ? escapeHtml(String(val)) : '') + '" placeholder="0" autocomplete="off"></div></label>' + (extra || '');
  }
  function choiceGrid(name, list, selected){
    return '<div class="choices" data-choice="' + name + '">' + list.map(function(c){
      var v = typeof c === 'string' ? c : c.id, e = typeof c === 'string' ? c : c.emoji, l = typeof c === 'string' ? '' : c.name;
      return '<button type="button" class="choice' + (v === selected ? ' on' : '') + '" data-v="' + escapeHtml(v) + '"><span class="emo">' + e + '</span>' + (l ? '<span>' + escapeHtml(l) + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function chosen(name){ var b = document.querySelector('[data-choice="' + name + '"] .choice.on'); return b ? b.dataset.v : ''; }
  function shake(el){ if(!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); el.focus(); }
  function val(id){ var el = $(id); return el ? el.value.trim() : ''; }

  /* ---- log a spend / money in ---- */
  function openAdd(editId, kind){
    var sp = editId ? (byId(state.spends, editId) || byId(state.incomes, editId)) : null;
    var isIn = sp ? !!byId(state.incomes, editId) : kind === 'in';
    var html = sheetHead(sp ? (isIn ? 'Edit money in' : 'Edit spend') + ' <span class="emo">✏️</span>' : 'Log it <span class="emo">✨</span>') +
      '<form id="add-form" autocomplete="off">' +
      (sp ? '' : '<div class="seg kind' + (isIn ? ' right' : '') + '" id="kind-seg"><span class="knob"></span><button type="button" data-action="kind-pick" data-v="out" class="' + (isIn ? '' : 'on') + '">💸 I spent</button><button type="button" data-action="kind-pick" data-v="in" class="' + (isIn ? 'on' : '') + '">💰 Money in</button></div>') +
      moneyField('add-amt', sp ? sp.amount : '', isIn ? 'How much came in?' : 'How much?',
        '<div class="presets" id="add-presets">' + [5, 10, 20, 50].map(function(n){ return '<button type="button" data-action="preset" data-v="' + n + '">' + escapeHtml(cur()) + n + '</button>'; }).join('') + '</div>') +
      '<div class="fld" id="cat-fld"' + (isIn ? ' style="display:none"' : '') + '><span class="lbl">What was it?</span>' + choiceGrid('cat', state.cats, sp && !isIn ? sp.cat : state.cats[0].id) + '</div>' +
      '<label class="fld"><span class="lbl">Note</span><input type="text" id="add-note" maxlength="120" placeholder="' + (isIn ? 'e.g. Paycheck' : 'e.g. Lunch with Maya') + '" value="' + (sp ? escapeHtml(sp.note) : '') + '"></label>' +
      '<label class="fld"><span class="lbl">When</span><input type="date" id="add-date" value="' + (sp ? sp.date : todayStr()) + '"></label>' +
      '<input type="hidden" id="add-kind" value="' + (isIn ? 'in' : 'out') + '">' +
      '<button type="submit" class="btn-fun btn-wide" style="margin-top:20px">' + (sp ? 'Save changes' : 'Save it 🚀') + '</button>' +
      (sp ? '<button type="button" class="danger-link" data-action="' + (isIn ? 'del-income' : 'del-spend') + '" data-id="' + sp.id + '">Delete this</button>' : '') +
      '</form>';
    openSheet(html, function(){
      var amt = r2(num(val('add-amt')));
      if(amt <= 0){ shake($('add-amt')); return false; }
      var k = val('add-kind'), note = val('add-note'), date = val('add-date') || todayStr();
      if(sp){
        sp.amount = amt; sp.note = note; sp.date = date; if(!isIn) sp.cat = chosen('cat') || sp.cat;
        save(); closeSheet(); renderCurrent(); toast('Updated ✏️'); return;
      }
      if(k === 'in'){ state.incomes.push({ id: uid(), amount: amt, note: note || 'Money in', date: date, ts: nowTs() }); save(); closeSheet(); renderCurrent(); toast('Money in! ' + money2(amt) + ' 💰'); return; }
      var cat = chosen('cat') || 'other';
      state.spends.push({ id: uid(), amount: amt, cat: cat, note: note, date: date, ts: nowTs() });
      save(); closeSheet(); renderCurrent(); afterSpendToast(amt, cat);
    });
  }
  function afterSpendToast(amt, catId){
    var b = budget(), c = catOf(catId);
    var line = b.left >= 0 ? money0(b.left) + ' left for today ' + (b.left > 20 ? '😎' : '👍') : 'Logged. Tomorrow is a fresh day 💛';
    if(c.cap && monthSpent(c.id) > c.cap) line = c.name + ' is a little over. That’s okay 💛';
    toast('Logged ' + money2(amt) + '. ' + line);
  }

  /* ---- quick log: "12 coffee" ---- */
  var KEYWORDS = { eating:['lunch','dinner','takeout','pizza','burger','restaurant','sushi','food','brunch','snack'], coffee:['coffee','latte','tea','starbucks','cafe'], groceries:['grocery','groceries','supermarket','market','milk','bread'], gas:['gas','fuel','petrol','parking','uber','bus','train'], fun:['movie','game','games','concert','book','fun','netflix'], home:['cleaning','soap','household','paper','laundry'], pets:['dog','cat','vet','pet','treats','kibble'] };
  function quickLog(text){
    var m = String(text).match(/^\s*[^\d\-.]*\s*(\d+(?:[.,]\d{1,2})?)\s*(.*)$/);
    if(!m) return false;
    var amt = r2(num(m[1].replace(',', '.'))), rest = m[2].trim(), low = rest.toLowerCase(), cat = null;
    if(amt <= 0) return false;
    state.cats.forEach(function(c){ if(!cat && low && (low.indexOf(c.name.toLowerCase()) >= 0 || c.name.toLowerCase().indexOf(low.split(' ')[0]) === 0)) cat = c.id; });
    if(!cat) Object.keys(KEYWORDS).forEach(function(k){ if(!cat && byId(state.cats, k) && KEYWORDS[k].some(function(w){ return low.indexOf(w) >= 0; })) cat = k; });
    cat = cat || (byId(state.cats, 'other') ? 'other' : state.cats[state.cats.length - 1].id);
    var note = rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : '';
    state.spends.push({ id: uid(), amount: amt, cat: cat, note: note, date: todayStr(), ts: nowTs() });
    save(); renderCurrent(); afterSpendToast(amt, cat);
    return true;
  }

  /* ---- balance ---- */
  function openBalance(){
    var b = budget();
    openSheet(sheetHead('What’s in your account? <span class="emo">🏦</span>') +
      '<p class="hint" style="margin-top:0">Open your banking app and type the number you see. No bank login needed, ever.</p>' +
      '<form id="bal-form" autocomplete="off">' + moneyField('bal-amt', state.balance.set ? b.bal.toFixed(2) : '', 'Balance right now') +
      '<button type="submit" class="btn-fun btn-wide" style="margin-top:20px">Update it 👍</button></form>', function(){
        var raw = val('bal-amt'); if(!raw){ shake($('bal-amt')); return false; }
        state.balance = { amount: r2(num(raw)), ts: nowTs(), set: true };
        state.nowDone[todayStr()] = (state.nowDone[todayStr()] || []).concat(['away']);
        ui.away = false; save(); closeSheet(); renderCurrent(); toast('Balance updated. Every number is fresh ✨');
      });
  }
  function openHow(){
    var b = budget();
    var rows = [
      ['In your account now', money2(b.bal)],
      ['Bills and minimums before payday', '−' + money2(b.owedTotal).replace('−', '')],
      ['Safe to spend until payday', money2(b.safe)],
      ['Days until payday', b.days + (b.days === 1 ? ' day' : ' days')],
      ['That’s per day (with today’s spending back in)', money2(b.perDay)],
      ['Spent today', '−' + money2(b.spentToday).replace('−', '')]
    ];
    openSheet(sheetHead('How it’s worked out <span class="emo">🧮</span>') +
      '<div class="breakdown">' + rows.map(function(r){ return '<div><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('') +
      '<div class="total"><span>Left for today</span><b>' + money2(Math.max(0, b.left)) + '</b></div></div>' +
      '<p class="hint">Payday is ' + fmtDay(b.payday) + (b.pay ? ' (' + escapeHtml(b.pay.name) + ')' : ' (add your paycheck under Money)') + '. Big bills you set aside for monthly count as their monthly share, never twice.</p>' +
      '<button class="btn-soft btn-wide" data-action="open-balance" style="margin-top:16px">Update my balance</button>');
  }

  /* ---- bills ---- */
  function openBill(id){
    var b = id ? byId(state.bills, id) : null, t = todayStr(), d = parseLocalDate(t).getDate();
    b = b || { name:'', emoji:'🏠', amount:'', freq:'monthly', day:d, day2:15, every:6, anchor:t, setAside:false };
    openSheet(sheetHead((id ? 'Edit bill' : 'New bill') + ' <span class="emo">🧾</span>') + '<form id="bill-form" autocomplete="off">' +
      '<label class="fld"><span class="lbl">What is it?</span><input type="text" id="bill-name" maxlength="40" placeholder="e.g. Phone" value="' + escapeHtml(b.name) + '"></label>' +
      '<div class="fld"><span class="lbl">Pick an emoji</span>' + choiceGrid('bemo', BILL_EMOJI, b.emoji) + '</div>' +
      moneyField('bill-amt', b.amount, 'How much?') +
      '<label class="fld"><span class="lbl">How often?</span><select id="bill-freq">' + Object.keys(FREQ).map(function(k){ return '<option value="' + k + '"' + (k === b.freq ? ' selected' : '') + '>' + FREQ[k] + '</option>'; }).join('') + '</select></label>' +
      '<div class="form-row-2 fld" id="bill-days"><label class="field-col"><span>Day of the month</span><input type="text" inputmode="numeric" id="bill-day" value="' + b.day + '"></label><label class="field-col" id="bill-day2-wrap"><span>Second day</span><input type="text" inputmode="numeric" id="bill-day2" value="' + b.day2 + '"></label></div>' +
      '<label class="fld" id="bill-anchor-wrap"><span class="lbl" id="bill-anchor-lbl">Next one is on</span><input type="date" id="bill-anchor" value="' + b.anchor + '"></label>' +
      '<label class="fld" id="bill-every-wrap"><span class="lbl">How many months apart?</span><select id="bill-every">' + [2,3,4,6,12].map(function(n){ return '<option value="' + n + '"' + (n === b.every ? ' selected' : '') + '>Every ' + n + ' months</option>'; }).join('') + '</select></label>' +
      '<div class="switch-row" id="bill-aside-wrap"><div><span class="lbl">Put a bit aside each month</span><small>Carry it as its monthly share so the big one never wrecks a month</small></div><button type="button" class="switch' + (b.setAside ? ' on' : '') + '" id="bill-aside" data-action="toggle-switch" aria-label="Put a bit aside each month" aria-pressed="' + (b.setAside ? 'true' : 'false') + '"></button></div>' +
      '<p class="hint">Put 31 for a bill on the last day; it follows the month’s length.</p>' +
      '<button type="submit" class="btn-fun btn-wide" style="margin-top:20px">' + (id ? 'Save changes' : 'Add bill 🎯') + '</button>' +
      (id ? '<button type="button" class="danger-link" data-action="del-bill" data-id="' + id + '">Delete this bill</button>' : '') + '</form>', function(){
        var name = val('bill-name'), amt = r2(num(val('bill-amt')));
        if(!name){ shake($('bill-name')); return false; }
        if(amt <= 0){ shake($('bill-amt')); return false; }
        var data = { name:name, emoji: chosen('bemo') || '🧾', amount:amt, freq: val('bill-freq'), day: Math.min(31, Math.max(1, Math.round(num(val('bill-day'))) || 1)), day2: Math.min(31, Math.max(1, Math.round(num(val('bill-day2'))) || 15)), anchor: val('bill-anchor') || todayStr(), every: Math.round(num(val('bill-every'))) || 6, setAside: $('bill-aside').classList.contains('on') };
        if(id){ Object.assign(byId(state.bills, id), data); toast('Bill updated ✏️'); }
        else { data.id = uid(); data.since = todayStr(); state.bills.push(data); toast('Added ' + name + ' 🧾'); }
        state.bills = normalize({ bills: state.bills }).bills;
        save(); closeSheet(); renderCurrent();
      });
    billFormVis();
  }
  function billFormVis(){
    var f = $('bill-freq'); if(!f) return; var v = f.value;
    $('bill-days').style.display = (v === 'monthly' || v === 'twice') ? '' : 'none';
    $('bill-day2-wrap').style.display = v === 'twice' ? '' : 'none';
    $('bill-anchor-wrap').style.display = (v === 'monthly' || v === 'twice') ? 'none' : '';
    $('bill-anchor-lbl').textContent = v === 'once' ? 'When is it due?' : 'Next one is on';
    $('bill-every-wrap').style.display = v === 'months' ? '' : 'none';
    $('bill-aside-wrap').style.display = v === 'months' ? '' : 'none';
  }
  function togglePaid(key, btn){
    var b = budget(), item = dueItems(addDays(b.today, -62), addDays(b.today, 62)).filter(function(x){ return x.key === key; })[0];
    if(!item) return;
    if(state.paid[key]){
      delete state.paid[key];
      if(item.kind === 'debt'){ var d = byId(state.debts, item.ref); if(d){ var pm = d.payments.filter(function(p){ return p.key === key; })[0]; if(pm){ d.balance = r2(d.balance + pm.amount); d.payments = d.payments.filter(function(p){ return p !== pm; }); } } }
      save(); renderCurrent(); return;
    }
    state.paid[key] = nowTs();
    if(btn){ btn.classList.add('on'); sparks(btn); buzz(10); }
    var paidOff = false;
    if(item.kind === 'debt'){ var dd = byId(state.debts, item.ref); if(dd){ var a = Math.min(item.amount, dd.balance); dd.payments.push({ id: uid(), amount: a, date: todayStr(), ts: nowTs(), key: key }); dd.balance = r2(dd.balance - a); paidOff = dd.balance <= 0; } }
    save();
    setTimeout(function(){
      renderCurrent();
      var nb = budget();
      if(paidOff){ var d2 = byId(state.debts, item.ref); goalScreen('🏆', d2.start, d2.name + ' is paid off!', 'That whole debt is gone. Seriously, look at you.'); return; }
      if(!nb.owed.length){ party(110); toast('Every bill before payday is paid 🎉'); }
      else toast(['Paid! One less thing 🙌', 'Boom, done 💥', 'Look at you go 🚀'][Object.keys(state.paid).length % 3], { actionLabel:'Undo', onAction:function(){ togglePaid(key); } });
    }, reduceMotion ? 0 : 450);
  }

  /* ---- paychecks ---- */
  function openPay(id){
    var p = id ? byId(state.pays, id) : null, t = todayStr();
    p = p || { name:'', amount:'', freq:'biweekly', anchor: addDays(t, 7), day:1, day2:15, early:false };
    openSheet(sheetHead((id ? 'Edit paycheck' : 'New paycheck') + ' <span class="emo">💰</span>') + '<form id="pay-form" autocomplete="off">' +
      '<label class="fld"><span class="lbl">Name</span><input type="text" id="pay-name" maxlength="40" placeholder="e.g. Work" value="' + escapeHtml(p.name) + '"></label>' +
      moneyField('pay-amt', p.amount, 'Usually lands as') +
      '<label class="fld"><span class="lbl">How often?</span><select id="pay-freq">' + Object.keys(PAYFREQ).map(function(k){ return '<option value="' + k + '"' + (k === p.freq ? ' selected' : '') + '>' + PAYFREQ[k] + '</option>'; }).join('') + '</select></label>' +
      '<label class="fld" id="pay-anchor-wrap"><span class="lbl">Next payday</span><input type="date" id="pay-anchor" value="' + p.anchor + '"></label>' +
      '<div class="form-row-2 fld" id="pay-days"><label class="field-col"><span>Payday</span><input type="text" inputmode="numeric" id="pay-day" value="' + p.day + '"></label><label class="field-col" id="pay-day2-wrap"><span>Second payday</span><input type="text" inputmode="numeric" id="pay-day2" value="' + p.day2 + '"></label></div>' +
      '<div class="switch-row"><div><span class="lbl">Paid early on weekends</span><small>Payday on a Saturday or Sunday arrives the Friday before</small></div><button type="button" class="switch' + (p.early ? ' on' : '') + '" id="pay-early" data-action="toggle-switch" aria-label="Paid early on weekends" aria-pressed="' + (p.early ? 'true' : 'false') + '"></button></div>' +
      '<button type="submit" class="btn-fun btn-wide" style="margin-top:20px">' + (id ? 'Save changes' : 'Add paycheck 💰') + '</button>' +
      (id ? '<button type="button" class="danger-link" data-action="del-pay" data-id="' + id + '">Delete this paycheck</button>' : '') + '</form>', function(){
        var name = val('pay-name'), amt = r2(num(val('pay-amt')));
        if(!name){ shake($('pay-name')); return false; }
        var data = { name:name, amount:amt, freq: val('pay-freq'), anchor: val('pay-anchor') || todayStr(), day: Math.round(num(val('pay-day'))) || 1, day2: Math.round(num(val('pay-day2'))) || 15, early: $('pay-early').classList.contains('on') };
        if(id) Object.assign(byId(state.pays, id), data); else { data.id = uid(); state.pays.push(data); }
        state.pays = normalize({ pays: state.pays }).pays;
        save(); closeSheet(); renderCurrent(); toast(id ? 'Paycheck updated ✏️' : 'Paycheck added. Countdown is on 💰');
      });
    payFormVis();
  }
  function payFormVis(){
    var f = $('pay-freq'); if(!f) return; var v = f.value, fixed = v === 'monthly' || v === 'twice';
    $('pay-anchor-wrap').style.display = fixed ? 'none' : '';
    $('pay-days').style.display = fixed ? '' : 'none';
    $('pay-day2-wrap').style.display = v === 'twice' ? '' : 'none';
  }

  /* ---- envelopes ---- */
  function openCat(id){
    var c = id ? byId(state.cats, id) : null;
    c = c || { name:'', emoji:'🎁', cap:'', tone:'grape' };
    openSheet(sheetHead((id ? 'Edit envelope' : 'New envelope') + ' <span class="emo">💌</span>') + '<form id="cat-form" autocomplete="off">' +
      '<label class="fld"><span class="lbl">Name</span><input type="text" id="cat-name" maxlength="30" placeholder="e.g. Gifts" value="' + escapeHtml(c.name) + '"></label>' +
      '<div class="fld"><span class="lbl">Pick an emoji</span>' + choiceGrid('cemo', CAT_EMOJI, c.emoji) + '</div>' +
      moneyField('cat-cap', c.cap || '', 'Monthly limit', '<p class="hint">Leave it empty for no limit. Going over just shows a gentle note.</p>') +
      '<button type="submit" class="btn-fun btn-wide" style="margin-top:20px">' + (id ? 'Save changes' : 'Add envelope 💌') + '</button>' +
      (id && state.cats.length > 1 ? '<button type="button" class="danger-link" data-action="del-cat" data-id="' + id + '">Delete this envelope</button>' : '') + '</form>', function(){
        var name = val('cat-name'); if(!name){ shake($('cat-name')); return false; }
        var data = { name:name, emoji: chosen('cemo') || '✨', cap: r2(num(val('cat-cap'))) };
        if(id) Object.assign(byId(state.cats, id), data); else { data.id = uid(); data.tone = TONES[state.cats.length % TONES.length]; state.cats.push(data); }
        save(); closeSheet(); renderCurrent(); toast(id ? 'Envelope updated ✏️' : 'New envelope ready 💌');
      });
  }

  /* ---- debts ---- */
  function openDebt(id){
    var d = id ? byId(state.debts, id) : null;
    d = d || { name:'', emoji:'💳', balance:'', rate:'', min:'', dueDay:'' };
    openSheet(sheetHead((id ? 'Edit debt' : 'New debt') + ' <span class="emo">📉</span>') + '<form id="debt-form" autocomplete="off">' +
      '<label class="fld"><span class="lbl">Name</span><input type="text" id="debt-name" maxlength="40" placeholder="e.g. Visa card" value="' + escapeHtml(d.name) + '"></label>' +
      '<div class="fld"><span class="lbl">Pick an emoji</span>' + choiceGrid('demo', DEBT_EMOJI, d.emoji) + '</div>' +
      moneyField('debt-bal', d.balance, 'What you owe now') +
      '<div class="form-row-2 fld"><label class="field-col"><span>Interest %</span><input type="text" inputmode="decimal" id="debt-rate" value="' + (d.rate === '' ? '' : d.rate) + '" placeholder="0"></label><label class="field-col"><span>Minimum</span><input type="text" inputmode="decimal" id="debt-min" value="' + (d.min === '' ? '' : d.min) + '" placeholder="0"></label></div>' +
      '<label class="fld"><span class="lbl">Minimum due on day</span><input type="text" inputmode="numeric" id="debt-due" value="' + (d.dueDay || '') + '" placeholder="Leave empty to skip"></label>' +
      '<p class="hint">With a due day, the minimum shows with your bills. Tick it there and the balance comes down by itself.</p>' +
      '<button type="submit" class="btn-fun btn-wide" style="margin-top:20px">' + (id ? 'Save changes' : 'Add debt 📉') + '</button>' +
      (id ? '<button type="button" class="danger-link" data-action="del-debt" data-id="' + id + '">Delete this debt</button>' : '') + '</form>', function(){
        var name = val('debt-name'), bal = r2(num(val('debt-bal')));
        if(!name){ shake($('debt-name')); return false; }
        var data = { name:name, emoji: chosen('demo') || '💳', balance: bal, rate: num(val('debt-rate')), min: r2(num(val('debt-min'))), dueDay: Math.min(31, Math.round(num(val('debt-due')))) };
        if(id){ var ex = byId(state.debts, id); data.start = Math.max(ex.start, bal); Object.assign(ex, data); }
        else { data.id = uid(); data.start = bal; data.since = todayStr(); data.payments = []; state.debts.push(data); }
        save(); closeSheet(); renderCurrent(); toast(id ? 'Debt updated ✏️' : 'Added to your debt-free road 🛣️');
      });
  }
  function stepperSheet(title, label, start, presets, onSave){
    openSheet(sheetHead(title) + '<form id="step-form" autocomplete="off"><div class="fld"><span class="lbl">' + label + '</span><div class="stepper">' +
      '<button type="button" class="round-btn" data-action="step" data-v="-5" aria-label="Less">' + icon('remove') + '</button>' +
      '<div class="money-in"><span class="cur">' + escapeHtml(cur()) + '</span><input type="text" inputmode="decimal" id="step-amt" value="' + (start || '') + '" placeholder="0"></div>' +
      '<button type="button" class="round-btn" data-action="step" data-v="5" aria-label="More">' + icon('add') + '</button></div>' +
      '<div class="presets">' + presets.map(function(n){ return '<button type="button" data-action="preset-step" data-v="' + n + '">' + escapeHtml(cur()) + n + '</button>'; }).join('') + '</div></div>' +
      '<button type="submit" class="btn-fun btn-wide" style="margin-top:20px">Save it 🚀</button></form>', function(){
        var a = r2(num(val('step-amt'))); if(a <= 0){ shake($('step-amt')); return false; }
        closeSheet(); onSave(a);
      });
  }
  function payDebt(id){
    var d = byId(state.debts, id); if(!d) return;
    stepperSheet('Pay toward ' + escapeHtml(d.name) + ' <span class="emo">💪</span>', 'How much did you pay?', d.min || '', [25, 50, 100, 200], function(a){
      a = Math.min(a, d.balance); d.payments.push({ id: uid(), amount: a, date: todayStr(), ts: nowTs(), key:'' }); d.balance = r2(d.balance - a); save(); renderCurrent();
      if(d.balance <= 0) goalScreen('🏆', d.start, d.name + ' is paid off!', 'That whole debt is gone. Seriously, look at you.');
      else toast(money0(a) + ' off ' + d.name + '! ' + money0(d.balance) + ' to go 🛣️');
    });
  }

  /* ---- goals ---- */
  function openGoal(id){
    var g = id ? byId(state.goals, id) : null;
    g = g || { name:'', emoji:'🛟', target:'', saved:'' };
    openSheet(sheetHead((id ? 'Edit goal' : 'New goal') + ' <span class="emo">🎯</span>') + '<form id="goal-form" autocomplete="off">' +
      '<label class="fld"><span class="lbl">Saving for</span><input type="text" id="goal-name" maxlength="40" placeholder="e.g. Emergency fund" value="' + escapeHtml(g.name) + '"></label>' +
      '<div class="fld"><span class="lbl">Pick an emoji</span>' + choiceGrid('gemo', GOAL_EMOJI, g.emoji) + '</div>' +
      moneyField('goal-target', g.target, 'Goal amount') + moneyField('goal-saved', g.saved, 'Already saved') +
      '<button type="submit" class="btn-fun btn-wide" style="margin-top:20px">' + (id ? 'Save changes' : 'Add goal 🎯') + '</button>' +
      (id ? '<button type="button" class="danger-link" data-action="del-goal" data-id="' + id + '">Delete this goal</button>' : '') + '</form>', function(){
        var name = val('goal-name'), target = r2(num(val('goal-target')));
        if(!name){ shake($('goal-name')); return false; }
        if(target <= 0){ shake($('goal-target')); return false; }
        var data = { name:name, emoji: chosen('gemo') || '🎯', target: target, saved: r2(num(val('goal-saved'))) };
        if(id) Object.assign(byId(state.goals, id), data); else { data.id = uid(); data.adds = []; state.goals.push(data); }
        save(); closeSheet(); renderCurrent(); toast(id ? 'Goal updated ✏️' : 'New goal! Let’s fill it up 🎯');
      });
  }
  function addToGoal(id){
    var g = byId(state.goals, id); if(!g) return;
    stepperSheet('Add to ' + escapeHtml(g.name) + ' <span class="emo">' + g.emoji + '</span>', 'How much are you putting in?', '', [10, 25, 50, 100], function(a){
      var was = g.saved < g.target; g.saved = r2(g.saved + a); g.adds.push({ amount: a, date: todayStr(), ts: nowTs() }); save(); renderCurrent();
      if(was && g.saved >= g.target) goalScreen(g.emoji, g.target, g.name + ': goal reached!', 'You saved every bit of it. That’s a real win.');
      else toast(money0(a) + ' in! ' + Math.min(100, Math.round(g.saved / g.target * 100)) + '% of the way ' + g.emoji);
    });
  }

  /* ---- wait list (park it before you buy it) ---- */
  function openWait(){
    openSheet(sheetHead('Park it for 48 hours <span class="emo">🅿️</span>') + '<form id="wait-form" autocomplete="off">' +
      '<p class="hint" style="margin-top:0">Want something right now? Park it here. In two days the app asks if you still want it.</p>' +
      '<label class="fld"><span class="lbl">What is it?</span><input type="text" id="wait-name" maxlength="60" placeholder="e.g. Air fryer"></label>' +
      moneyField('wait-price', '', 'Price') +
      '<button type="submit" class="btn-fun btn-wide" style="margin-top:20px">Park it 🅿️</button></form>', function(){
        var name = val('wait-name'); if(!name){ shake($('wait-name')); return false; }
        state.wait.push({ id: uid(), name: name, price: r2(num(val('wait-price'))), addedAt: nowTs(), status:'waiting', decidedAt:0 });
        save(); closeSheet(); renderCurrent(); toast('Parked. Future you will decide 🅿️');
      });
  }
  function waitReady(w){ return nowTs() - w.addedAt >= 48 * 3600e3; }

  /* ============================================================
     RENDERING
     ============================================================ */
  function wavesSvg(){ return '<svg class="waves" viewBox="0 0 400 64" preserveAspectRatio="none" aria-hidden="true"><path d="M0 34 C 70 8, 140 8, 200 30 S 330 58, 400 26 V64 H0Z" fill="rgba(255,255,255,.22)"/><path d="M0 46 C 80 24, 150 30, 210 44 S 340 62, 400 40 V64 H0Z" fill="var(--bg)"/></svg>'; }
  function topLine(emoji, small, title, right){
    return '<header class="top rise" style="--i:0"><div class="hi"><span class="wave emo">' + emoji + '</span><div><span class="date">' + small + '</span><h1>' + title + '</h1></div></div>' + (right || '') + '</header>';
  }
  function bigMoney(n, cls){ var v = Math.round(n); return '<span class="big num' + (cls ? ' ' + cls : '') + '" data-count="' + Math.max(0, v) + '" data-prefix="' + escapeHtml(cur()) + '">' + money0(Math.max(0, v)) + '</span>'; }
  function checkHtml(key, on, label){ return '<button class="bigcheck' + (on ? ' on' : '') + '" data-action="pay-item" data-key="' + escapeHtml(key) + '" aria-label="' + escapeHtml(label) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + icon('check') + '</button>'; }
  function itemRow(x, today){
    var d = daysBetween(today, x.date), cls = d <= 1 ? 'soon' : 'calm';
    var rel = d < 0 ? 'was due' : d === 0 ? 'today' : d === 1 ? 'tomorrow' : 'in ' + d + ' days';
    var what = x.kind === 'lump' ? 'From what you set aside' : x.kind === 'aside' ? 'Set-aside' : x.kind === 'debt' ? 'Minimum' : SHORTFREQ[(byId(state.bills, x.ref) || {}).freq] || 'Bill';
    return '<div class="row' + (x.paid ? ' done' : '') + '"><span class="av emo">' + escapeHtml(x.emoji) + '</span><div class="row-text"><b>' + escapeHtml(x.name) + '</b><span>' + fmtDay(x.date) + ' · ' + escapeHtml(what) + '</span></div>' +
      '<div class="amt-col"><span class="amt num">' + money2(x.amount) + '</span>' + (x.paid || x.kind === 'lump' ? '<small class="rel">' + (x.kind === 'lump' ? 'covered' : 'paid') + '</small>' : '<small class="rel ' + cls + '">' + rel + '</small>') + '</div>' +
      (x.kind === 'lump' ? '' : checkHtml(x.key, x.paid, 'Mark ' + x.name + ' paid')) + '</div>';
  }
  function spendRow(s){
    var c = catOf(s.cat);
    return '<div class="row tapable" data-action="edit-spend" data-id="' + s.id + '"><span class="av emo" style="' + toneBg(c.tone) + '">' + escapeHtml(c.emoji) + '</span><div class="row-text"><b>' + escapeHtml(s.note || c.name) + '</b><span>' + escapeHtml(c.name) + ' · ' + (s.date === todayStr() ? 'today' : fmtDay(s.date)) + '</span></div><span class="amt num">' + money2(s.amount) + '</span></div>';
  }

  function rightNow(b){
    var t = b.today, dis = state.nowDone[t] || [];
    if(ui.away && dis.indexOf('away') < 0) return { emo:'👋', label:'Welcome back!', title:'Quick catch-up: what’s in your account now?', meta:'One number and everything is fresh again. No lecture, promise.', actions:'<button class="btn-fun" data-action="open-balance">Update balance</button><button class="btn-soft" data-action="now-skip" data-k="away">Not now</button>' };
    if(!state.balance.set) return { emo:'🏦', label:'Step 1', title:'Type in what’s in your account', meta:'That’s all it needs to work out today’s number.', actions:'<button class="btn-fun" data-action="open-balance">Add my balance</button>' };
    if(!state.pays.length) return { emo:'💰', label:'Step 2', title:'When do you get paid?', meta:'The countdown to payday makes the daily number work.', actions:'<button class="btn-fun" data-action="add-pay">Add my paycheck</button>' };
    var due = b.owed.filter(function(x){ return daysBetween(t, x.date) <= 1; })[0];
    if(due) return { emo: due.emoji, label: daysBetween(t, due.date) < 0 ? 'Still to pay' : daysBetween(t, due.date) === 0 ? 'Due today' : 'Due tomorrow', title:'Pay ' + due.name + ' · ' + money2(due.amount), meta: fmtDay(due.date), actions:'<button class="btn-fun" data-action="pay-item" data-key="' + escapeHtml(due.key) + '">Done, it’s paid ✓</button>' };
    var ready = state.wait.filter(function(w){ return w.status === 'waiting' && waitReady(w); })[0];
    if(ready) return { emo:'🅿️', label:'Your 48 hours are up', title:'Still want the ' + ready.name + '?', meta: money2(ready.price) + ' · parked ' + Math.floor((nowTs() - ready.addedAt) / 3600e3) + ' hours ago', actions:'<button class="btn-fun" data-action="wait-skip" data-id="' + ready.id + '">Skip it 🎉</button><button class="btn-soft" data-action="wait-buy" data-id="' + ready.id + '">Buy it</button>' };
    if(!state.spends.some(function(s){ return s.date === t; }) && dis.indexOf('log') < 0) return { emo:'📝', label:'One thing right now', title:'Log anything you’ve spent today', meta:'Or type “12 coffee” in the quick box below.', actions:'<button class="btn-fun" data-action="open-add">Log a spend</button><button class="btn-soft" data-action="now-skip" data-k="log">Nothing today</button>' };
    var nxt = b.owed[0];
    return { calm:true, emo:'😎', label:'All caught up', title: nxt ? 'Next up: ' + nxt.name + ' ' + relDay(nxt.date) : 'Nothing due before payday', meta:'Enjoy the breathing room.', actions:'' };
  }

  function renderHome(){
    var b = budget(), h = new Date().getHours(), name = state.profile.name;
    var greet = (h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening') + (name ? ', ' + name : '') + '!';
    var dateStr = new Date().toLocaleDateString(undefined, { weekday:'long', month:'short', day:'numeric' });
    var spentToday = state.spends.filter(function(s){ return s.date === b.today; }).sort(function(a, c){ return c.ts - a.ts; });
    var setup = !state.balance.set || !state.pays.length;
    var short = !setup && b.safe < 0;
    var heroLabel = short ? 'A little tight before payday' : 'Safe to spend today';
    var rn = rightNow(b);
    // run to payday tiles
    var tiles = [], last = Math.min(b.days, 13);
    for(var i = 0; i <= last; i++){
      var d = addDays(b.today, i), isPay = d === b.payday, hasBill = b.owed.some(function(x){ return x.date === d; });
      tiles.push('<div class="day' + (i === 0 ? ' today' : '') + (isPay ? ' pay' : '') + '"><small>' + dayName(d).slice(0, 3) + '</small><b class="num">' + parseLocalDate(d).getDate() + '</b><span class="emo">' + (isPay ? '💰' : hasBill ? '🧾' : '') + '</span></div>');
    }
    var billsLeft = b.owed.length;
    $('view-home').innerHTML =
      topLine('👋', escapeHtml(dateStr), escapeHtml(greet), '<button class="round-btn" data-goto="settings" aria-label="Settings">' + icon('settings') + '</button>') +
      '<section class="hero rise" style="--i:1"><div class="sun"></div><div class="mascot emo">' + (short ? '🫣' : '🐷') + '</div>' +
        '<span class="hero-tag"><span class="emo">' + (short ? '💛' : '💸') + '</span>' + heroLabel + '</span>' +
        '<div class="big-row">' + bigMoney(short ? 0 : b.left) + '<span class="big-unit">' + (setup ? 'until you add your balance 👇' : short ? 'for today' : b.left <= 0 ? 'left today, and that’s okay' : 'left for today') + '</span></div>' +
        '<p class="hero-sub">' + (setup ? 'Two quick steps and this number comes alive.' : short ? money0(-b.safe) + ' short before payday. Let’s look at it together.' : money0(b.safe) + ' safe until payday · about ' + money0(b.perDay) + ' a day') + '</p>' +
        '<div class="hero-actions"><button class="go" data-action="open-how">How is this worked out?</button></div>' + wavesSvg() + '</section>' +
      '<div class="minis rise" style="--i:2">' +
        '<div class="mini"><span class="emo">💰</span><b class="num">' + b.days + (b.days === 1 ? ' day' : ' days') + '</b><small>to payday</small></div>' +
        '<div class="mini"><span class="emo">🧾</span><b class="num">' + billsLeft + '</b><small>' + (billsLeft === 1 ? 'bill' : 'bills') + ' before it</small></div>' +
        '<div class="mini"><span class="emo">🛍️</span><b class="num">' + money0(b.spentToday) + '</b><small>spent today</small></div></div>' +
      '<section class="panel rise" style="--i:3"><div class="now' + (rn.calm ? ' calm' : '') + '"><span class="now-emo emo">' + rn.emo + '</span><div class="now-body"><div class="now-label">' + escapeHtml(rn.label) + '</div><div class="now-title">' + escapeHtml(rn.title) + '</div><div class="now-meta">' + escapeHtml(rn.meta) + '</div>' + (rn.actions ? '<div class="now-actions">' + rn.actions + '</div>' : '') + '</div></div></section>' +
      '<section class="panel rise" style="--i:4"><div class="panel-head"><h2>Quick log <span class="emo">⚡</span></h2></div>' +
        '<form class="quick" id="quick-form" autocomplete="off"><input type="text" id="quick-input" placeholder="12 coffee" maxlength="80" aria-label="Quick log a spend"><button type="submit" class="btn-fun">Log it</button></form>' +
        '<p class="hint">Type an amount and a word. It picks the envelope for you.</p></section>' +
      '<section class="panel rise" style="--i:5"><div class="panel-head"><h2>Run to payday <span class="emo">🏃</span></h2><span class="chip sun num">💰 ' + payShort(b.payday) + '</span></div>' +
        '<div class="dayrow">' + tiles.join('') + '</div>' +
        '<p class="plan-line">' + (short ? 'Bills come first. Try a no-spend day or two 💛' : 'Aim for about <b class="num">' + money0(b.perDay) + '</b> a day and you land on payday with bills paid.') + '</p></section>' +
      '<section class="panel rise" style="--i:6"><div class="panel-head"><h2>Spent today <span class="emo">🛍️</span></h2><button class="link-btn" data-action="open-add">' + icon('add', 16) + 'Add</button></div>' +
        (spentToday.length ? '<div class="rows">' + spentToday.map(spendRow).join('') + '</div><p class="hint">Tap one to fix or delete it.</p>' : '<div class="empty"><span class="emo">🌱</span>Nothing yet today. A no-spend day counts too!</div>') + '</section>';
  }

  function renderBills(){
    var b = budget(), t = b.today, tab = ui.billTab;
    var monthEnd = monthDate(parseLocalDate(t).getFullYear(), parseLocalDate(t).getMonth(), 31), monthStart = t.slice(0, 8) + '01';
    var monthItems = dueItems(monthStart, monthEnd).filter(function(x){ return x.kind !== 'lump'; });
    var monthTotal = sum(monthItems, function(x){ return x.amount; }), monthPaid = sum(monthItems.filter(function(x){ return x.paid; }), function(x){ return x.amount; });
    var body;
    if(tab === 'soon'){
      var list = b.items.filter(function(x){ return !x.paid || x.date >= t; });
      body = '<section class="panel rise" style="--i:4"><div class="panel-head"><h2>Before payday <span class="emo">💰</span></h2><span class="chip num">' + payShort(b.payday) + '</span></div>' +
        (list.length ? '<div class="rows">' + list.map(function(x){ return itemRow(x, t); }).join('') + '</div>' : '<div class="empty"><span class="emo">😎</span>Nothing to pay before payday.</div>') + '</section>';
    } else if(tab === 'month'){
      body = '<section class="panel rise" style="--i:4"><div class="panel-head"><h2>' + parseLocalDate(t).toLocaleDateString(undefined, { month:'long' }) + ' <span class="emo">🗓️</span></h2><span class="chip num">' + money0(monthPaid) + ' paid</span></div>' +
        (monthItems.length ? '<div class="rows">' + dueItems(monthStart, monthEnd).map(function(x){ return itemRow(x, t); }).join('') + '</div>' : '<div class="empty"><span class="emo">🧾</span>No bills this month yet.</div>') + '</section>';
    } else {
      body = '<section class="panel rise" style="--i:4"><div class="panel-head"><h2>All your bills <span class="emo">🧾</span></h2><button class="link-btn" data-action="add-bill">' + icon('add', 16) + 'Add</button></div>' +
        (state.bills.length ? '<div class="rows">' + state.bills.map(function(x){
          var sched = x.freq === 'monthly' ? 'Monthly on the ' + ordinal(x.day) : x.freq === 'twice' ? 'The ' + ordinal(x.day) + ' and ' + ordinal(x.day2) : x.freq === 'months' ? 'Every ' + x.every + ' months' + (x.setAside ? ' · ' + money0(x.amount / x.every) + '/mo set aside' : '') : FREQ[x.freq];
          return '<div class="row tapable" data-action="edit-bill" data-id="' + x.id + '"><span class="av emo">' + escapeHtml(x.emoji) + '</span><div class="row-text"><b>' + escapeHtml(x.name) + '</b><span>' + escapeHtml(sched) + '</span></div><span class="amt num">' + money2(x.amount) + '</span><span class="icon-btn" aria-hidden="true">' + icon('edit') + '</span></div>';
        }).join('') + '</div>' : '<div class="empty"><span class="emo">🧾</span>Add your first bill. Rent, phone, streaming…</div>') +
        '<button class="btn-fun btn-wide" data-action="add-bill" style="margin-top:12px">+ Add a bill</button></section>';
    }
    $('view-bills').innerHTML = topLine('🧾', 'Every must-pay, soonest first', 'Bills') +
      '<section class="hero short rise" style="--i:1"><div class="sun"></div><div class="mascot emo">🧾</div><span class="hero-tag"><span class="emo">⏳</span>Still to go out before payday</span>' +
        '<div class="big-row">' + bigMoney(b.owedTotal, 'mid') + '<span class="big-unit">' + b.owed.length + (b.owed.length === 1 ? ' bill' : ' bills') + '</span></div>' + wavesSvg() + '</section>' +
      '<div class="summary-stats rise" style="--i:2;margin-top:-30px;position:relative;z-index:3"><div><span class="k">This month</span><span class="v num">' + money0(monthTotal) + '</span></div><div><span class="k">Paid so far</span><span class="v num in">' + money0(monthPaid) + '</span></div></div>' +
      '<div class="tabs rise" style="--i:3" role="tablist">' + [['soon','Before payday'],['month','This month'],['all','All bills']].map(function(x){ return '<button data-action="bill-tab" data-v="' + x[0] + '" class="' + (tab === x[0] ? 'on' : '') + '" role="tab" aria-selected="' + (tab === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' + body;
  }
  function payShort(d){ return dayName(d).slice(0, 3) + ' ' + parseLocalDate(d).getDate(); }
  function md(d){ return parseLocalDate(d).toLocaleDateString(undefined, { month:'short', day:'numeric' }); }
  function ordinal(n){ var s = ['th','st','nd','rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

  function renderMoney(){
    var t = todayStr(), tab = ui.moneyTab, ym = t.slice(0, 7);
    var capped = state.cats.filter(function(c){ return c.cap > 0; }), capTotal = sum(capped, function(c){ return c.cap; }), spentMonth = monthSpent(null, ym);
    var head = topLine('💌', 'Envelopes, paychecks and your month', 'Money');
    var tabs = '<div class="tabs rise" style="--i:1" role="tablist">' + [['env','Envelopes'],['pay','Paychecks'],['month','Month']].map(function(x){ return '<button data-action="money-tab" data-v="' + x[0] + '" class="' + (tab === x[0] ? 'on' : '') + '" role="tab" aria-selected="' + (tab === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>';
    var body = '';
    if(tab === 'env'){
      var left = capTotal - sum(capped, function(c){ return Math.min(c.cap, monthSpent(c.id, ym)); });
      body = '<section class="hero short rise" style="--i:2"><div class="sun"></div><div class="mascot emo">💌</div><span class="hero-tag"><span class="emo">🛍️</span>Spent this month</span>' +
          '<div class="big-row">' + bigMoney(spentMonth, 'mid') + '<span class="big-unit">of ' + money0(capTotal) + ' planned</span></div>' + wavesSvg() + '</section>' +
        '<div class="summary-stats rise" style="--i:3;margin-top:-30px;position:relative;z-index:3"><div><span class="k">Left in envelopes</span><span class="v num in">' + money0(Math.max(0, left)) + '</span></div><div><span class="k">Days left in month</span><span class="v num">' + (lastDay(parseLocalDate(t).getFullYear(), parseLocalDate(t).getMonth()) - parseLocalDate(t).getDate() + 1) + '</span></div></div>' +
        '<section class="panel rise" style="--i:4"><div class="panel-head"><h2>Envelopes <span class="emo">✉️</span></h2><button class="link-btn" data-action="add-cat">' + icon('add', 16) + 'New</button></div><div class="tiles">' +
        state.cats.map(function(c){
          var s = monthSpent(c.id, ym), pct = c.cap ? Math.min(100, s / c.cap * 100) : 0, over = c.cap && s > c.cap;
          return '<button class="tile tap' + (over ? ' over' : '') + '" data-action="edit-cat" data-id="' + c.id + '" style="--bgc:var(--t-' + c.tone + '-bg);--fg:var(--t-' + c.tone + ')"><div class="tile-top"><span class="t-emo emo">' + escapeHtml(c.emoji) + '</span><span class="t-name">' + escapeHtml(c.name) + '</span></div>' +
            '<div><span class="t-val num">' + money0(s) + '</span><span class="t-of">' + (c.cap ? (over ? money0(s - c.cap) + ' over, that’s okay' : 'of ' + money0(c.cap)) : 'no limit') + '</span></div>' +
            (c.cap ? '<div class="tbar"><i style="width:' + pct.toFixed(1) + '%"></i></div>' : '') + '</button>';
        }).join('') + '</div><p class="hint" style="margin-top:12px">Tap an envelope to change its limit. Going over is just information, never a telling-off.</p></section>';
    } else if(tab === 'pay'){
      var np = nextPayday(), monthIn = sum(state.incomes.filter(function(x){ return x.date.slice(0, 7) === ym; }), function(x){ return x.amount; });
      var recent = state.incomes.slice().sort(function(a, c){ return c.date < a.date ? -1 : c.date > a.date ? 1 : c.ts - a.ts; }).slice(0, 8);
      body = '<section class="hero short rise" style="--i:2"><div class="sun"></div><div class="mascot emo">💰</div><span class="hero-tag"><span class="emo">⏳</span>' + (np ? 'Next payday · ' + escapeHtml(np.pay.name) : 'No paycheck added yet') + '</span>' +
          '<div class="big-row"><span class="big mid num" data-count="' + (np ? daysBetween(t, np.date) : 0) + '">' + (np ? daysBetween(t, np.date) : 0) + '</span><span class="big-unit">' + (np ? (daysBetween(t, np.date) === 1 ? 'day to go' : 'days to go') : 'days') + '</span></div>' + wavesSvg() + '</section>' +
        '<div class="summary-stats rise" style="--i:3;margin-top:-30px;position:relative;z-index:3"><div><span class="k">Payday</span><span class="v num">' + (np ? fmtDay(np.date) : '—') + '</span></div><div><span class="k">Came in this month</span><span class="v num in">' + money0(monthIn) + '</span></div></div>' +
        '<section class="panel rise" style="--i:4"><div class="panel-head"><h2>Your paychecks <span class="emo">💰</span></h2><button class="link-btn" data-action="add-pay">' + icon('add', 16) + 'Add</button></div>' +
        (state.pays.length ? '<div class="rows">' + state.pays.map(function(p){
          var nd = payDates(p, addDays(t, 1), addDays(t, 70))[0];
          return '<div class="row tapable" data-action="edit-pay" data-id="' + p.id + '"><span class="av emo">💵</span><div class="row-text"><b>' + escapeHtml(p.name) + '</b><span>' + PAYFREQ[p.freq] + (nd ? ' · ' + md(nd) : '') + '</span></div><span class="amt num in">' + money2(p.amount) + '</span></div>';
        }).join('') + '</div>' : '<div class="empty"><span class="emo">💵</span>Add each paycheck with its own schedule. Two jobs? Add both.</div>') + '</section>' +
        '<section class="panel rise" style="--i:5"><div class="panel-head"><h2>Money in <span class="emo">🎉</span></h2><button class="link-btn" data-action="add-income">' + icon('add', 16) + 'Log</button></div>' +
        (recent.length ? '<div class="rows">' + recent.map(function(x){ return '<div class="row tapable" data-action="edit-spend" data-id="' + x.id + '"><span class="av emo" style="' + toneBg('sun') + '">💰</span><div class="row-text"><b>' + escapeHtml(x.note) + '</b><span>' + fmtDay(x.date) + '</span></div><span class="amt num in">+' + money2(x.amount) + '</span></div>'; }).join('') + '</div>' : '<div class="empty"><span class="emo">🪙</span>Paychecks, refunds, gifts, side money. Log it here.</div>') + '</section>';
    } else {
      var ymSel = ui.calMonth, y = +ymSel.slice(0, 4), m = +ymSel.slice(5, 7) - 1, first = new Date(y, m, 1), nd2 = lastDay(y, m);
      var from = ymSel + '-01', to = ymSel + '-' + pad(nd2), items = dueItems(from, to), paysIn = [];
      state.pays.forEach(function(p){ payDates(p, from, to).forEach(function(d){ paysIn.push({ d:d, p:p }); }); });
      var lead = (first.getDay() + 6) % 7, cells = [];
      ['M','T','W','T','F','S','S'].forEach(function(d){ cells.push('<span class="dow">' + d + '</span>'); });
      for(var i = 0; i < lead; i++) cells.push('<button class="other" tabindex="-1" aria-hidden="true"></button>');
      for(var dd = 1; dd <= nd2; dd++){
        var ds = ymSel + '-' + pad(dd), dots = '';
        if(items.some(function(x){ return x.date === ds && x.kind !== 'aside'; })) dots += '<i class="d-bill"></i>';
        if(paysIn.some(function(x){ return x.d === ds; })) dots += '<i class="d-pay"></i>';
        if(state.spends.some(function(x){ return x.date === ds; })) dots += '<i class="d-spend"></i>';
        cells.push('<button data-action="cal-day" data-v="' + ds + '" class="' + (ds === t ? 'today ' : '') + (ds === ui.calSel ? 'sel' : '') + '" aria-label="' + fmtDay(ds) + '"><span class="num">' + dd + '</span><span class="dots">' + dots + '</span></button>');
      }
      var inM = sum(state.incomes.filter(function(x){ return x.date.slice(0, 7) === ymSel; }), function(x){ return x.amount; });
      var outM = monthSpent(null, ymSel) + sum(items.filter(function(x){ return x.paid && x.kind !== 'lump'; }), function(x){ return x.amount; });
      var sel = ui.calSel, selRows = [];
      paysIn.filter(function(x){ return x.d === sel; }).forEach(function(x){ selRows.push('<div class="row"><span class="av emo" style="' + toneBg('sun') + '">💰</span><div class="row-text"><b>' + escapeHtml(x.p.name) + '</b><span>Payday</span></div><span class="amt num in">+' + money2(x.p.amount) + '</span></div>'); });
      items.filter(function(x){ return x.date === sel; }).forEach(function(x){ selRows.push(itemRow(x, t)); });
      state.spends.filter(function(x){ return x.date === sel; }).forEach(function(x){ selRows.push(spendRow(x)); });
      body = '<div class="summary-stats cols-4 rise" style="--i:2"><div><span class="k">Came in</span><span class="v num in">' + money0(inM) + '</span></div><div><span class="k">Went out</span><span class="v num out">' + money0(outM) + '</span></div><div><span class="k">You kept</span><span class="v num">' + money0(inM - outM) + '</span></div><div><span class="k">Spends</span><span class="v num">' + state.spends.filter(function(x){ return x.date.slice(0, 7) === ymSel; }).length + '</span></div></div>' +
        '<section class="panel cal-panel rise" style="--i:3"><div class="cal-head"><button class="round-btn" data-action="cal-prev" aria-label="Previous month">' + icon('chevron_left') + '</button><h2>' + first.toLocaleDateString(undefined, { month:'long', year:'numeric' }) + '</h2><button class="round-btn" data-action="cal-next" aria-label="Next month">' + icon('chevron_right') + '</button></div>' +
        '<div class="cal">' + cells.join('') + '</div><div class="legend"><span><i class="d-bill"></i>Bill</span><span><i class="d-pay"></i>Payday</span><span><i class="d-spend"></i>Spending</span></div></section>' +
        '<section class="panel rise" style="--i:4"><div class="panel-head"><h2>' + fmtDay(sel) + '</h2></div>' + (selRows.length ? '<div class="rows">' + selRows.join('') + '</div>' : '<div class="empty"><span class="emo">🌤️</span>A quiet day. Nothing here.</div>') + '</section>';
    }
    $('view-money').innerHTML = head + tabs + body;
  }

  function renderGoals(){
    var tab = ui.goalTab, body = '';
    var tabs = '<div class="tabs rise" style="--i:1" role="tablist">' + [['debt','Debt'],['save','Savings'],['wait','Wait list']].map(function(x){ return '<button data-action="goal-tab" data-v="' + x[0] + '" class="' + (tab === x[0] ? 'on' : '') + '" role="tab" aria-selected="' + (tab === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>';
    if(tab === 'debt'){
      var list = debtsOrdered(), owe = sum(state.debts, function(d){ return d.balance; }), start = sum(state.debts, function(d){ return d.start; }), paid = start - owe;
      var active = list.filter(function(d){ return d.balance > 0; });
      body = '<section class="hero short rise" style="--i:2"><div class="sun"></div><div class="mascot emo">🛣️</div><span class="hero-tag"><span class="emo">📉</span>Road to debt-free</span>' +
          '<div class="big-row">' + bigMoney(owe, 'mid') + '<span class="big-unit">to go</span></div>' + wavesSvg() + '</section>' +
        '<div class="summary-stats rise" style="--i:3;margin-top:-30px;position:relative;z-index:3"><div><span class="k">Paid off so far</span><span class="v num in">' + money0(paid) + '</span></div><div><span class="k">Debts cleared</span><span class="v num">' + (list.length - active.length) + ' of ' + list.length + '</span></div></div>' +
        (list.length ? '<section class="panel rise" style="--i:4"><div class="panel-head"><h2>Your road <span class="emo">🏁</span></h2><span class="chip num">' + (start ? Math.round(paid / start * 100) : 0) + '%</span></div><div class="road" id="road">' +
          '<svg viewBox="0 0 320 176" aria-hidden="true"><defs><linearGradient id="rg" x1="0" x2="1"><stop offset="0" stop-color="#43DCC7"/><stop offset=".6" stop-color="#17B4A6"/><stop offset="1" stop-color="#12879A"/></linearGradient></defs><path id="rp" class="base" d="M 28 36 H 252 A 52 52 0 0 1 252 140 H 40"/><path id="rprog" class="prog" d="M 28 36 H 252 A 52 52 0 0 1 252 140 H 40"/><path class="dash" d="M 28 36 H 252 A 52 52 0 0 1 252 140 H 40"/></svg></div>' +
          '<p class="road-note">' + (active.length ? 'Next stop: ' + escapeHtml(active[0].name) + ' ' + escapeHtml(active[0].emoji) : 'Debt-free! Every stop is checked 🏆') + '</p></section>' : '') +
        '<section class="panel rise" style="--i:5"><div class="panel-head"><h2>Payoff order</h2></div><div class="seg' + (state.debtOrder === 'avalanche' ? ' right' : '') + '"><span class="knob"></span><button data-action="debt-order" data-v="snowball" class="' + (state.debtOrder === 'snowball' ? 'on' : '') + '">⛄ Smallest first</button><button data-action="debt-order" data-v="avalanche" class="' + (state.debtOrder === 'avalanche' ? 'on' : '') + '">🏔️ Highest rate</button></div>' +
          '<p class="hint">' + (state.debtOrder === 'snowball' ? 'Quick wins first. Great for motivation.' : 'Saves the most on interest over time.') + '</p></section>' +
        '<div class="card-list rise" style="--i:6">' + (list.length ? list.map(function(d, i){
          var pct = d.start ? Math.min(100, (d.start - d.balance) / d.start * 100) : 0, hist = d.payments.slice().sort(function(a, c){ return c.ts - a.ts; }).slice(0, 4);
          return '<div class="dcard"><div class="dcard-top"><span class="order-badge num">' + (d.balance <= 0 ? '✓' : (active.indexOf(d) + 1)) + '</span><span class="av emo">' + escapeHtml(d.emoji) + '</span><div class="row-text"><b>' + escapeHtml(d.name) + '</b><span>' + (d.rate ? d.rate + '% APR' : '0% interest') + (d.min ? ' · ' + money0(d.min) + '/mo' : '') + (d.dueDay ? ' · ' + ordinal(d.dueDay) : '') + '</span></div><span class="amt num">' + money0(d.balance) + '</span></div>' +
            '<div class="bar"><i style="width:' + pct.toFixed(1) + '%"></i></div>' +
            '<div class="dcard-foot"><span class="meta num">' + Math.round(pct) + '% paid off · started at ' + money0(d.start) + '</span><span style="display:flex;gap:8px"><button class="btn-soft" data-action="edit-debt" data-id="' + d.id + '">Edit</button>' + (d.balance > 0 ? '<button class="btn-fun" data-action="pay-debt" data-id="' + d.id + '">Pay</button>' : '') + '</span></div>' +
            (hist.length ? '<div class="hist">' + hist.map(function(p){ return '<div><span>' + fmtDay(p.date) + (p.key ? ' · minimum' : '') + '</span><b class="num">−' + money2(p.amount) + '</b></div>'; }).join('') + '</div>' : '') + '</div>';
        }).join('') : '<div class="panel"><div class="empty"><span class="emo">🛣️</span>Add a card, loan or payment plan to build your road.</div></div>') +
        '<button class="btn-fun btn-wide" data-action="add-debt">+ Add a debt</button></div>';
    } else if(tab === 'save'){
      var tot = sum(state.goals, function(g){ return Math.min(g.saved, g.target); }), tgt = sum(state.goals, function(g){ return g.target; });
      body = '<section class="hero short rise" style="--i:2"><div class="sun"></div><div class="mascot emo">🎯</div><span class="hero-tag"><span class="emo">🐷</span>Saved toward your goals</span>' +
          '<div class="big-row">' + bigMoney(sum(state.goals, function(g){ return g.saved; }), 'mid') + '<span class="big-unit">of ' + money0(tgt) + '</span></div>' + wavesSvg() + '</section>' +
        '<div class="summary-stats rise" style="--i:3;margin-top:-30px;position:relative;z-index:3"><div><span class="k">Goals</span><span class="v num">' + state.goals.length + '</span></div><div><span class="k">Overall</span><span class="v num in">' + (tgt ? Math.round(tot / tgt * 100) : 0) + '%</span></div></div>' +
        '<div class="card-list rise" style="--i:4">' + (state.goals.length ? state.goals.map(function(g, i){
          var pct = Math.min(100, g.saved / g.target * 100), done = g.saved >= g.target, tn = TONES[(i + 1) % TONES.length];
          return '<div class="dcard"><div class="dcard-top"><span class="av emo" style="' + toneBg(tn) + '">' + escapeHtml(g.emoji) + '</span><div class="row-text"><b>' + escapeHtml(g.name) + '</b><span>' + (done ? 'Goal reached! 🎉' : money0(g.target - g.saved) + ' to go') + '</span></div><span class="amt num">' + money0(g.saved) + '</span></div>' +
            '<div class="bar"><i style="width:' + pct.toFixed(1) + '%"></i></div>' +
            '<div class="dcard-foot"><span class="meta num">' + Math.round(pct) + '% of ' + money0(g.target) + '</span><span style="display:flex;gap:8px"><button class="btn-soft" data-action="edit-goal" data-id="' + g.id + '">Edit</button><button class="btn-fun" data-action="add-goal-money" data-id="' + g.id + '">+ Add</button></span></div></div>';
        }).join('') : '<div class="panel"><div class="empty"><span class="emo">🎯</span>What are you saving for? A trip, a cushion, new glasses…</div></div>') +
        '<button class="btn-fun btn-wide" data-action="add-goal">+ Add a goal</button></div>';
    } else {
      var waiting = state.wait.filter(function(w){ return w.status === 'waiting'; }), skipped = state.wait.filter(function(w){ return w.status === 'skipped'; }), savedSkip = sum(skipped, function(w){ return w.price; });
      body = '<section class="hero short rise" style="--i:2"><div class="sun"></div><div class="mascot emo">🅿️</div><span class="hero-tag"><span class="emo">🎉</span>Saved by skipping</span>' +
          '<div class="big-row">' + bigMoney(savedSkip, 'mid') + '<span class="big-unit">' + skipped.length + ' skipped</span></div>' + wavesSvg() + '</section>' +
        '<div class="summary-stats rise" style="--i:3;margin-top:-30px;position:relative;z-index:3"><div><span class="k">Parked now</span><span class="v num">' + waiting.length + '</span></div><div><span class="k">Ready to decide</span><span class="v num">' + waiting.filter(waitReady).length + '</span></div></div>' +
        '<div class="card-list rise" style="--i:4">' + (waiting.length ? waiting.map(function(w){
          var hrs = (nowTs() - w.addedAt) / 3600e3, ready = hrs >= 48;
          return '<div class="dcard"><div class="dcard-top"><span class="av emo" style="' + toneBg(ready ? 'sun' : 'grape') + '">' + (ready ? '⏰' : '⏳') + '</span><div class="row-text"><b>' + escapeHtml(w.name) + '</b><span>' + (ready ? 'Ready. Still want it?' : 'Decide in ' + Math.ceil(48 - hrs) + ' hours') + '</span></div><span class="amt num">' + money2(w.price) + '</span></div>' +
            '<div class="bar"><i style="width:' + Math.min(100, hrs / 48 * 100).toFixed(1) + '%"></i></div>' +
            '<div class="wait-actions"><button class="btn-fun" data-action="wait-skip" data-id="' + w.id + '">Skip it 🎉</button><button class="btn-soft" data-action="wait-buy" data-id="' + w.id + '">Buy it</button></div></div>';
        }).join('') : '<div class="panel"><div class="empty"><span class="emo">🅿️</span>Nothing parked. Next time something calls your name, park it here first.</div></div>') +
        '<button class="btn-fun btn-wide" data-action="add-wait">+ Park something</button>' +
        (skipped.length ? '<section class="panel" style="margin:0"><div class="panel-head"><h2>Skipped <span class="emo">🏅</span></h2></div><div class="rows">' + skipped.slice().reverse().map(function(w){ return '<div class="row"><span class="av emo" style="' + toneBg('lime') + '">🏅</span><div class="row-text"><b>' + escapeHtml(w.name) + '</b><span>Kept in your pocket</span></div><span class="amt num in">' + money2(w.price) + '</span></div>'; }).join('') + '</div></section>' : '') + '</div>';
    }
    $('view-goals').innerHTML = topLine('🏆', 'Debt, savings and the wait list', 'Goals') + tabs + body;
    if(tab === 'debt') drawRoad();
  }
  // Journey path: one stop per debt in payoff order, trophy at the end.
  function drawRoad(){
    var road = $('road'), rp = $('rp'); if(!road || !rp) return;
    var list = debtsOrdered(), stops = list.length + 1, L = rp.getTotalLength(), firstOpen = -1;
    list.forEach(function(d, i){ if(firstOpen < 0 && d.balance > 0) firstOpen = i; });
    var doneCount = firstOpen < 0 ? list.length : firstOpen;
    for(var k = 0; k < stops; k++){
      var pt = rp.getPointAtLength(k / (stops - 1) * L), n = document.createElement('div'), d = list[k];
      n.className = 'node' + (k === stops - 1 ? ' last' : '') + (k < doneCount || (k === stops - 1 && firstOpen < 0) ? ' done' : '') + (k === firstOpen ? ' cur' : '');
      n.style.left = (pt.x / 320 * 100) + '%'; n.style.top = (pt.y / 176 * 100) + '%';
      n.innerHTML = '<span class="emo">' + (k === stops - 1 ? '🏆' : (k < doneCount ? '✅' : escapeHtml(d.emoji))) + '</span>';
      road.appendChild(n);
    }
    var start = sum(state.debts, function(x){ return x.start; }), owe = sum(state.debts, function(x){ return x.balance; });
    var frac = start ? (start - owe) / start : 0;
    var p = $('rprog'); p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
    var target = L - frac * L;
    if(reduceMotion || $('view-goals').classList.contains('settled')) p.style.strokeDashoffset = target;
    else requestAnimationFrame(function(){ requestAnimationFrame(function(){ p.style.strokeDashoffset = target; }); });
  }

  function renderSettings(){
    $('set-name').value = state.profile.name;
    $('set-currency').value = state.profile.currency;
    if(!$('set-currency').value) $('set-currency').value = '$';
    applyTheme(false);
  }

  var RENDER = { home:renderHome, bills:renderBills, money:renderMoney, goals:renderGoals, settings:renderSettings };
  var settleTimer = null;
  function renderCurrent(){
    RENDER[currentView]();
    var v = $('view-' + currentView);
    hydrateIcons(v);
    if(!v.classList.contains('settled')) countUp(v);
  }

  /* ============================================================
     NAVIGATION
     ============================================================ */
  function buildNav(){
    $('nav-list').innerHTML = NAV.map(function(n){ return '<li><button class="nav-btn" data-view="' + n.view + '">' + icon(n.icon) + escapeHtml(n.label) + '</button></li>'; }).join('');
    var tabs = NAV.filter(function(n){ return !n.sideOnly; });
    function tabBtn(n){ return '<button class="tab" data-view="' + n.view + '">' + icon(n.icon) + '<span>' + escapeHtml(n.label) + '</span></button>'; }
    $('bottom-nav').innerHTML = tabBtn(tabs[0]) + tabBtn(tabs[1]) + '<button class="add" data-action="open-add" aria-label="Log a spend">' + icon('add') + '</button>' + tabBtn(tabs[2]) + tabBtn(tabs[3]);
  }
  function switchView(name, keepScroll){
    if(!RENDER[name]) name = 'home';
    currentView = name;
    Object.keys(RENDER).forEach(function(v){ var el = $('view-' + v); el.classList.toggle('active', v === name); el.classList.remove('settled'); });
    document.querySelectorAll('.nav-btn, .bottom-nav .tab').forEach(function(b){ b.classList.toggle('active', b.dataset.view === name); });
    renderCurrent();
    clearTimeout(settleTimer);
    settleTimer = setTimeout(function(){ var v = $('view-' + currentView); if(v) v.classList.add('settled'); }, 1100);
    if(!keepScroll) window.scrollTo({ top: 0 });
  }
  function rerenderTab(){ renderCurrent(); }

  /* ============================================================
     DATA: export / import / clear / sample
     ============================================================ */
  function exportData(){
    var blob = new Blob([JSON.stringify(state, null, 2)], { type:'application/json' });
    download(blob, BACKUP_PREFIX + '-backup-' + todayStr() + '.json'); toast('Backup downloaded 💾');
  }
  function exportCsv(){
    var rows = [['Date','Type','Envelope','Note','Amount']];
    state.spends.forEach(function(s){ rows.push([s.date, 'Spend', catOf(s.cat).name, s.note, (-s.amount).toFixed(2)]); });
    state.incomes.forEach(function(s){ rows.push([s.date, 'Money in', '', s.note, s.amount.toFixed(2)]); });
    rows = [rows[0]].concat(rows.slice(1).sort(function(a, b){ return a[0] < b[0] ? -1 : 1; }));
    var csv = rows.map(function(r){ return r.map(function(c){ c = String(c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n');
    download(new Blob([csv], { type:'text/csv' }), BACKUP_PREFIX + '-spending-' + todayStr() + '.csv'); toast('Spreadsheet downloaded 📊');
  }
  function download(blob, name){
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
  }
  function importData(file){
    var reader = new FileReader();
    reader.onload = function(e){
      try{
        var parsed = JSON.parse(e.target.result);
        if(!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.bills) || !Array.isArray(parsed.spends)) throw new Error('bad');
        state = normalize(parsed); save(); switchView('home');
        toast('Backup restored ✨');
      }catch(err){ toast("That file doesn't look like a backup from this planner."); }
    };
    reader.readAsText(file);
  }
  function clearAll(){
    openModal({
      title:'Clear all data?',
      message:"This removes everything from this browser. It can't be undone, so export a backup first if you might want it back.",
      confirmLabel:'Clear everything', danger:true, requireText:'DELETE',
      onConfirm:function(){ state = defaultState(); save(); switchView('home'); toast('All cleared. A fresh start 🌱'); }
    });
  }
  // A real person's fortnight: dated around today so screenshots always look current.
  function applySampleData(){
    var t = todayStr(), td = parseLocalDate(t), D = function(n){ return addDays(t, n); }, dom = function(n){ return parseLocalDate(D(n)).getDate(); };
    var at = function(ds, h, m){ var x = parseLocalDate(ds); x.setHours(h, m || 0, 0, 0); return x.getTime(); };
    var balTs = at(t, 7, 30);
    var spends = [
      [-9, 'groceries', 'Weekly shop', 86.40, 18], [-9, 'coffee', 'Oat latte', 4.75, 8], [-8, 'gas', 'Fill up', 48.20, 17], [-8, 'eating', 'Tacos with Maya', 18.50, 19],
      [-7, 'pets', 'Dog food', 32.99, 12], [-6, 'coffee', 'Iced coffee', 5.25, 9], [-6, 'fun', 'Movie night', 14.00, 20], [-5, 'home', 'Laundry pods', 11.97, 15],
      [-4, 'groceries', 'Top-up shop', 27.35, 18], [-4, 'eating', 'Pizza Friday', 24.00, 19], [-3, 'coffee', 'Coffee + muffin', 7.10, 8], [-2, 'gas', 'Gas', 41.60, 8],
      [-2, 'fun', 'Thrift store find', 12.00, 14], [-1, 'eating', 'Work lunch', 12.40, 12], [-1, 'groceries', 'Fruit & milk', 9.80, 18],
      [0, 'coffee', 'Oat latte', 4.75, 8], [0, 'groceries', 'Lunch stuff', 23.40, 12]
    ].map(function(s){ var ds = D(s[0]); return { amount:s[3], cat:s[1], note:s[2], date:ds, ts: s[0] === 0 ? Math.max(balTs + 60e3, Math.min(at(ds, s[4], 10), Date.now() - 60e3)) : at(ds, s[4], 10) }; });
    var bills = [
      { id:'b-rent', name:'Rent', emoji:'🏠', amount:950, freq:'monthly', day:1, since: D(-70) },
      { id:'b-phone', name:'Phone', emoji:'📱', amount:45, freq:'monthly', day: dom(1), since: D(-70) },
      { id:'b-stream', name:'Streaming', emoji:'📺', amount:15.99, freq:'monthly', day: dom(3), since: D(-70) },
      { id:'b-power', name:'Electric', emoji:'⚡', amount:88, freq:'monthly', day: dom(9), since: D(-70) },
      { id:'b-net', name:'Internet', emoji:'🌐', amount:60, freq:'monthly', day: dom(-2), since: D(-70) },
      { id:'b-gym', name:'Gym', emoji:'🏋️', amount:29, freq:'biweekly', anchor: D(12), since: D(-70) },
      { id:'b-car', name:'Car insurance', emoji:'🛡️', amount:372, freq:'months', every:6, anchor: (function(){ var a = parseLocalDate(D(4)); a.setMonth(a.getMonth() + 2); return formatDateLocal(a); })(), setAside:true, since: D(-70) }
    ];
    var debts = [
      { id:'d-plan', name:'Laptop plan', emoji:'💻', start:480, balance:0, rate:0, min:40, dueDay:0, since:D(-200), payments:[{ amount:40, date:D(-20), ts:at(D(-20), 9) }] },
      { id:'d-visa', name:'Visa card', emoji:'💳', start:2600, balance:1840, rate:22.9, min:55, dueDay: dom(4), since:D(-70), payments:[{ amount:150, date:D(-12), ts:at(D(-12), 9) }, { amount:55, date:D(-26), ts:at(D(-26), 9), key:'' }] },
      { id:'d-car', name:'Car loan', emoji:'🚗', start:6000, balance:3420, rate:6.5, min:210, dueDay: dom(10), since:D(-70), payments:[{ amount:210, date:D(-20), ts:at(D(-20), 9) }] },
      { id:'d-dent', name:'Dentist plan', emoji:'🏥', start:900, balance:360, rate:0, min:60, dueDay:0, since:D(-70), payments:[{ amount:60, date:D(-15), ts:at(D(-15), 9) }] }
    ];
    var raw = {
      profile: { name:'Sam', currency:'$' },
      balance: { amount:512.40, ts: balTs, set:true },
      bills: bills,
      pays: [ { id:'p-work', name:'Work paycheck', amount:1420, freq:'biweekly', anchor: D(5), early:true }, { id:'p-etsy', name:'Etsy shop', amount:160, freq:'monthly', day: dom(18) } ],
      spends: spends,
      incomes: [ { amount:1420, note:'Work paycheck', date:D(-9), ts:at(D(-9), 6) }, { amount:32, note:'Refund for headphones', date:D(-3), ts:at(D(-3), 11) } ],
      debts: debts, debtOrder:'snowball',
      goals: [ { name:'Emergency fund', emoji:'🛟', target:1000, saved:640 }, { name:'Beach trip', emoji:'🏖️', target:900, saved:310 }, { name:'New glasses', emoji:'👓', target:200, saved:120 } ],
      wait: [ { name:'Air fryer', price:89, addedAt: Date.now() - 52 * 3600e3, status:'waiting' }, { name:'Concert tickets', price:140, addedAt: Date.now() - 10 * 3600e3, status:'waiting' }, { name:'Gaming headset', price:119, addedAt: Date.now() - 12 * 864e5, status:'skipped', decidedAt: Date.now() - 10 * 864e5 }, { name:'Throw blanket', price:67, addedAt: Date.now() - 6 * 864e5, status:'skipped', decidedAt: Date.now() - 4 * 864e5 } ],
      lastOpen: t
    };
    state = normalize(raw);
    // Everything that came due before today was paid on its day (before this morning's balance).
    dueItems(D(-70), D(-1)).forEach(function(x){ if(x.kind !== 'lump') state.paid[x.key] = at(x.date, 9); });
  }
  function loadSample(){
    openModal({
      title:'Load sample data?', message:'This replaces what’s here with example numbers so you can see how everything fits together.',
      confirmLabel:'Load samples',
      onConfirm:function(){ applySampleData(); save(); switchView('home'); toast('Sample data loaded ✨'); }
    });
  }

  /* ============================================================
     EVENTS
     ============================================================ */
  function init(){
    buildNav();
    hydrateIcons();
    applyTheme(false);
    // "While you were away": a week or more since the last open
    var t = todayStr();
    if(state.lastOpen && daysBetween(state.lastOpen, t) >= 7 && !isEmpty()) ui.away = true;
    state.lastOpen = t;
    Object.keys(state.nowDone).forEach(function(k){ if(k < addDays(t, -7)) delete state.nowDone[k]; });
    save();

    document.addEventListener('click', function(e){
      var nav = e.target.closest('.nav-btn, .bottom-nav .tab');
      if(nav){ switchView(nav.dataset.view); return; }
      var th = e.target.closest('[data-theme-set]');
      if(th){ setTheme(th.dataset.themeSet); return; }
      var go = e.target.closest('[data-goto]');
      if(go){ switchView(go.dataset.goto); return; }
      var ch = e.target.closest('.choice');
      if(ch){ ch.parentElement.querySelectorAll('.choice').forEach(function(x){ x.classList.remove('on'); }); ch.classList.add('on'); buzz(6); return; }

      var b = e.target.closest('[data-action]'); if(!b) return;
      var a = b.dataset.action, id = b.dataset.id;
      switch(a){
        case 'open-add': openAdd(); break;
        case 'add-income': openAdd(null, 'in'); break;
        case 'edit-spend': openAdd(id); break;
        case 'close-sheet': closeSheet(); break;
        case 'kind-pick':
          var isIn = b.dataset.v === 'in'; $('add-kind').value = isIn ? 'in' : 'out';
          $('kind-seg').classList.toggle('right', isIn);
          $('kind-seg').querySelectorAll('button').forEach(function(x){ x.classList.toggle('on', x === b); });
          $('cat-fld').style.display = isIn ? 'none' : '';
          $('add-note').placeholder = isIn ? 'e.g. Paycheck' : 'e.g. Lunch with Maya'; buzz(6); break;
        case 'preset': $('add-amt').value = b.dataset.v; buzz(6); break;
        case 'preset-step': $('step-amt').value = b.dataset.v; buzz(6); break;
        case 'step': $('step-amt').value = Math.max(0, r2(num($('step-amt').value) + num(b.dataset.v))); buzz(6); break;
        case 'toggle-switch': b.classList.toggle('on'); b.setAttribute('aria-pressed', b.classList.contains('on') ? 'true' : 'false'); buzz(6); break;
        case 'del-spend': case 'del-income':
          var listName = a === 'del-spend' ? 'spends' : 'incomes', idx = -1;
          state[listName].forEach(function(x, i){ if(x.id === id) idx = i; }); if(idx < 0) return;
          var removed = state[listName].splice(idx, 1)[0]; save(); closeSheet(); renderCurrent();
          toast('Deleted.', { actionLabel:'Undo', onAction:function(){ state[listName].splice(idx, 0, removed); save(); renderCurrent(); } }); break;
        case 'open-balance': openBalance(); break;
        case 'open-how': openHow(); break;
        case 'now-skip': var k = b.dataset.k; state.nowDone[todayStr()] = (state.nowDone[todayStr()] || []).concat([k]); if(k === 'away') ui.away = false; save(); renderCurrent(); if(k === 'log') toast('A no-spend day. Love that 🌱'); break;
        case 'pay-item': togglePaid(b.dataset.key, b.classList.contains('bigcheck') ? b : null); break;
        case 'bill-tab': ui.billTab = b.dataset.v; rerenderTab(); break;
        case 'money-tab': ui.moneyTab = b.dataset.v; rerenderTab(); break;
        case 'goal-tab': ui.goalTab = b.dataset.v; rerenderTab(); break;
        case 'add-bill': openBill(); break;
        case 'edit-bill': openBill(id); break;
        case 'del-bill':
          var bi = -1; state.bills.forEach(function(x, i){ if(x.id === id) bi = i; }); if(bi < 0) return;
          var rb = state.bills.splice(bi, 1)[0]; save(); closeSheet(); renderCurrent();
          toast('Bill deleted.', { actionLabel:'Undo', onAction:function(){ state.bills.splice(bi, 0, rb); save(); renderCurrent(); } }); break;
        case 'add-pay': openPay(); break;
        case 'edit-pay': openPay(id); break;
        case 'del-pay':
          var pi = -1; state.pays.forEach(function(x, i){ if(x.id === id) pi = i; }); if(pi < 0) return;
          var rp = state.pays.splice(pi, 1)[0]; save(); closeSheet(); renderCurrent();
          toast('Paycheck deleted.', { actionLabel:'Undo', onAction:function(){ state.pays.splice(pi, 0, rp); save(); renderCurrent(); } }); break;
        case 'add-cat': openCat(); break;
        case 'edit-cat': openCat(id); break;
        case 'del-cat':
          var ci = -1; state.cats.forEach(function(x, i){ if(x.id === id) ci = i; }); if(ci < 0 || state.cats.length < 2) return;
          var rc = state.cats.splice(ci, 1)[0]; save(); closeSheet(); renderCurrent();
          toast('Envelope deleted. Its spends move to “' + catOf(rc.id).name + '”.', { actionLabel:'Undo', onAction:function(){ state.cats.splice(ci, 0, rc); save(); renderCurrent(); } }); break;
        case 'cal-prev': case 'cal-next':
          var y = +ui.calMonth.slice(0, 4), m = +ui.calMonth.slice(5, 7) - 1 + (a === 'cal-next' ? 1 : -1), nd = new Date(y, m, 1);
          ui.calMonth = nd.getFullYear() + '-' + pad(nd.getMonth() + 1); ui.calSel = ui.calMonth === todayStr().slice(0, 7) ? todayStr() : ui.calMonth + '-01'; rerenderTab(); break;
        case 'cal-day': ui.calSel = b.dataset.v; rerenderTab(); break;
        case 'debt-order': state.debtOrder = b.dataset.v; save(); rerenderTab(); break;
        case 'add-debt': openDebt(); break;
        case 'edit-debt': openDebt(id); break;
        case 'pay-debt': payDebt(id); break;
        case 'del-debt':
          var di = -1; state.debts.forEach(function(x, i){ if(x.id === id) di = i; }); if(di < 0) return;
          var rd = state.debts.splice(di, 1)[0]; save(); closeSheet(); renderCurrent();
          toast('Debt deleted.', { actionLabel:'Undo', onAction:function(){ state.debts.splice(di, 0, rd); save(); renderCurrent(); } }); break;
        case 'add-goal': openGoal(); break;
        case 'edit-goal': openGoal(id); break;
        case 'add-goal-money': addToGoal(id); break;
        case 'del-goal':
          var gi = -1; state.goals.forEach(function(x, i){ if(x.id === id) gi = i; }); if(gi < 0) return;
          var rg = state.goals.splice(gi, 1)[0]; save(); closeSheet(); renderCurrent();
          toast('Goal deleted.', { actionLabel:'Undo', onAction:function(){ state.goals.splice(gi, 0, rg); save(); renderCurrent(); } }); break;
        case 'add-wait': openWait(); break;
        case 'wait-skip': case 'wait-buy':
          var w = byId(state.wait, id); if(!w) return;
          w.status = a === 'wait-skip' ? 'skipped' : 'bought'; w.decidedAt = nowTs(); save();
          if(a === 'wait-skip'){ motionBurst(b); party(70); renderCurrent(); toast('Skipped! ' + money2(w.price) + ' stays with you 🎉', { actionLabel:'Undo', onAction:function(){ w.status = 'waiting'; save(); renderCurrent(); } }); }
          else { renderCurrent(); toast('Enjoy it! You waited, that counts 💛'); openAdd(); setTimeout(function(){ if($('add-amt')){ $('add-amt').value = w.price; $('add-note').value = w.name; } }, 0); }
          break;
      }
    });
    document.addEventListener('change', function(e){
      if(e.target.id === 'bill-freq') billFormVis();
      if(e.target.id === 'pay-freq') payFormVis();
    });
    document.addEventListener('submit', function(e){
      var f = e.target;
      if(f.id === 'quick-form'){ e.preventDefault(); var qi = $('quick-input'); if(!quickLog(qi.value)) shake(qi); return; }
      if(f.id === 'profile-form'){ e.preventDefault(); state.profile.name = val('set-name'); state.profile.currency = $('set-currency').value || '$'; save(); toast('Saved 🙂'); return; }
      if(f.closest('#sheet-body')){ e.preventDefault(); if(sheetSubmit) sheetSubmit(); }
    });
    $('sheet-overlay').addEventListener('click', function(e){ if(e.target.id === 'sheet-overlay') closeSheet(); });

    $('load-sample-btn').addEventListener('click', loadSample);
    $('export-btn').addEventListener('click', exportData);
    $('csv-btn').addEventListener('click', exportCsv);
    $('import-btn').addEventListener('click', function(){ $('import-file').click(); });
    $('import-file').addEventListener('change', function(e){ var f = e.target.files && e.target.files[0]; if(f) importData(f); e.target.value = ''; });
    $('clear-btn').addEventListener('click', clearAll);

    $('modal-confirm').addEventListener('click', function(){ var h = modalHandler; closeModal(); if(h) h(); });
    $('modal-cancel').addEventListener('click', closeModal);
    $('modal-overlay').addEventListener('click', function(e){ if(e.target.id === 'modal-overlay') closeModal(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape'){ closeModal(); closeSheet(); } });
    // Come back to the tab after midnight: refresh the day's numbers
    document.addEventListener('visibilitychange', function(){ if(!document.hidden && currentView !== 'settings') renderCurrent(); });

    // Screenshot / demo hook: "?view=bills&sample=1" opens a view pre-filled with sample data (only when empty).
    var params = new URLSearchParams(window.location.search);
    if(params.get('sample') === '1' && isEmpty()){ applySampleData(); save(); }
    if(params.get('tab')){ var tb = params.get('tab'); if(['soon','month','all'].indexOf(tb) >= 0) ui.billTab = tb; if(['env','pay','month'].indexOf(tb) >= 0) ui.moneyTab = tb; if(['debt','save','wait'].indexOf(tb) >= 0) ui.goalTab = tb; }
    switchView(RENDER[params.get('view')] ? params.get('view') : 'home');
  }

  document.addEventListener('DOMContentLoaded', init);
