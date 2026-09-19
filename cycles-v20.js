// v20 - Visao de ciclos preparatorios na tela Plano.
// Mostra etapa atual, prazos, metas e linha do tempo ate a prova.
(function(){
  var VERSION_LABEL = 'v20';
  var RACE_DATE = new Date(Date.UTC(2027,1,14));
  var CYCLES = [
    {
      id:1,
      title:'Etapa 1 — Reentrada + Base',
      short:'Base',
      start:'2026-08-24',
      end:'2026-10-18',
      objective:'Reconstruir consistência aeróbica, técnica e força protetiva.',
      focus:'Corrida leve, piscina técnica, bike controlada e academia para joelho/quadril.',
      target:'Correr 7-8 km leve; pedalar 60-75 min; nadar 800-1000 m acumulado.',
      caution:'Não transformar todo treino em competição. Joelho manda no plano.'
    },
    {
      id:2,
      title:'Etapa 2 — Construção + 10 km',
      short:'Construção / 10 km',
      start:'2026-10-19',
      end:'2026-12-20',
      objective:'Preparar os 10 km e consolidar base real de triathlon.',
      focus:'Longão progressivo, bike endurance, natação contínua e brick quinzenal.',
      target:'Completar 10 km confortável; bike 90 min; nado 1200-1500 m acumulado.',
      caution:'Cuidar da transição entre correr 10 km e treinar como triatleta.'
    },
    {
      id:3,
      title:'Etapa 3 — Específica Penha + Polimento',
      short:'Penha / Taper',
      start:'2026-12-21',
      end:'2027-02-14',
      objective:'Simular a prova e chegar descansado.',
      focus:'Águas abertas, bike em Navegantes, brick semanal, simulado e redução final de carga.',
      target:'Simulado de 80-90% da prova; últimas 2 semanas com fadiga caindo.',
      caution:'Não testar nada novo na semana da prova. Reduzir volume no taper.'
    }
  ];

  function parseDate(s){
    var p=String(s).split('-').map(Number);
    return new Date(Date.UTC(p[0],p[1]-1,p[2]));
  }
  function todayUTC(){
    var n=new Date();
    return new Date(Date.UTC(n.getFullYear(),n.getMonth(),n.getDate()));
  }
  function daysBetween(a,b){return Math.ceil((b-a)/86400000);}
  function fmt(s){
    var d = typeof s === 'string' ? parseDate(s) : s;
    return String(d.getUTCDate()).padStart(2,'0')+'/'+String(d.getUTCMonth()+1).padStart(2,'0')+'/'+d.getUTCFullYear();
  }
  function percent(start,end,now){
    var total=Math.max(1,end-start);
    var done=Math.min(Math.max(now-start,0),total);
    return Math.round((done/total)*100);
  }
  function currentCycle(now){
    for(var i=0;i<CYCLES.length;i++){
      var s=parseDate(CYCLES[i].start), e=parseDate(CYCLES[i].end);
      if(now>=s && now<=e) return CYCLES[i];
    }
    if(now<parseDate(CYCLES[0].start)) return CYCLES[0];
    return CYCLES[CYCLES.length-1];
  }
  function weekNumber(now){
    var start=parseDate('2026-08-24');
    return Math.max(1, Math.min(25, Math.floor(daysBetween(start,now)/7)+1));
  }
  function phaseState(c,now){
    var s=parseDate(c.start), e=parseDate(c.end);
    if(now<s) return 'Futura';
    if(now>e) return 'Concluída';
    return 'Atual';
  }

  function injectStyle(){
    if(document.getElementById('cycles-v20-style')) return;
    var st=document.createElement('style');
    st.id='cycles-v20-style';
    st.textContent = `
      .cycles-v20{display:grid;gap:14px;margin-bottom:16px;}
      .cycle-hero{background:linear-gradient(135deg,rgba(59,130,246,.14),rgba(16,185,129,.10));border:1px solid rgba(148,163,184,.25);}
      .cycle-hero-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;}
      .cycle-hero h2{margin:.25rem 0 .35rem;}
      .cycle-pill{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(148,163,184,.35);border-radius:999px;padding:6px 10px;font-size:.82rem;font-weight:700;background:rgba(15,23,42,.12);}
      .cycle-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px;}
      .cycle-kpi{border:1px solid rgba(148,163,184,.20);border-radius:14px;padding:12px;background:rgba(255,255,255,.04);min-width:0;}
      .cycle-kpi span{display:block;font-size:.78rem;opacity:.75;margin-bottom:5px;}
      .cycle-kpi strong{font-size:1.12rem;line-height:1.2;word-break:break-word;}
      .cycle-progress{height:10px;border-radius:999px;background:rgba(148,163,184,.20);overflow:hidden;margin-top:12px;}
      .cycle-progress > div{height:100%;border-radius:999px;background:linear-gradient(90deg,#60a5fa,#34d399);}
      .cycle-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:14px;}
      .cycle-focus-list{display:grid;gap:10px;margin-top:10px;}
      .cycle-focus-item{padding:10px 12px;border:1px solid rgba(148,163,184,.18);border-radius:12px;background:rgba(255,255,255,.035);}
      .cycle-focus-item strong{display:block;margin-bottom:4px;}
      .cycle-timeline{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;}
      .cycle-card{position:relative;border:1px solid rgba(148,163,184,.22);border-radius:16px;padding:13px;background:rgba(255,255,255,.04);min-width:0;}
      .cycle-card.current{border-color:rgba(52,211,153,.75);box-shadow:0 0 0 1px rgba(52,211,153,.28) inset;}
      .cycle-card.done{opacity:.78;}
      .cycle-card .state{font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;opacity:.82;}
      .cycle-card h3{font-size:1rem;margin:6px 0 6px;}
      .cycle-card p{font-size:.86rem;margin:0;color:var(--muted,#94a3b8);}
      .cycle-card small{display:block;margin-top:8px;opacity:.78;}
      .cycle-alert{border-left:4px solid #34d399;}
      @media(max-width:720px){.cycle-kpis{grid-template-columns:repeat(2,minmax(0,1fr));}.cycle-grid{grid-template-columns:1fr}.cycle-timeline{grid-template-columns:1fr;}}
    `;
    document.head.appendChild(st);
  }

  function renderCycles(){
    var view=document.getElementById('view-plano');
    if(!view) return;
    var old=document.getElementById('cyclesV20');
    if(old) old.remove();

    var now=todayUTC();
    var current=currentCycle(now);
    var cStart=parseDate(current.start);
    var cEnd=parseDate(current.end);
    var next=CYCLES.find(function(c){return parseDate(c.start)>now;});
    var raceDays=daysBetween(now,RACE_DATE);
    var cycleRemaining=Math.max(0,daysBetween(now,cEnd));
    var progress=percent(cStart,cEnd,now);
    var currentWeek=weekNumber(now);
    var stageText = phaseState(current,now)==='Atual' ? 'Etapa atual' : phaseState(current,now);

    var html='<div id="cyclesV20" class="cycles-v20">'+
      '<div class="card cycle-hero">'+
        '<div class="cycle-hero-top"><div><span class="cycle-pill">'+stageText+'</span><h2>'+current.title+'</h2><p class="muted">'+current.objective+'</p></div><span class="cycle-pill">App '+VERSION_LABEL+'</span></div>'+ 
        '<div class="cycle-kpis">'+
          '<div class="cycle-kpi"><span>Semana do plano</span><strong>'+currentWeek+' de 25</strong></div>'+ 
          '<div class="cycle-kpi"><span>Fim do ciclo</span><strong>'+fmt(current.end)+'</strong></div>'+ 
          '<div class="cycle-kpi"><span>Faltam no ciclo</span><strong>'+cycleRemaining+' dias</strong></div>'+ 
          '<div class="cycle-kpi"><span>Faltam para a prova</span><strong>'+raceDays+' dias</strong></div>'+ 
        '</div>'+ 
        '<div class="cycle-progress" aria-label="Progresso do ciclo"><div style="width:'+progress+'%"></div></div>'+ 
        '<p class="muted" style="margin-top:8px">Período do ciclo: '+fmt(current.start)+' a '+fmt(current.end)+' • Progresso aproximado: '+progress+'%</p>'+ 
      '</div>'+ 
      '<div class="cycle-grid">'+
        '<div class="card"><h2>Meta deste ciclo</h2><div class="cycle-focus-list">'+
          '<div class="cycle-focus-item"><strong>Foco técnico</strong><span>'+current.focus+'</span></div>'+ 
          '<div class="cycle-focus-item"><strong>Meta ao final</strong><span>'+current.target+'</span></div>'+ 
          '<div class="cycle-focus-item"><strong>Cuidado principal</strong><span>'+current.caution+'</span></div>'+ 
        '</div></div>'+ 
        '<div class="card cycle-alert"><h2>Próximo marco</h2>'+ 
          (next ? '<p><strong>'+next.title+'</strong></p><p class="muted">Começa em '+fmt(next.start)+'. Faltam '+Math.max(0,daysBetween(now,parseDate(next.start)))+' dias.</p><p class="muted">'+next.objective+'</p>' : '<p><strong>Semana da prova</strong></p><p class="muted">Agora o foco é reduzir fadiga, manter confiança e não testar nada novo.</p>')+
        '</div>'+ 
      '</div>'+ 
      '<div class="card"><h2>Linha do tempo da preparação</h2><div class="cycle-timeline">'+
        CYCLES.map(function(c){
          var state=phaseState(c,now);
          var cls=state==='Atual'?'current':(state==='Concluída'?'done':'');
          return '<div class="cycle-card '+cls+'"><span class="state">'+state+'</span><h3>'+c.short+'</h3><p>'+c.objective+'</p><small>'+fmt(c.start)+' a '+fmt(c.end)+'</small></div>';
        }).join('')+
      '</div></div>'+ 
    '</div>';

    view.insertAdjacentHTML('afterbegin',html);
  }

  function boot(){
    injectStyle();
    renderCycles();
    document.addEventListener('click',function(e){
      var tab=e.target.closest && e.target.closest('[data-view="plano"]');
      if(tab) setTimeout(renderCycles,120);
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();