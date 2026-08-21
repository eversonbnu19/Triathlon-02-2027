// Corrige a exibicao do checklist semanal para respeitar agenda real de segunda a domingo.
// Domingo fica opcional, exceto na semana da prova.
(function(){
  const dayRank = {
    'Segunda-feira': 1,
    'Terca-feira': 2,
    'Terça-feira': 2,
    'Quarta-feira': 3,
    'Quinta-feira': 4,
    'Sexta-feira': 5,
    'Sabado': 6,
    'Sábado': 6,
    'Domingo': 7
  };

  function normalizeText(value){
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function classifyTask(title){
    const text = normalizeText(title);
    if(/prova|gp triathlon|race/.test(text)) return {day:'Domingo', optional:false, label:'Prova'};
    if(/brick|transicao|transição/.test(text)) return {day:'Domingo', optional:true, label:'Opcional'};
    if(/longao|longão/.test(text)) return {day:'Domingo', optional:true, label:'Opcional'};
    if(/speed|bike|bicicleta|ciclismo/.test(text)) return {day:'Sábado', optional:false, label:'Fim de semana'};
    if(/natacao|natação|piscina|praia/.test(text)) return {day:'Quarta-feira', optional:false, label:'Semana'};
    if(/academia|forca|força|ativacao|ativação|manutencao|manutenção|core/.test(text)) return {day:'Segunda-feira', optional:false, label:'Semana'};
    if(/corrida/.test(text)) return {day:'Terça-feira', optional:false, label:'Semana'};
    return {day:'Quinta-feira', optional:false, label:'Ajustar'};
  }

  function orderedWeekTasks(w){
    return [1,2,3,4,5]
      .map((n,idx)=>{
        const title = w[`Treino ${n}`];
        if(!title) return null;
        const meta = classifyTask(title);
        return {
          id:`w${w['Sem']}-t${idx+1}`,
          original:`Treino ${n}`,
          day: meta.day,
          title,
          optional: meta.optional,
          label: meta.label,
          rank: dayRank[meta.day] || 99
        };
      })
      .filter(Boolean)
      .sort((a,b)=>a.rank-b.rank);
  }

  taskDay = function(w, index, title='', weekdayIndex=0){
    return classifyTask(title).day;
  };

  weekTasks = function(w){
    return orderedWeekTasks(w);
  };

  renderChecklist = function(){
    const w = data.plano25[selectedWeek];
    const box = document.getElementById('checklist');
    if(!box) return;
    box.innerHTML='';
    weekTasks(w).forEach(task=>{
      const div=document.createElement('label');
      div.className='check-item'+(state.done[task.id]?' done':'')+(task.optional?' optional-task':'');
      const opt = task.optional ? ' • opcional' : '';
      div.innerHTML = `<input type="checkbox" ${state.done[task.id]?'checked':''}/><div><div class="task-day">${task.day}${task.optional?' • Opcional':''}</div><div class="task-title">${task.title}</div><div class="task-meta">${task.original}${opt} • ${w['Local preferencial']} • ${w['Etapa']}</div></div>`;
      div.querySelector('input').addEventListener('change', e=>{
        state.done[task.id]=e.target.checked;
        save();
        renderChecklist();
        renderDashboard();
      });
      box.appendChild(div);
    });
    document.getElementById('mRun').textContent=(w['Run min']||0)+' min';
    document.getElementById('mBike').textContent=(w['Bike min']||0)+' min';
    document.getElementById('mSwim').textContent=(w['Swim min']||0)+' min';
    document.getElementById('mStrength').textContent=(w['Força min']||0)+' min';
  };

  renderWeekDetail = function(){
    const w=data.plano25[selectedWeek];
    const el=document.getElementById('weekDetail');
    if(!el) return;
    el.innerHTML=`<h2>Semana ${w['Sem']} — ${w['Etapa']}</h2><p class="muted">Início ${fmtDate(w['Início'])} • ${w['Local preferencial']}</p><div class="training-list">${weekTasks(w).map(t=>`<div class="training ${t.optional?'optional-training':''}"><span class="task-day">${t.day}${t.optional?' • Opcional':''}</span><br>${t.title}<div class="task-meta">${t.original}</div></div>`).join('')}</div><div class="pill-row"><span class="pill">Corrida ${w['Run min']||0} min</span><span class="pill">Bike ${w['Bike min']||0} min</span><span class="pill">Natação ${w['Swim min']||0} min</span><span class="pill">Força ${w['Força min']||0} min</span><span class="pill">Total ${w['Total min']||0} min</span></div><p style="margin-top:12px">${w['Observações']||''}</p>`;
  };

  renderTimeline = function(){
    const filter=document.getElementById('localFilter').value;
    const el=document.getElementById('allWeeks');
    if(!el) return;
    el.innerHTML='';
    data.plano25.forEach((w,i)=>{
      if(filter==='Blumenau' && !String(w['Local preferencial']).includes('Blumenau')) return;
      if(filter==='Penha' && !String(w['Local preferencial']).match(/Penha|Navegantes/)) return;
      const card=document.createElement('div');
      card.className='week-card';
      card.innerHTML=`<h3>Semana ${w['Sem']} • ${w['Etapa']}</h3><div class="week-meta">${fmtDate(w['Início'])} • ${w['Local preferencial']} • ${w['Total min']||0} min</div><div>${weekTasks(w).map(t=>`${t.day}${t.optional?' opcional':''}: ${t.title}`).join(' • ')}</div>`;
      card.addEventListener('click',()=>{
        selectedWeek=i;
        weekSelect.value=i;
        renderAll();
        window.scrollTo({top:0,behavior:'smooth'});
      });
      el.appendChild(card);
    });
  };

  renderAll = function(){
    initHeader();
    renderChecklist();
    renderWeekDetail();
    renderTimeline();
    renderControl();
    renderDashboard();
  };

  renderAll();
})();