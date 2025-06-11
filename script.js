// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCGG5Ur3YpVxbtkjooMxE6r7RPuAmZoFRI",
    authDomain: "anonim-not.firebaseapp.com",
    projectId: "anonim-not",
    storageBucket: "anonim-not.firebasestorage.app",
    messagingSenderId: "1020793266706",
    appId: "1:1020793266706:web:bdaba147c8367a50dfaecb"
};

// EmailJS Configuration - Doğru şekilde yapılandırıldı
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

// Initialize EmailJS - Düzeltildi
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

// Mobile Menu Toggle - Yeni eklendi
function toggleMobileMenu() {
    const navButtons = document.querySelector('.nav-buttons');
    navButtons.classList.toggle('mobile-open');
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

    // Mobile menüyü kapat
    const navButtons = document.querySelector('.nav-buttons');
    if (navButtons.classList.contains('mobile-open')) {
        navButtons.classList.remove('mobile-open');
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

        // E-posta doğrulandı mı kontrol et
        if (!currentUser.emailVerified) {
            // Giriş sayfasındaki doğrulama butonlarını göster
            const loginVerificationButtons = document.getElementById('loginVerificationButtons');
            if (loginVerificationButtons) {
                loginVerificationButtons.style.display = 'block';
            }
        } else {
            // Doğrulama butonlarını gizle
            const loginVerificationButtons = document.getElementById('loginVerificationButtons');
            if (loginVerificationButtons) {
                loginVerificationButtons.style.display = 'none';
            }
        }

        // İletişim formlarını otomatik doldur
        prefillContactForm();
        prefillContactFormHome();
    } else {
        authButtons.style.display = 'block';
        userMenu.style.display = 'none';
        
        // Doğrulama butonlarını gizle
        const loginVerificationButtons = document.getElementById('loginVerificationButtons');
        if (loginVerificationButtons) {
            loginVerificationButtons.style.display = 'none';
        }
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
    const emailVerificationSection = document.getElementById('email-verification');
    const loginTab = document.querySelector('.auth-tab');
    const registerTab = document.querySelectorAll('.auth-tab')[1];

    // Tüm auth bölümlerini gizle
    loginSection.style.display = 'none';
    registerSection.style.display = 'none';
    emailVerificationSection.style.display = 'none';

    if (tab === 'login') {
        loginSection.style.display = 'block';
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
    } else {
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
        
        // Kullanıcının e-postası doğrulandı mı kontrol et
        if (currentUser && !currentUser.emailVerified) {
            showNotification('E-posta adresinizi doğrulamanız gerekiyor!', 'warning');
            // Doğrulama butonlarını göster
            const loginVerificationButtons = document.getElementById('loginVerificationButtons');
            if (loginVerificationButtons) {
                loginVerificationButtons.style.display = 'block';
            }
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
        if (currentUser) {
            await currentUser.sendEmailVerification();
            showNotification('Doğrulama e-postası gönderildi!', 'success');
        }
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
    if (!currentUser) {
        showNotification('Önce giriş yapmalısınız!', 'error');
        return;
    }

    currentUser.reload().then(() => {
        if (currentUser.emailVerified) {
            showSection('home');
            showNotification('E-posta doğrulandı! 🎉', 'success');
            // Doğrulama butonlarını gizle
            const loginVerificationButtons = document.getElementById('loginVerificationButtons');
            if (loginVerificationButtons) {
                loginVerificationButtons.style.display = 'none';
            }
        } else {
            showNotification('E-posta henüz doğrulanmadı. Lütfen e-postanızı kontrol edin.', 'warning');
        }
    }).catch(error => {
        showNotification('Doğrulama kontrolü başarısız: ' + error.message, 'error');
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
        showSection('auth');
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

// Laboratuvar input'ları için özel event listener'lar
function setupLabInputListeners() {
    // Bu fonksiyon laboratuvar formu oluşturulduğunda çağrılacak
    setTimeout(() => {
        const nameInput = document.getElementById('itemName');
        const quantityInput = document.getElementById('itemQuantity');
        const valueInput = document.getElementById('itemValue');
        
        if (nameInput && currentListType === 'laboratory') {
            nameInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const nextInput = document.getElementById('itemQuantity');
                    if (nextInput) nextInput.focus();
                }
            });
        }
        
        if (quantityInput && currentListType === 'laboratory') {
            quantityInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const nextInput = document.getElementById('itemValue');
                    if (nextInput) nextInput.focus();
                }
            });
        }
        
        if (valueInput && currentListType === 'laboratory') {
            valueInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem();
                }
            });
        }
    }, 100);
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
                    <input type="text" id="itemName" placeholder="Birim İsmi (örn: 100Ω Direnç)" class="form-input" required>
                    <input type="text" id="itemQuantity" placeholder="Miktar (örn: 5 adet)" class="form-input">
                    <input type="text" id="itemValue" placeholder="Değer (örn: 100Ω, 5V)" class="form-input">
                    <input type="file" id="itemImage" accept="image/*" class="form-input" onchange="previewItemImage()">
                    <button type="button" onclick="addItem()" class="form-button add-btn">➕ Ekle</button>
                </div>
                <div id="itemImagePreview" class="image-preview-small"></div>
            `;
            // Laboratuvar input'ları için özel listener'ları kur
            setupLabInputListeners();
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
    
    // Focus'u ilk input'a geri getir
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
        showNotification('Liste adını girin!', 'warning');
        return;
    }

    if (currentItems.length === 0) {
        showNotification('En az bir öğe ekleyin!', 'warning');
        return;
    }

    try {
        const listData = {
            name: listName,
            type: currentListType,
            items: currentItems,
            userId: currentUser.uid,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Add list image if exists
        const listImageFile = document.getElementById('listImage').files[0];
        if (listImageFile) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                listData.image = e.target.result;
                await saveToDB(listData);
            };
            reader.readAsDataURL(listImageFile);
        } else {
            await saveToDB(listData);
        }

    } catch (error) {
        console.error('Save error:', error);
        showNotification('Kaydetme hatası: ' + error.message, 'error');
    }
}

async function saveToDB(listData) {
    try {
        let docRef;
        if (currentListId) {
            // Update existing list
            docRef = db.collection('lists').doc(currentListId);
            await docRef.update(listData);
            showNotification('Liste güncellendi! 🎉', 'success');
        } else {
            // Create new list
            docRef = await db.collection('lists').add(listData);
            currentListId = docRef.id;
            showNotification('Liste kaydedildi! 🎉', 'success');
        }

        // Generate QR code
        generateQRCode(currentListId);

    } catch (error) {
        console.error('Database save error:', error);
        showNotification('Veritabanı hatası: ' + error.message, 'error');
    }
}

function generateQRCode(listId) {
    const qrSection = document.getElementById('qrSection');
    const qrCodeDiv = document.getElementById('qrCode');
    
    if (qrSection && qrCodeDiv) {
        const url = `${window.location.origin}?list=${listId}`;
        
        // Clear previous QR code
        qrCodeDiv.innerHTML = '';
        
        // Generate new QR code
        const qr = new QRious({
            element: document.createElement('canvas'),
            value: url,
            size: 200,
            background: 'white',
            foreground: 'black'
        });
        
        qrCodeDiv.appendChild(qr.canvas);
        qrSection.style.display = 'block';
    }
}

// User subscription management
async function loadUserSubscription() {
    if (!currentUser) return;
    
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            userSubscription = userData.subscription || 'free';
        }
    } catch (error) {
        console.error('Error loading user subscription:', error);
    }
}

// List filtering
function filterLists(filterType) {
    currentFilter = filterType;
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filterType) {
            btn.classList.add('active');
        }
    });
    
    loadUserLists();
}

async function loadUserLists() {
    if (!isFirebaseReady || !currentUser) {
        return;
    }

    try {
        let query = db.collection('lists').where('userId', '==', currentUser.uid);
        
        if (currentFilter !== 'all') {
            query = query.where('type', '==', currentFilter);
        }
        
        const snapshot = await query.orderBy('createdAt', 'desc').get();
        const lists = [];
        
        snapshot.forEach(doc => {
            lists.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderUserLists(lists);
        
    } catch (error) {
        console.error('Error loading lists:', error);
        showNotification('Listeler yüklenirken hata oluştu: ' + error.message, 'error');
    }
}

function renderUserLists(lists) {
    const container = document.getElementById('userListsContainer');
    
    if (lists.length === 0) {
        container.innerHTML = '<p class="no-lists">Henüz liste oluşturmadınız.</p>';
        return;
    }
    
    let html = '';
    lists.forEach(list => {
        const typeIcons = {
            shopping: '🛒',
            todo: '✅',
            laboratory: '🧪'
        };
        
        const createdDate = list.createdAt ? new Date(list.createdAt.seconds * 1000).toLocaleDateString('tr-TR') : 'Bilinmiyor';
        
        html += `
            <div class="list-card" onclick="editList('${list.id}')">
                <div class="list-header">
                    <span class="list-type-icon">${typeIcons[list.type]}</span>
                    <h3>${list.name}</h3>
                </div>
                <div class="list-info">
                    <span>${list.items ? list.items.length : 0} öğe</span>
                    <span>${createdDate}</span>
                </div>
                <div class="list-actions" onclick="event.stopPropagation()">
                    <button onclick="editList('${list.id}')" class="edit-btn">✏️</button>
                    <button onclick="deleteList('${list.id}')" class="delete-btn">🗑️</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function editList(listId) {
    try {
        const doc = await db.collection('lists').doc(listId).get();
        if (doc.exists) {
            const listData = doc.data();
            
            // Set current data
            currentListId = listId;
            currentListType = listData.type;
            currentItems = listData.items || [];
            
            // Setup the form
            setupCreateListSection(listData.type);
            
            // Fill form data
            document.getElementById('listName').value = listData.name || '';
            
            // Show create list section
            showSection('create-list');
            
            showNotification('Liste düzenleme modunda açıldı!', 'success');
        }
    } catch (error) {
        console.error('Error loading list:', error);
        showNotification('Liste yüklenirken hata oluştu: ' + error.message, 'error');
    }
}

