let dictionnaryTextePdf;

pdfjsLib.GlobalWorkerOptions.workerSrc = '../librairies/pdf.workers.min.js';



async function renderAllPages(vraiNomPdf, sanitizedFilename, currentPdfDoc) {
    const panelContainer = document.getElementById(`panel-${sanitizedFilename}`);
    const state = pdfStates[sanitizedFilename];

    try {
        if (state.pageFormats.length === 0) {
            await state.initializePageFormats();
        }

        async function loadPage(pageNumber) {
            const page = await currentPdfDoc.getPage(pageNumber);
            const viewport = page.getViewport({ scale: state.currentZoom });

            const originalWidth = viewport.width / state.currentZoom;
            const originalHeight = viewport.height / state.currentZoom;

            const pageDiv = document.createElement('div');
            pageDiv.classList.add('pdf-page');
            pageDiv.setAttribute('data-page', pageNumber);
            pageDiv.setAttribute('data-original-width', originalWidth);
            pageDiv.setAttribute('data-original-height', originalHeight);

            const pageFormat = state.pageFormats[pageNumber - 1];
            pageDiv.setAttribute('data-format', pageFormat.size);
            pageDiv.setAttribute('data-orientation', pageFormat.orientation);

            pageDiv.style.position = 'relative';
            pageDiv.style.width = '100%';
            pageDiv.style.maxWidth = `${originalWidth}px`;
            pageDiv.style.aspectRatio = `${originalWidth} / ${originalHeight}`;
            pageDiv.style.margin = '20px auto';
            pageDiv.style.border = '1px solid #ccc';
            pageDiv.style.overflow = 'auto';

            // Afficher seulement la première page, masquer les autres
            pageDiv.style.display = pageNumber === 1 ? 'block' : 'none';

            panelContainer.appendChild(pageDiv);

            try {
                const textContent = await page.getTextContent();
                await renderTextContent(vraiNomPdf, pageNumber, pageDiv, textContent, viewport);
                const opList = await page.getOperatorList();
                await processImages(page, opList, pageDiv, viewport);
            } catch (error) {
                console.warn(`Erreur lors du traitement de la page ${pageNumber}:`, error);
            }
        }

        // Charger toutes les pages en parallèle
        await Promise.all(
            Array.from({ length: currentPdfDoc.numPages }, (_, i) => loadPage(i + 1))
        );

        updateFormatDisplay(sanitizedFilename);

    } catch (error) {
        console.error('Erreur lors du rendu des pages:', error);
    }
}

function loadPDF(file) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();

        fileReader.onerror = () => {
            reject(`Erreur lors de la lecture du fichier : ${file.name}`);
        };

        fileReader.onload = async (e) => {
            try {
                const typedArray = new Uint8Array(e.target.result);

                // Chargement du document PDF
                const loadingTask = pdfjsLib.getDocument(typedArray);

                // Attendez la résolution de la promesse
                loadingTask.promise
                    .then((pdfDoc) => {
                        resolve(pdfDoc); // Résolvez avec le document PDF
                    })
                    .catch((error) => {
                        reject(`Erreur lors du chargement du fichier ${file.name} : ${error.message}`);
                    });
            } catch (error) {
                reject(`Erreur inattendue lors du traitement de ${file.name} : ${error.message}`);
            }
        };

        fileReader.readAsArrayBuffer(file);
    });
}


