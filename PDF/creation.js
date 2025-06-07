let activePanel;
let pageCible;
const pageInput = document.querySelector('#pageInput');;
const btnCreationImage = document.getElementById('btn-creation-image');
const fileInput = document.getElementById('file-input');

function addText() {
    const pageCible = document.querySelector(`.panel.active .pdf-page[data-page="${pageInput.value}"]`);
  
    // Création du container déplaçable
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '100px';
    container.style.top = '100px';
    container.style.cursor = 'move';
    container.style.zIndex = '1000';
    container.style.padding = '8px';
    container.style.minWidth = '150px';
    container.style.maxWidth = '300px';
  
    // Création du texte éditable à l'intérieur
    const textDiv = document.createElement('div');
    textDiv.textContent = "Double-cliquez pour modifier...";
    textDiv.contentEditable = true;
    textDiv.style.outline = 'none'; // pour éviter un contour bleu par défaut
    textDiv.style.minHeight = '40px';
  
    container.appendChild(textDiv);
    pageCible.appendChild(container);
  
    // Rendre le container déplaçable (pas le texte directement)
    makeDraggableElement(container);
  }
  

function addImage(nouvelleImage) {
    const pageCible = document.querySelector(`.panel.active .pdf-page[data-page="${pageInput.value}"]`);

    if (!pageCible) {
        console.error("Page cible introuvable !");
        return;
    }

    if (nouvelleImage) {
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('image-container');
        imgContainer.style = "position: absolute; overflow: hidden; left: 72.425px; top: 430.71px; width: 450.38px; height: 219px; cursor: grab;";
        
        const img = document.createElement('img');
        img.src = URL.createObjectURL(nouvelleImage);
        img.style = "width: 100%; height: 100%; display: block;";


        imgContainer.appendChild(img);
        pageCible.appendChild(imgContainer);

        makeDraggableElement(imgContainer);
        setupImageControls(imgContainer);
    }
}




