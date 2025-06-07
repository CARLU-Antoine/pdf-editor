let pdfStates = {};
class PDFState {
    constructor(currentPdfDoc) {
        this.currentPdfDoc = currentPdfDoc;
        this.currentZoom = 1;
        this.currentPage = 1;
        this.pageFormats = [];
        this.totalPages = currentPdfDoc.numPages;
    }

    // Méthode pour initialiser les formats de page
    async initializePageFormats() {
        for (let pageNumber = 1; pageNumber <= this.totalPages; pageNumber++) {
            const page = await this.currentPdfDoc.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 1 });
            
            // Détecter le format et l'orientation
            const format = this.determinePageFormat(viewport.width, viewport.height);
            
            this.pageFormats[pageNumber - 1] = {
                width: viewport.width,
                height: viewport.height,
                orientation: format.orientation,
                size: format.size
            };
        }
    }

    determinePageFormat(width, height) {
        // Conversion de points (pt) en millimètres (mm)
        const ptToMm = 0.352778;
        const widthMm = width * ptToMm;
        const heightMm = height * ptToMm;

        // Déterminer l'orientation
        const orientation = width > height ? 'paysage' : 'portrait';

        // Formats standard en mm avec une marge de tolérance de 2mm
        const formats = {
            'A4': { width: 210, height: 297 },
            'A3': { width: 297, height: 420 },
            'A5': { width: 148, height: 210 },
            'Letter': { width: 215.9, height: 279.4 }
        };

        // Détecter le format standard
        let size = 'personnalisé';
        for (const [formatName, dimensions] of Object.entries(formats)) {
            if (
                (Math.abs(widthMm - dimensions.width) < 2 && Math.abs(heightMm - dimensions.height) < 2) ||
                (Math.abs(widthMm - dimensions.height) < 2 && Math.abs(heightMm - dimensions.width) < 2)
            ) {
                size = formatName;
                break;
            }
        }

        return { orientation, size };
    }

    getCurrentPageFormat() {
        return this.pageFormats[this.currentPage - 1];
    }

    
}


function updateFormatDisplay(sanitizedFilename) {
    const state = pdfStates[sanitizedFilename];
    const currentFormat = state.getCurrentPageFormat();
    
    // Mettre à jour l'affichage du format si les éléments existent
    const formatDisplay = document.getElementById('formatDisplay');
    if (formatDisplay) {
        formatDisplay.textContent = `Format: ${currentFormat.size} - ${currentFormat.orientation}`;
    }
}


