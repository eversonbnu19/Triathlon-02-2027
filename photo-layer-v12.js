// v12 - aplica fotos internas aos cards de exercicios.
(function(){
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