function renderTextContent(namePdf,numeroPage,pageDiv, textContent, viewport) {

    let previousY = -1;
    let lineBuffer = [];
    const threshold = 5;
    const addedTexts = new Set();

    textContent.items.forEach((item) => {
        const text = item.str.trim();
        if (text.length > 0) {
            const fontSize = item.height || 12;
            const x = item.transform[4];
            const y = viewport.height - item.transform[5];
            const fontName = item.fontName || 'Arial';
            const uniqueKey = `${x}-${y}-${text}`;

            if (previousY === -1 || Math.abs(y - previousY) < threshold) {
                if (!addedTexts.has(uniqueKey)) {
                    lineBuffer.push({ text, x, y, fontSize, fontName, width: item.width });
                    addedTexts.add(uniqueKey);


                    if (!dictionnaryTextePdf.hasOwnProperty(namePdf)) {
                        dictionnaryTextePdf[namePdf] = {};  
                    }
                    
                    if (!dictionnaryTextePdf[namePdf].hasOwnProperty(numeroPage)) {
                        dictionnaryTextePdf[namePdf][numeroPage] = uniqueKey.replace(/[^\w\s]/g, '');  
                    } else {
                        dictionnaryTextePdf[namePdf][numeroPage] += uniqueKey.replace(/[^\w\s]/g, '');
                    }

                }
            } else {
                addLineToPage(pageDiv, lineBuffer);
                lineBuffer = [{ text, x, y, fontSize, fontName, width: item.width }];
                addedTexts.add(uniqueKey);

                if (!dictionnaryTextePdf.hasOwnProperty(namePdf)) {
                    dictionnaryTextePdf[namePdf] = {};  
                }
                    
                if (!dictionnaryTextePdf[namePdf].hasOwnProperty(numeroPage)) {
                    dictionnaryTextePdf[namePdf][numeroPage] = uniqueKey.replace(/[^\w\s]/g, '');  
                } else {
                    dictionnaryTextePdf[namePdf][numeroPage] += uniqueKey.replace(/[^\w\s]/g, '');
                }
            }
            previousY = y;
        }
    });

    if (lineBuffer.length > 0) {
        addLineToPage(pageDiv, lineBuffer);
    }

}

function addLineToPage(pageDiv, lineBuffer) {
    const lineDiv = document.createElement('div');
    lineDiv.classList.add('text-line');
    lineDiv.style.position = 'absolute';
    lineDiv.style.left = `${lineBuffer[0].x}px`;
    lineDiv.style.top = `${lineBuffer[0].y}px`;
    lineDiv.setAttribute('data-original-left', lineBuffer[0].x);
    lineDiv.setAttribute('data-original-top', lineBuffer[0].y);
    lineDiv.style.display = 'flex';
    lineDiv.style.alignItems = 'flex-end';

    lineBuffer.forEach(({ text, fontSize, fontName, width }, index) => {
        const span = document.createElement('span');
        span.textContent = text;
        span.classList.add('editable-text');
        span.style.fontSize = `${fontSize}px`;
        span.setAttribute('data-original-font-size', fontSize);
        span.style.fontFamily = fontName;
        span.style.whiteSpace = 'pre';
        
        // Add data attributes to preserve original properties
        span.setAttribute('data-original-text', text);
        span.setAttribute('data-original-font-name', fontName);


        if (index > 0) {
            const previousX = lineBuffer[index - 1].x + lineBuffer[index - 1].width;
            const space = lineBuffer[index].x - previousX;
            if (space > 0) {
                span.style.marginLeft = `${space}px`;
            }
        }

        lineDiv.appendChild(span);
    });

    pageDiv.appendChild(lineDiv);
    makeDraggableElement(lineDiv);

    lineDiv.contentEditable =true;
        

    configMenuWord(lineDiv);

    // Improved editing functionality
    lineDiv.addEventListener('dblclick', startEditing);

    function startEditing() {
        lineDiv.classList.add('editing');
        lineDiv.querySelectorAll('.editable-text').forEach(span => {
            span.setAttribute('contenteditable', 'true');
            span.addEventListener('blur', handleBlur);
            span.addEventListener('keydown', handleKeyDown);
        });
    }

    function handleBlur(event) {
        // Prevent immediate disabling if clicking on another span
        setTimeout(() => {
            if (!lineDiv.matches(':hover')) {
                disableEditing();
            }
        }, 100);
    }

    function handleKeyDown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            disableEditing();
        }
    }

    function disableEditing() {
        lineDiv.classList.remove('editing');
        lineDiv.querySelectorAll('.editable-text').forEach(span => {
            span.removeAttribute('contenteditable');
            span.removeEventListener('blur', handleBlur);
            span.removeEventListener('keydown', handleKeyDown);

            // Preserve original properties if content is deleted
            if (span.textContent.trim() === '') {
                span.textContent = span.getAttribute('data-original-text');
                span.style.fontSize = `${span.getAttribute('data-original-font-size')}px`;
                span.style.fontFamily = span.getAttribute('data-original-font-name');
            } else {
                // Update data attributes with new content
                span.setAttribute('data-original-text', span.textContent);
            }
        });
    }

    // Close editing when clicking outside
    document.addEventListener('click', (event) => {
        if (!lineDiv.contains(event.target)) {
            disableEditing();
        }
    });


}