function initializeViewerControls(sanitizedFilename, state) {

    const totalPagesElement = document.getElementById(`totalPages`);
    const pageInputElement = document.getElementById(`pageInput`);


    totalPagesElement.textContent = state.totalPages;
    pageInputElement.max = state.totalPages;
    pageInputElement.value = state.currentPage;


    
    setupEventListeners(sanitizedFilename);
}
function setupEventListeners(sanitizedFilename) {
    const state = pdfStates[sanitizedFilename];
    if (!state) return;

    // Événements de navigation
    const prevButton = document.getElementById(`prevPage`);
    const nextButton = document.getElementById(`nextPage`);
    const pageInput = document.getElementById(`pageInput`);
    const zoomInButton = document.getElementById(`zoomIn`);
    const zoomOutButton = document.getElementById(`zoomOut`);
    const fullScreenButton = document.getElementById(`fullScreen`);
    const addPageButton = document.getElementById(`btn-ajout-page`);
    const deletePageButton = document.getElementById(`btn-suppression-page`);
    const selectedFormat = document.getElementById('select-format');
    const selectedOrientation = document.getElementById('select-orientation');
    const btnTelechargementPdf = document.getElementById('btn-telechargement-pdf');

    if (prevButton) {
        prevButton.onclick = () => {
            if (state.currentPage > 1) {
                // Mise à jour explicite du dictionnaire
                state.currentPage = state.currentPage - 1;
                updatePageVisibility(state.currentPage, sanitizedFilename);
            }
        };
    }

    if (nextButton) {
        nextButton.onclick = () => {
            if (state.currentPage < state.totalPages) {
                // Mise à jour explicite du dictionnaire
                state.currentPage = state.currentPage + 1;
                updatePageVisibility(state.currentPage, sanitizedFilename);
            }
        };
    }

    if (pageInput) {
        pageInput.onchange = (e) => {
            const pageNumber = parseInt(e.target.value);
            if (!isNaN(pageNumber)) {
                // Mise à jour explicite du dictionnaire
                state.currentPage = pageNumber;
                updatePageVisibility(state.currentPage, sanitizedFilename);
            }
        };
    }

    // Ajouter une nouvelle page au PDF courant
    if (addPageButton) {
        addPageButton.onclick = () => {
            addPage(sanitizedFilename);
        };
    }

    // Supprimer une page au PDF courant
    if (deletePageButton) {
        deletePageButton.onclick = () => {
            const pageNumber = parseInt(state.currentPage);
            removePage(sanitizedFilename, pageNumber);
        };
    }

    if (zoomInButton) {
        zoomInButton.onclick = () => changeZoom(0.1, sanitizedFilename);
    }

    if (zoomOutButton) {
        zoomOutButton.onclick = () => changeZoom(-0.1, sanitizedFilename);
    }

    if (fullScreenButton) {
        fullScreenButton.onclick = () => toggleFullScreen();
    }

   // Gestion du changement de format
    if (selectedFormat) {
        selectedFormat.addEventListener('change', () => {
            const selectedSize = selectedFormat.value;

            // Mettre à jour le format de toutes les pages
            state.pageFormats.forEach((page, index) => {
                page.size = selectedSize;
            });

            // Récupérer les dimensions standards
            const formats = {
                'A4': { width: 210, height: 297 },
                'A3': { width: 297, height: 420 },
                'A5': { width: 148, height: 210 },
                'Letter': { width: 215.9, height: 279.4 }
            };

            // Sélectionner toutes les pages
            document.querySelectorAll(`#panel-${sanitizedFilename} .pdf-page`).forEach((pageDiv, index) => {
                const currentOrientation = state.pageFormats[index].orientation;
                const dimensions = formats[selectedSize];

                if (dimensions) {
                    // Calculer la largeur et la hauteur en fonction de l'orientation
                    const width = currentOrientation === 'paysage' ? dimensions.height : dimensions.width;
                    const height = currentOrientation === 'paysage' ? dimensions.width : dimensions.height;

                    // Convertir mm en pixels (approximativement)
                    const pixelWidth = width * 2.83465;
                    const pixelHeight = height * 2.83465;

                    // Mettre à jour les attributs et styles
                    pageDiv.setAttribute('data-original-width', pixelWidth);
                    pageDiv.setAttribute('data-original-height', pixelHeight);
                    pageDiv.setAttribute('data-format', selectedSize);

                    pageDiv.style.maxWidth = `${pixelWidth}px`;
                    pageDiv.style.aspectRatio = `${width} / ${height}`;
                }
            });

            // Mettre à jour l'affichage du format
            updateFormatDisplay(sanitizedFilename);
        });
    }

    // Gestion du changement d'orientation
    if (selectedOrientation) {
        selectedOrientation.addEventListener('change', () => {
            const selectedOrient = selectedOrientation.value.toLowerCase();

            // Mettre à jour l'orientation de toutes les pages
            state.pageFormats.forEach((page) => {
                page.orientation = selectedOrient;
            });

            // Récupérer les dimensions standards
            const formats = {
                'A4': { width: 210, height: 297 },
                'A3': { width: 297, height: 420 },
                'A5': { width: 148, height: 210 },
                'Letter': { width: 215.9, height: 279.4 }
            };

            // Sélectionner toutes les pages
            document.querySelectorAll(`#panel-${sanitizedFilename} .pdf-page`).forEach((pageDiv, index) => {
                const currentFormat = state.pageFormats[index].size;
                const dimensions = formats[currentFormat];

                if (dimensions) {
                    // Calculer la largeur et la hauteur en fonction de la nouvelle orientation
                    const width = selectedOrient === 'paysage' ? dimensions.height : dimensions.width;
                    const height = selectedOrient === 'paysage' ? dimensions.width : dimensions.height;

                    // Convertir mm en pixels (approximativement)
                    const pixelWidth = width * 2.83465;
                    const pixelHeight = height * 2.83465;

                    // Mettre à jour les attributs et styles
                    pageDiv.setAttribute('data-original-width', pixelWidth);
                    pageDiv.setAttribute('data-original-height', pixelHeight);
                    pageDiv.setAttribute('data-orientation', selectedOrient);

                    pageDiv.style.maxWidth = `${pixelWidth}px`;
                    pageDiv.style.aspectRatio = `${width} / ${height}`;
                }
            });

            // Mettre à jour l'affichage du format
            updateFormatDisplay(sanitizedFilename);
        });
    }

    if(btnTelechargementPdf){
        btnTelechargementPdf.onclick = () => {
            creerPdf(sanitizedFilename);
        };
    }

}

