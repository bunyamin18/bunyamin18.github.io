// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCGG5Ur3YpVxbtkjooMxE6r7RPuAmZoFRI",
    authDomain: "anonim-not.firebaseapp.com",
    projectId: "anonim-not",
    storageBucket: "anonim-not.firebasestorage.app",
    messagingSenderId: "1020793266706",
    appId: "1:1020793266706:web:bdaba147c8367a50dfaecb"
};

// EmailJS Configuration - EmailJS dashboard'unuzdan doğru değerleri alın
const EMAILJS_SERVICE_ID = "service_ownrnmj"; // EmailJS dashboard > Email Services > Service ID
const EMAILJS_TEMPLATE_ID = "template_yj8xnwj"; // EmailJS dashboard > Email Templates > Template ID  
const EMAILJS_PUBLIC_KEY = "YrJGLKrAZ7qPXrXOT"; // EmailJS dashboard > Account > General > Public Key

// Initialize variables to prevent reference errors
let auth = null;
let db = null;
let currentUser = null;
let currentItems = [];
let currentListId = null;
let currentListType = 'shopping';
let currentFilter = 'all';
let userSubscription = 'free';
let isFirebaseReady = false;
let isEmailJSReady = false;

// Initialize Firebase
function initializeFirebase() {
    try {
        if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            auth = firebase.auth();
            isFirebaseReady = true;
            console.log('Firebase initialized successfully');

            // Initialize auth listener after Firebase is ready
            initializeAuth();
        } else if (firebase.apps.length > 0) {
            // Firebase already initialized
            db = firebase.firestore();
            auth = firebase.auth();
            isFirebaseReady = true;
            console.log('Firebase already initialized');
            initializeAuth();
        } else {
            console.error('Firebase not loaded, retrying...');
            setTimeout(initializeFirebase, 1000);
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
        setTimeout(initializeFirebase, 2000);
    }
}

