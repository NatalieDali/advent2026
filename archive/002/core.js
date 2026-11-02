/* Pure rules shared by the interface and regression checks. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AdventCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function blank() { return {version: 2, viewed: [], solved: [], hints: {}, answers: {}, finalSolved: false, sampleSolved: false, preferences: {snow: true, motion: true}}; }
  function isoDay(now, zone) {
    const p = new Intl.DateTimeFormat('en-GB', {timeZone: zone, year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
    const get = type => p.find(x => x.type === type).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function dateFor(config, day) { const d=new Date(config.startDate+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+day-1);return d.toISOString().slice(0,10); }
  function available(config, day, now = new Date(), preview = null) {
    if (!Number.isInteger(day) || day < 1 || day > 24) return false;
    if (preview?.enabled) return day <= preview.day;
    const date=isoDay(now,config.timeZone);
    return date>=dateFor(config,day) && date<=config.endDate;
  }
  function hintAvailable(config, task, index, now, preview) { return index>=0 && index<2 && available(config,task.day+index,now,preview); }
  function normalize(raw) { return String(raw).trim().toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' '); }
  function checkAnswer(spec, raw) {
    if (!spec || !String(raw).trim()) return false;
    if (spec.type === 'set') {
      const str=String(raw).trim();
      if (!/^\d+(?:[\s,;]+\d+)*$/.test(str)) return false;
      const n=str.split(/[\s,;]+/).map(Number);
      return n.every(Number.isSafeInteger) && new Set(n).size===n.length && JSON.stringify(n.sort((a,b)=>a-b))===JSON.stringify([...spec.value].sort((a,b)=>a-b));
    }
    if (spec.type === 'number') { const s=String(raw).trim().replace(',','.');return /^[+-]?\d+(?:\.\d+)?$/.test(s) && Number(s)===spec.value; }
    if (spec.type === 'text') return (spec.accepted || [spec.value]).some(s => normalize(s)===normalize(raw));
    return false;
  }
  function validate(input, config) {
    if(!input || input.version!==2) throw Error('Unsupported save version');
    const nums=(a,max)=>Array.isArray(a) && a.length<=max && a.every(n=>Number.isInteger(n)&&n>=1&&n<=24);
    if(!nums(input.viewed,24)||!nums(input.solved,10))throw Error('Invalid day list');
    const s=blank();s.viewed=[...new Set(input.viewed)];
    s.solved=[...new Set(input.solved)].filter(n=>config.tasks.some(t=>t.day===n&&t.status==='ready'&&t.key&&t.answer));
    for(const task of config.tasks){
      const h=input.hints?.[task.day];if(Array.isArray(h)&&h.length<=2&&h.every(x=>x===0||x===1))s.hints[task.day]=[...new Set(h)];
      const a=input.answers?.[task.day];if(typeof a==='string'&&a.length<=200)s.answers[task.day]=a;
    }
    s.finalSolved=Boolean(input.finalSolved && config.final.answer && s.solved.length>=8);
    s.sampleSolved=input.sampleSolved===true;
    for(const p of ['snow','motion'])if(typeof input.preferences?.[p]==='boolean')s.preferences[p]=input.preferences[p];
    return s;
  }
  function keys(config,state){return config.tasks.filter(t=>state.solved.includes(t.day)&&t.key);}
  function effects(config,state){return new Set(keys(config,state).map(t=>t.effect));}
  function solve(config,state,day,raw,now=new Date()) {
    const task=config.tasks.find(t=>t.day===day);
    // A date, a hint, preview controls or a draft must never issue a real key.
    if(!task || task.status!=='ready' || !task.key || !available(config,day,now) || !checkAnswer(task.answer,raw))return false;
    if(!state.solved.includes(day))state.solved.push(day);
    return true;
  }
  return {blank,isoDay,dateFor,available,hintAvailable,checkAnswer,validate,keys,effects,solve};
});