async function deleteList(listId) {
    if (!confirm('Bu listeyi silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        await db.collection('lists').doc(listId).delete();
        showNotification('Liste silindi!', 'success');
        loadUserLists();
    } catch (error) {
        console.error('Error deleting list:', error);
        showNotification('Liste silinirken hata oluştu: ' + error.message, 'error');
    }
}

// Account info management
function updateAccountInfo() {
    if (!currentUser) return;
    
    document.getElementById('accountEmail').textContent = currentUser.email;
    document.getElementById('accountName').textContent = currentUser.displayName || 'Belirtilmemiş';
    document.getElementById('accountDate').textContent = currentUser.metadata.creationTime ? 
        new Date(currentUser.metadata.creationTime).toLocaleDateString('tr-TR') : 'Bilinmiyor';
    document.getElementById('accountSubscription').textContent = userSubscription === 'premium' ? 'Premium' : 'Ücretsiz';
}

// Contact form management
function prefillContactForm() {
    if (currentUser) {
        const nameInput = document.getElementById('contactName');
        const emailInput = document.getElementById('contactEmail');
        
        if (nameInput) nameInput.value = currentUser.displayName || '';
        if (emailInput) emailInput.value = currentUser.email || '';
    }
}

function prefillContactFormHome() {
    if (currentUser) {
        const nameInput = document.getElementById('contactNameHome');
        const emailInput = document.getElementById('contactEmailHome');
        
        if (nameInput) nameInput.value = currentUser.displayName || '';
        if (emailInput) emailInput.value = currentUser.email || '';
    }
}

// Contact form submission - Düzeltildi
async function sendContactMessage(formId) {
    if (!isEmailJSReady) {
        showNotification('E-posta servisi yükleniyor, lütfen bekleyin...', 'warning');
        return;
    }

    const form = document.getElementById(formId);
    const nameInput = form.querySelector('[id*="contactName"]');
    const emailInput = form.querySelector('[id*="contactEmail"]');
    const subjectInput = form.querySelector('[id*="contactSubject"]');
    const messageInput = form.querySelector('[id*="contactMessage"]');

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const subject = subjectInput.value;
    const message = messageInput.value.trim();

    if (!name || !email || !subject || !message) {
        showNotification('Lütfen tüm alanları doldurun!', 'warning');
        return;
    }

    try {
        const templateParams = {
            from_name: name,
            from_email: email,
            subject: subject,
            message: message,
            to_email: 'ebunyamin0@gmail.com'
        };

        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
        showNotification('Mesajınız gönderildi! 📧', 'success');
        
        // Clear form
        nameInput.value = '';
        emailInput.value = '';
        subjectInput.value = '';
        messageInput.value = '';
        
        // Prefill user info if logged in
        if (currentUser) {
            nameInput.value = currentUser.displayName || '';
            emailInput.value = currentUser.email || '';
        }
        
    } catch (error) {
        console.error('EmailJS error:', error);
        showNotification('Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin. ✕', 'error');
    }
}

// Contact form event listeners - Düzeltildi
document.addEventListener('DOMContentLoaded', function() {
    // Ana iletişim formu
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            sendContactMessage('contactForm');
        });
    }

    // Ana sayfadaki iletişim formu
    const contactFormHome = document.getElementById('contactFormHome');
    if (contactFormHome) {
        contactFormHome.addEventListener('submit', function(e) {
            e.preventDefault();
            sendContactMessage('contactFormHome');
        });
    }
});

