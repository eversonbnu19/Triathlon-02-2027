const data = window.TRAINING_DATA;
const raceDate = new Date('2027-02-14T07:00:00-03:00');
const today = new Date();
const weekSelect = document.getElementById('weekSelect');
const stateKey = 'tri_penha_app_v1';
let state = JSON.parse(localStorage.getItem(stateKey) || '{}');
if(!state.done) state.done = {};
if(!state.control) state.control = {};

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
function weekTasks(w){
  return [1,2,3,4,5].map(n=>w[`Treino ${n}`]).filter(Boolean).map((t,i)=>({id:`w${w['Sem']}-t${i+1}`, title:t}));
}
function renderChecklist(){
  const w = data.plano25[selectedWeek];
  const box = document.getElementById('checklist'); box.innerHTML='';
  weekTasks(w).forEach(task=>{
    const div=document.createElement('label'); div.className='check-item'+(state.done[task.id]?' done':'');
    div.innerHTML = `<input type="checkbox" ${state.done[task.id]?'checked':''}/><div><div class="task-title">${task.title}</div><div class="task-meta">${w['Local preferencial']} • ${w['Etapa']}</div></div>`;
    div.querySelector('input').addEventListener('change', e=>{state.done[task.id]=e.target.checked; save(); renderChecklist();});
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
  el.innerHTML=`<h2>Semana ${w['Sem']} — ${w['Etapa']}</h2><p class="muted">Início ${fmtDate(w['Início'])} • ${w['Local preferencial']}</p><div class="training-list">${weekTasks(w).map(t=>`<div class="training">${t.title}</div>`).join('')}</div><div class="pill-row"><span class="pill">Corrida ${w['Run min']||0} min</span><span class="pill">Bike ${w['Bike min']||0} min</span><span class="pill">Natação ${w['Swim min']||0} min</span><span class="pill">Força ${w['Força min']||0} min</span><span class="pill">Total ${w['Total min']||0} min</span></div><p style="margin-top:12px">${w['Observações']||''}</p>`;
}
function renderTimeline(){
  const filter=document.getElementById('localFilter').value;
  const el=document.getElementById('allWeeks'); el.innerHTML='';
  data.plano25.forEach((w,i)=>{
    if(filter==='Blumenau' && !String(w['Local preferencial']).includes('Blumenau')) return;
    if(filter==='Penha' && !String(w['Local preferencial']).match(/Penha|Navegantes/)) return;
    const card=document.createElement('div'); card.className='week-card';
    card.innerHTML=`<h3>Semana ${w['Sem']} • ${w['Etapa']}</h3><div class="week-meta">${fmtDate(w['Início'])} • ${w['Local preferencial']} • ${w['Total min']||0} min</div><div>${[w['Treino 1'],w['Treino 2'],w['Treino 3'],w['Treino 4'],w['Treino 5']].filter(Boolean).join(' • ')}</div>`;
    card.addEventListener('click',()=>{selectedWeek=i; weekSelect.value=i; renderAll(); window.scrollTo({top:0,behavior:'smooth'});});
    el.appendChild(card);
  });
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
    const d=document.createElement('details'); if(idx<2)d.open=true;
    d.innerHTML=`<summary>${title}</summary><div class="tableish">${rows.map(r=>`<div class="rowish"><strong>${r[main]||r['Tipo']||r['Exercício']||''}</strong>${fields.map(f=>r[f]?`<div><span class="muted">${f}:</span> ${r[f]}</div>`:'').join('')}</div>`).join('')}</div>`;
    el.appendChild(d);
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
function renderAll(){ initHeader(); renderChecklist(); renderWeekDetail(); renderTimeline(); renderControl(); }

document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.tab,.view').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active'); document.getElementById('view-'+btn.dataset.view).classList.add('active');
}));
document.getElementById('resetWeek').addEventListener('click',()=>{weekTasks(data.plano25[selectedWeek]).forEach(t=>delete state.done[t.id]); save(); renderChecklist();});
document.getElementById('saveControl').addEventListener('click',()=>{
  const w=data.plano25[selectedWeek]; state.control[w['Sem']]={kneePain:kneePain.value,rpe:rpe.value,sleep:sleep.value,notes:notes.value,date:new Date().toISOString()}; save();
  document.getElementById('controlMsg').textContent='Controle salvo.'; renderHistory();
});
let deferredPrompt; const installBtn=document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;installBtn.classList.remove('hidden');});
installBtn.addEventListener('click',async()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null;installBtn.classList.add('hidden');}});
if('serviceWorker' in navigator){navigator.serviceWorker.register('./service-worker.js').catch(()=>{});}
initWeekSelect(); renderModalidades(); renderKneeRules(); renderAll();