// Initialize EmailJS
function initializeEmailJS() {
    try {
        if (typeof emailjs !== 'undefined') {
            emailjs.init(EMAILJS_PUBLIC_KEY);
            isEmailJSReady = true;
            console.log('EmailJS initialized successfully');
            console.log('Service ID:', EMAILJS_SERVICE_ID);
            console.log('Template ID:', EMAILJS_TEMPLATE_ID);
            console.log('Public Key:', EMAILJS_PUBLIC_KEY ? 'Configured' : 'Missing');
        } else {
            console.error('EmailJS not loaded, retrying...');
            setTimeout(initializeEmailJS, 1000);
        }
    } catch (error) {
        console.error('EmailJS initialization error:', error);
        setTimeout(initializeEmailJS, 2000);
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification container if it doesn't exist
    let container = document.getElementById('notificationContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const iconMap = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    notification.style.cssText = `
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 0.5rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-color);
        animation: slideIn 0.3s ease;
    `;

    notification.innerHTML = `
        <span>${iconMap[type] || 'ℹ️'}</span>
        <span style="flex: 1;">${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: var(--text-color); cursor: pointer; font-size: 1.2rem;">✕</button>
    `;

    container.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function compressImage(file, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = function() {
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = img;

        // Calculate new dimensions
        if (width > height) {
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
        } else {
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(callback, 'image/jpeg', 0.8);
    };

    img.src = URL.createObjectURL(file);
}

// Scroll to section function
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// Navigate to section (go to home page first if needed)
function navigateToSection(sectionId) {
    // Check if we're on home page
    const homeSection = document.getElementById('home-section');
    if (homeSection.style.display === 'none') {
        // Go to home page first
        showSection('home');
        // Wait a bit then scroll
        setTimeout(() => {
            scrollToSection(sectionId);
        }, 100);
    } else {
        // Already on home page, just scroll
        scrollToSection(sectionId);
    }
}

// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton();
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton();
}

function updateThemeButton() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const themeIcon = document.getElementById('theme-icon');
    const themeIconMobile = document.getElementById('theme-icon-mobile');

    const darkIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M11.38 2.019a7.5 7.5 0 1 0 10.6 10.6C21.662 17.854 17.316 22 12.001 22 6.477 22 2 17.523 2 12c0-5.315 4.146-9.661 9.38-9.981z'/%3E%3C/svg%3E";
    const lightIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM17.6568 16.9497L18.364 17.6568L20.4853 15.5355L19.7782 14.8284L17.6568 16.9497ZM20.4853 8.46447L18.364 6.34315L17.6568 7.05025L19.7782 9.17157L20.4853 8.46447ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497Z'/%3E%3C/svg%3E";

    if (currentTheme === 'dark') {
        if (themeIcon) themeIcon.src = darkIcon;
        if (themeIconMobile) themeIconMobile.src = darkIcon;
    } else {
        if (themeIcon) themeIcon.src = lightIcon;
        if (themeIconMobile) themeIconMobile.src = lightIcon;
    }
}

// Mobile menu functions
function toggleMobileMenu() {
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const hamburger = document.querySelector('.hamburger');
    
    if (mobileMenuOverlay && hamburger) {
        const isActive = mobileMenuOverlay.classList.contains('active');
        
        if (isActive) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }
}

function openMobileMenu() {
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const hamburger = document.querySelector('.hamburger');
    
    if (mobileMenuOverlay) {
        mobileMenuOverlay.classList.add('active');
    }
    if (hamburger) {
        hamburger.classList.add('active');
    }
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const hamburger = document.querySelector('.hamburger');
    
    if (mobileMenuOverlay) {
        mobileMenuOverlay.classList.remove('active');
    }
    if (hamburger) {
        hamburger.classList.remove('active');
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
}

// Page management
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });

    // Show selected section
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.style.display = 'block';

        // Load section-specific content
        if (sectionName === 'my-lists') {
            loadUserLists();
        } else if (sectionName === 'account') {
            updateAccountInfo();
        } else if (sectionName === 'contact') {
            prefillContactForm();
        }
    }
}

// Authentication functions
function initializeAuth() {
    if (!auth) {
        console.error('Firebase auth not initialized');
        setTimeout(initializeAuth, 1000);
        return;
    }

    auth.onAuthStateChanged((user) => {
        currentUser = user;
        updateAuthUI();

        if (user && user.emailVerified) {
            loadUserSubscription();
        }
    });
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const authButtonsMobile = document.getElementById('authButtonsMobile');
    const userMenuMobile = document.getElementById('userMenuMobile');

    if (currentUser) {
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) userMenu.style.display = 'block';
        if (authButtonsMobile) authButtonsMobile.style.display = 'none';
        if (userMenuMobile) userMenuMobile.style.display = 'block';

        const email = currentUser.email;
        const shortEmail = email.length > 15 ? email.substring(0, 12) + '...' : email;
        const userEmailElement = document.getElementById('userEmailShort');
        const userEmailElementMobile = document.getElementById('userEmailShortMobile');
        
        if (userEmailElement) {
            userEmailElement.textContent = shortEmail;
        }
        if (userEmailElementMobile) {
            userEmailElementMobile.textContent = shortEmail;
        }

        // İletişim formlarını otomatik doldur
        prefillContactForm();
        prefillContactFormHome();
    } else {
        if (authButtons) authButtons.style.display = 'block';
        if (userMenu) userMenu.style.display = 'none';
        if (authButtonsMobile) authButtonsMobile.style.display = 'block';
        if (userMenuMobile) userMenuMobile.style.display = 'none';
    }
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    const userMenu = document.querySelector('.user-menu');

    if (!dropdown || !userMenu) {
        console.error('User dropdown elements not found');
        return;
    }

    // Close all other dropdowns first
    document.querySelectorAll('.user-dropdown').forEach(dd => {
        if (dd !== dropdown) {
            dd.classList.remove('show');
        }
    });

    dropdown.classList.toggle('show');

    // Prevent event bubbling
    if (event) {
        event.stopPropagation();
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const userMenu = e.target.closest('.user-menu');
    const dropdown = document.getElementById('userDropdown');

    if (!userMenu && dropdown) {
        dropdown.classList.remove('show');
    }
});

// Prevent dropdown from closing when clicking inside it
document.addEventListener('click', (e) => {
    if (e.target.closest('.user-dropdown')) {
        e.stopPropagation();
    }
});

function showAuthTab(tab) {
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const loginTab = document.querySelector('.auth-tab');
    const registerTab = document.querySelectorAll('.auth-tab')[1];

    if (tab === 'login') {
        if (loginSection) loginSection.style.display = 'block';
        if (registerSection) registerSection.style.display = 'none';
        if (loginTab) loginTab.classList.add('active');
        if (registerTab) registerTab.classList.remove('active');
    } else {
        if (loginSection) loginSection.style.display = 'none';
        if (registerSection) registerSection.style.display = 'block';
        if (loginTab) loginTab.classList.remove('active');
        if (registerTab) registerTab.classList.add('active');
    }
}

// Auth event listeners - will be set up when DOM is ready

async function sendEmailVerification() {
    try {
        await currentUser.sendEmailVerification();
        showNotification('Doğrulama e-postası gönderildi!', 'success');
    } catch (error) {
        showNotification('E-posta gönderilemedi: ' + error.message, 'error');
    }
}

function showEmailVerification() {
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const emailVerification = document.getElementById('email-verification');
    
    if (loginSection) loginSection.style.display = 'none';
    if (registerSection) registerSection.style.display = 'none';
    if (emailVerification) emailVerification.style.display = 'block';
}

function checkEmailVerification() {
    if (!auth || !auth.currentUser) return;
    
    auth.currentUser.reload().then(() => {
        if (auth.currentUser.emailVerified) {
            showSection('home');
            showNotification('E-posta doğrulandı! 🎉', 'success');
        } else {
            showNotification('E-posta henüz doğrulanmadı. Lütfen e-postanızı kontrol edin.', 'warning');
        }
    });
}

function logout() {
    if (auth) {
        auth.signOut().then(() => {
            showSection('home');
            showNotification('Başarıyla çıkış yapıldı!', 'success');
            currentItems = [];
            currentListId = null;
        });
    }
}

// Authentication check for protected actions
function checkAuthAndRedirect(targetSection) {
    if (!isFirebaseReady || !auth) {
        showNotification('Sistem yükleniyor, lütfen bekleyin...', 'warning');
        setTimeout(() => checkAuthAndRedirect(targetSection), 1000);
        return;
    }

    if (!currentUser) {
        showSection('auth');
        showNotification('Bu özelliği kullanmak için giriş yapmalısınız!', 'warning');
        return;
    }

    if (!currentUser.emailVerified) {
        showEmailVerification();
        showNotification('Devam etmek için e-posta adresinizi doğrulamalısınız!', 'warning');
        return;
    }

    if (targetSection === 'create-list') {
        showSection('list-type');
    } else {
        showSection(targetSection);
    }
}

// List type selection
function selectListType(type) {
    // Clear previous list data for new list creation
    currentItems = [];
    currentListId = null;
    currentListType = type;

    // Clear form inputs
    setTimeout(() => {
        const listName = document.getElementById('listName');
        const listImage = document.getElementById('listImage');
        const imagePreview = document.getElementById('imagePreview');
        const qrSection = document.getElementById('qrSection');
        
        if (listName) listName.value = '';
        if (listImage) listImage.value = '';
        if (imagePreview) imagePreview.innerHTML = '';
        if (qrSection) qrSection.style.display = 'none';
    }, 100);

    setupCreateListSection(type);
    showSection('create-list');
}

function setupCreateListSection(type) {
    const title = document.getElementById('createListTitle');
    const itemInputSection = document.getElementById('itemInputSection');

    switch (type) {
        case 'shopping':
            if (title) title.textContent = '🛒 Alışveriş Listesi Oluştur';
            if (itemInputSection) {
                itemInputSection.innerHTML = `
                    <h4>Ürün Ekle</h4>
                    <div class="input-group">
                        <input type="text" id="itemName" placeholder="Ürün adı" class="form-input" required>
                        <input type="text" id="itemQuantity" placeholder="Miktar (örn: 2 kg, 5 adet)" class="form-input">
                        <button type="button" onclick="addItem()" class="form-btn">➕ Ekle</button>
                    </div>
                    <div class="input-group">
                        <input type="file" id="itemImage" accept="image/*" class="form-input" onchange="previewItemImage()">
                    </div>
                    <div id="itemImagePreview" class="image-preview"></div>
                `;
            }
            break;

        case 'todo':
            if (title) title.textContent = '✅ Yapılacaklar Listesi Oluştur';
            if (itemInputSection) {
                itemInputSection.innerHTML = `
                    <h4>Görev Ekle</h4>
                    <div class="input-group">
                        <input type="text" id="itemName" placeholder="Görev adı" class="form-input" required>
                        <select id="itemPriority" class="form-input">
                            <option value="low">🟢 Düşük Öncelik</option>
                            <option value="medium">🟡 Orta Öncelik</option>
                            <option value="high">🔴 Yüksek Öncelik</option>
                        </select>
                        <button type="button" onclick="addItem()" class="form-btn">➕ Ekle</button>
                    </div>
                    <div class="input-group">
                        <input type="file" id="itemImage" accept="image/*" class="form-input" onchange="previewItemImage()">
                    </div>
                    <div id="itemImagePreview" class="image-preview"></div>
                `;
            }
            break;

        case 'laboratory':
            if (title) title.textContent = '🧪 Laboratuvar Listesi Oluştur';
            if (itemInputSection) {
                itemInputSection.innerHTML = `
                    <h4>Komponent Ekle</h4>
                    <div class="input-group">
                        <input type="text" id="itemName" placeholder="Komponent adı (örn: Direnç)" class="form-input" required>
                        <input type="text" id="itemQuantity" placeholder="Miktar (örn: 5 adet)" class="form-input">
                        <input type="text" id="itemValue" placeholder="Değer (örn: 100Ω, 5V)" class="form-input">
                        <button type="button" onclick="addItem()" class="form-btn">➕ Ekle</button>
                    </div>
                    <div class="input-group">
                        <input type="file" id="itemImage" accept="image/*" class="form-input" onchange="previewItemImage()">
                    </div>
                    <div id="itemImagePreview" class="image-preview"></div>
                `;
                
                // Laboratuvar için Enter tuş navigasyonu ekle
                setTimeout(() => {
                    const nameInput = document.getElementById('itemName');
                    const quantityInput = document.getElementById('itemQuantity');
                    const valueInput = document.getElementById('itemValue');
                    
                    if (nameInput) {
                        nameInput.addEventListener('keydown', function(e) {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (quantityInput) quantityInput.focus();
                            }
                        });
                    }
                    
                    if (quantityInput) {
                        quantityInput.addEventListener('keydown', function(e) {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (valueInput) valueInput.focus();
                            }
                        });
                    }
                    
                    if (valueInput) {
                        valueInput.addEventListener('keydown', function(e) {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addItem();
                            }
                        });
                    }
                }, 100);
            }
            break;
    }

    // Render existing items
    renderItems();
}

function previewListImage() {
    const file = document.getElementById('listImage');
    const preview = document.getElementById('imagePreview');
    
    if (file && file.files && file.files[0] && preview) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <div class="image-preview-container">
                    <img src="${e.target.result}" alt="Liste Resmi" class="preview-image">
                    <button type="button" onclick="clearListImage()" class="remove-image-btn">❌</button>
                </div>
            `;
        };
        reader.readAsDataURL(file.files[0]);
    }
}

