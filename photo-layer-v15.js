// v15 - Corrige exibicao das fotos dos exercicios.
// Aplica imagem especifica quando existir e usa fallback quando a chave do exercicio nao tiver imagem propria.
(function(){
  function firstImage(){
    const images = window.EXERCISE_IMAGES || {};
    const keys = Object.keys(images);
    return keys.length ? images[keys[0]] : '';
  }

  function applyExercisePhotos(root){
    const scope = root && root.querySelectorAll ? root : document;
    const cards = scope.querySelectorAll('.exercise-card[data-exercise-key]');
    const fallback = firstImage();
    cards.forEach(card => {
      const key = card.dataset.exerciseKey;
      const imgSrc = (window.EXERCISE_IMAGES && window.EXERCISE_IMAGES[key]) || fallback;
      const photo = card.querySelector('.exercise-photo');
      if(!photo || !imgSrc) return;
      if(card.dataset.photoApplied === '1' && photo.querySelector('img')) return;
      photo.classList.remove('placeholder-photo');
      photo.classList.add('exercise-photo-real');
      photo.innerHTML = `<img src="${imgSrc}" alt="Foto demonstrativa do exercício" loading="lazy"><span class="photo-caption">Foto demonstrativa</span>`;
      card.dataset.photoApplied = '1';
    });
  }

  function boot(){
    applyExercisePhotos(document);
    const target = document.getElementById('modalidadeList') || document.body;
    const observer = new MutationObserver(() => applyExercisePhotos(document));
    observer.observe(target, {childList:true, subtree:true});
    window.applyExercisePhotos = applyExercisePhotos;
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();