function addTable() {
    const pageCible = document.querySelector(`.panel.active .pdf-page[data-page="${pageInput.value}"]`);
    
    // Création du conteneur
    const tableContainer = document.createElement('div');
    tableContainer.style = "position: absolute; overflow: hidden; left: 72.425px; top: 430.71px; width: 450.38px; height: 219px; cursor: grab;";

    // Création de la table
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style = "width: 100%; height: 100%; display: block;";

    // Création de la première ligne pour les boutons de colonnes
    const headerRow = table.insertRow();
    headerRow.insertCell(); // Cellule vide pour le coin
    
    // Ajout des cellules de contrôle des colonnes
    for (let i = 0; i < 3; i++) {
        const cell = headerRow.insertCell();
        const btn = createButton('−', 'delete');
        btn.onclick = () => deleteColumn(i + 1);
        cell.appendChild(btn);
    }

    // Bouton d'ajout de colonne dans l'en-tête
    const addColumnCell = headerRow.insertCell();
    addColumnCell.appendChild(createButton('+', 'add'));

    // Ajouter l'événement d'ajout de colonne au bouton d'ajout
    addColumnCell.querySelector('button').onclick = addColumn;

    

    // Ajout des 3 lignes et 3 colonnes par défaut
    for (let i = 0; i < 1; i++) {
        const row = table.insertRow();
        
        // Bouton de suppression de ligne
        const deleteCell = row.insertCell();
        const deleteBtn = createButton('−', 'delete');
        deleteBtn.onclick = () => deleteRow(i + 1);
        deleteCell.appendChild(deleteBtn);

        // Cellules de données
        for (let j = 0; j < 3; j++) {
            const cell = row.insertCell();
            cell.contentEditable = true;
            cell.style.border = '1px solid #e0e0e0';
            cell.style.padding = '12px';
            cell.style.minWidth = '40px';
            cell.textContent = `Cell ${i + 1},${j + 1}`;
        }

        // Cellule vide à la fin
        row.insertCell();
    }

    // Ligne pour le bouton d'ajout de ligne
    const lastRow = table.insertRow();
    const addRowCell = lastRow.insertCell();
    const addRowBtn = createButton('+', 'add');
    addRowBtn.onclick = addNewRow;
    addRowCell.appendChild(addRowBtn);
    
    // Compléter la dernière ligne avec des cellules vides
    for (let i = 0; i < 4; i++) {
        lastRow.insertCell();
    }

    // Style des cellules de contrôle
    const controlCells = table.querySelectorAll('td:first-child, td:last-child');
    controlCells.forEach(cell => {
        cell.style.border = 'none';
        cell.style.padding = '0 8px';
        cell.style.width = '40px';
    });

    // Fonctions pour manipuler la table
    function addNewRow() {
        const rowIndex = table.rows.length - 1;
        const row = table.insertRow(rowIndex);
        
        // Bouton de suppression
        const deleteCell = row.insertCell();
        const deleteBtn = createButton('−', 'delete');
        deleteBtn.onclick = () => deleteRow(rowIndex);
        deleteCell.appendChild(deleteBtn);

        // Cellules de données
        for (let j = 0; j < table.rows[0].cells.length - 2; j++) {
            const cell = row.insertCell();
            cell.contentEditable = true;
            cell.style.border = '1px solid #e0e0e0';
            cell.style.padding = '12px';
            cell.textContent = `Cell ${rowIndex},${j + 1}`;
        }
        row.insertCell(); // Cellule vide à la fin
    }

    function deleteRow(index) {
        if (table.rows.length > 4) { // Minimum 2 lignes de données
            table.deleteRow(index);
        }
    }

    function addColumn() {
        const colIndex = table.rows[0].cells.length - 1;
        // Ajouter bouton de suppression dans l'en-tête
        const headerCell = table.rows[0].insertCell(colIndex);
        const deleteBtn = createButton('−', 'delete');
        deleteBtn.onclick = () => deleteColumn(colIndex);
        headerCell.appendChild(deleteBtn);

        // Ajouter cellules de données
        for (let i = 1; i < table.rows.length - 1; i++) {
            const cell = table.rows[i].insertCell(colIndex);
            cell.contentEditable = true;
            cell.style.border = '1px solid #e0e0e0';
            cell.style.padding = '12px';
            cell.textContent = `Cell ${i},${colIndex}`;
        }
        table.rows[table.rows.length - 1].insertCell(colIndex);
    }

    function deleteColumn(index) {
        if (table.rows[0].cells.length > 4) { // Minimum 2 colonnes de données
            for (let i = 0; i < table.rows.length; i++) {
                table.rows[i].deleteCell(index);
            }
        }
    }

    function createButton(text, type) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.className = 'btn btn-' + type;
        btn.style.width = '24px';
        btn.style.height = '24px';
        btn.style.borderRadius = '4px';
        btn.style.border = '1px solid #ddd';
        btn.style.background = 'white';
        btn.style.cursor = 'pointer';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.fontSize = '18px';
        btn.style.color = type === 'add' ? '#4CAF50' : '#f44336';
        return btn;
    }

    // Ajout des éléments au conteneur
    tableContainer.appendChild(table);
    pageCible.appendChild(tableContainer);

    // Rendre la table déplaçable
    makeDraggableElement(tableContainer);
}


document.querySelector('#btn-text-texte').addEventListener('click', (event) => {
    activePanel = document.querySelector('.panel.active');

    if(activePanel && pageInput.value != 0){
        addText();     
    }
});

btnCreationImage.addEventListener('click', function() {
    fileInput.click();
});

fileInput.addEventListener('change', function() {
    if (fileInput.files.length > 0) {
        const fileName = fileInput.files[0].name;
        addImage(fileInput.files[0]);
    }
});

document.querySelector('#btn-creation-tableau').addEventListener('click', (event) => {
    activePanel = document.querySelector('.panel.active');

    if(activePanel && pageInput.value != 0){
        addTable();    
    }
});