function clearListImage() {
    const listImage = document.getElementById('listImage');
    const imagePreview = document.getElementById('imagePreview');
    
    if (listImage) listImage.value = '';
    if (imagePreview) imagePreview.innerHTML = '';
}

function previewItemImage() {
    const file = document.getElementById('itemImage');
    const preview = document.getElementById('itemImagePreview');
    
    if (file && file.files && file.files[0] && preview) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <div class="image-preview-container">
                    <img src="${e.target.result}" alt="Öğe Resmi" class="preview-image-small">
                    <button type="button" onclick="clearItemImage()" class="remove-image-btn">❌</button>
                </div>
            `;
        };
        reader.readAsDataURL(file.files[0]);
    }
}

function clearItemImage() {
    const itemImage = document.getElementById('itemImage');
    const itemImagePreview = document.getElementById('itemImagePreview');
    
    if (itemImage) itemImage.value = '';
    if (itemImagePreview) itemImagePreview.innerHTML = '';
}

function addItem() {
    const nameInput = document.getElementById('itemName');
    if (!nameInput) {
        showNotification('Öğe adı alanı bulunamadı!', 'error');
        return;
    }
    
    const name = nameInput.value.trim();
    
    if (!name) {
        showNotification('Lütfen öğe adını girin!', 'warning');
        return;
    }

    const item = {
        id: Date.now(),
        name: name,
        completed: false,
        image: null
    };

    // Type-specific properties'i önce ekle
    switch (currentListType) {
        case 'shopping':
            const shoppingQuantityInput = document.getElementById('itemQuantity');
            item.quantity = shoppingQuantityInput ? shoppingQuantityInput.value : '';
            break;

        case 'todo':
            const priorityInput = document.getElementById('itemPriority');
            item.priority = priorityInput ? priorityInput.value : 'medium';
            break;

        case 'laboratory':
            const quantityInput = document.getElementById('itemQuantity');
            const valueInput = document.getElementById('itemValue');
            
            item.quantity = quantityInput ? quantityInput.value : '';
            item.value = valueInput ? valueInput.value : '';
            break;
    }

    // Get image if selected
    const imageFile = document.getElementById('itemImage');
    if (imageFile && imageFile.files && imageFile.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            item.image = e.target.result;
            
            // Add to current items and render
            currentItems.push(item);
            renderItems();
            clearItemForm();
            showNotification('Öğe eklendi! ✅', 'success');
        };
        reader.readAsDataURL(imageFile.files[0]);
    } else {
        // Add to current items and render
        currentItems.push(item);
        renderItems();
        clearItemForm();
        showNotification('Öğe eklendi! ✅', 'success');
    }
}

function clearItemForm() {
    const itemName = document.getElementById('itemName');
    const itemQuantity = document.getElementById('itemQuantity');
    const itemPriority = document.getElementById('itemPriority');
    const itemValue = document.getElementById('itemValue');
    const itemImage = document.getElementById('itemImage');
    const itemImagePreview = document.getElementById('itemImagePreview');
    
    if (itemName) itemName.value = '';
    if (itemQuantity) itemQuantity.value = '';
    if (itemPriority) itemPriority.value = 'medium';
    if (itemValue) itemValue.value = '';
    if (itemImage) itemImage.value = '';
    if (itemImagePreview) itemImagePreview.innerHTML = '';
    
    // Focus'u ilk input'a geri getir (laboratuvar için)
    if (currentListType === 'laboratory' && itemName) {
        itemName.focus();
    }
}

function renderItems() {
    const itemsList = document.getElementById('itemsList');
    
    if (!itemsList) {
        console.error('Items list container not found');
        return;
    }
    
    if (currentItems.length === 0) {
        itemsList.innerHTML = '<p class="no-items">Henüz öğe eklenmedi.</p>';
        return;
    }

    let html = '';

    currentItems.forEach(item => {
        let itemHtml = `
            <div class="item ${item.completed ? 'completed' : ''}" data-id="${item.id}">
                <div class="item-content">
                    ${item.image ? `<img src="${item.image}" alt="${item.name}" class="item-image">` : ''}
                    <div class="item-details">
                        <div class="item-name">${item.name}</div>
        `;

        switch (currentListType) {
            case 'shopping':
                if (item.quantity) {
                    itemHtml += `<div class="item-quantity">Miktar: ${item.quantity}</div>`;
                }
                break;

            case 'todo':
                const priorityColors = {
                    low: '🟢',
                    medium: '🟡',
                    high: '🔴'
                };
                const priorityNames = {
                    low: 'Düşük Öncelik',
                    medium: 'Orta Öncelik',
                    high: 'Yüksek Öncelik'
                };
                itemHtml += `<div class="item-priority">${priorityColors[item.priority]} ${priorityNames[item.priority]}</div>`;
                break;

            case 'laboratory':
                itemHtml += `
                    <div class="item-lab-details">
                        ${item.quantity ? `<span>Miktar: ${item.quantity}</span>` : ''}
                        ${item.value ? `<span>Değer: ${item.value}</span>` : ''}
                    </div>
                `;
                break;
        }

        itemHtml += `
                    </div>
                </div>
                <div class="item-actions">
                    ${currentListType === 'todo' ? `
                        <button onclick="toggleItem(${item.id})" class="toggle-btn">
                            ${item.completed ? '✅' : '⭕'}
                        </button>
                    ` : ''}
                    <button onclick="removeItem(${item.id})" class="remove-btn">🗑️</button>
                </div>
            </div>
        `;

        html += itemHtml;
    });

    itemsList.innerHTML = html;
}

function toggleItem(id) {
    const item = currentItems.find(item => item.id === id);
    if (item) {
        item.completed = !item.completed;
        renderItems();
    }
}

function removeItem(id) {
    currentItems = currentItems.filter(item => item.id !== id);
    renderItems();
    showNotification('Öğe silindi!', 'success');
}

async function saveList() {
    if (!isFirebaseReady || !currentUser) {
        showNotification('Giriş yapmalısınız!', 'error');
        return;
    }

    const listNameInput = document.getElementById('listName');
    if (!listNameInput) {
        showNotification('Liste adı alanı bulunamadı!', 'error');
        return;
    }

    const listName = listNameInput.value.trim();
    if (!listName) {
        showNotification('Liste adı gereklidir!', 'warning');
        return;
    }

    if (currentItems.length === 0) {
        showNotification('En az bir öğe eklemelisiniz!', 'warning');
        return;
    }

    try {
        showNotification('Liste kaydediliyor...', 'info');

        // Get list image
        let listImageBase64 = null;
        const listImageFile = document.getElementById('listImage');
        if (listImageFile && listImageFile.files && listImageFile.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                listImageBase64 = e.target.result;
                saveListToFirestore(listName, listImageBase64);
            };
            reader.readAsDataURL(listImageFile.files[0]);
        } else {
            saveListToFirestore(listName, null);
        }

    } catch (error) {
        console.error('Liste kaydetme hatası:', error);
        showNotification('Liste kaydedilemedi: ' + error.message, 'error');
    }
}

async function saveListToFirestore(listName, listImage) {
    try {
        const listData = {
            name: listName,
            type: currentListType,
            items: currentItems,
            userId: currentUser.uid,
            userEmail: currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            image: listImage
        };

        let docRef;
        if (currentListId) {
            // Update existing list
            await db.collection('lists').doc(currentListId).update(listData);
            docRef = { id: currentListId };
            showNotification('Liste başarıyla güncellendi! 🎉', 'success');
        } else {
            // Create new list
            docRef = await db.collection('lists').add(listData);
            currentListId = docRef.id;
            showNotification('Liste başarıyla kaydedildi! 🎉', 'success');
        }

        // Generate and show QR code
        generateQRCode(docRef.id);

    } catch (error) {
        console.error('Firestore kaydetme hatası:', error);
        showNotification('Liste kaydedilemedi: ' + error.message, 'error');
    }
}

// QR Code generation
function generateQRCode(listId) {
    if (!listId) {
        console.error('Liste ID bulunamadı');
        return;
    }

    try {
        const qrContainer = document.getElementById('qrCode');
        const qrSection = document.getElementById('qrSection');
        
        if (!qrContainer || !qrSection) {
            console.error('QR container elementleri bulunamadı');
            return;
        }

        // QR konteynerini temizle
        qrContainer.innerHTML = '';
        
        // QR kod URL'i oluştur
        const shareUrl = `${window.location.origin}${window.location.pathname}?list=${listId}`;
        console.log('QR URL:', shareUrl);

        // QR kod oluştur
        if (typeof QRious !== 'undefined') {
            const qr = new QRious({
                element: document.createElement('canvas'),
                value: shareUrl,
                size: 256,
                foreground: '#000000',
                background: '#FFFFFF'
            });
            
            qrContainer.appendChild(qr.element);
            qrSection.style.display = 'block';
            console.log('QR kod başarıyla oluşturuldu');
        } else {
            console.error('QRious kütüphanesi yüklenmedi');
            qrContainer.innerHTML = '<p style="color: red;">QR kod oluşturulamadı</p>';
        }
    } catch (error) {
        console.error('QR kod oluşturma hatası:', error);
        const qrContainer = document.getElementById('qrCode');
        if (qrContainer) {
            qrContainer.innerHTML = '<p style="color: red;">QR kod oluşturulamadı</p>';
        }
    }
}

/**
 * Belirtilen liste ID'siyle QR kodu oluşturur ve ilgili HTML elementine ekler.
 * @param {string} listId - Listenin benzersiz ID'si
 * @param {HTMLElement} qrCodeElement - QR kodun çizileceği HTML elemanı
 * @param {HTMLElement} qrSectionElement - QR kod bölümünü içeren eleman (görünürlük için)
 */
function _generateQRCodeInternal(listId, qrCodeElement, qrSectionElement) {
    if (!window.QRious) {
        if (qrSectionElement) qrSectionElement.style.display = "none";
        return;
    }
    if (!listId || !qrCodeElement) {
        if (qrSectionElement) qrSectionElement.style.display = "none";
        return;
    }

    // Önce eski QR kodu temizle
    qrCodeElement.innerHTML = "";

    // Paylaşılacak URL'yi oluştur
    const shareUrl = `${window.location.origin}?list=${listId}`;

    // QR kodu oluştur
    const qr = new QRious({
        value: shareUrl,
        size: 180,
        background: 'white',
        foreground: '#222',
        level: 'H'
    });

    // QR kodu ekle
    const img = document.createElement('img');
    img.src = qr.toDataURL();
    img.alt = "QR Kod";
    img.style.width = "180px";
    img.style.height = "180px";
    qrCodeElement.appendChild(img);

    if (qrSectionElement) qrSectionElement.style.display = "block";
}

// Load user lists
async function loadUserLists() {
    if (!isFirebaseReady || !currentUser || !db) {
        const myListsContainer = document.getElementById('myListsContainer');
        if (myListsContainer) {
            myListsContainer.innerHTML = '<div class="loading-state">Giriş yapmalısınız!</div>';
        }
        return;
    }

    try {
        const myListsContainer = document.getElementById('myListsContainer');
        if (myListsContainer) {
            myListsContainer.innerHTML = '<div class="loading-state">Listeler yükleniyor...</div>';
        }

        // Use simple query without orderBy to avoid index requirement
        const querySnapshot = await db.collection('lists')
            .where('userId', '==', currentUser.uid)
            .get();

        const lists = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            lists.push({
                id: doc.id,
                ...data,
                // Convert Firestore timestamp to date for sorting
                createdAtDate: data.createdAt ? data.createdAt.toDate() : new Date()
            });
        });

        // Sort locally by creation date (newest first)
        lists.sort((a, b) => b.createdAtDate - a.createdAtDate);

        displayLists(lists);

    } catch (error) {
        console.error('Listeler yüklenirken hata oluştu:', error);
        const myListsContainer = document.getElementById('myListsContainer');
        if (myListsContainer) {
            myListsContainer.innerHTML = '<div class="error-state">Listeler yüklenirken hata oluştu: ' + error.message + '</div>';
        }
    }
}

function filterLists(type) {
    // This function would filter the displayed lists by type
    loadUserLists(); // For now, just reload all lists
}

function displayLists(lists) {
    const myListsContainer = document.getElementById('myListsContainer');
    if (!myListsContainer) return;

    if (lists.length === 0) {
        myListsContainer.innerHTML = '<div class="empty-state">Henüz liste oluşturmadınız.</div>';
        return;
    }

    let html = '';
    lists.forEach(list => {
        const typeIcons = {
            shopping: '🛒',
            todo: '✅',
            laboratory: '🧪'
        };
        
        const typeNames = {
            shopping: 'Alışveriş',
            todo: 'Yapılacaklar',
            laboratory: 'Laboratuvar'
        };

        const completedItems = list.items ? list.items.filter(item => item.completed).length : 0;
        const totalItems = list.items ? list.items.length : 0;

        html += `
            <div class="list-card" onclick="viewList('${list.id}')">
                <div class="list-card-header">
                    <div>
                        <div class="list-title">${typeIcons[list.type]} ${list.name}</div>
                        <div class="list-type">${typeNames[list.type]}</div>
                    </div>
                </div>
                <div class="list-stats">
                    <span>${totalItems} öğe</span>
                    <span>${completedItems} tamamlandı</span>
                </div>
                <div class="list-actions" onclick="event.stopPropagation()">
                    <button class="form-btn" onclick="editList('${list.id}')">✏️ Düzenle</button>
                    <button class="form-btn" onclick="shareList('${list.id}')">📤 Paylaş</button>
                    <button class="form-btn danger" onclick="deleteList('${list.id}')">🗑️ Sil</button>
                </div>
            </div>
        `;
    });

    myListsContainer.innerHTML = html;
}

async function viewList(listId) {
    if (!db || !listId) return;

    try {
        const doc = await db.collection('lists').doc(listId).get();

        if (doc.exists) {
            const listData = { id: listId, ...doc.data() };
            showSharedListModal(listData); // Mevcut modal yapısını yeniden kullanıyoruz.
        } else {
            showNotification('Liste bulunamadı!', 'error');
        }
    } catch (error) {
        console.error('Liste görüntülenirken hata:', error);
        showNotification('Liste yüklenemedi: ' + error.message, 'error');
    }
}

async function editList(listId) {
    if (!db || !listId) return;

    try {
        const docRef = db.collection('lists').doc(listId);
        const doc = await docRef.get();

        if (doc.exists) {
            const listData = doc.data();
            
            // Load the list data into the form
            currentListId = listId; // Düzenlenen listenin ID'sini ayarla
            currentListType = listData.type; // Listenin türünü ayarla
            currentItems = listData.items || []; // Mevcut öğeleri yükle

            // Liste türüne göre oluşturma/düzenleme bölümünün yapısını kur
            // Bu, doğru input alanlarını render edecek ve renderItems() fonksiyonunu çağıracak
            setupCreateListSection(currentListType);

            // Liste adı inputunu doldur
            const listNameInput = document.getElementById('listName');
            if (listNameInput) {
                listNameInput.value = listData.name;
            }

            // Liste görseli önizlemesini doldur (eğer görsel varsa)
            const imagePreview = document.getElementById('imagePreview');
            const listImageInput = document.getElementById('listImage');
            if (imagePreview) {
                if (listData.image) {
                    imagePreview.innerHTML = `
                        <div class="image-preview-container">
                            <img src="${listData.image}" alt="Liste Resmi" class="preview-image">
                            <button type="button" onclick="clearListImage()" class="remove-image-btn">❌</button>
                        </div>
                    `;
                } else {
                    imagePreview.innerHTML = ''; // Önceki önizlemeyi temizle
                }
                if (listImageInput) listImageInput.value = ''; // Dosya input değerini temizle
            }

            // create-list bölümünü göster (artık düzenleme modunda)
            showSection('create-list');
            showNotification('Liste düzenleme moduna geçildi! ✏️', 'info');
        }
    } catch (error) {
        console.error('Liste yüklenirken hata:', error);
        showNotification('Liste yüklenemedi: ' + error.message, 'error');
    }
}

async function deleteList(listId) {
    if (!db || !listId) return;

    if (confirm('Bu listeyi silmek istediğinizden emin misiniz?')) {
        try {
            await db.collection('lists').doc(listId).delete();
            showNotification('Liste başarıyla silindi!', 'success');
            loadUserLists(); // Reload the lists
        } catch (error) {
            console.error('Liste silinirken hata:', error);
            showNotification('Liste silinemedi: ' + error.message, 'error');
        }
    }
}

function shareList(listId) {
    const shareUrl = `${window.location.origin}${window.location.pathname}?list=${listId}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Akıllı Liste',
            text: 'Bu listeyi kontrol edin!',
            url: shareUrl
        });
    } else {
        // Fallback to copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            showNotification('Liste bağlantısı panoya kopyalandı!', 'success');
        }).catch(() => {
            showNotification('Bağlantı: ' + shareUrl, 'info');
        });
    }
}

