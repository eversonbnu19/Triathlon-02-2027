// v9 - Camada visual da aba Treinos.
// Objetivo: separar Academia A/B/C, criar cards visuais para celular e evitar salto de tela ao marcar concluido.
(function(){
  if(!window.TRAINING_DATA || !window.TRAINING_DATA.academia) return;

  const TREINO_CONFIG = {
    A: {
      title: 'Academia A',
      subtitle: 'Pernas, joelho e quadril',
      description: 'Treino de base para proteger joelho, melhorar corrida e sustentar a carga do triathlon.',
      match: 'A -',
      icon: '🏋️'
    },
    B: {
      title: 'Academia B',
      subtitle: 'Natação, costas e ombro',
      description: 'Treino para dorsal, escápulas, ombro e core, com foco direto na eficiência da braçada.',
      match: 'B -',
      icon: '🏊'
    },
    C: {
      title: 'Academia C',
      subtitle: 'Manutenção, core e estabilidade',
      description: 'Treino de controle corporal, unilateral, core e estabilidade para manter consistência.',
      match: 'C -',
      icon: '⚡'
    }
  };

  if(!state.exerciseWeights) state.exerciseWeights = {};

  function exerciseKey(exercise){
    return String(exercise || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function cleanText(value){
    return String(value || '').replace(/<br\s*\/?>/gi, ' ');
  }

  function extractLink(html){
    const match = String(html || '').match(/href=['"]([^'"]+)['"]/i);
    return match ? match[1] : '';
  }

  function stripHtml(html){
    const tmp = document.createElement('div');
    tmp.innerHTML = String(html || '');
    return tmp.textContent || tmp.innerText || '';
  }

  function rowsForTreino(letter){
    const config = TREINO_CONFIG[letter];
    return data.academia.filter(row => String(row['Treino'] || '').includes(config.match));
  }

  function getWeight(key){
    const rec = state.exerciseWeights[key] || {};
    return rec.today || '';
  }

  function setWeight(key, value){
    if(!state.exerciseWeights[key]) state.exerciseWeights[key] = {};
    state.exerciseWeights[key].today = value;
    state.exerciseWeights[key].updatedAt = new Date().toISOString();
    save();
  }

  function exerciseCard(row, idx, letter){
    const ex = row['Exercício'] || '';
    const key = `gym-${idx}-${ex}`;
    const stableKey = exerciseKey(ex);
    const checked = state.gymDone[key] ? 'checked' : '';
    const doneClass = state.gymDone[key] ? ' done' : '';
    const link = extractLink(row['Ponto técnico']);
    const point = stripHtml(row['Ponto técnico']).replace('Ver referencia', '').replace('Buscar video', '').trim();
    const peso = getWeight(stableKey);
    return `
      <article class="exercise-card${doneClass}" data-exercise-card="${encodeURIComponent(key)}">
        <div class="exercise-photo placeholder-photo">
          <div class="photo-icon">${TREINO_CONFIG[letter].icon}</div>
          <div>
            <strong>Foto pendente</strong>
            <span>Imagem será adicionada após aprovação</span>
          </div>
        </div>
        <div class="exercise-body">
          <div class="exercise-topline">
            <span class="exercise-tag">${TREINO_CONFIG[letter].title}</span>
            <span class="exercise-status">${state.gymDone[key] ? 'Completo' : 'Pendente'}</span>
          </div>
          <h3>${ex}</h3>
          <div class="exercise-grid">
            <div><span>Séries</span><strong>${row['Séries x reps'] || '-'}</strong></div>
            <div><span>Intensidade</span><strong>${row['Intensidade'] || '-'}</strong></div>
          </div>
          <div class="weight-box">
            <label>Peso hoje
              <input class="weight-input" inputmode="decimal" type="text" placeholder="kg" value="${peso}" data-weight-key="${stableKey}">
            </label>
            <div class="previous-weight"><span>Peso anterior</span><strong>v10</strong><small>Será calculado com histórico do Supabase</small></div>
          </div>
          <div class="coach-note">
            <strong>Ponto técnico</strong>
            <p>${point || '-'}</p>
          </div>
          <div class="coach-note knee-note">
            <strong>Se o joelho reclamar</strong>
            <p>${row['Substituição se joelho reclamar'] || '-'}</p>
          </div>
          <div class="exercise-actions">
            <label class="complete-toggle">
              <input type="checkbox" data-v9-gym-key="${encodeURIComponent(key)}" ${checked}>
              <span>Concluir exercício</span>
            </label>
            ${link ? `<a class="video-link" target="_blank" rel="noopener" href="${link}">Revisar referência</a>` : `<button class="video-link disabled" type="button">Vídeo pendente</button>`}
          </div>
        </div>
      </article>`;
  }

  function renderAcademiaHome(){
    const el=document.getElementById('modalidadeList');
    if(!el) return;
    const blocks = Object.entries(TREINO_CONFIG).map(([letter, cfg])=>{
      const rows = rowsForTreino(letter);
      return `<button class="training-home-card" data-open-gym="${letter}">
        <div class="home-icon">${cfg.icon}</div>
        <div>
          <strong>${cfg.title}</strong>
          <span>${cfg.subtitle}</span>
          <small>${rows.length} exercícios</small>
        </div>
      </button>`;
    }).join('');

    el.innerHTML = `
      <section class="v9-training-shell">
        <div class="v9-head card">
          <p class="eyebrow">Treinos de academia</p>
          <h2>Escolha o treino</h2>
          <p class="muted">Telas separadas para usar no celular durante o treino. Fotos e vídeos entram depois de revisão.</p>
        </div>
        <div class="training-home-grid">${blocks}</div>
        <details class="other-modalities">
          <summary>Outras modalidades</summary>
          <div class="tableish">
            ${['corrida','natacao','bike','brick'].map(name=>{
              const label = name === 'natacao' ? 'Natação' : name === 'bike' ? 'Bike Speed' : name === 'brick' ? 'Brick e transição' : 'Corrida';
              return `<div class="rowish"><strong>${label}</strong><span class="muted">Disponível no plano semanal e checklist da aba Hoje.</span></div>`;
            }).join('')}
          </div>
        </details>
      </section>`;

    el.querySelectorAll('[data-open-gym]').forEach(btn=>{
      btn.addEventListener('click',()=>renderAcademiaDetail(btn.dataset.openGym));
    });
  }

  function renderAcademiaDetail(letter){
    const cfg = TREINO_CONFIG[letter];
    const rows = rowsForTreino(letter);
    const el=document.getElementById('modalidadeList');
    if(!el) return;
    el.innerHTML = `
      <section class="v9-training-shell">
        <button class="back-training" type="button">← Voltar aos treinos</button>
        <div class="card workout-hero">
          <div class="home-icon large">${cfg.icon}</div>
          <div>
            <p class="eyebrow">${cfg.title}</p>
            <h2>${cfg.subtitle}</h2>
            <p class="muted">${cfg.description}</p>
          </div>
        </div>
        <div class="exercise-list">
          ${rows.map((row, idx)=>exerciseCard(row, idx, letter)).join('')}
        </div>
      </section>`;

    el.querySelector('.back-training').addEventListener('click', renderAcademiaHome);

    el.querySelectorAll('[data-v9-gym-key]').forEach(input=>{
      input.addEventListener('change', e=>{
        const key = decodeURIComponent(e.target.dataset.v9GymKey);
        const card = e.target.closest('.exercise-card');
        const status = card ? card.querySelector('.exercise-status') : null;
        state.gymDone[key] = e.target.checked;
        save();
        if(card){
          card.classList.toggle('done', e.target.checked);
          if(status) status.textContent = e.target.checked ? 'Completo' : 'Pendente';
        }
        renderDashboard();
      });
    });

    el.querySelectorAll('[data-weight-key]').forEach(input=>{
      input.addEventListener('change', e=>setWeight(e.target.dataset.weightKey, e.target.value));
      input.addEventListener('blur', e=>setWeight(e.target.dataset.weightKey, e.target.value));
    });
  }

  renderModalidades = renderAcademiaHome;
  renderModalidades();
})();