async function addPage(sanitizedFilename) {
    const state = pdfStates[sanitizedFilename];
    if (!state) {
        console.error("État PDF introuvable pour", sanitizedFilename);
        return;
    }

    const { currentPdfDoc, totalPages, pageFormats } = state;
    state.totalPages += 1;
    state.currentPage = state.totalPages;

    // Déterminer le format de la dernière page
    const lastPageFormat = pageFormats[totalPages - 1] || { width: 595, height: 842, orientation: "portrait", size: "A4" };
    state.pageFormats.push({ ...lastPageFormat });

    // Créer un conteneur pour la nouvelle page
    const panelContainer = document.getElementById(`panel-${sanitizedFilename}`);
    if (!panelContainer) {
        console.error("Panel introuvable pour", sanitizedFilename);
        return;
    }

    const newPageDiv = document.createElement("div");
    newPageDiv.classList.add("pdf-page");
    newPageDiv.setAttribute("data-page", totalPages + 1);
    newPageDiv.setAttribute("data-original-width", lastPageFormat.width);
    newPageDiv.setAttribute("data-original-height", lastPageFormat.height);
    newPageDiv.setAttribute("data-format", lastPageFormat.size);
    newPageDiv.setAttribute("data-orientation", lastPageFormat.orientation);
    newPageDiv.style.position = "relative";
    newPageDiv.style.width = "100%";
    newPageDiv.style.maxWidth = `${lastPageFormat.width}px`;
    newPageDiv.style.aspectRatio = `${lastPageFormat.width} / ${lastPageFormat.height}`;
    newPageDiv.style.margin = "20px auto";
    newPageDiv.style.border = "1px solid #ccc";
    newPageDiv.style.overflow = "auto";
    newPageDiv.style.display = "none"; // Cachée par défaut

    panelContainer.appendChild(newPageDiv);


    // Mettre à jour les contrôles d'affichage
    updateViewerControls(sanitizedFilename);

    updatePageVisibility(state.currentPage, sanitizedFilename);
}


async function removePage(sanitizedFilename, pageNumber) {
    const state = pdfStates[sanitizedFilename];
    if (!state || pageNumber < 1 || pageNumber > state.totalPages) {
        console.warn("Numéro de page invalide ou état du PDF introuvable.");
        return;
    }

    // Supprimer l'affichage de la page
    const pageDiv = document.querySelector(`#panel-${sanitizedFilename} .pdf-page[data-page="${pageNumber}"]`);
    if (pageDiv) {
        pageDiv.remove();
    }

    // Supprimer les informations sur la page
    state.pageFormats.splice(pageNumber - 1, 1);
    state.totalPages--;

    // Réorganiser les numéros des pages restantes
    const allPages = document.querySelectorAll(`#panel-${sanitizedFilename} .pdf-page`);
    allPages.forEach((page, index) => {
        page.setAttribute('data-page', index + 1);
    });

    // Mettre à jour la pagination
    if (state.currentPage > state.totalPages) {
        state.currentPage = state.totalPages;
    }

    updateViewerControls(sanitizedFilename);
    updatePageVisibility(state.currentPage, sanitizedFilename);
}


function creerPdf(sanitizedFilename) {
    const pages = document.querySelectorAll(`#panel-${sanitizedFilename} .pdf-page`);
    if (pages.length === 0) {
      console.error("Aucune page trouvée !");
      return;
    }
  
    const pdf = new jspdf.jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
  
    let isFirstPage = true;
  
    function capturePage(index) {
      if (index >= pages.length) {
        pdf.save(`${sanitizedFilename}.pdf`);
        console.log("PDF généré avec succès !");
        return;
      }
  
      const page = pages[index];
      const originalDisplay = page.style.display;
      page.style.display = 'block';
  
      if (page.offsetWidth === 0 || page.offsetHeight === 0) {
        console.error(`Page ${index + 1} invisible ou vide`);
        page.style.display = originalDisplay;
        capturePage(index + 1);
        return;
      }
  
      html2canvas(page, { scale: 2, useCORS: true, allowTaint: false }).then(canvas => {
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const imgWidth = 210; // Largeur A4
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
        if (!isFirstPage) {
          pdf.addPage();
        } else {
          isFirstPage = false;
        }
  
        // Ajout de marges pour améliorer l'espacement
        pdf.setPage(pdf.internal.getNumberOfPages());
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.setLineHeightFactor(1.5); // Augmente l'interligne
  
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        console.log(`Page ${index + 1} capturée`);
  
        page.style.display = originalDisplay;
        setTimeout(() => capturePage(index + 1), 300);
      }).catch(error => {
        console.error(`Erreur lors de la capture de la page ${index + 1} :`, error);
        page.style.display = originalDisplay;
        capturePage(index + 1);
      });
    }
  
    capturePage(0);
  }