// Account management functions
function updateAccountInfo() {
    if (!currentUser) return;
    
    const accountEmail = document.getElementById('accountEmail');
    const accountName = document.getElementById('accountName');
    const accountSubscription = document.getElementById('accountSubscription');
    
    if (accountEmail) accountEmail.textContent = currentUser.email;
    if (accountName) accountName.textContent = currentUser.displayName || 'Kullanıcı';
    if (accountSubscription) accountSubscription.textContent = userSubscription === 'premium' ? 'Premium' : 'Ücretsiz';
}

function deleteAccount() {
    if (confirm('Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
        showNotification('Hesap silme özelliği yakında eklenecek!', 'info');
    }
}

// Contact form functions (simplified - no forms to prefill)
function prefillContactForm() {
    // No contact form to prefill anymore
    return;
}

function prefillContactFormHome() {
    // No contact form to prefill anymore
    return;
}

// Ad management
function closeAd(adId) {
    const ad = document.getElementById(adId);
    if (ad) {
        ad.style.display = 'none';
        localStorage.setItem('ad_' + adId + '_closed', 'true');
    }
}

// Load shared list from URL parameter
async function loadSharedList() {
    const urlParams = new URLSearchParams(window.location.search);
    const listId = urlParams.get('list');
    
    if (listId && db) {
        try {
            const doc = await db.collection('lists').doc(listId).get();
            if (doc.exists) {
                const listData = { id: listId, ...doc.data() };
                showSharedListModal(listData);
            } else {
                showNotification('Paylaşılan liste bulunamadı!', 'error');
            }
        } catch (error) {
            console.error('Paylaşılan liste yüklenirken hata:', error);
            showNotification('Liste yüklenemedi: ' + error.message, 'error');
        }
    }
}

function showSharedListModal(listData) {
    const modal = document.getElementById('sharedListModal');
    const title = document.getElementById('sharedListTitle');
    const typeElement = document.getElementById('sharedListType');
    const dateElement = document.getElementById('sharedListDate');
    const imageElement = document.getElementById('sharedListImage');
    const itemsElement = document.getElementById('sharedListItems');
    
    if (!modal) return;
    
    // Set title
    if (title) title.textContent = `📋 ${listData.name}`;
    
    // Set type badge
    if (typeElement) {
        const typeNames = {
            shopping: '🛒 Alışveriş',
            todo: '✅ Yapılacaklar',
            laboratory: '🧪 Laboratuvar'
        };
        typeElement.textContent = typeNames[listData.type] || 'Liste';
    }
    
    // Set date
    if (dateElement && listData.createdAt) {
        const date = listData.createdAt.toDate ? listData.createdAt.toDate() : new Date(listData.createdAt);
        dateElement.textContent = date.toLocaleDateString('tr-TR');
    }
    
    // Set image
    if (imageElement) {
        if (listData.image) {
            imageElement.innerHTML = `<img src="${listData.image}" alt="${listData.name}">`;
        } else {
            imageElement.innerHTML = '';
        }
    }
    
    // Render items
    if (itemsElement) {
        renderSharedListItems(listData.items || [], listData.type);
    }
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    _generateQRCodeInternal(listData.id, document.getElementById('sharedListQrCode'), document.getElementById('sharedListQrSection'));
}

function renderSharedListItems(items, listType) {
    const itemsElement = document.getElementById('sharedListItems');
    if (!itemsElement) return;
    
    if (items.length === 0) {
        itemsElement.innerHTML = '<p class="empty-state">Bu listede henüz öğe bulunmuyor.</p>';
        return;
    }
    
    let html = '';
    items.forEach(item => {
        let metaInfo = '';
        
        switch (listType) {
            case 'shopping':
                if (item.quantity) {
                    metaInfo = `Miktar: ${item.quantity}`;
                }
                break;
            case 'todo':
                const priorityNames = {
                    low: '🟢 Düşük Öncelik',
                    medium: '🟡 Orta Öncelik',
                    high: '🔴 Yüksek Öncelik'
                };
                metaInfo = priorityNames[item.priority] || '';
                break;
            case 'laboratory':
                const details = [];
                if (item.quantity) details.push(`Miktar: ${item.quantity}`);
                if (item.value) details.push(`Değer: ${item.value}`);
                metaInfo = details.join(' • ');
                break;
        }
        
        html += `
            <div class="shared-item ${item.completed ? 'completed' : ''}">
                <div class="shared-item-content">
                    ${item.image ? `<img src="${item.image}" alt="${item.name}" class="shared-item-image">` : ''}
                    <div class="shared-item-details">
                        <div class="shared-item-name">${item.name}</div>
                        ${metaInfo ? `<div class="shared-item-meta">${metaInfo}</div>` : ''}
                    </div>
                </div>
                ${listType === 'todo' ? `
                    <div class="shared-item-status">
                        ${item.completed ? '✅' : '⭕'}
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    itemsElement.innerHTML = html;
}

function closeSharedListModal() {
    const modal = document.getElementById('sharedListModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        
        // URL'de 'list' parametresi varsa temizle (paylaşılan listeler için)
        const url = new URL(window.location);
        if (url.searchParams.has('list')) {
            url.searchParams.delete('list');
            window.history.replaceState({}, '', url);
        }
    }
}

function copySharedListUrl() {
    const url = window.location.href;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Liste bağlantısı panoya kopyalandı!', 'success');
        }).catch(() => {
            showNotification('Bağlantı kopyalanamadı', 'error');
        });
    } else {
        // Fallback
        showNotification('Bağlantı: ' + url, 'info');
    }
}

