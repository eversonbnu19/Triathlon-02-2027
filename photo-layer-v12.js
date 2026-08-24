// v12 - aplica fotos internas aos cards de exercicios.
(function(){
  function injectPhotoStyles(){
    if(document.getElementById('photo-layer-v12-style')) return;
    const style = document.createElement('style');
    style.id = 'photo-layer-v12-style';
    style.textContent = `
      .exercise-photo-real{
        padding:0!important;
        min-height:190px!important;
        height:220px!important;
        overflow:hidden!important;
        background:#0f172a!important;
        border-bottom:1px solid rgba(255,255,255,.08)!important;
        display:block!important;
      }
      .exercise-photo-real img{
        width:100%!important;
        height:100%!important;
        display:block!important;
        object-fit:cover!important;
        object-position:center!important;
      }
      .exercise-card[data-photo-applied="1"] .exercise-body{padding-top:14px!important;}
      @media(max-width:420px){.exercise-photo-real{height:180px!important;}}
    `;
    document.head.appendChild(style);
  }

  function applyExercisePhotos(root){
    const scope = root || document;
    const cards = scope.querySelectorAll ? scope.querySelectorAll('.exercise-card[data-exercise-key]') : [];
    cards.forEach(card => {
      const key = card.dataset.exerciseKey;
      const imgSrc = window.EXERCISE_IMAGES && window.EXERCISE_IMAGES[key];
      if(!imgSrc || card.dataset.photoApplied === '1') return;
      const photo = card.querySelector('.exercise-photo');
      if(!photo) return;
      photo.classList.remove('placeholder-photo');
      photo.classList.add('exercise-photo-real');
      photo.innerHTML = `<img src="${imgSrc}" alt="Foto demonstrativa do exercício" loading="lazy">`;
      card.dataset.photoApplied = '1';
    });
  }

  function boot(){
    injectPhotoStyles();
    applyExercisePhotos(document);
    const target = document.getElementById('modalidadeList') || document.body;
    const observer = new MutationObserver(mutations => {
      mutations.forEach(m => m.addedNodes.forEach(node => applyExercisePhotos(node.nodeType === 1 ? node : document)));
    });
    observer.observe(target, {childList:true, subtree:true});
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
