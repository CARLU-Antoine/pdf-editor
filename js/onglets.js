const tabsContainer = document.querySelector('.tabs');
const contentContainer = document.querySelector('.content');

function initOnglets(fileName,sanitizedFileName, index) {
    // Créer un onglet
    const tab = document.createElement('div');
    tab.classList.add('tab');
    if (index === 0) tab.classList.add('active'); // Premier onglet actif par défaut
    tab.innerHTML = `<span class="pdf-icon"></span> ${fileName}`;
    tab.addEventListener('click', (evt) => openTab(evt,fileName, `panel-${sanitizedFileName}`));

    // Ajouter l'onglet au conteneur
    tabsContainer.appendChild(tab);

    // Créer le contenu correspondant
    const panel = document.createElement('div');
    panel.classList.add('panel');
    if (index === 0) panel.classList.add('active'); // Premier panneau actif par défaut
    panel.id = `panel-${sanitizedFileName}`;

    // Ajouter le contenu au conteneur
    contentContainer.appendChild(panel);

}

// Fonction pour gérer l'activation des onglets
function openTab(evt,fileName, panelId) {

    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.panel');

    // Désactiver tous les onglets et panneaux
    tabs.forEach(tab => tab.classList.remove('active'));
    panels.forEach(panel => panel.classList.remove('active'));

    // Activer l'onglet et le panneau sélectionnés
    evt.currentTarget.classList.add('active');
    const panel = document.getElementById(panelId);
    panel.classList.add('active');

    // Récupérer le nom du fichier à partir de panelId
    const sanitizedFilename = panelId.replace("panel-", "");


    // Configurer les contrôles après qu'ils soient dans le DOM
    initializeViewerControls(sanitizedFilename, pdfStates[sanitizedFilename]);


}


function sanitizeFileName(fileName) {
    return fileName
        .replace(/\s+/g, '-')       // Remplace tous les espaces par des tirets
        .replace(/[^a-zA-Z0-9-]/g, '') // Supprime tous les caractères non alphanumériques sauf les tirets
        .toLowerCase();             // Met en minuscule pour plus de cohérence
}


function togglePanel() {
    const panel = document.getElementById('settingsPanel');
    panel.classList.toggle('open');
}