// Email sending function
async function sendContactEmail(formId) {
    if (!isEmailJSReady || typeof emailjs === 'undefined') {
        showNotification('E-posta servisi henüz hazır değil!', 'warning');
        return;
    }

    const form = document.getElementById(formId);
    if (!form) {
        showNotification('Form bulunamadı!', 'error');
        return;
    }

    // Form alanlarını doğru şekilde al
    let name, email, subject, message;
    
    if (formId === 'contactFormHome') {
        name = document.getElementById('contactNameHome')?.value || '';
        email = document.getElementById('contactEmailHome')?.value || '';
        subject = document.getElementById('contactSubjectHome')?.value || '';
        message = document.getElementById('contactMessageHome')?.value || '';
    } else {
        name = document.getElementById('contactName')?.value || '';
        email = document.getElementById('contactEmail')?.value || '';
        subject = document.getElementById('contactSubject')?.value || '';
        message = document.getElementById('contactMessage')?.value || '';
    }

    // Boş alanları kontrol et
    if (!name || !email || !subject || !message) {
        showNotification('Lütfen tüm alanları doldurun!', 'warning');
        return;
    }

    const templateParams = {
        from_name: name,
        from_email: email,
        subject: subject,
        message: message,
        to_email: 'ebunyamin0@gmail.com'
    };

    try {
        showNotification('E-posta gönderiliyor...', 'info');
        
        const response = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
        
        console.log('EmailJS Response:', response);
        showNotification('Mesajınız başarıyla gönderildi! 📧', 'success');
        
        // Formu temizle
        form.reset();
        
        // Eğer kullanıcı giriş yapmışsa formları tekrar doldur
        if (currentUser) {
            setTimeout(() => {
                if (formId === 'contactFormHome') {
                    prefillContactFormHome();
                } else {
                    prefillContactForm();
                }
            }, 100);
        }
        
    } catch (error) {
        console.error('E-posta gönderme hatası:', error);
        showNotification('Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.', 'error');
    }
}