// Désactive l'édition et enlève l'attribut contenteditable
function disableEditing(lineDiv) {
    lineDiv.classList.remove('editing');
    lineDiv.querySelectorAll('.editable-text').forEach(span => {
        span.removeAttribute('contenteditable');
    });
}


async function processImages(page, operatorList, pageDiv, viewport) {
    const state = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        transform: viewport.transform // On utilise la transformation du viewport pour plus de précision
    };

    for (let i = 0; i < operatorList.fnArray.length; i++) {
        const fn = operatorList.fnArray[i];
        const args = operatorList.argsArray[i];

        switch (fn) {
            case pdfjsLib.OPS.transform:
                state.transform = args;
                break;

            case pdfjsLib.OPS.paintImageXObject:
                try {
                    const imgData = await page.objs.get(args[0]);

                    // Créer le conteneur d'image
                    const imgContainer = document.createElement('div');
                    imgContainer.classList.add('image-container');
                    imgContainer.style.position = 'absolute';
                    imgContainer.style.overflow = 'hidden';

                    // Créer l'élément image
                    const img = document.createElement('img');
                    img.classList.add('pdf-image');
                    
                    // Créer un canvas avec les dimensions de l'image
                    const canvas = document.createElement('canvas');
                    canvas.width = imgData.width;
                    canvas.height = imgData.height;
                    const ctx = canvas.getContext('2d');

                    // Gérer le cas ImageBitmap
                    if (imgData.bitmap) {
                        const bitmap = await createImageBitmap(imgData.bitmap);
                        ctx.drawImage(bitmap, 0, 0);
                        bitmap.close();
                    } 
                    else if (imgData.data) {
                        const imageData = ctx.createImageData(imgData.width, imgData.height);
                        imageData.data.set(imgData.data);
                        ctx.putImageData(imageData, 0, 0);
                    }

                    img.src = canvas.toDataURL();

                    // Extraire les composants de la transformation
                    const [a, b, c, d, e, f] = state.transform;

                    // Calculer l'échelle et les dimensions
                    const scaleX = Math.sqrt(a * a + b * b);
                    const scaleY = Math.sqrt(c * c + d * d);

                    // Calculer la position finale pour 'x' et 'y'
                    // Ces coordonnées sont déjà transformées par le PDF
                    const x = e * viewport.scale; // X ajusté par le facteur de mise à l'échelle du viewport
                    const y = (viewport.height - (f * viewport.scale)) - (scaleY * viewport.scale); // Y ajusté par la mise à l'échelle et inversé

                    // Appliquer le positionnement
                    imgContainer.style.left = `${x}px`;
                    imgContainer.style.top = `${y}px`;
                    imgContainer.style.width = `${scaleX * viewport.scale}px`;
                    imgContainer.style.height = `${scaleY * viewport.scale}px`;

                    // Styles de l'image
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.display = 'block';

                    // Ajouter les contrôles
                    const controls = document.createElement('div');
                    controls.classList.add('image-controls');
                    controls.style.position = 'absolute';
                    controls.style.top = '0';
                    controls.style.left = '0';
                    controls.innerHTML = `
                        <button class="delete-image" style="font-size:10px">🗑</button>
                        <button class="replace-image" style="font-size:10px">🔄</button>
                    `;
                    
                    // Assembler les éléments
                    imgContainer.appendChild(img);
                    imgContainer.appendChild(controls);
                    pageDiv.appendChild(imgContainer);

                    // Rendre l'image déplaçable
                    makeDraggableElement(imgContainer);

                    // Ajouter les gestionnaires d'événements pour les boutons
                    setupImageControls(imgContainer);
                } catch (error) {
                    console.error('Error processing image:', error, error.stack);
                }
                break;
        }
    }
}

function setupImageControls(imgContainer) {
    const deleteBtn = imgContainer.querySelector('.delete-image');
    const replaceBtn = imgContainer.querySelector('.replace-image');
    
    deleteBtn.addEventListener('click', () => {
        imgContainer.remove();
    });
    
    replaceBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = imgContainer.querySelector('img');
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
        
        input.click();
    });
}