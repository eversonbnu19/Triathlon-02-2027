// v18 - Limpa os campos apos concluir treino e enviar.
// Mantem o historico/peso anterior, mas deixa a tela em branco para o proximo treino.
(function(){
  if(!window.TRAINING_DATA || !window.TRAINING_DATA.academia) return;

  var TABLE = 'exercicios_registros';
  var VERSION_LABEL = 'v18';
  var CFG = {
    A:{title:'Academia A',subtitle:'Pernas, joelho e quadril',desc:'Base para proteger joelho, melhorar corrida e sustentar o triathlon.',match:'A -',icon:'🏋️'},
    B:{title:'Academia B',subtitle:'Natação, costas e ombro',desc:'Costas, ombro, escápulas e core para melhorar a braçada.',match:'B -',icon:'🏊'},
    C:{title:'Academia C',subtitle:'Manutenção, core e estabilidade',desc:'Controle corporal, estabilidade, core e manutenção.',match:'C -',icon:'⚡'}
  };

  if(!state.exerciseWeights) state.exerciseWeights = {};
  if(!state.gymDone) state.gymDone = {};
  if(!state.exerciseHistory) state.exerciseHistory = {};

  function normalize(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');}
  function rows(letter){return data.academia.filter(function(r){return String(r['Treino']||'').indexOf(CFG[letter].match)>=0;});}
  function week(){try{return data.plano25[selectedWeek]['Sem'];}catch(e){return null;}}
  function draft(key){return state.exerciseWeights[key] || {peso:'',series:'',reps:'',obs:''};}
  function setDraft(key,field,value){if(!state.exerciseWeights[key]) state.exerciseWeights[key]={}; state.exerciseWeights[key][field]=value; state.exerciseWeights[key].updatedAt=new Date().toISOString(); save();}
  function strip(html){var div=document.createElement('div'); div.innerHTML=String(html||''); return (div.textContent||div.innerText||'').replace('Ver referencia','').replace('Buscar video','').trim();}
  function yt(title){return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(String(title||'') + ' execução correta');}
  function prev(key){var h=state.exerciseHistory[key] || []; if(!h.length) return '<strong>-</strong><small>Sem registro anterior</small>'; var p=h[0]; return '<strong>'+(p.peso_kg?p.peso_kg+' kg':'-')+'</strong><small>'+(p.series?p.series+' séries':'')+(p.repeticoes?' • '+p.repeticoes+' reps':'')+'</small>';}
  function n(v){var x=String(v||'').replace(',','.').trim(); return x==='' ? null : Number(x);}

  function card(row,letter){
    var title=row['Exercício']||'';
    var key=normalize(title);
    var doneKey='gym-v18-'+letter+'-'+key;
    var d=draft(key);
    var done=!!state.gymDone[doneKey];
    var url=yt(title);
    return '<article class="exercise-card '+(done?'done':'')+'" data-exercise-key="'+key+'" data-done-key="'+doneKey+'">'+
      '<div class="exercise-photo youtube-photo-link">'+
        '<div class="youtube-link-card"><div class="youtube-play">▶</div><div><strong>Vídeo de referência</strong><span>'+title+'</span><small>Toque para pesquisar no YouTube</small></div></div>'+ 
        '<a class="youtube-big-link" target="_blank" rel="noopener" href="'+url+'">Abrir no YouTube</a>'+ 
      '</div>'+ 
      '<div class="exercise-body">'+
        '<div class="exercise-topline"><span class="exercise-tag">'+CFG[letter].title+'</span><span class="exercise-status">'+(done?'Feito':'Em aberto')+'</span></div>'+ 
        '<h3>'+title+'</h3>'+ 
        '<div class="exercise-grid"><div><span>Planejado</span><strong>'+(row['Séries x reps']||'-')+'</strong></div><div><span>Intensidade</span><strong>'+(row['Intensidade']||'-')+'</strong></div></div>'+ 
        '<div class="weight-box weight-box-v10">'+
          '<label>Peso hoje (kg)<input class="weight-input" inputmode="decimal" type="text" placeholder="ex: 16" value="'+(d.peso||'')+'" data-field="peso" data-ex-key="'+key+'"></label>'+ 
          '<label>Séries feitas<input class="weight-input" inputmode="numeric" type="number" min="0" placeholder="ex: 4" value="'+(d.series||'')+'" data-field="series" data-ex-key="'+key+'"></label>'+ 
          '<label>Reps médias<input class="weight-input" inputmode="numeric" type="number" min="0" placeholder="ex: 10" value="'+(d.reps||'')+'" data-field="reps" data-ex-key="'+key+'"></label>'+ 
          '<div class="previous-weight"><span>Peso anterior</span>'+prev(key)+'</div>'+ 
        '</div>'+ 
        '<label class="exercise-note-input">Observação do exercício<textarea rows="2" placeholder="dor, facilidade, ajuste de carga..." data-field="obs" data-ex-key="'+key+'">'+(d.obs||'')+'</textarea></label>'+ 
        '<div class="coach-note"><strong>Ponto técnico</strong><p>'+ (strip(row['Ponto técnico'])||'-') +'</p></div>'+ 
        '<div class="coach-note knee-note"><strong>Se o joelho reclamar</strong><p>'+ (row['Substituição se joelho reclamar']||'-') +'</p></div>'+ 
        '<div class="exercise-actions"><label class="complete-toggle"><input type="checkbox" data-check-ex="'+doneKey+'" '+(done?'checked':'')+'><span>Marcar exercício feito</span></label><a class="video-link" target="_blank" rel="noopener" href="'+url+'">Abrir referência no YouTube</a></div>'+ 
      '</div></article>';
  }

  function home(){
    var el=document.getElementById('modalidadeList'); if(!el) return;
    el.innerHTML='<section class="v9-training-shell"><div class="v9-head card"><p class="eyebrow">Treinos de academia</p><h2>Escolha o treino</h2><p class="muted">v18: ao concluir e enviar, os campos ficam em branco para o próximo treino.</p></div><div class="training-home-grid">'+
      ['A','B','C'].map(function(l){var c=CFG[l]; return '<button type="button" class="training-home-card" data-open-v18="'+l+'"><div class="home-icon">'+c.icon+'</div><div><strong>'+c.title+'</strong><span>'+c.subtitle+'</span><small>'+rows(l).length+' exercícios</small></div></button>';}).join('')+
      '</div></section>';
  }

  function detail(letter){
    var el=document.getElementById('modalidadeList'); if(!el) return;
    var c=CFG[letter]; var list=rows(letter);
    el.innerHTML='<section class="v9-training-shell"><button class="back-training" type="button" data-back-v18="1">← Voltar aos treinos</button><div class="card workout-hero"><div class="home-icon large">'+c.icon+'</div><div><p class="eyebrow">'+c.title+'</p><h2>'+c.subtitle+'</h2><p class="muted">'+c.desc+'</p></div></div><div class="exercise-list">'+list.map(function(r){return card(r,letter);}).join('')+'</div><div class="card workout-complete-box"><h2>Finalizar treino</h2><p class="muted">Ao concluir, os exercícios preenchidos serão enviados e a tela será limpa para o próximo treino.</p><button type="button" class="primary" data-complete-v18="'+letter+'">Concluir treino e enviar</button><div class="exercise-save-status"></div></div></section>';
  }

  function payload(row,letter){
    var key=normalize(row['Exercício']||''); var d=draft(key);
    return {device_id:CLOUD_DEVICE_ID,semana:week(),treino_tipo:letter,exercicio:row['Exercício']||'',exercicio_key:key,peso_kg:n(d.peso),series:d.series===''?null:Number(d.series),repeticoes:d.reps===''?null:Number(d.reps),observacoes:d.obs||null,dados_json:{treino:row['Treino']||'',series_planejadas:row['Séries x reps']||'',intensidade:row['Intensidade']||'',feito:!!state.gymDone['gym-v18-'+letter+'-'+key],app_version:VERSION_LABEL}};
  }

  function addToHistory(savedRows){
    savedRows.forEach(function(r){
      var k=r.exercicio_key;
      if(!state.exerciseHistory[k]) state.exerciseHistory[k]=[];
      state.exerciseHistory[k].unshift(Object.assign({created_at:new Date().toISOString()},r));
    });
  }

  function clearWorkoutState(letter){
    rows(letter).forEach(function(r){
      var key=normalize(r['Exercício']||'');
      delete state.exerciseWeights[key];
      delete state.gymDone['gym-v18-'+letter+'-'+key];
    });
    var el=document.getElementById('modalidadeList');
    if(el){
      el.querySelectorAll('[data-ex-key][data-field]').forEach(function(input){input.value='';});
      el.querySelectorAll('[data-check-ex]').forEach(function(input){input.checked=false;});
      el.querySelectorAll('.exercise-card').forEach(function(cardEl){cardEl.classList.remove('done'); var st=cardEl.querySelector('.exercise-status'); if(st) st.textContent='Em aberto';});
      el.querySelectorAll('.previous-weight').forEach(function(box){
        var cardEl=box.closest('.exercise-card');
        var key=cardEl ? cardEl.getAttribute('data-exercise-key') : '';
        if(key) box.innerHTML='<span>Peso anterior</span>'+prev(key);
      });
    }
    save();
  }

  async function complete(letter,btn){
    var box=btn.parentElement.querySelector('.exercise-save-status');
    var dataRows=rows(letter).map(function(r){return payload(r,letter);}).filter(function(p){return p.peso_kg!==null||p.series!==null||p.repeticoes!==null||p.observacoes||p.dados_json.feito;});
    if(!dataRows.length){box.textContent='Preencha ou marque pelo menos um exercício antes de concluir.'; box.className='exercise-save-status warn visible'; return;}
    btn.disabled=true; btn.textContent='Enviando...'; box.textContent='Salvando treino...'; box.className='exercise-save-status visible';
    try{
      if(cloudReady && supabaseClient){
        var res=await supabaseClient.from(TABLE).insert(dataRows).select();
        if(res.error) throw res.error;
        addToHistory(res.data && res.data.length ? res.data : dataRows);
        clearWorkoutState(letter);
        box.textContent='Treino enviado. Campos limpos para o próximo treino.';
        box.className='exercise-save-status ok visible';
      } else {
        addToHistory(dataRows.map(function(r){return Object.assign({local:true},r);}));
        clearWorkoutState(letter);
        box.textContent='Treino salvo localmente. Campos limpos para o próximo treino.';
        box.className='exercise-save-status warn visible';
      }
      renderDashboard();
    }catch(e){
      addToHistory(dataRows.map(function(r){return Object.assign({local:true},r);}));
      clearWorkoutState(letter);
      box.textContent='Treino salvo localmente. Campos limpos; verifique Supabase/RLS.';
      box.className='exercise-save-status warn visible';
    }
    btn.disabled=false; btn.textContent='Concluir treino e enviar';
  }

  document.addEventListener('click',function(e){
    var open=e.target.closest('[data-open-v18]'); if(open){detail(open.getAttribute('data-open-v18')); return;}
    if(e.target.closest('[data-back-v18]')){home(); return;}
    var completeBtn=e.target.closest('[data-complete-v18]'); if(completeBtn){complete(completeBtn.getAttribute('data-complete-v18'),completeBtn); return;}
  });
  document.addEventListener('change',function(e){
    if(e.target.matches('[data-check-ex]')){var k=e.target.getAttribute('data-check-ex'); var cardEl=e.target.closest('.exercise-card'); var st=cardEl?cardEl.querySelector('.exercise-status'):null; state.gymDone[k]=e.target.checked; save(); if(cardEl){cardEl.classList.toggle('done',e.target.checked); if(st) st.textContent=e.target.checked?'Feito':'Em aberto';} return;}
    if(e.target.matches('[data-ex-key][data-field]')){setDraft(e.target.getAttribute('data-ex-key'),e.target.getAttribute('data-field'),e.target.value); return;}
  });
  document.addEventListener('blur',function(e){if(e.target && e.target.matches && e.target.matches('[data-ex-key][data-field]')) setDraft(e.target.getAttribute('data-ex-key'),e.target.getAttribute('data-field'),e.target.value);},true);

  window.renderModalidades = home;
  setTimeout(home,250);
})();