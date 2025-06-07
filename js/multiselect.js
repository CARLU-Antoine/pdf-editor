class Multiselect {
    constructor(elementId, categories = {}) {
        this.container = document.getElementById(elementId);
        this.selectBox = this.container.querySelector('.select-box');
        this.dropdownList = this.container.querySelector('.dropdown-list');
        this.searchBox = this.container.querySelector('.search-box');
        this.optionsContainer = this.container.querySelector('.options');
        this.selectedItems = this.container.querySelector('.selected-items');
        this.placeholder = this.container.querySelector('.placeholder');
        this.selectedValues = new Set();
        this.categories = categories;
        
        this.init();
        this.setupEventListeners();
    }

    init() {
        this.optionsContainer.innerHTML = '';
        
        const allOption = document.createElement('div');
        allOption.className = 'option all-option';
        allOption.textContent = 'All';
        this.optionsContainer.appendChild(allOption);

        Object.entries(this.categories).forEach(([category, subOptions]) => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'category';
            
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-header';
            
            const categoryCheckbox = document.createElement('input');
            categoryCheckbox.type = 'checkbox';
            categoryCheckbox.className = 'category-checkbox';
            
            const categoryTitle = document.createElement('div');
            categoryTitle.className = 'category-title';
            categoryTitle.textContent = category;
            
            const toggleButton = document.createElement('button');
            toggleButton.className = 'toggle-details';
            toggleButton.textContent = '+';
            
            categoryHeader.append(categoryCheckbox, categoryTitle, toggleButton);
            categoryElement.appendChild(categoryHeader);
            
            const subCategoryContainer = document.createElement('div');
            subCategoryContainer.className = 'sub-category-container';
            subCategoryContainer.style.display = 'none';
            
            subOptions.forEach(option => {
                const optionElement = document.createElement('div');
                optionElement.className = 'option sub-option';
                optionElement.dataset.category = category;
                optionElement.textContent = option;
                subCategoryContainer.appendChild(optionElement);
            });
            
            categoryElement.appendChild(subCategoryContainer);
            this.optionsContainer.appendChild(categoryElement);
        });
    }

    setupEventListeners() {
        this.selectBox.addEventListener('click', () => {
            this.dropdownList.classList.toggle('active');
            if (this.dropdownList.classList.contains('active')) {
                this.searchBox.focus();
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.dropdownList.classList.remove('active');
            }
        });
        
        this.searchBox.addEventListener('input', (e) => this.search(e.target.value.toLowerCase()));
        this.optionsContainer.addEventListener('click', (e) => this.handleOptionClick(e));
    }

    search(searchTerm) {
        this.optionsContainer.querySelectorAll('.category, .sub-option, .all-option').forEach(option => {
            const text = option.textContent.toLowerCase();
            option.style.display = text.includes(searchTerm) ? 'block' : 'none';
        });
    }

    handleOptionClick(e) {
        if (e.target.classList.contains('sub-option')) {
            this.toggleSelection(e.target);
        } else if (e.target.classList.contains('all-option')) {
            this.toggleAll();
        } else if (e.target.classList.contains('category-checkbox')) {
            this.toggleCategory(e.target);
        } else if (e.target.classList.contains('toggle-details')) {
            this.toggleCategoryVisibility(e.target);
        }
    }

    toggleSelection(option) {
        const text = option.textContent;
        if (this.selectedValues.has(text)) {
            this.selectedValues.delete(text);
            option.classList.remove('selected');
        } else {
            this.selectedValues.add(text);
            option.classList.add('selected');
        }
        
    }

    toggleAll() {
        const allSelected = this.selectedValues.size === this.optionsContainer.querySelectorAll('.sub-option').length;
        this.selectedValues.clear();
        this.optionsContainer.querySelectorAll('.sub-option').forEach(option => {
            if (!allSelected) {
                this.selectedValues.add(option.textContent);
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
        
    }

    toggleCategory(checkbox) {
        const category = checkbox.closest('.category').querySelector('.category-title').textContent;
        const subOptions = this.optionsContainer.querySelectorAll(`.sub-option[data-category="${category}"]`);
        const select = checkbox.checked;

        subOptions.forEach(option => {
            if (select) {
                this.selectedValues.add(option.textContent);
                option.classList.add('selected');
            } else {
                this.selectedValues.delete(option.textContent);
                option.classList.remove('selected');
            }
        });
        
    }

    toggleCategoryVisibility(button) {
        const subCategoryContainer = button.closest('.category').querySelector('.sub-category-container');
        const isVisible = subCategoryContainer.style.display !== 'none';
        subCategoryContainer.style.display = isVisible ? 'none' : 'block';
        button.textContent = isVisible ? '+' : '-';
    }

    updatePlaceholder() {
        this.placeholder.style.display = this.selectedValues.size > 0 ? 'none' : 'block';
    }

    getSelectedValues() {
        return Array.from(this.selectedValues);
    }
}