// Subscription management
async function loadUserSubscription() {
    if (!currentUser || !db) return;

    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            userSubscription = userData.subscription || 'free';
        }
    } catch (error) {
        console.error('Error loading subscription:', error);
        userSubscription = 'free';
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    initializeTheme();
    
    // Initialize Firebase
    initializeFirebase();
    
    // Initialize EmailJS
    initializeEmailJS();
    
    // Set up auth form listeners
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                await auth.signInWithEmailAndPassword(email, password);

                if (!auth.currentUser.emailVerified) {
                    showEmailVerification();
                } else {
                    showSection('home');
                    showNotification('Hoş geldiniz! 🎉', 'success');
                }
            } catch (error) {
                showNotification('Giriş hatası: ' + error.message, 'error');
            }
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerPasswordConfirm').value;

            if (password !== confirmPassword) {
                showNotification('Şifreler eşleşmiyor!', 'error');
                return;
            }

            if (password.length < 6) {
                showNotification('Şifre en az 6 karakter olmalıdır!', 'error');
                return;
            }

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                await userCredential.user.updateProfile({ displayName: name });
                await sendEmailVerification();
                showEmailVerification();
            } catch (error) {
                showNotification('Kayıt hatası: ' + error.message, 'error');
            }
        });
    }

    // Contact form listeners removed - no forms to handle
    
    // Hide closed ads
    if (localStorage.getItem('ad_topAdBanner_closed') === 'true') {
        const topAd = document.getElementById('topAdBanner');
        if (topAd) topAd.style.display = 'none';
    }
    
    if (localStorage.getItem('ad_sideAdBanner_closed') === 'true') {
        const sideAd = document.getElementById('sideAdBanner');
        if (sideAd) sideAd.style.display = 'none';
    }
    
    // Check for shared list in URL
    loadSharedList();
});

