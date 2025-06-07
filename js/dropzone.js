const dropzone = document.getElementById("dropzone");
const placeholder = dropzone.querySelector(".placeholder");
const validationButton = document.getElementById("btn-validation");
let loadedFiles = [];
const addedFileKeys = new Set(); 

dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "blue";
});

dropzone.addEventListener("dragleave", () => {
    dropzone.style.borderColor = "#ccc";
});

dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "#ccc";
    handleFiles(e.dataTransfer.files);
});

dropzone.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "application/pdf"; // Limite aux fichiers PDF
    input.style.display = "none";
    document.body.appendChild(input);

    input.addEventListener("change", (e) => {
        handleFiles(e.target.files);
        document.body.removeChild(input);
    });

    input.click();
});


function handleFiles(files) {
    for (const file of files) {

        if (file.type === "application/pdf") {
            // Créer une clé unique pour le fichier (par exemple, en utilisant son nom et sa taille)
            const fileKey = `${file.name}-${file.size}`;

            // Vérifier si le fichier a déjà été ajouté
            if (addedFileKeys.has(fileKey)) {
                console.log(`Le fichier "${file.name}" est déjà présent.`);
                continue; // Ignorer ce fichier si déjà ajouté
            }

            // Ajouter le fichier à la liste et au Set pour éviter les doublons
            loadedFiles.push(file);
            addedFileKeys.add(fileKey);

            const fileElement = document.createElement("div");
            fileElement.classList.add("file");

            fileElement.innerHTML = `
                <img src="https://cdn-icons-png.flaticon.com/512/337/337946.png" alt="file">
                <span>${file.name.length > 10 ? file.name.substring(0, 10) + "..." : file.name} <br> (${(file.size / 1024).toFixed(1)} KB)</span>
                <button class="delete-btn">🗑</button>
            `;

            fileElement.querySelector(".delete-btn").addEventListener("click", (event) => {
                event.stopPropagation();
                deleteFile(fileElement, file);
            });

            dropzone.appendChild(fileElement);
        } else {
            alert("Seuls les fichiers PDF sont pris en charge.");
        }
    }

    updatePlaceholder();
}


function deleteFile(fileElement, file) {
    fileElement.classList.add("removing"); // Animation de suppression
    setTimeout(() => {
        fileElement.remove();
        loadedFiles = loadedFiles.filter((f) => f !== file); // Supprime le fichier de la liste
        updatePlaceholder();
    }, 300); // Attendre 300ms pour l'effet smooth
}

function updatePlaceholder() {
    if (dropzone.querySelectorAll(".file").length === 0) {
        placeholder.style.opacity = "1";
    } else {
        placeholder.style.opacity = "0";
    }
}


// Fonction pour charger tous les fichiers ajoutés
validationButton.addEventListener("click", async () => {
  if (loadedFiles.length === 0) {
    alert("Aucun fichier à charger.");
    return;
  }
  

  // Reset les dictionnaires ainsi que les onglets et le content des onglets
  pdfStates = {};
  dictionnaryTextePdf = {};
  tabsContainer.innerHTML = '';
  contentContainer.innerHTML = '';
  
  // Afficher le loader avant de commencer le traitement
  laoderContainer.style.display = 'flex';
  percentage = 0;
  updateProgressBar();
  
  try {
    // Démarrage à 5%
    await animateProgress(0, 5, 100);
    
    // Calculer les plages de pourcentage pour chaque fichier
    const percentagePerFile = Math.floor(90 / loadedFiles.length); // 90% disponible (de 5% à 95%)
    
    for (let i = 0; i < loadedFiles.length; i++) {
      const file = loadedFiles[i];
      
      // Calculer les bornes de pourcentage pour ce fichier
      const fileStartPercent = Math.floor(5 + (i * percentagePerFile));
      const fileMiddlePercent = Math.floor(fileStartPercent + (percentagePerFile * 0.5));
      const fileEndPercent = Math.floor(fileStartPercent + percentagePerFile);
      
      // Phase 1: Chargement du PDF (première moitié du pourcentage alloué au fichier)
      await animateProgress(fileStartPercent, fileMiddlePercent, 200);
      const currentPdfDoc = await loadPDF(file);
      
      // Phase 2: Initialisation du PDF (seconde moitié du pourcentage)
      const sanitizedFileName = sanitizeFileName(file.name);
      pdfStates[sanitizedFileName] = new PDFState(currentPdfDoc);
      
      // Créer l'onglet et rendre le PDF
      initOnglets(file.name, sanitizedFileName, i);

      
      await renderAllPages(file.name, sanitizedFileName, currentPdfDoc).catch((err) => {
          console.error("Erreur lors du rendu des pages :", err);
      });
      
      // Mise à jour des contrôleurs pour le premier fichier
      if (i === 0) {

        initializeViewerControls(sanitizedFileName, pdfStates[sanitizedFileName]);
      }
      
      // Animer jusqu'à la fin du pourcentage alloué à ce fichier
      await animateProgress(fileMiddlePercent, fileEndPercent, 200);
    }
    
    // Animation finale (95% à 100%)
    await animateProgress(95, 100, 300);
    
    // Masquer le loader avec un délai
    setTimeout(() => {
      laoderContainer.style.display = 'none';
    }, 500);


    // Construire l'objet de catégories à partir de votre dictionnaire
    const categoriesData = {};

    // Pour chaque PDF (qui servira de catégorie principale)
    Object.keys(dictionnaryTextePdf).forEach(namePdf => {
        // Les pages serviront de sous-catégories (mais nous utiliserons leur valeur comme texte)
        const subCategories = [];
        
        // Pour chaque numéro de page dans ce PDF
        Object.keys(dictionnaryTextePdf[namePdf]).forEach(numeroPage => {
            // Utiliser un texte descriptif comme "Page X" comme sous-catégorie
            subCategories.push(`Page ${numeroPage}`);
        });
        
        // Ajouter cette entrée à notre objet de catégories
        categoriesData[namePdf] = subCategories;
    });


    // Initialiser le multiselect
    const multiselect = new Multiselect('multiselect-files', categoriesData);
    
  } catch (error) {
    console.error("Erreur lors du traitement des fichiers PDF :", error);
    statusText.textContent = "Une erreur est survenue";
    await animateProgress(percentage, 100, 300);
    setTimeout(() => {
      laoderContainer.style.display = 'none';
    }, 500);
  }


  document.querySelector('.viewer-controls').style.display = 'flex';
});

