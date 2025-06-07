// Version modifiée de configMenuWord pour mieux gérer les sélections
function configMenuWord(element) {
    const toolbar = document.getElementById('wordToolbar');
    let currentSelection = null;
    let isDragging = false;
    let offsetX, offsetY;
    
    // Fonctions de gestion de la sélection
    function saveSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            return selection.getRangeAt(0).cloneRange();
        }
        return null;
    }
    
    function restoreSelection(savedSelection) {
        if (savedSelection) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(savedSelection);
        }
    }
    
    // Positionner la toolbar
    function positionToolbar(e) {
        const x = e.clientX+20;
        const y = e.clientY+20;
        
        currentSelection = saveSelection();
        
        // Vérifier que la sélection est bien dans l'élément éditable
        if (currentSelection && isSelectionInElement(currentSelection, element)) {
            const toolbarRect = toolbar.getBoundingClientRect();
            const maxX = window.innerWidth - toolbarRect.width;
            const maxY = window.innerHeight - toolbarRect.height;
            
            toolbar.style.left = `${Math.min(x, maxX)}px`;
            toolbar.style.top = `${Math.min(y, maxY)}px`;
            toolbar.style.display = 'block';
            
            // Mettre à jour l'état des boutons en fonction de la sélection actuelle
            updateButtonStates();
        }
    }
    
    // Vérifier si la sélection est à l'intérieur de l'élément éditable
    function isSelectionInElement(range, targetElement) {
        let container = range.commonAncestorContainer;
        
        // Remonter jusqu'à trouver un élément
        while (container && container.nodeType !== 1) {
            container = container.parentNode;
        }
        
        // Vérifier si l'élément ou un de ses ancêtres est l'élément cible
        while (container) {
            if (container === targetElement) {
                return true;
            }
            container = container.parentNode;
        }
        
        return false;
    }
    
    // Mettre à jour l'état visuel des boutons en fonction de la sélection
    function updateButtonStates() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            // Mise à jour des boutons de formatage
            document.getElementById('boldButton').classList.toggle('active', document.queryCommandState('bold'));
            document.getElementById('italicButton').classList.toggle('active', document.queryCommandState('italic'));
            document.getElementById('underlineButton').classList.toggle('active', document.queryCommandState('underline'));
            
            // Récupérer l'élément parent du texte sélectionné
            let parentElement = selection.anchorNode;
            if (parentElement.nodeType === 3) { // Nœud texte
                parentElement = parentElement.parentElement;
            }
            
            if (parentElement) {
                const computedStyle = window.getComputedStyle(parentElement);
                
                // Police
                const fontFamily = computedStyle.fontFamily.replace(/"/g, '').split(',')[0];
                const fontSelect = document.getElementById('fontSelect');
                for (let i = 0; i < fontSelect.options.length; i++) {
                    if (fontSelect.options[i].value === fontFamily) {
                        fontSelect.selectedIndex = i;
                        break;
                    }
                }
                
                // Couleur de texte et surlignage
                if (computedStyle.color) {
                    document.getElementById('textColorInput').value = rgbToHex(computedStyle.color);
                }
                if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                    document.getElementById('highlightColorInput').value = rgbToHex(computedStyle.backgroundColor);
                }
                
                // Taille de la police
                const fontSize = parseInt(computedStyle.fontSize);
                const sizeSelect = document.getElementById('sizeSelect');
                const sizeMap = {
                    8: '1',
                    9: '2',
                    10: '3',
                    11: '4',
                    12: '5',
                    13: '6',
                    14: '7'
                };
                
                if (sizeMap[fontSize]) {
                    sizeSelect.value = sizeMap[fontSize];
                }
            }
        }
    }
    
    // Convertir RGB en Hex pour les couleurs
    function rgbToHex(rgb) {
        if (!rgb || rgb === 'rgba(0, 0, 0, 0)') return '#000000';
        
        const rgbMatch = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }
        return rgb;
    }
    
    // Fermer les menus déroulants
    function closeAllDropdowns() {
        document.querySelectorAll('.color-dropdown, .styles-dropdown').forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    }
    
    // Appliquer une commande de formatage
    function applyFormatCommand(command, value = null) {
        // S'assurer que l'élément a le focus
        if (document.activeElement !== element) {
            element.focus();
        }
        
        restoreSelection(currentSelection);
        document.execCommand(command, false, value);
        currentSelection = saveSelection();
        updateButtonStates();
    }
    
    // Gestionnaires d'événements pour la toolbar
    element.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        positionToolbar(e);
    });
    
    element.addEventListener('mouseup', function(e) {
        if (e.button !== 2) {
            currentSelection = saveSelection();
            if (toolbar.style.display === 'block') {
                updateButtonStates();
            }
        }
    });
    
    document.addEventListener('click', function(e) {
        if (!toolbar.contains(e.target) && e.target !== element) {
            toolbar.style.display = 'none';
            closeAllDropdowns();
        }
    });
    
    // Déplacement de la toolbar
    toolbar.querySelector('.top-row').addEventListener('mousedown', function(e) {
        if (e.target === this || e.target.classList.contains('drag-handle')) {
            isDragging = true;
            offsetX = e.clientX - toolbar.offsetLeft;
            offsetY = e.clientY - toolbar.offsetTop;
            document.body.style.cursor = 'move';
            e.preventDefault(); // Empêcher la sélection de texte pendant le déplacement
        }
    });
    
    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            toolbar.style.left = `${Math.max(0, e.clientX - offsetX)}px`;
            toolbar.style.top = `${Math.max(0, e.clientY - offsetY)}px`;
        }
    });
    
    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            document.body.style.cursor = 'default';
            restoreSelection(currentSelection);
        }
    });
    
    // Configuration des gestionnaires d'événements pour les boutons
    const buttonHandlers = {
        'boldButton': () => applyFormatCommand('bold'),
        'italicButton': () => applyFormatCommand('italic'),
        'underlineButton': () => applyFormatCommand('underline'),
        'bulletListButton': () => applyFormatCommand('insertUnorderedList'),
        'numberedListButton': () => applyFormatCommand('insertOrderedList'),
        'outdentButton': () => applyFormatCommand('outdent'),
        'indentButton': () => applyFormatCommand('indent'),
        'clearFormatButton': () => applyFormatCommand('removeFormat')
    };
    
    // Attacher les gestionnaires aux boutons
    Object.entries(buttonHandlers).forEach(([id, handler]) => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', handler);
        }
    });
    
    // Gestionnaires pour les couleurs
    document.getElementById('textColorInput').addEventListener('change', function() {
        applyFormatCommand('foreColor', this.value);
    });
    
    document.getElementById('highlightColorInput').addEventListener('change', function() {
        applyFormatCommand('hiliteColor', this.value);
    });
    
    // Gestionnaire pour les styles
    document.getElementById('stylesButton').addEventListener('click', function(e) {
        const stylesDropdown = document.getElementById('stylesDropdown');
        stylesDropdown.style.display = stylesDropdown.style.display === 'none' ? 'block' : 'none';
        e.stopPropagation();
    });
    
    document.querySelectorAll('.style-option').forEach(function(option) {
        option.addEventListener('click', function() {
            applyFormatCommand('formatBlock', this.dataset.style);
            document.getElementById('stylesDropdown').style.display = 'none';
        });
    });
    
    // Gestionnaires pour la taille de police
    document.getElementById('sizeUpButton').addEventListener('click', function() {
        try {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                let node = selection.anchorNode;
                if (node.nodeType === 3) node = node.parentElement;
                
                const fontSize = parseInt(window.getComputedStyle(node).fontSize);
                const newSize = (fontSize + 1) + 'px';
                
                applyFormatCommand('fontSize', '7'); // Valeur temporaire
                
                // Remplacer par la taille exacte
                setTimeout(() => {
                    const newSelection = window.getSelection();
                    if (newSelection.rangeCount > 0) {
                        const fontElements = document.querySelectorAll('font[size="7"]');
                        fontElements.forEach(el => {
                            el.style.fontSize = newSize;
                            el.removeAttribute('size');
                        });
                    }
                }, 0);
            }
        } catch (error) {
            console.error("Erreur lors de l'augmentation de la taille:", error);
        }
    });
    
    document.getElementById('sizeDownButton').addEventListener('click', function() {
        try {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                let node = selection.anchorNode;
                if (node.nodeType === 3) node = node.parentElement;
                
                const fontSize = parseInt(window.getComputedStyle(node).fontSize);
                const newSize = Math.max(8, fontSize - 1) + 'px';
                
                applyFormatCommand('fontSize', '1'); // Valeur temporaire
                
                // Remplacer par la taille exacte
                setTimeout(() => {
                    const newSelection = window.getSelection();
                    if (newSelection.rangeCount > 0) {
                        const fontElements = document.querySelectorAll('font[size="1"]');
                        fontElements.forEach(el => {
                            el.style.fontSize = newSize;
                            el.removeAttribute('size');
                        });
                    }
                }, 0);
            }
        } catch (error) {
            console.error("Erreur lors de la diminution de la taille:", error);
        }
    });
    
    // Gestionnaires pour la police et la taille via sélection
    document.getElementById('fontSelect').addEventListener('change', function() {
        applyFormatCommand('fontName', this.value);
    });
    
    document.getElementById('sizeSelect').addEventListener('change', function() {
        const sizeMap = {
            '1': '8px',
            '2': '9px',
            '3': '10px',
            '4': '11px',
            '5': '11.5px',
            '6': '12px',
            '7': '14px'
        };
        
        applyFormatCommand('fontSize', this.value);
        
        // Ajuster la taille exacte avec un délai pour s'assurer que la commande a été appliquée
        setTimeout(() => {
            const fontElements = document.querySelectorAll(`font[size="${this.value}"]`);
            fontElements.forEach(el => {
                el.style.fontSize = sizeMap[this.value];
                el.removeAttribute('size');
            });
        }, 0);
    });
    
    // Écouter les modifications du contenu pour mettre à jour les états
    element.addEventListener('input', function() {
        if (toolbar.style.display === 'block') {
            currentSelection = saveSelection();
            updateButtonStates();
        }
    });
    
    // Prévenir la perte de focus lors de l'utilisation des boutons
    toolbar.addEventListener('mousedown', function(e) {
        if (e.target.tagName !== 'SELECT' && !e.target.classList.contains('drag-handle')) {
            e.preventDefault();
        }
    });
}