// Make functions globally available
window.initializeFirebase = initializeFirebase;
window.initializeEmailJS = initializeEmailJS;
window.showNotification = showNotification;
window.scrollToSection = scrollToSection;
window.navigateToSection = navigateToSection;
window.initializeTheme = initializeTheme;
window.toggleTheme = toggleTheme;
window.updateThemeButton = updateThemeButton;
window.toggleMobileMenu = toggleMobileMenu;
window.openMobileMenu = openMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.showSection = showSection;
window.updateAuthUI = updateAuthUI;
window.toggleUserDropdown = toggleUserDropdown;
window.showAuthTab = showAuthTab;
window.checkAuthAndRedirect = checkAuthAndRedirect;
window.sendEmailVerification = sendEmailVerification;
window.showEmailVerification = showEmailVerification;
window.checkEmailVerification = checkEmailVerification;
window.logout = logout;
window.selectListType = selectListType;
window.setupCreateListSection = setupCreateListSection;
window.previewListImage = previewListImage;
window.clearListImage = clearListImage;
window.previewItemImage = previewItemImage;
window.clearItemImage = clearItemImage;
window.addItem = addItem;
window.clearItemForm = clearItemForm;
window.renderItems = renderItems;
window.toggleItem = toggleItem;
window.removeItem = removeItem;
window.saveList = saveList;
window.generateQRCode = generateQRCode;
window.loadUserLists = loadUserLists;
window.filterLists = filterLists;
window.displayLists = displayLists;
window.viewList = viewList;
window.editList = editList;
window.deleteList = deleteList;
window.shareList = shareList;
window.updateAccountInfo = updateAccountInfo;
window.deleteAccount = deleteAccount;
window.prefillContactForm = prefillContactForm;
window.prefillContactFormHome = prefillContactFormHome;
window.closeAd = closeAd;
window.loadSharedList = loadSharedList;
window.showSharedListModal = showSharedListModal;
window.closeSharedListModal = closeSharedListModal;
window.copySharedListUrl = copySharedListUrl;
window.sendContactEmail = sendContactEmail;