const data = window.TRAINING_DATA;
const raceDate = new Date('2027-02-14T07:00:00-03:00');
const today = new Date();
const weekSelect = document.getElementById('weekSelect');
const stateKey = 'tri_penha_app_v2';
let state = JSON.parse(localStorage.getItem(stateKey) || '{}');
if(!state.done) state.done = {};
if(!state.control) state.control = {};
if(!state.gymDone) state.gymDone = {};

function save(){ localStorage.setItem(stateKey, JSON.stringify(state)); }
function fmtDate(s){ const d = new Date(s+'T12:00:00'); return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}); }
function currentWeekIndex(){
  let idx = 0;
  data.plano25.forEach((w,i)=>{ if(new Date(w['Início']+'T00:00:00') <= today) idx = i; });
  return Math.min(idx, data.plano25.length-1);
}
let selectedWeek = currentWeekIndex();

function initHeader(){
  const w = data.plano25[selectedWeek];
  document.getElementById('phaseBadge').textContent = w['Etapa'];
  document.getElementById('weekTitle').textContent = `Semana ${w['Sem']} • ${fmtDate(w['Início'])}`;
  document.getElementById('weekSubtitle').textContent = w['Observações'] || 'Plano semanal';
  const days = Math.max(0, Math.ceil((raceDate - today)/(1000*60*60*24)));
  document.getElementById('daysToRace').textContent = days;
}
function taskDay(w, index, title='', weekdayIndex=0){
  const text = String(title || '').toLowerCase();
  const local = String(w['Local preferencial'] || '').toLowerCase();
  const weekdayDays = ['Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira'];

  if(/prova|race/.test(text)) return 'Domingo';
  if(/speed|bike|bicicleta|ciclismo/.test(text)) return 'Sábado';
  if(/brick|transição|transicao/.test(text)) return 'Domingo';
  if(/natação praia|natacao praia|praia penha/.test(text) && /penha|navegantes/.test(local)) return 'Sexta-feira';

  return weekdayDays[weekdayIndex] || `Treino ${index+1}`;
}
function weekTasks(w){
  let weekdayIndex = 0;
  return [1,2,3,4,5]
    .map((n,idx)=>{
      const title = w[`Treino ${n}`];
      if(!title) return null;
      const day = taskDay(w, idx, title, weekdayIndex);
      if(!/Sábado|Domingo/.test(day)) weekdayIndex += 1;
      return {id:`w${w['Sem']}-t${idx+1}`, day, title};
    })
    .filter(Boolean);
}
function renderChecklist(){
  const w = data.plano25[selectedWeek];
  const box = document.getElementById('checklist'); box.innerHTML='';
  weekTasks(w).forEach(task=>{
    const div=document.createElement('label'); div.className='check-item'+(state.done[task.id]?' done':'');
    div.innerHTML = `<input type="checkbox" ${state.done[task.id]?'checked':''}/><div><div class="task-day">${task.day}</div><div class="task-title">${task.title}</div><div class="task-meta">${w['Local preferencial']} • ${w['Etapa']}</div></div>`;
    div.querySelector('input').addEventListener('change', e=>{state.done[task.id]=e.target.checked; save(); renderChecklist(); renderDashboard();});
    box.appendChild(div);
  });
  document.getElementById('mRun').textContent=(w['Run min']||0)+' min';
  document.getElementById('mBike').textContent=(w['Bike min']||0)+' min';
  document.getElementById('mSwim').textContent=(w['Swim min']||0)+' min';
  document.getElementById('mStrength').textContent=(w['Força min']||0)+' min';
}
function initWeekSelect(){
  weekSelect.innerHTML='';
  data.plano25.forEach((w,i)=>{ const opt=document.createElement('option'); opt.value=i; opt.textContent=`Semana ${w['Sem']} - ${fmtDate(w['Início'])} - ${w['Etapa']}`; weekSelect.appendChild(opt); });
  weekSelect.value=selectedWeek;
  weekSelect.addEventListener('change',e=>{selectedWeek=Number(e.target.value); renderAll();});
  document.getElementById('localFilter').addEventListener('change', renderTimeline);
}
function renderWeekDetail(){
  const w=data.plano25[selectedWeek];
  const el=document.getElementById('weekDetail');
  el.innerHTML=`<h2>Semana ${w['Sem']} — ${w['Etapa']}</h2><p class="muted">Início ${fmtDate(w['Início'])} • ${w['Local preferencial']}</p><div class="training-list">${weekTasks(w).map(t=>`<div class="training"><span class="task-day">${t.day}</span><br>${t.title}</div>`).join('')}</div><div class="pill-row"><span class="pill">Corrida ${w['Run min']||0} min</span><span class="pill">Bike ${w['Bike min']||0} min</span><span class="pill">Natação ${w['Swim min']||0} min</span><span class="pill">Força ${w['Força min']||0} min</span><span class="pill">Total ${w['Total min']||0} min</span></div><p style="margin-top:12px">${w['Observações']||''}</p>`;
}
function renderTimeline(){
  const filter=document.getElementById('localFilter').value;
  const el=document.getElementById('allWeeks'); el.innerHTML='';
  data.plano25.forEach((w,i)=>{
    if(filter==='Blumenau' && !String(w['Local preferencial']).includes('Blumenau')) return;
    if(filter==='Penha' && !String(w['Local preferencial']).match(/Penha|Navegantes/)) return;
    const card=document.createElement('div'); card.className='week-card';
    card.innerHTML=`<h3>Semana ${w['Sem']} • ${w['Etapa']}</h3><div class="week-meta">${fmtDate(w['Início'])} • ${w['Local preferencial']} • ${w['Total min']||0} min</div><div>${weekTasks(w).map(t=>`${t.day}: ${t.title}`).join(' • ')}</div>`;
    card.addEventListener('click',()=>{selectedWeek=i; weekSelect.value=i; renderAll(); window.scrollTo({top:0,behavior:'smooth'});});
    el.appendChild(card);
  });
}
function renderGymChecklist(rows){
  return rows.map((r,idx)=>{
    const key = `gym-${idx}-${r['Exercício'] || 'exercicio'}`;
    const checked = state.gymDone[key] ? 'checked' : '';
    const doneClass = state.gymDone[key] ? ' done' : '';
    return `<label class="check-item gym-check${doneClass}"><input type="checkbox" data-gym-key="${encodeURIComponent(key)}" ${checked}/><div><div class="task-title">${r['Exercício']||''}</div><div class="task-meta">${r['Treino']||''} • ${r['Séries x reps']||''}</div><div><span class="muted">Intensidade:</span> ${r['Intensidade']||'-'}</div><div><span class="muted">Ponto técnico:</span> ${r['Ponto técnico']||'-'}</div><div><span class="muted">Se joelho reclamar:</span> ${r['Substituição se joelho reclamar']||'-'}</div></div></label>`;
  }).join('');
}
function renderModalidades(){
  const groups = [
    ['Semana Blumenau', data.semanaBlumenau, 'Sessão', ['Dia','Local','Objetivo','Duração','Intensidade','Observações']],
    ['Fim de semana Penha/Navegantes', data.fimSemanaPenha, 'Sessão', ['Dia','Local','Objetivo','Duração','Intensidade','Quando usar','Observações']],
    ['Academia AdHering', data.academia, 'Exercício', ['Treino','Séries x reps','Intensidade','Ponto técnico','Substituição se joelho reclamar']],
    ['Corrida', data.corrida, 'Tipo', ['Local','Quando','Estrutura','Intensidade','Objetivo','Alerta joelho']],
    ['Natação', data.natacao, 'Tipo', ['Local','Estrutura','Volume alvo','Intensidade','Foco','Segurança']],
    ['Bike Speed', data.bike, 'Tipo', ['Local','Estrutura','Duração','Intensidade','Objetivo','Observações']],
    ['Brick e transição', data.brick, 'Sessão', ['Fase','Frequência','Objetivo','Como executar','Erro a evitar']]
  ];
  const el=document.getElementById('modalidadeList'); el.innerHTML='';
  groups.forEach(([title, rows, main, fields],idx)=>{
    const d=document.createElement('details'); if(idx<3)d.open=true;
    const body = title === 'Academia AdHering'
      ? `<div class="gym-panel"><p class="muted">Checklist dos exercícios de academia. Use durante o treino para não esquecer séries e pontos técnicos.</p>${renderGymChecklist(rows)}</div>`
      : `<div class="tableish">${rows.map(r=>`<div class="rowish"><strong>${r[main]||r['Tipo']||r['Exercício']||''}</strong>${fields.map(f=>r[f]?`<div><span class="muted">${f}:</span> ${r[f]}</div>`:'').join('')}</div>`).join('')}</div>`;
    d.innerHTML=`<summary>${title}</summary>${body}`;
    el.appendChild(d);
  });
  el.querySelectorAll('[data-gym-key]').forEach(input=>{
    input.addEventListener('change', e=>{
      const key = decodeURIComponent(e.target.dataset.gymKey);
      state.gymDone[key] = e.target.checked;
      save(); renderModalidades(); renderDashboard();
    });
  });
}
function renderKneeRules(){
  const el=document.getElementById('kneeRules'); el.innerHTML='';
  data.joelho.forEach(r=>{
    let cls='rule'; const s=String(r['Sinal']||''); if(s.includes('4-5')||s.includes('3/10'))cls+=' warn'; if(s.includes('6')||s.includes('Instabilidade'))cls+=' danger';
    const div=document.createElement('div'); div.className=cls;
    div.innerHTML=`<h3>${r['Sinal']}</h3><p><strong>Interpretação:</strong> ${r['Interpretação']||''}</p><p><strong>Ação:</strong> ${r['Ação imediata']||''}</p><p><strong>Substituição:</strong> ${r['Substituição recomendada']||''}</p><p><strong>Voltar quando:</strong> ${r['Quando voltar']||''}</p>`;
    el.appendChild(div);
  });
}
function renderControl(){
  const w=data.plano25[selectedWeek]; const rec=state.control[w['Sem']]||{};
  ['kneePain','rpe','sleep','notes'].forEach(id=>document.getElementById(id).value=rec[id]||'');
  renderHistory();
}
function renderHistory(){
  const el=document.getElementById('history'); el.innerHTML='';
  Object.entries(state.control).sort((a,b)=>b[0]-a[0]).forEach(([week,rec])=>{
    const div=document.createElement('div'); div.className='history-item';
    div.innerHTML=`<strong>Semana ${week}</strong><div class="muted">Joelho: ${rec.kneePain||'-'} • RPE: ${rec.rpe||'-'} • Sono: ${rec.sleep||'-'}</div><p>${rec.notes||''}</p>`;
    el.appendChild(div);
  });
}
function numberValues(field){
  return Object.values(state.control).map(r=>Number(String(r[field]||'').replace(',','.'))).filter(v=>!Number.isNaN(v) && v>0);
}
function avg(arr){ return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }
function sleepToHours(value){
  const s = String(value || '').toLowerCase().replace(',', '.');
  const h = s.match(/(\d+(?:\.\d+)?)\s*h/);
  if(h) return Number(h[1]);
  const n = Number(s.replace(/[^0-9.]/g,''));
  return Number.isNaN(n) ? 0 : n;
}
function renderDashboard(){
  const w = data.plano25[selectedWeek];
  const tasks = weekTasks(w);
  const done = tasks.filter(t=>state.done[t.id]).length;
  const adherence = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  const gymTotal = data.academia ? data.academia.length : 0;
  const gymDone = Object.values(state.gymDone).filter(Boolean).length;
  const kneeAvg = avg(numberValues('kneePain'));
  const rpeAvg = avg(numberValues('rpe'));
  const sleepVals = Object.values(state.control).map(r=>sleepToHours(r.sleep)).filter(v=>v>0);
  const sleepAvg = avg(sleepVals);
  const metrics = [
    ['Adesão da semana', `${adherence}%`, `${done}/${tasks.length} treinos concluídos`],
    ['Volume planejado', `${w['Total min']||0} min`, `Semana ${w['Sem']} • ${w['Etapa']}`],
    ['Checklist academia', `${gymDone}/${gymTotal}`, 'Exercícios marcados na aba Treinos'],
    ['Dor média joelho', kneeAvg ? kneeAvg.toFixed(1)+'/10' : '-', 'Meta: ficar até 3/10'],
    ['RPE médio', rpeAvg ? rpeAvg.toFixed(1)+'/10' : '-', 'Meta base: 3 a 6 na maior parte'],
    ['Sono médio', sleepAvg ? sleepAvg.toFixed(1)+'h' : '-', 'Meta prática: 7h ou mais']
  ];
  const box = document.getElementById('dashboardMetrics');
  if(box){
    box.innerHTML = metrics.map(m=>`<div class="card dash-card"><span>${m[0]}</span><strong>${m[1]}</strong><small>${m[2]}</small></div>`).join('');
  }
  const insight = document.getElementById('dashboardInsight');
  if(insight){
    let msg = 'Semana sob controle. Priorize consistência e técnica.';
    let cls = 'ok';
    if(kneeAvg >= 4){ msg = 'A dor média do joelho está alta. Reduza corrida de impacto e priorize bike leve, natação e força controlada.'; cls='danger'; }
    else if(rpeAvg >= 7){ msg = 'O esforço médio está alto. Mantenha intensidade baixa no próximo bloco para não acumular fadiga.'; cls='warn'; }
    else if(adherence < 60){ msg = 'A adesão semanal está baixa. Faça versões mínimas dos treinos antes de aumentar carga.'; cls='warn'; }
    insight.innerHTML = `<div class="insight-box ${cls}">${msg}</div>`;
  }
  const hist = document.getElementById('dashboardHistory');
  if(hist){
    const entries = Object.entries(state.control).sort((a,b)=>b[0]-a[0]).slice(0,4);
    hist.innerHTML = entries.length ? entries.map(([week,rec])=>`<div class="history-item"><strong>Semana ${week}</strong><div class="muted">Joelho ${rec.kneePain||'-'} • RPE ${rec.rpe||'-'} • Sono ${rec.sleep||'-'}</div><p>${rec.notes||''}</p></div>`).join('') : '<p class="muted">Ainda não há registros. Preencha a aba Controle no fim da semana.</p>';
  }
}
function renderAll(){ initHeader(); renderChecklist(); renderWeekDetail(); renderTimeline(); renderControl(); renderDashboard(); }

document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.tab,.view').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active'); document.getElementById('view-'+btn.dataset.view).classList.add('active');
  renderDashboard();
}));
document.getElementById('resetWeek').addEventListener('click',()=>{weekTasks(data.plano25[selectedWeek]).forEach(t=>delete state.done[t.id]); save(); renderChecklist(); renderDashboard();});
document.getElementById('saveControl').addEventListener('click',()=>{
  const w=data.plano25[selectedWeek]; state.control[w['Sem']]={kneePain:kneePain.value,rpe:rpe.value,sleep:sleep.value,notes:notes.value,date:new Date().toISOString()}; save();
  document.getElementById('controlMsg').textContent='Controle salvo.'; renderHistory(); renderDashboard();
});
let deferredPrompt; const installBtn=document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;installBtn.classList.remove('hidden');});
installBtn.addEventListener('click',async()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null;installBtn.classList.add('hidden');}});
if('serviceWorker' in navigator){navigator.serviceWorker.register('./service-worker.js').catch(()=>{});}
initWeekSelect(); renderModalidades(); renderKneeRules(); renderAll();