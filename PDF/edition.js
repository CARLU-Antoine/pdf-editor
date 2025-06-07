function makeDraggableElement(element) {
    let isDragging = false;
    let isRotating = false;
    let isResizing = false;
    let startX, startY;
    let startWidth, startHeight;
    let startLeft, startTop;
    let startAngle = 0;
    let currentRotation = 0;
    let currentResizeHandle = null;

    // Style de base
    element.style.cursor = 'grab';
    element.style.position = 'absolute';

    // Créer les poignées de redimensionnement
    const positions = ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'];
    const resizeHandles = positions.map(pos => {
        const handle = document.createElement('div');
        handle.className = `resize-handle resize-${pos}`;
        handle.dataset.position = pos;
        handle.style.cssText = `
            position: absolute;
            width: 10px;
            height: 10px;
            background-color: #4444FF;
            border: 1px solid #0000CC;
            border-radius: 50%;
            display: none;
            z-index: 1000;
        `;
        
        // Positionner les poignées
        switch(pos) {
            case 'n': 
                handle.style.top = '-5px';
                handle.style.left = '50%';
                handle.style.transform = 'translateX(-50%)';
                handle.style.cursor = 'n-resize';
                break;
            case 'e':
                handle.style.right = '-5px';
                handle.style.top = '50%';
                handle.style.transform = 'translateY(-50%)';
                handle.style.cursor = 'e-resize';
                break;
            case 's':
                handle.style.bottom = '-5px';
                handle.style.left = '50%';
                handle.style.transform = 'translateX(-50%)';
                handle.style.cursor = 's-resize';
                break;
            case 'w':
                handle.style.left = '-5px';
                handle.style.top = '50%';
                handle.style.transform = 'translateY(-50%)';
                handle.style.cursor = 'w-resize';
                break;
            case 'ne':
                handle.style.top = '-5px';
                handle.style.right = '-5px';
                handle.style.cursor = 'ne-resize';
                break;
            case 'se':
                handle.style.bottom = '-5px';
                handle.style.right = '-5px';
                handle.style.cursor = 'se-resize';
                break;
            case 'sw':
                handle.style.bottom = '-5px';
                handle.style.left = '-5px';
                handle.style.cursor = 'sw-resize';
                break;
            case 'nw':
                handle.style.top = '-5px';
                handle.style.left = '-5px';
                handle.style.cursor = 'nw-resize';
                break;
        }
        
        handle.addEventListener('mousedown', initResize);
        element.appendChild(handle);
        return handle;
    });

    // Créer la poignée de rotation
    const rotateHandle = document.createElement('div');
    rotateHandle.className = 'rotate-handle';
    rotateHandle.style.cssText = `
        position: absolute;
        width: 15px;
        height: 15px;
        background-color: #FF4444;
        border-radius: 50%;
        top: -20px;
        left: 50%;
        display: none;
        transform: translateX(-50%);
        cursor: pointer;
        z-index: 1000;
    `;
    element.appendChild(rotateHandle);

    // Gestion du clic pour afficher/masquer les poignées
    element.addEventListener('click', (e) => {
        if (e.target !== rotateHandle && !isDragging && !isResizing) {
            const isVisible = rotateHandle.style.display === 'block';
            rotateHandle.style.display = isVisible ? 'none' : 'block';
            resizeHandles.forEach(handle => {
                handle.style.display = isVisible ? 'none' : 'block';
            });
        }
    });

    // Cacher les poignées lors d'un clic à l'extérieur
    document.addEventListener('click', (e) => {
        if (!element.contains(e.target)) {
            rotateHandle.style.display = 'none';
            resizeHandles.forEach(handle => {
                handle.style.display = 'none';
            });
        }
    });

    // Fonctions de redimensionnement
    function initResize(e) {
        if (element.contentEditable === 'true' || isDragging || isRotating) return;

        isResizing = true;
        currentResizeHandle = e.target;
        
        const rect = element.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startWidth = rect.width;
        startHeight = element.getBoundingClientRect().height;
        startLeft = parseInt(element.style.left) || 0;
        startTop = parseInt(element.style.top) || 0;

        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
        e.preventDefault();
    }

    function resize(e) {
        if (!isResizing) return;

        const position = currentResizeHandle.dataset.position;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newLeft = startLeft;
        let newTop = startTop;

        const minSize = 50;

        // Calcul des nouvelles dimensions et positions
        if (position.includes('e')) {
            newWidth = Math.max(minSize, startWidth + deltaX);
        }
        if (position.includes('w')) {
            const possibleWidth = startWidth - deltaX;
            if (possibleWidth >= minSize) {
                newWidth = possibleWidth;
                newLeft = startLeft + deltaX;
            }
        }
        if (position.includes('s')) {
            newHeight = Math.max(minSize, startHeight + deltaY);
        }
        if (position.includes('n')) {
            const possibleHeight = startHeight - deltaY;
            if (possibleHeight >= minSize) {
                newHeight = possibleHeight;
                newTop = startTop + deltaY;
            }
        }

        // Appliquer les changements
        element.style.width = `${newWidth}px`;
        element.style.height = `${newHeight}px`;
        element.style.left = `${newLeft}px`;
        element.style.top = `${newTop}px`;

        e.preventDefault();
    }

    function stopResize() {
        isResizing = false;
        currentResizeHandle = null;
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
    }

    // Fonctions de déplacement
    element.addEventListener('mousedown', initDrag);

    function initDrag(e) {
        if (e.target.closest('.resize-handle') || e.target.closest('.rotate-handle') || 
            e.target.contentEditable === 'true' || isResizing || isRotating) {
            return;
        }

        isDragging = true;
        const rect = element.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
        element.style.cursor = 'grabbing';

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
        e.preventDefault();
    }

    function drag(e) {
        if (!isDragging) return;
        const parentRect = element.parentElement.getBoundingClientRect();
        const x = e.clientX - parentRect.left - startX;
        const y = e.clientY - parentRect.top - startY;
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        e.preventDefault();
    }

    function stopDrag() {
        isDragging = false;
        element.style.cursor = 'grab';
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
    }

    // Fonctions de rotation
    rotateHandle.addEventListener('mousedown', initRotate);

    function initRotate(e) {
        if (element.contentEditable === 'true' || isDragging || isResizing) return;

        isRotating = true;
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);

        document.addEventListener('mousemove', rotate);
        document.addEventListener('mouseup', stopRotate);
        e.preventDefault();
    }

    function rotate(e) {
        if (!isRotating) return;
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        const angleDiff = (currentAngle - startAngle) * (180 / Math.PI);

        currentRotation += angleDiff;
        element.style.transform = `rotate(${currentRotation}deg)`;
        startAngle = currentAngle;
        e.preventDefault();
    }

    function stopRotate() {
        isRotating = false;
        document.removeEventListener('mousemove', rotate);
        document.removeEventListener('mouseup', stopRotate);
    }
}


