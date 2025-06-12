// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCGG5Ur3YpVxbtkjooMxE6r7RPuAmZoFRI",
    authDomain: "anonim-not.firebaseapp.com",
    projectId: "anonim-not",
    storageBucket: "anonim-not.firebasestorage.app",
    messagingSenderId: "1020793266706",
    appId: "1:1020793266706:web:bdaba147c8367a50dfaecb"
};

// EmailJS Configuration
const EMAILJS_SERVICE_ID = "service_ownrnmj";
const EMAILJS_TEMPLATE_ID = "template_yj8xnwj";
const EMAILJS_PUBLIC_KEY = "YrJGLKrAZ7qPXrXOT";

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
        } else {
            console.error('EmailJS not loaded, retrying...');
            setTimeout(initializeEmailJS, 1000);
        }
    } catch (error) {
        console.error('EmailJS initialization error:', error);
        setTimeout(initializeEmailJS, 2000);
    }
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

    if (!themeIcon) return;

    if (currentTheme === 'dark') {
        // Moon icon for dark theme
        themeIcon.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M11.38 2.019a7.5 7.5 0 1 0 10.6 10.6C21.662 17.854 17.316 22 12.001 22 6.477 22 2 17.523 2 12c0-5.315 4.146-9.661 9.38-9.981z'/%3E%3C/svg%3E";
    } else {
        // Sun icon for light theme
        themeIcon.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM17.6568 16.9497L18.364 17.6568L20.4853 15.5355L19.7782 14.8284L17.6568 16.9497ZM20.4853 8.46447L18.364 6.34315L17.6568 7.05025L19.7782 9.17157L20.4853 8.46447ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497Z'/%3E%3C/svg%3E";
    }
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

    if (currentUser) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'block';

        const email = currentUser.email;
        const shortEmail = email.length > 15 ? email.substring(0, 12) + '...' : email;
        document.getElementById('userEmailShort').textContent = shortEmail;

        // İletişim formlarını otomatik doldur
        prefillContactForm();
        prefillContactFormHome();
    } else {
        authButtons.style.display = 'block';
        userMenu.style.display = 'none';
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
    event.stopPropagation();
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
        loginSection.style.display = 'block';
        registerSection.style.display = 'none';
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
    } else {
        loginSection.style.display = 'none';
        registerSection.style.display = 'block';
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
    }
}

// Auth event listeners
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);

        if (!currentUser.emailVerified) {
            showEmailVerification();
        } else {
            showSection('home');
            showNotification('Hoş geldiniz! 🎉', 'success');
        }
    } catch (error) {
        showNotification('Giriş hatası: ' + error.message, 'error');
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
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

async function sendEmailVerification() {
    try {
        await currentUser.sendEmailVerification();
        showNotification('Doğrulama e-postası gönderildi!', 'success');
    } catch (error) {
        showNotification('E-posta gönderilemedi: ' + error.message, 'error');
    }
}

function showEmailVerification() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('email-verification').style.display = 'block';
}

function checkEmailVerification() {
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
    auth.signOut().then(() => {
        showSection('home');
        showNotification('Başarıyla çıkış yapıldı!', 'success');
        currentItems = [];
        currentListId = null;
    });
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
        if (document.getElementById('listName')) {
            document.getElementById('listName').value = '';
        }
        if (document.getElementById('listImage')) {
            document.getElementById('listImage').value = '';
        }
        if (document.getElementById('imagePreview')) {
            document.getElementById('imagePreview').innerHTML = '';
        }
        if (document.getElementById('qrSection')) {
            document.getElementById('qrSection').style.display = 'none';
        }
    }, 100);

    setupCreateListSection(type);
    showSection('create-list');
}