// Ad management
function closeAd(adId) {
    const ad = document.getElementById(adId);
    if (ad) {
        ad.style.display = 'none';
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.background = '#51cf66';
            break;
        case 'error':
            notification.style.background = '#ff6b6b';
            break;
        case 'warning':
            notification.style.background = '#ffd43b';
            notification.style.color = '#333';
            break;
        default:
            notification.style.background = '#4a90e2';
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeFirebase();
    initializeEmailJS();
    
    // Check for shared list in URL
    const urlParams = new URLSearchParams(window.location.search);
    const sharedListId = urlParams.get('list');
    if (sharedListId) {
        loadSharedList(sharedListId);
    }
});

// Load shared list
async function loadSharedList(listId) {
    try {
        const doc = await db.collection('lists').doc(listId).get();
        if (doc.exists) {
            const listData = doc.data();
            
            // Show shared list content
            showSharedListModal(listData);
        } else {
            showNotification('Paylaşılan liste bulunamadı!', 'error');
        }
    } catch (error) {
        console.error('Error loading shared list:', error);
        showNotification('Liste yüklenirken hata oluştu!', 'error');
    }
}

function showSharedListModal(listData) {
    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: var(--surface-color);
        padding: 2rem;
        border-radius: 12px;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        color: var(--text-color);
    `;
    
    const typeIcons = {
        shopping: '🛒',
        todo: '✅',
        laboratory: '🧪'
    };
    
    let itemsHtml = '';
    if (listData.items && listData.items.length > 0) {
        listData.items.forEach(item => {
            itemsHtml += `<div style="padding: 0.5rem; border-bottom: 1px solid var(--border-color);">
                ${item.name}
                ${item.quantity ? ` - ${item.quantity}` : ''}
                ${item.value ? ` - ${item.value}` : ''}
            </div>`;
        });
    } else {
        itemsHtml = '<p>Liste boş</p>';
    }
    
    modalContent.innerHTML = `
        <h2>${typeIcons[listData.type]} ${listData.name}</h2>
        <div style="margin: 1rem 0;">
            ${itemsHtml}
        </div>
        <button onclick="this.closest('.modal').remove()" style="
            background: var(--primary-color);
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
        ">Kapat</button>
    `;
    
    modal.className = 'modal';
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}
