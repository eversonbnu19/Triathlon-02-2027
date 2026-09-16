// v16 - Substitui a area de foto por link do YouTube.
// Evita imagem quebrada e mantém referência prática para execução no celular.
(function(){
  const youtubeQueries = {
    'bike-leve-mobilidade-tornozelo-quadril':'bike leve mobilidade tornozelo quadril aquecimento',
    'agachamento-livre':'agachamento livre execução correta',
    'hip-thrust-com-halter':'hip thrust com halter execução correta',
    'pull-through-no-cabo':'pull through no cabo execução correta',
    'step-up-baixo-com-halteres-leves':'step up baixo com halteres execução correta',
    'panturrilha-em-pe-com-halteres':'panturrilha em pé com halteres execução correta',
    'barra-fixa-assistida-ou-puxada-na-polia':'barra fixa assistida puxada na polia execução correta',
    'remada-unilateral-com-halter':'remada unilateral com halter execução correta',
    'pullover-com-halter':'pullover com halter execução correta',
    'face-pull':'face pull execução correta',
    'elevacao-y-t-w-no-banco-inclinado':'elevação Y T W banco inclinado execução correta',
    'pallof-press':'pallof press execução correta',
    'agachamento-livre-leve-ou-split-squat-curto':'split squat curto agachamento livre leve execução joelho',
    'afundo-reverso-curto':'afundo reverso curto execução correta',
    'supino-com-halteres':'supino com halteres execução correta',
    'caminhada-lateral-com-miniband':'caminhada lateral com miniband execução correta',
    'prancha-lateral':'prancha lateral execução correta',
    'farmer-walk':'farmer walk execução correta',
    'prancha-com-toque-no-ombro':'prancha com toque no ombro execução correta'
  };

  function normalize(value){
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  }

  function youtubeUrl(key, title){
    const query = youtubeQueries[key] || `${title || key} execução correta`;
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  }

  function applyYoutubeLayer(root){
    const scope = root && root.querySelectorAll ? root : document;
    const cards = scope.querySelectorAll('.exercise-card[data-exercise-key]');
    cards.forEach(card => {
      const key = card.dataset.exerciseKey;
      const title = card.querySelector('h3') ? card.querySelector('h3').textContent.trim() : key;
      const safeKey = key || normalize(title);
      const photo = card.querySelector('.exercise-photo');
      if(!photo) return;
      const url = youtubeUrl(safeKey, title);
      photo.classList.remove('placeholder-photo','exercise-photo-real');
      photo.classList.add('youtube-photo-link');
      photo.innerHTML = `
        <div class="youtube-link-card">
          <div class="youtube-play">▶</div>
          <div>
            <strong>Vídeo de referência</strong>
            <span>${title}</span>
            <small>Toque para pesquisar no YouTube</small>
          </div>
        </div>
        <a class="youtube-big-link" target="_blank" rel="noopener" href="${url}">Abrir no YouTube</a>`;
      const oldVideo = card.querySelector('.video-link');
      if(oldVideo && oldVideo.tagName === 'A') oldVideo.href = url;
      if(oldVideo) oldVideo.textContent = 'Abrir referência no YouTube';
    });
  }

  function boot(){
    applyYoutubeLayer(document);
    const target = document.getElementById('modalidadeList') || document.body;
    const observer = new MutationObserver(() => applyYoutubeLayer(document));
    observer.observe(target, {childList:true, subtree:true});
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();