function setupCreateListSection(type) {
    const title = document.getElementById('createListTitle');
    const itemsSectionTitle = document.getElementById('itemsSectionTitle');
    const addItemForm = document.getElementById('addItemForm');

    switch (type) {
        case 'shopping':
            title.textContent = '🛒 Alışveriş Listesi Oluştur';
            itemsSectionTitle.textContent = '🛍️ Ürünler';
            addItemForm.innerHTML = `
                <h4>Ürün Ekle</h4>
                <div class="form-row">
                    <input type="text" id="itemName" placeholder="Ürün adı" class="form-input" required>
                    <input type="text" id="itemQuantity" placeholder="Miktar (örn: 2 kg, 5 adet)" class="form-input">
                    <input type="file" id="itemImage" accept="image/*" class="form-input" onchange="previewItemImage()">
                    <button type="button" onclick="addItem()" class="form-button add-btn">➕ Ekle</button>
                </div>
                <div id="itemImagePreview" class="image-preview-small"></div>
            `;
            break;

        case 'todo':
            title.textContent = '✅ Yapılacaklar Listesi Oluştur';
            itemsSectionTitle.textContent = '📋 Görevler';
            addItemForm.innerHTML = `
                <h4>Görev Ekle</h4>
                <div class="form-row">
                    <input type="text" id="itemName" placeholder="Görev adı" class="form-input" required>
                    <select id="itemPriority" class="form-input">
                        <option value="low">🟢 Düşük Öncelik</option>
                        <option value="medium">🟡 Orta Öncelik</option>
                        <option value="high">🔴 Yüksek Öncelik</option>
                    </select>
                    <input type="file" id="itemImage" accept="image/*" class="form-input" onchange="previewItemImage()">
                    <button type="button" onclick="addItem()" class="form-button add-btn">➕ Ekle</button>
                </div>
                <div id="itemImagePreview" class="image-preview-small"></div>
            `;
            break;

        case 'laboratory':
            title.textContent = '🧪 Laboratuvar Listesi Oluştur';
            itemsSectionTitle.textContent = '⚡ Elektronik Komponentler';
            addItemForm.innerHTML = `
                <h4>Komponent Ekle</h4>
                <div class="form-row">
                    <input type="text" id="itemName" placeholder="Komponent adı (örn: Direnç)" class="form-input" required>
                    <input type="text" id="itemQuantity" placeholder="Miktar (örn: 5 adet)" class="form-input">
                    <input type="text" id="itemValue" placeholder="Değer (örn: 100Ω, 5V)" class="form-input">
                    <input type="file" id="itemImage" accept="image/*" class="form-input" onchange="previewItemImage()">
                    <button type="button" onclick="addItem()" class="form-button add-btn">➕ Ekle</button>
                </div>
                <div id="itemImagePreview" class="image-preview-small"></div>
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
            break;
    }

    // Render existing items
    renderItems();
}

function previewListImage() {
    const file = document.getElementById('listImage').files[0];
    const preview = document.getElementById('imagePreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <div class="image-preview-container">
                    <img src="${e.target.result}" alt="Liste Resmi" class="preview-image">
                    <button type="button" onclick="clearListImage()" class="remove-image-btn">❌</button>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
}

function clearListImage() {
    document.getElementById('listImage').value = '';
    document.getElementById('imagePreview').innerHTML = '';
}

function previewItemImage() {
    const file = document.getElementById('itemImage').files[0];
    const preview = document.getElementById('itemImagePreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <div class="image-preview-container">
                    <img src="${e.target.result}" alt="Öğe Resmi" class="preview-image-small">
                    <button type="button" onclick="clearItemImage()" class="remove-image-btn">❌</button>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
}

function clearItemImage() {
    document.getElementById('itemImage').value = '';
    document.getElementById('itemImagePreview').innerHTML = '';
}

function addItem() {
    const nameInput = document.getElementById('itemName');
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
    const imageFile = document.getElementById('itemImage').files[0];
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            item.image = e.target.result;
            
            // Add to current items and render
            currentItems.push(item);
            renderItems();
            clearItemForm();
            showNotification('Öğe eklendi! ✅', 'success');
        };
        reader.readAsDataURL(imageFile);
    } else {
        // Add to current items and render
        currentItems.push(item);
        renderItems();
        clearItemForm();
        showNotification('Öğe eklendi! ✅', 'success');
    }
}

function clearItemForm() {
    document.getElementById('itemName').value = '';
    
    const quantityInput = document.getElementById('itemQuantity');
    if (quantityInput) quantityInput.value = '';
    
    const priorityInput = document.getElementById('itemPriority');
    if (priorityInput) priorityInput.value = 'medium';
    
    const valueInput = document.getElementById('itemValue');
    if (valueInput) valueInput.value = '';
    
    document.getElementById('itemImage').value = '';
    document.getElementById('itemImagePreview').innerHTML = '';
    
    // Focus'u ilk input'a geri getir (laboratuvar için)
    if (currentListType === 'laboratory') {
        document.getElementById('itemName').focus();
    }
}

function renderItems() {
    const itemsList = document.getElementById('itemsList');
    
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
                    <button onclick="toggleItem(${item.id})" class="toggle-btn">
                        ${item.completed ? '✅' : '⭕'}
                    </button>
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

    const listName = document.getElementById('listName').value.trim();
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
        const listImageFile = document.getElementById('listImage').files[0];
        if (listImageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                listImageBase64 = e.target.result;
                saveListToFirestore(listName, listImageBase64);
            };
            reader.readAsDataURL(listImageFile);
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
        const qrContainer = document.getElementById('qrCodeContainer');
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
            qrContainer.innerHTML = '<p style="color: red;">QR kod kütüphanesi yüklenemedi</p>';
        }

    } catch (error) {
        console.error('QR kod oluşturma genel hatası:', error);
        const qrContainer = document.getElementById('qrCodeContainer');
        if (qrContainer) {
            qrContainer.innerHTML = '<p style="color: red;">QR kod oluşturulamadı</p>';
        }
    }
}

// QR sayfası gösterme
function showQRPage(listId) {
    if (!listId) {
        showNotification('Liste ID bulunamadı!', 'error');
        return;
    }

    try {
        const qrDisplayContainer = document.getElementById('qrDisplayContainer');
        
        if (!qrDisplayContainer) {
            console.error('QR display container bulunamadı');
            return;
        }

        // QR konteynerini temizle
        qrDisplayContainer.innerHTML = '';
        
        // QR kod URL'i oluştur
        const shareUrl = `${window.location.origin}${window.location.pathname}?list=${listId}`;
        
        // QR kod oluştur
        if (typeof QRious !== 'undefined') {
            const qr = new QRious({
                element: document.createElement('canvas'),
                value: shareUrl,
                size: 400,
                foreground: '#000000',
                background: '#FFFFFF'
            });
            
            qrDisplayContainer.appendChild(qr.element);
            showSection('qr-display');
            console.log('QR kod sayfası başarıyla oluşturuldu');
        } else {
            console.error('QRious kütüphanesi yüklenmedi');
            qrDisplayContainer.innerHTML = '<p style="color: red;">QR kod kütüphanesi yüklenemedi</p>';
        }

    } catch (error) {
        console.error('QR sayfası oluşturma hatası:', error);
        showNotification('QR kod sayfası oluşturulamadı!', 'error');
    }
}

function editList(listId) {
    if (!currentUser) {
        showNotification('Giriş yapmalısınız!', 'error');
        return;
    }

    db.collection('lists').doc(listId).get().then((doc) => {
        if (doc.exists) {
            const listData = doc.data();
            
            // Check if user owns this list
            if (listData.userId !== currentUser.uid) {
                showNotification('Bu listeyi düzenleme yetkiniz yok!', 'error');
                return;
            }

            // Set current data for editing
            currentListId = listId;
            currentListType = listData.type;
            currentItems = listData.items || [];

            // Set form values
            document.getElementById('listName').value = listData.name;
            
            // Show list image if exists
            if (listData.image) {
                document.getElementById('imagePreview').innerHTML = `
                    <div class="image-preview-container">
                        <img src="${listData.image}" alt="Liste Resmi" class="preview-image">
                        <button type="button" onclick="clearListImage()" class="remove-image-btn">❌</button>
                    </div>
                `;
            }

            // Setup and show create list section
            setupCreateListSection(listData.type);
            showSection('create-list');
            
            showNotification('Liste düzenleme modunda!', 'info');
        } else {
            showNotification('Liste bulunamadı!', 'error');
        }
    }).catch((error) => {
        console.error('Liste yükleme hatası:', error);
        showNotification('Liste yüklenirken hata oluştu!', 'error');
    });
}

function deleteList(listId) {
    if (!currentUser) {
        showNotification('Giriş yapmalısınız!', 'error');
        return;
    }

    if (confirm('Bu listeyi silmek istediğinizden emin misiniz?')) {
        db.collection('lists').doc(listId).delete().then(() => {
            showNotification('Liste başarıyla silindi!', 'success');
            loadUserLists(); // Refresh the list
        }).catch((error) => {
            console.error('Liste silme hatası:', error);
            showNotification('Liste silinemedi: ' + error.message, 'error');
        });
    }
}

function loadUserLists() {
    if (!currentUser) {
        document.getElementById('listsContainer').innerHTML = '<p class="error">Listelerinizi görmek için giriş yapmalısınız.</p>';
        return;
    }

    const listsContainer = document.getElementById('listsContainer');
    listsContainer.innerHTML = '<p class="loading">Listeler yükleniyor...</p>';

    db.collection('lists')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                listsContainer.innerHTML = '<p class="no-items">Henüz liste oluşturmadınız. <a href="#" onclick="checkAuthAndRedirect(\'create-list\')">İlk listenizi oluşturun!</a></p>';
                return;
            }

            let html = '';
            querySnapshot.forEach((doc) => {
                const list = doc.data();
                const listId = doc.id;
                
                // Filter by current filter
                if (currentFilter !== 'all' && list.type !== currentFilter) {
                    return;
                }

                const date = list.createdAt ? list.createdAt.toDate().toLocaleDateString('tr-TR') : 'Bilinmiyor';
                const itemCount = list.items ? list.items.length : 0;
                
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

                html += `
                    <div class="list-card" data-type="${list.type}">
                        ${list.image ? `<img src="${list.image}" alt="${list.name}" class="list-card-image">` : ''}
                        <div class="list-card-content">
                            <h3>${list.name}</h3>
                            <span class="list-type">${typeIcons[list.type]} ${typeNames[list.type]}</span>
                            <p class="list-date">📅 ${date}</p>
                            <p class="list-items-count">📦 ${itemCount} öğe</p>
                            <div class="list-card-actions">
                                <button onclick="editList('${listId}')" class="action-btn edit-btn">✏️ Düzenle</button>
                                <button onclick="showQRPage('${listId}')" class="action-btn share-btn">🔗 Paylaş</button>
                                <button onclick="deleteList('${listId}')" class="action-btn delete-btn">🗑️ Sil</button>
                            </div>
                        </div>
                    </div>
                `;
            });

            listsContainer.innerHTML = html;
        })
        .catch((error) => {
            console.error('Listeler yüklenirken hata:', error);
            listsContainer.innerHTML = '<p class="error">Listeler yüklenirken hata oluştu.</p>';
        });
}

function setListFilter(filter) {
    currentFilter = filter;
    
    // Update filter button styles
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Reload lists with filter
    loadUserLists();
}

// Shared list viewing
function loadSharedList() {
    const urlParams = new URLSearchParams(window.location.search);
    const listId = urlParams.get('list');
    
    if (listId) {
        console.log('Paylaşılan liste yükleniyor:', listId);
        
        if (!isFirebaseReady || !db) {
            console.log('Firebase henüz hazır değil, tekrar denenecek...');
            setTimeout(() => loadSharedList(), 1000);
            return;
        }

        db.collection('lists').doc(listId).get().then((doc) => {
            if (doc.exists) {
                const listData = doc.data();
                displaySharedList(listData);
            } else {
                showNotification('Liste bulunamadı!', 'error');
            }
        }).catch((error) => {
            console.error('Paylaşılan liste yükleme hatası:', error);
            showNotification('Liste yüklenirken hata oluştu!', 'error');
        });
    }
}

function displaySharedList(listData) {
    // Set current list data for display
    currentItems = listData.items || [];
    currentListType = listData.type;
    currentListId = null; // Shared lists cannot be edited
    
    // Set list name
    document.getElementById('listName').value = listData.name;
    
    // Setup create list section for display
    setupCreateListSection(listData.type);
    
    // Show list image if exists
    if (listData.image) {
        document.getElementById('imagePreview').innerHTML = `
            <div class="image-preview-container">
                <img src="${listData.image}" alt="Liste Resmi" class="preview-image">
            </div>
        `;
    }
    
    // Hide save button for shared lists
    const saveButton = document.querySelector('.save-btn');
    if (saveButton) {
        saveButton.style.display = 'none';
    }
    
    // Hide QR section for shared lists
    const qrSection = document.getElementById('qrSection');
    if (qrSection) {
        qrSection.style.display = 'none';
    }
    
    showSection('create-list');
    showNotification('Paylaşılan liste yüklendi! 📋', 'success');
}

// Premium subscription functions
async function loadUserSubscription() {
    if (!currentUser) return;

    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            userSubscription = userData.subscription || 'free';
        } else {
            userSubscription = 'free';
        }
    } catch (error) {
        console.error('Kullanıcı abonelik bilgisi yüklenemedi:', error);
        userSubscription = 'free';
    }
}

function upgradeToPremium() {
    showNotification('Premium üyelik yakında aktif olacak! 🚀', 'info');
}

// Account info functions
function updateAccountInfo() {
    if (!currentUser) {
        return;
    }

    document.getElementById('accountEmail').textContent = currentUser.email;
    document.getElementById('accountType').textContent = userSubscription === 'premium' ? 'Premium' : 'Ücretsiz';
    
    const creationTime = currentUser.metadata.creationTime;
    if (creationTime) {
        const date = new Date(creationTime);
        document.getElementById('accountCreated').textContent = date.toLocaleDateString('tr-TR');
    }

    // Get user's list count
    if (isFirebaseReady && db) {
        db.collection('lists')
            .where('userId', '==', currentUser.uid)
            .get()
            .then((querySnapshot) => {
                document.getElementById('accountListCount').textContent = querySnapshot.size;
            })
            .catch((error) => {
                console.error('Liste sayısı alınamadı:', error);
                document.getElementById('accountListCount').textContent = '0';
            });
    }
}

// Contact form functions
function setupContactFormListeners() {
    // Main contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }

    // Home contact form
    const contactFormHome = document.getElementById('contactFormHome');
    if (contactFormHome) {
        contactFormHome.addEventListener('submit', handleContactFormHome);
    }
}

async function handleContactForm(e) {
    e.preventDefault();
    
    if (!isEmailJSReady) {
        showNotification('E-posta servisi henüz hazır değil, lütfen bekleyin...', 'warning');
        return;
    }

    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value;

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            from_name: name,
            from_email: email,
            subject: subject,
            message: message,
            to_email: 'ebunyamin0@gmail.com'
        });

        showNotification('Mesajınız başarıyla gönderildi! 📧', 'success');
        document.getElementById('contactForm').reset();
    } catch (error) {
        console.error('E-posta gönderme hatası:', error);
        showNotification('Mesaj gönderilemedi. Lütfen tekrar deneyin.', 'error');
    }
}

async function handleContactFormHome(e) {
    e.preventDefault();
    
    if (!isEmailJSReady) {
        showNotification('E-posta servisi henüz hazır değil, lütfen bekleyin...', 'warning');
        return;
    }

    const name = document.getElementById('contactNameHome').value;
    const email = document.getElementById('contactEmailHome').value;
    const subject = document.getElementById('contactSubjectHome').value;
    const message = document.getElementById('contactMessageHome').value;

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            from_name: name,
            from_email: email,
            subject: subject,
            message: message,
            to_email: 'ebunyamin0@gmail.com'
        });

        showNotification('Mesajınız başarıyla gönderildi! 📧', 'success');
        document.getElementById('contactFormHome').reset();
    } catch (error) {
        console.error('E-posta gönderme hatası:', error);
        showNotification('Mesaj gönderilemedi. Lütfen tekrar deneyin.', 'error');
    }
}

function prefillContactForm() {
    if (currentUser) {
        const nameField = document.getElementById('contactName');
        const emailField = document.getElementById('contactEmail');
        
        if (nameField && currentUser.displayName) {
            nameField.value = currentUser.displayName;
        }
        if (emailField) {
            emailField.value = currentUser.email;
        }
    }
}

function prefillContactFormHome() {
    if (currentUser) {
        const nameFieldHome = document.getElementById('contactNameHome');
        const emailFieldHome = document.getElementById('contactEmailHome');
        
        if (nameFieldHome && currentUser.displayName) {
            nameFieldHome.value = currentUser.displayName;
        }
        if (emailFieldHome) {
            emailFieldHome.value = currentUser.email;
        }
    }
}

// Ad management functions
function closeAd(adId) {
    const ad = document.getElementById(adId);
    if (ad) {
        ad.style.display = 'none';
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);

    // Add click to dismiss
    notification.addEventListener('click', () => {
        notification.remove();
    });
}

// Page load events
window.onload = function() {
    initializeTheme();
    initializeFirebase();
    initializeEmailJS();
    
    // Contact form listeners
    setupContactFormListeners();
    
    // Check for shared list
    setTimeout(() => {
        loadSharedList();
    }, 2000);
    
    // Close ads on page load
    setTimeout(() => {
        const ads = ['topAdBanner', 'sideAdBanner'];
        ads.forEach(adId => {
            const ad = document.getElementById(adId);
            if (ad && Math.random() > 0.7) { // 30% chance to hide ads
                ad.style.display = 'none';
            }
        });
    }, 5000);
};