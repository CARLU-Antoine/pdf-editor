let percentage = 0;
const progressBar = document.getElementById('progress');
const percentageText = document.querySelector('.percentage');
const laoderContainer = document.querySelector('.loader-container');
const icons = [
  document.getElementById('icon1'),
  document.getElementById('icon2'),
  document.getElementById('icon3')
];
const statusText = document.querySelector('.status-text');
const statusMessages = [
    "Démarrage de l'analyse...",
    "Lecture des documents PDF...",
    "Analyse intelligente en cours...",
    "Finalisation du traitement..."
];

// Fonction pour mettre à jour la progression de manière fluide
function updateProgressBar() {
  progressBar.style.width = percentage + '%';
  percentageText.textContent = percentage + '%';
  updateIconsAndStatus();
}

// Fonction pour mettre à jour les icônes et le texte de statut
function updateIconsAndStatus() {
  // Mise à jour des icônes
  if (percentage < 33) {
    icons.forEach(icon => icon.classList.remove('active'));
    icons[0].classList.add('active');
  } else if (percentage < 66) {
    icons.forEach(icon => icon.classList.remove('active'));
    icons[1].classList.add('active');
  } else {
    icons.forEach(icon => icon.classList.remove('active'));
    icons[2].classList.add('active');
  }
  
  // Mise à jour du message de statut
  if (percentage < 25) {
    statusText.textContent = statusMessages[0];
  } else if (percentage < 50) {
    statusText.textContent = statusMessages[1];
  } else if (percentage < 75) {
    statusText.textContent = statusMessages[2];
  } else {
    statusText.textContent = statusMessages[3];
  }
}


// Fonction d'animation de la barre de progression améliorée
async function animateProgress(startValue, endValue, duration) {
  return new Promise(resolve => {
      const startTime = performance.now();
      let animationFrameId;
      
      function updateFrame(currentTime) {
          const elapsedTime = currentTime - startTime;
          
          if (elapsedTime < duration) {
              // Utiliser une fonction d'accélération pour une animation plus fluide
              const progress = elapsedTime / duration;
              const smoothProgress = 0.5 * (1 - Math.cos(progress * Math.PI));
              percentage = Math.floor(startValue + (endValue - startValue) * smoothProgress);
              updateProgressBar();
              animationFrameId = requestAnimationFrame(updateFrame);
          } else {
              // Finaliser l'animation
              percentage = Math.floor(endValue);
              updateProgressBar();
              cancelAnimationFrame(animationFrameId);
              resolve();
          }
      }
      
      animationFrameId = requestAnimationFrame(updateFrame);
  });
}