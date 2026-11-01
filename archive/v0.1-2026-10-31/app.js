(() => {
  'use strict';
  const C = window.ADVENT;
  const KEY = 'lichtenbourg-advent-v1';
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const blank = () => ({version: 1, demo: C.defaultDemo, viewed: [], solved: [], hints: {}, answers: {}, explanations: []});
  function validate(x) {
    if (!x || x.version !== 1 || typeof x.demo !== 'boolean') throw Error('Неверный формат файла прогресса.');
    const days = v => Array.isArray(v) && v.length <= 24 && v.every(n => Number.isInteger(n) && n >= 1 && n <= 24);
    if (!days(x.viewed) || !days(x.solved) || !days(x.explanations || [])) throw Error('Неверные данные дней.');
    const s = blank(); s.demo = x.demo; s.viewed = [...new Set(x.viewed)];
    s.solved = [...new Set(x.solved)].filter(n => C.days[n-1].ready && C.days[n-1].type === 'task');
    s.explanations = [...new Set(x.explanations || [])];
    for (let n = 1; n <= 24; n++) {
      const h = x.hints?.[n]; if (Number.isInteger(h) && h >= 0 && h <= (C.days[n-1].hints?.length || 0)) s.hints[n] = h;
      if (typeof x.answers?.[n] === 'string' && x.answers[n].length <= 100) s.answers[n] = x.answers[n];
    }
    return s;
  }
  let state = blank(), storageError = false;
  try { const raw = localStorage.getItem(KEY); if (raw) state = validate(JSON.parse(raw)); } catch { storageError = true; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { storageError = true; toast('Браузер не сохраняет прогресс. Скачайте его копию в настройках.'); } }
  let toastTimer;
  function toast(message) { $('#toast').textContent = message; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 5500); }
  function today() { return new Intl.DateTimeFormat('en-CA', {timeZone: C.timeZone, year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
  const dayDate = n => { const date = new Date(C.startDate + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + n - 1); return date.toISOString().slice(0,10); };
  function available(n) { const now = today(); return state.demo || (now >= dayDate(n) && now <= C.endDate); }
  const typeName = type => ({task:'Математическое дело',story:'Письмо из города',final:'Финальное дело'}[type]);
  const typeIcon = type => ({task:'✧',story:'✉',final:'✦'}[type]);
  function clues() { return state.solved.filter(n => C.days[n-1].clue).map(n => ({...C.days[n-1].clue, day: n})); }
  function frame() {
    $('#clue-count').textContent = clues().length;
    $('#mode-banner').innerHTML = state.demo ? '<span class="status-dot"></span> Демонстрационный режим · все дни открыты <button id="banner-settings">Изменить</button>' : `<span class="status-dot"></span> Календарный режим · с 1 декабря 2026 · ${esc(C.timeZone)} <button id="banner-settings">Изменить</button>`;
    $('#banner-settings').onclick = openSettings;
    document.querySelectorAll('[data-nav]').forEach(a => { const on = a.dataset.nav === (location.hash.startsWith('#day/') ? 'calendar' : (location.hash.slice(1) || 'calendar')); a.classList.toggle('active', on); if (on) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  }
  function calendar() {
    const next = C.days.findIndex((d,i) => d.ready && available(i+1) && !state.solved.includes(i+1) && (d.type === 'task' || !state.viewed.includes(i+1)));
    return `<section class="hero"><div class="hero-copy"><div class="eyebrow">МАТЕМАТИЧЕСКИЙ АДВЕНТ · 10–13 ЛЕТ</div><h1>Тайна пропавшей<br><em>полуночи</em></h1><p>В городе, где каждый час хранит свою историю,<br class="desktop"> однажды исчезла целая минута.<br class="desktop"> Помогите вернуть её до Рождества.</p><a class="button" href="#day/${next < 0 ? 1 : next+1}">${state.viewed.length ? 'Продолжить расследование' : 'Начать расследование'} <span>↗</span></a><div class="hero-caption">24 дня · 10 математических дел · 1 большая тайна</div></div><img class="city" src="assets/city.svg" alt="Заснеженные крыши Лихтенбурга, часовая башня и тёплый свет рождественских окон"></section>
    <section class="calendar-section" aria-labelledby="calendar-title"><div class="section-heading"><div><div class="eyebrow">ДЕКАБРЬ В ЛИХТЕНБУРГЕ</div><h2 id="calendar-title">Каждое окошко — новая история</h2></div><div class="progress-label"><strong>${state.solved.length} / 10</strong><span>дел раскрыто</span><div class="progress-track"><i style="width:${state.solved.length*10}%"></i></div></div></div>
    <div class="legend"><span><i class="legend-dot"></i> Доступно</span><span><i class="legend-dot viewed"></i> Просмотрено</span><span><i class="legend-dot solved"></i> Дело раскрыто</span><span>✧ Дело &nbsp; ✉ Письмо &nbsp; ✦ Финал</span></div>
    <div class="calendar-grid">${C.days.map((d,i) => {const n=i+1, open=available(n), solved=state.solved.includes(n), viewed=state.viewed.includes(n); return `<a href="#day/${n}" class="day-card ${!open?'locked':''} ${viewed?'visited':''} ${solved?'solved':''} ${d.type==='final'?'final-card':''}" aria-label="${n} декабря. ${esc(d.title)}. ${!open?'Закрыто':solved?'Дело раскрыто':viewed?'Просмотрено':'Доступно'}${!d.ready?'. Заготовка':''}"><div class="day-card-top"><span>${String(n).padStart(2,'0')}</span><span class="day-symbol" aria-hidden="true">${!open?'⌑':solved?'✓':typeIcon(d.type)}</span></div><span class="day-title">${esc(d.title)}</span><span class="day-meta">${!open ? `Откроется ${n} декабря` : !d.ready ? 'В подготовке' : solved ? 'Улика в архиве' : typeName(d.type)}</span></a>`; }).join('')}</div>
    <aside class="note-bar"><span class="note-star">✧</span><p><strong>Исследуйте в своём ритме.</strong> Новые дни открываются по датам, даже если прежнее дело ещё не раскрыто. К любой загадке можно вернуться.</p></aside></section>`;
  }
  function day(n) {
    const d = C.days[n-1];
    const head = `<div class="day-heading"><a class="back-link" href="#calendar">← К календарю</a><span>${String(n).padStart(2,'0')} ДЕКАБРЯ · ${typeName(d.type).toUpperCase()}</span></div>`;
    if (!available(n)) return `<section class="reading-wrap">${head}<article class="paper locked-paper"><div class="eyebrow">ПИСЬМО ЕЩЁ В ПУТИ</div><h1>${esc(d.title)}</h1><p>${today() > C.endDate ? 'Календарный период этого адвента завершён.' : `Это окошко откроется ${n} декабря 2026 года по времени ${esc(C.timeZone)}.`}</p><p>Для просмотра прототипа включите демонстрационный режим в настройках.</p><button class="button" id="unlock-demo">Настройки</button></article></section>`;
    if (!state.viewed.includes(n)) {state.viewed.push(n);save();}
    let body;
    if (!d.ready) body = `<div class="eyebrow">РЕДАКТОРСКАЯ ЗАГОТОВКА</div><h1>${esc(d.title)}</h1><p>Это место для ${d.type==='final'?'финальной разгадки':d.type==='task'?'математического дела':'сюжетного письма'}. Содержание ещё готовится.</p><p>Название — рабочее. Здесь пока нет задания, проверки ответа или новой улики. Проверить полный путь расследования можно в первом дне.</p><a class="button" href="#day/1">В мастерскую часовщика ↗</a>${d.type==='final'?'<div class="setting-note">Финал объединит результаты предыдущих дел. Его механику и цифровой подарок разработаем после утверждения задач.</div>':''}`;
    else if (d.type === 'story') body = `<div class="eyebrow">${esc(d.place)}</div><h1>${esc(d.title)}</h1><div class="letter">${d.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}<span class="signature">Эмма Вальд<br><small>Хранитель городского архива</small></span></div><aside class="setting-note">${esc(d.note)}</aside><a class="button secondary" href="#day/1">Вернуться к первому делу</a>`;
    else {
      const solved = state.solved.includes(n), h = state.hints[n] || 0;
      body = `<div class="eyebrow">${esc(d.place)} · ДЕЛО № ${String(C.taskDays.indexOf(n)+1).padStart(2,'0')}</div><h1>${esc(d.title)}</h1><p class="story-intro">${esc(d.intro)}</p><div class="task-divider"><span>МАТЕМАТИЧЕСКОЕ ДЕЛО</span></div><h2>${esc(d.taskTitle)}</h2><p>${esc(d.question)}</p>
      <div class="window-study" aria-label="Схема девяти окон"><div class="window-roof">МАСТЕРСКАЯ ЧАСОВЩИКА</div><div class="window-grid">${Array.from({length:9},(_,i)=>`<div class="window ${solved&&d.answer.includes(i+1)?'lit':''}"><i></i><span>${i+1}</span></div>`).join('')}</div><span class="diagram-caption">${solved?'Световой знак восстановлен':'Все окна в начале тёмные'}</span></div>
      ${solved ? `<div class="success-panel" role="status"><div class="eyebrow">ДЕЛО РАСКРЫТО</div><h3>В городе стало немного светлее.</h3><p>Правильный ответ: ${d.answer.join(', ')}. В архив добавлена новая улика.</p><a href="#archive" class="button">Открыть архив улик ↗</a></div>` : `<form id="answer-form"><label for="answer">${esc(d.inputLabel)}</label><p class="field-help" id="answer-help">Введите все номера через запятую или пробел. Порядок не важен.</p><div class="answer-row"><input id="answer" name="answer" type="text" inputmode="numeric" autocomplete="off" maxlength="100" placeholder="${esc(d.placeholder)}" value="${esc(state.answers[n] || '')}" aria-describedby="answer-help answer-feedback" required><button class="button" type="submit">Проверить →</button></div><p id="answer-feedback" role="status"></p></form>`}
      <div class="hint-area"><h3>Если нужна зацепка</h3><p>Можно взять подсказку и продолжить думать. Это часть расследования.</p><div id="hints">${d.hints.slice(0,h).map((hint,i)=>`<div class="hint"><strong>Подсказка ${i+1}</strong><p>${esc(hint)}</p></div>`).join('')}</div>${h<d.hints.length?`<button class="button secondary" id="hint-next">${h?'Следующая подсказка':'Первая подсказка'} <span>${h+1} / ${d.hints.length}</span></button>`:''}</div>
      <details id="explanation" ${solved?'open':''}><summary>Разобрать математическую идею</summary><p>${esc(d.explanation)}</p>${!solved?'<p class="field-help">Разбор можно читать без решения. Чтобы получить улику, вернитесь к полю ответа и восстановите световой знак.</p>':''}</details>${solved?`<aside class="clue-inline"><span>✧</span><div><strong>${esc(d.clue.title)}</strong><p>${esc(d.clue.text)}</p></div></aside>`:''}`;
    }
    return `<section class="reading-wrap">${head}<article class="paper">${body}</article><nav class="day-pagination" aria-label="Переход между днями">${n>1?`<a href="#day/${n-1}">← День ${n-1}</a>`:'<span></span>'}${n<24?`<a href="#day/${n+1}">День ${n+1} →</a>`:'<a href="#archive">Архив улик →</a>'}</nav></section>`;
  }
  function archive() {
    const list=clues();
    return `<section class="archive-wrap"><div class="eyebrow">ЛИЧНОЕ ДОСЬЕ ИССЛЕДОВАТЕЛЯ</div><h1>Архив улик</h1><p class="lead">Маленькие открытия складываются в большую историю.</p><div class="archive-stats"><span><strong>${list.length}</strong> ${list.length===1?'улика собрана':list.length>=2&&list.length<=4?'улики собраны':'улик собрано'}</span><span><strong>${state.viewed.length}</strong> / 24 дней просмотрено</span></div>${list.length?`<div class="clue-grid">${list.map(c=>`<article class="clue-card"><div class="eyebrow">ВЕЩЕСТВЕННОЕ ДОКАЗАТЕЛЬСТВО</div><span class="clue-mark">✧</span><h2>${esc(c.title)}</h2><p>${esc(c.text)}</p><small>${esc(c.source)}</small><a href="#day/${c.day}">Перечитать дело →</a></article>`).join('')}</div>`:`<div class="empty-archive"><img src="assets/seal.svg" alt="" width="64" height="64"><h2>Первое открытие ещё впереди</h2><p>Раскройте дело в мастерской часовщика — и здесь появится первая улика.</p><a class="button" href="#day/1">Открыть первое дело ↗</a></div>`}<h2 class="documents-title">Открытые документы</h2><div class="document-list">${state.viewed.filter(n=>C.days[n-1].ready).map(n=>`<a href="#day/${n}"><span>${typeIcon(C.days[n-1].type)} &nbsp; ${esc(C.days[n-1].title)}</span><small>День ${n} →</small></a>`).join('') || '<p>Здесь будут письма и материалы просмотренных дней.</p>'}</div></section>`;
  }
  function about() {
    return `<section class="reading-wrap"><article class="paper"><div class="eyebrow">ПРИГЛАШЕНИЕ В ЛИХТЕНБУРГ</div><h1>У каждого открытия<br>есть своя история.</h1><p class="lead">Математический адвент для любопытных исследователей 10–13 лет.</p><p>В старинном европейском городе заснеженные переулки ведут к архивам, часовой башне и рождественской площади. Здесь случилось невозможное: пропала полночь. Чтобы разобраться, понадобятся наблюдательность, логика и математика.</p><h2>Как проходить адвент</h2><ol class="howto"><li>Открывайте календарные окошки. Впереди 24 дня, десять основных дел и отдельный финал.</li><li>Решайте в своём ритме. Между делами — короткие письма, а к любой задаче можно вернуться.</li><li>Пользуйтесь подсказками и читайте объяснения. Преподаватель для проверки не нужен.</li><li>Собирайте улики в архиве. В полной версии они помогут раскрыть общую тайну.</li></ol><h2>Что есть в этой версии</h2><p>Работают календарь, одно демонстрационное дело, письмо второго дня, проверка ответа, три подсказки, объяснение, архив, сохранение и перенос прогресса. Дни 3–24 пока содержат редакторские заготовки. Демонстрационная задача не утверждена для финального продукта.</p><h2>Сохранение и даты</h2><p>Регистрация не нужна. Прогресс остаётся в этом браузере и может исчезнуть при очистке его данных. В настройках можно скачать и загрузить копию. В календарном режиме дни открываются с 1 декабря 2026 года по времени Берлина; доступ сохраняется до 31 января 2027 года включительно. Демонстрационный режим открывает все дни сразу.</p><a class="button" href="#calendar">К календарю ↗</a></article></section>`;
  }
  function parseAnswer(raw) {
    const value=raw.trim();
    if (!/^\d+(?:[\s,;]+\d+)*$/.test(value)) return null;
    const nums=value.split(/[\s,;]+/).map(Number);
    return nums.every(n=>Number.isSafeInteger(n)&&n>=1&&n<=9)&&new Set(nums).size===nums.length?nums.sort((a,b)=>a-b):null;
  }
  function bindDay(n) {
    const d=C.days[n-1];
    if ($('#unlock-demo')) $('#unlock-demo').onclick=openSettings;
    if ($('#answer')) $('#answer').addEventListener('input',e=>{state.answers[n]=e.target.value;save();});
    if ($('#answer-form')) $('#answer-form').onsubmit=e=>{
      e.preventDefault(); const parsed=parseAnswer($('#answer').value); const feedback=$('#answer-feedback');
      if (!parsed) { feedback.textContent='Введите разные номера от 1 до 9 через запятую или пробел.'; $('#answer').setAttribute('aria-invalid','true'); return; }
      if (JSON.stringify(parsed)===JSON.stringify([...d.answer].sort((a,b)=>a-b))) {state.solved.push(n);state.solved=[...new Set(state.solved)];save();render(false);$('.success-panel').scrollIntoView({block:'center',behavior:'smooth'});toast('Световой знак восстановлен. Новая улика в архиве.');}
      else {feedback.textContent='Пока знак не совпал. Проверьте, сколько раз переключится каждое выбранное окно. Можно взять подсказку.';$('#answer').setAttribute('aria-invalid','true');}
    };
    if ($('#hint-next')) $('#hint-next').onclick=()=>{state.hints[n]=(state.hints[n]||0)+1;save();render(false);const button=$('#hint-next');(button||$('#explanation summary')).focus();};
    if ($('#explanation')) $('#explanation').addEventListener('toggle',e=>{if(e.target.open&&!state.explanations.includes(n)){state.explanations.push(n);save();}});
  }
  function render(scroll=true) {
    const hash=location.hash || '#calendar', match=hash.match(/^#day\/(\d+)$/), n=match?Number(match[1]):null;
    let html;
    if(n>=1&&n<=24) html=day(n);
    else if(hash==='#archive') html=archive();
    else if(hash==='#about') html=about();
    else if(hash==='#calendar'||hash==='#') html=calendar();
    else html='<section class="reading-wrap"><article class="paper"><h1>Этой улицы нет на карте</h1><p>Вернитесь к календарю и выберите один из 24 дней.</p><a href="#calendar" class="button">К календарю</a></article></section>';
    $('#main').innerHTML=html; frame(); if(n>=1&&n<=24)bindDay(n);
    document.title=(n>=1&&n<=24?C.days[n-1].title:hash==='#archive'?'Архив улик':C.title)+' · Математический адвент';
    if(scroll){window.scrollTo(0,0);$('#main').focus({preventScroll:true});}
  }
  function openSettings(){ $('#demo-toggle').checked=state.demo;$('#settings').showModal(); }
  $('.skip').onclick=e=>{e.preventDefault();$('#main').focus();$('#main').scrollIntoView();};
  $('#settings-open').onclick=openSettings;
  $('#settings-close').onclick=()=>$('#settings').close();
  $('#demo-toggle').onchange=e=>{state.demo=e.target.checked;save();render(false);};
  function download(name,text,type) {const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('#export-progress').onclick=()=>{download('lichtenbourg-progress.json',JSON.stringify(state,null,2),'application/json');toast('Копия прогресса подготовлена.');};
  $('#import-progress').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>50000)throw Error('Файл слишком большой.');const restored=validate(JSON.parse(await f.text()));state=restored;save();render(false);toast('Прогресс загружен.');}catch{toast('Не удалось прочитать файл. Выберите сохранённый JSON-файл прогресса этого адвента.');}finally{e.target.value='';}};
  $('#reset-progress').onclick=()=>{$('#reset-confirm').hidden=false;$('#reset-yes').focus();};
  $('#reset-no').onclick=()=>{$('#reset-confirm').hidden=true;};
  $('#reset-yes').onclick=()=>{const demo=state.demo;state=blank();state.demo=demo;save();$('#reset-confirm').hidden=true;$('#settings').close();location.hash='#calendar';render();toast('Можно начать новое расследование.');};
  window.addEventListener('hashchange',()=>render());
  window.addEventListener('focus',()=>{if(!$('#settings').open)render(false);});
  setInterval(()=>{if(!state.demo&&!$('#settings').open&&document.activeElement?.tagName!=='INPUT')render(false);},60000);
  render(false);if(storageError)toast('Сохранение недоступно или повреждено. Используйте копию прогресса в настройках.');
})();