function updateViewerControls(sanitizedFilename) {
    const state = pdfStates[sanitizedFilename];

    // Mettre à jour les infos de page
    document.getElementById(`totalPages`).textContent = state.totalPages;
    document.getElementById(`pageInput`).value = state.currentPage;
    document.getElementById(`pageInput`).max = state.totalPages;

    // Mettre à jour le niveau de zoom
    document.getElementById(`zoomLevel`).textContent = `${Math.round(state.currentZoom * 100)}%`;

    // Afficher la bonne page
    updatePageVisibility(state.currentPage, sanitizedFilename);
}


function updatePageVisibility(pageNumber, sanitizedFilename) {
    const state = pdfStates[sanitizedFilename];
    state.currentPage = pageNumber;
    document.getElementById(`pageInput`).value = pageNumber;

    const allPages = document.querySelectorAll(`#panel-${sanitizedFilename} .pdf-page`);
    allPages.forEach(page => page.style.display = 'none');

    const currentPageDiv = document.querySelector(`#panel-${sanitizedFilename} .pdf-page[data-page="${pageNumber}"]`);
    if (currentPageDiv) {
        currentPageDiv.style.display = 'block';
        // Mettre à jour l'affichage du format
        updateFormatDisplay(sanitizedFilename);
    }
}

// Appliquer la classe fullscreen lorsque l'état du plein écran change
document.addEventListener('fullscreenchange', function() {
    if (document.fullscreenElement) {
        document.body.classList.add('fullscreen');
    } else {
        document.body.classList.remove('fullscreen');
    }
});


function changeZoom(delta, sanitizedFilename) {
    const state = pdfStates[sanitizedFilename];
    if (!state) return;

    state.currentZoom = Math.max(0.5, Math.min(3, state.currentZoom + delta)); 
    document.getElementById(`zoomLevel`).textContent = `${Math.round(state.currentZoom * 100)}%`;

    // Applique le zoom uniquement sur les éléments internes (comme les images, le texte)
    document.querySelectorAll(`#panel-${sanitizedFilename} .pdf-page *`).forEach(element => {
        // Pour chaque élément à l'intérieur de .pdf-page, on applique la transformation
        element.style.transform = `scale(${state.currentZoom})`;
        element.style.transformOrigin = 'top left'; // Origine du zoom en haut à gauche
        element.style.transition = 'transform 0.2s ease-in-out'; // Animation fluide pour le zoom
    });
}


function toggleFullScreen() {
    const tabsContainer = document.querySelector('.tabs-container');
    if (document.fullscreenElement) {
        // Sortir du plein écran
        document.exitFullscreen();
    } else {
        // Passer en plein écran
        if (tabsContainer.requestFullscreen) {
            tabsContainer.requestFullscreen();
        } else if (tabsContainer.mozRequestFullScreen) { // Firefox
            tabsContainer.mozRequestFullScreen();
        } else if (tabsContainer.webkitRequestFullscreen) { // Chrome, Safari, Opera
            tabsContainer.webkitRequestFullscreen();
        } else if (tabsContainer.msRequestFullscreen) { // IE/Edge
            tabsContainer.msRequestFullscreen();
        }
    }
}



