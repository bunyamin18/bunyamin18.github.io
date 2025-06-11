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
            initializeAuth();
        } else if (firebase.apps.length > 0) {
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

// Resim sıkıştırma fonksiyonu
function compressImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            let { width, height } = img;
            
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(resolve, 'image/jpeg', quality);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

// Base64'e çevirme fonksiyonu (sıkıştırılmış)
function fileToBase64Compressed(file, maxWidth = 800, quality = 0.7) {
    return new Promise(async (resolve, reject) => {
        try {
            const compressedFile = await compressImage(file, maxWidth, quality);
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const base64 = e.target.result;
                if (base64.length > 500000) {
                    fileToBase64Compressed(file, maxWidth * 0.8, quality * 0.8).then(resolve).catch(reject);
                } else {
                    resolve(base64);
                }
            };
            
            reader.onerror = reject;
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            reject(error);
        }
    });
}

// Mobile Menu Toggle
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

// Navigate to section
function navigateToSection(sectionId) {
    const homeSection = document.getElementById('home-section');
    if (homeSection.style.display === 'none') {
        showSection('home');
        setTimeout(() => {
            scrollToSection(sectionId);
        }, 100);
    } else {
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
        themeIcon.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M11.38 2.019a7.5 7.5 0 1 0 10.6 10.6C21.662 17.854 17.316 22 12.001 22 6.477 22 2 17.523 2 12c0-5.315 4.146-9.661 9.38-9.981z'/%3E%3C/svg%3E";
    } else {
        themeIcon.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM17.6568 16.9497L18.364 17.6568L20.4853 15.5355L19.7782 14.8284L17.6568 16.9497ZM20.4853 8.46447L18.364 6.34315L17.6568 7.05025L19.7782 9.17157L20.4853 8.46447ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497Z'/%3E%3C/svg%3E";
    }
}

// Page management
function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });

    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.style.display = 'block';

        if (sectionName === 'my-lists') {
            loadUserLists();
        } else if (sectionName === 'account') {
            updateAccountInfo();
        } else if (sectionName === 'contact') {
            prefillContactForm();
        }
    }

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

        if (!currentUser.emailVerified) {
            const loginVerificationButtons = document.getElementById('loginVerificationButtons');
            if (loginVerificationButtons) {
                loginVerificationButtons.style.display = 'block';
            }
        } else {
            const loginVerificationButtons = document.getElementById('loginVerificationButtons');
            if (loginVerificationButtons) {
                loginVerificationButtons.style.display = 'none';
            }
        }

        prefillContactForm();
        prefillContactFormHome();
    } else {
        authButtons.style.display = 'block';
        userMenu.style.display = 'none';
        
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

    document.querySelectorAll('.user-dropdown').forEach(dd => {
        if (dd !== dropdown) {
            dd.classList.remove('show');
        }
    });

    dropdown.classList.toggle('show');
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
        
        if (currentUser && !currentUser.emailVerified) {
            showNotification('E-posta adresinizi doğrulamanız gerekiyor!', 'warning');
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

// Premium üyelik kontrolü ve liste sınırı
async function checkListLimit(listType) {
    if (userSubscription === 'premium') {
        return true;
    }

    try {
        const listsSnapshot = await db.collection('lists')
            .where('userId', '==', currentUser.uid)
            .get();

        if (listsSnapshot.size >= 1) {
            showNotification('Ücretsiz hesapla sadece 1 liste oluşturabilirsiniz. Premium üyeliğe geçin!', 'warning');
            showSection('subscription');
            return false;
        }
        return true;
    } catch (error) {
        console.error('Liste limit kontrolü hatası:', error);
        return true;
    }
}

// List type selection
async function selectListType(type) {
    const canCreate = await checkListLimit(type);
    if (!canCreate) {
        return;
    }

    currentItems = [];
    currentListId = null;
    currentListType = type;

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
            setupLabInputListeners();
            break;
    }

    renderItems();
}

async function previewListImage() {
    const file = document.getElementById('listImage').files[0];
    const preview = document.getElementById('imagePreview');
    
    if (file) {
        try {
            showNotification('Resim işleniyor...', 'info');
            const compressedBase64 = await fileToBase64Compressed(file);
            
            preview.innerHTML = `
                <div class="image-preview-container">
                    <img src="${compressedBase64}" alt="Liste Resmi" class="preview-image">
                    <button type="button" onclick="clearListImage()" class="remove-image-btn">❌</button>
                </div>
            `;
            showNotification('Resim hazırlandı!', 'success');
        } catch (error) {
            console.error('Resim işleme hatası:', error);
            showNotification('Resim işlenirken hata oluştu!', 'error');
            clearListImage();
        }
    }
}

function clearListImage() {
    document.getElementById('listImage').value = '';
    document.getElementById('imagePreview').innerHTML = '';
}

async function previewItemImage() {
    const file = document.getElementById('itemImage').files[0];
    const preview = document.getElementById('itemImagePreview');
    
    if (file) {
        try {
            showNotification('Resim işleniyor...', 'info');
            const compressedBase64 = await fileToBase64Compressed(file, 400, 0.6);
            
            preview.innerHTML = `
                <div class="image-preview-container">
                    <img src="${compressedBase64}" alt="Öğe Resmi" class="preview-image-small">
                    <button type="button" onclick="clearItemImage()" class="remove-image-btn">❌</button>
                </div>
            `;
            showNotification('Resim hazırlandı!', 'success');
        } catch (error) {
            console.error('Resim işleme hatası:', error);
            showNotification('Resim işlenirken hata oluştu!', 'error');
            clearItemImage();
        }
    }
}

function clearItemImage() {
    document.getElementById('itemImage').value = '';
    document.getElementById('itemImagePreview').innerHTML = '';
}

async function addItem() {
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

    const imageFile = document.getElementById('itemImage').files[0];
    if (imageFile) {
        try {
            showNotification('Resim işleniyor...', 'info');
            const compressedBase64 = await fileToBase64Compressed(imageFile, 300, 0.5);
            item.image = compressedBase64;
            
            currentItems.push(item);
            renderItems();
            clearItemForm();
            showNotification('Öğe eklendi! ✅', 'success');
        } catch (error) {
            console.error('Resim işleme hatası:', error);
            showNotification('Resim eklenirken hata oluştu, resim olmadan ekleniyor!', 'warning');
            
            currentItems.push(item);
            renderItems();
            clearItemForm();
        }
    } else {
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

        let listImageBase64 = null;
        const listImageFile = document.getElementById('listImage').files[0];
        if (listImageFile) {
            try {
                listImageBase64 = await fileToBase64Compressed(listImageFile, 600, 0.7);
            } catch (error) {
                console.error('Liste resmi işleme hatası:', error);
                showNotification('Liste resmi eklenirken hata oluştu, resim olmadan kaydediliyor!', 'warning');
            }
        }

        const listData = {
            name: listName,
            type: currentListType,
            items: currentItems,
            userId: currentUser.uid,
            userEmail: currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            image: listImageBase64
        };

        const dataSize = JSON.stringify(listData).length;
        console.log('Liste veri boyutu:', dataSize, 'bytes');
        
        if (dataSize > 900000) {
            showNotification('Liste çok büyük! Lütfen resim sayısını azaltın veya daha küçük resimler kullanın.', 'error');
            return;
        }

        let docRef;
        if (currentListId) {
            await db.collection('lists').doc(currentListId).update(listData);
            docRef = { id: currentListId };
            showNotification('Liste başarıyla güncellendi! 🎉', 'success');
        } else {
            docRef = await db.collection('lists').add(listData);
            currentListId = docRef.id;
            showNotification('Liste başarıyla kaydedildi! 🎉', 'success');
        }

        generateQRCode(docRef.id);

    } catch (error) {
        console.error('Liste kaydetme hatası:', error);
        
        if (error.code === 'invalid-argument' && error.message.includes('1048487')) {
            showNotification('Liste çok büyük! Lütfen resim sayısını azaltın veya daha küçük resimler kullanın.', 'error');
        } else {
            showNotification('Liste kaydedilemedi: ' + error.message, 'error');
        }
    }
}

function generateQRCode(listId) {
    const qrSection = document.getElementById('qrSection');
    const qrContainer = document.getElementById('qrCodeContainer');
    
    if (!qrSection || !qrContainer) return;
    
    qrSection.style.display = 'block';
    
    const shareUrl = `${window.location.origin}?list=${listId}`;
    
    QRCode.toCanvas(qrContainer, shareUrl, {
        width: 200,
        height: 200,
        margin: 2
    }, function (error) {
        if (error) {
            console.error('QR kod oluşturma hatası:', error);
            showNotification('QR kod oluşturulamadı!', 'error');
        } else {
            console.log('QR kod başarıyla oluşturuldu');
        }
    });
}

function showQRPage(listId) {
    if (!listId) {
        showNotification('Liste ID bulunamadı!', 'error');
        return;
    }

    showSection('qr-display');
    
    const qrDisplayContainer = document.getElementById('qrDisplayContainer');
    const shareUrl = `${window.location.origin}?list=${listId}`;
    
    qrDisplayContainer.innerHTML = '';
    
    QRCode.toCanvas(qrDisplayContainer, shareUrl, {
        width: 300,
        height: 300,
        margin: 2
    }, function (error) {
        if (error) {
            console.error('QR kod oluşturma hatası:', error);
            showNotification('QR kod oluşturulamadı!', 'error');
        }
    });
}

async function loadUserLists() {
    if (!currentUser) {
        showNotification('Giriş yapmalısınız!', 'error');
        return;
    }

    const listsContainer = document.getElementById('listsContainer');
    listsContainer.innerHTML = '<p class="loading">Listeler yükleniyor...</p>';

    try {
        const snapshot = await db.collection('lists')
            .where('userId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();

        if (snapshot.empty) {
            listsContainer.innerHTML = '<p class="no-items">Henüz liste oluşturmadınız. <a href="#" onclick="showSection(\'list-type\')">İlk listenizi oluşturun!</a></p>';
            return;
        }

        const lists = [];
        snapshot.forEach(doc => {
            lists.push({ id: doc.id, ...doc.data() });
        });

        renderUserLists(lists);
    } catch (error) {
        console.error('Listeler yüklenirken hata:', error);
        listsContainer.innerHTML = '<p class="error">Listeler yüklenirken hata oluştu!</p>';
    }
}

function renderUserLists(lists) {
    const listsContainer = document.getElementById('listsContainer');
    
    const filteredLists = currentFilter === 'all' 
        ? lists 
        : lists.filter(list => list.type === currentFilter);

    if (filteredLists.length === 0) {
        listsContainer.innerHTML = '<p class="no-items">Bu kategoride liste bulunamadı.</p>';
        return;
    }

    let html = '';

    filteredLists.forEach(list => {
        const listTypes = {
            shopping: '🛒 Alışveriş',
            todo: '✅ Yapılacaklar',
            laboratory: '🧪 Laboratuvar'
        };

        const createdDate = list.createdAt 
            ? new Date(list.createdAt.toDate()).toLocaleDateString('tr-TR')
            : 'Bilinmiyor';

        const itemsCount = list.items ? list.items.length : 0;
        const completedCount = list.items ? list.items.filter(item => item.completed).length : 0;

        html += `
            <div class="list-card" onclick="editList('${list.id}')">
                <h3>${list.name}</h3>
                <div class="list-type">${listTypes[list.type] || list.type}</div>
                <div class="list-date">📅 ${createdDate}</div>
                <div class="list-items-count">📊 ${completedCount}/${itemsCount} tamamlandı</div>
            </div>
        `;
    });

    listsContainer.innerHTML = html;
}

function setListFilter(filter) {
    currentFilter = filter;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    loadUserLists();
}

async function editList(listId) {
    try {
        const doc = await db.collection('lists').doc(listId).get();
        
        if (!doc.exists) {
            showNotification('Liste bulunamadı!', 'error');
            return;
        }

        const listData = doc.data();
        
        currentListId = listId;
        currentListType = listData.type;
        currentItems = listData.items || [];

        setupCreateListSection(currentListType);
        showSection('create-list');

        setTimeout(() => {
            document.getElementById('listName').value = listData.name || '';
            
            if (listData.image) {
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = `
                    <div class="image-preview-container">
                        <img src="${listData.image}" alt="Liste Resmi" class="preview-image">
                        <button type="button" onclick="clearListImage()" class="remove-image-btn">❌</button>
                    </div>
                `;
            }

            renderItems();
            generateQRCode(listId);
        }, 100);

    } catch (error) {
        console.error('Liste yüklenirken hata:', error);
        showNotification('Liste yüklenemedi!', 'error');
    }
}

async function loadUserSubscription() {
    userSubscription = 'free';
}

function updateAccountInfo() {
    if (!currentUser) return;

    document.getElementById('accountEmail').textContent = currentUser.email;
    document.getElementById('accountType').textContent = userSubscription === 'premium' ? 'Premium' : 'Ücretsiz';
    
    const createdDate = currentUser.metadata.creationTime 
        ? new Date(currentUser.metadata.creationTime).toLocaleDateString('tr-TR')
        : 'Bilinmiyor';
    document.getElementById('accountCreated').textContent = createdDate;

    db.collection('lists')
        .where('userId', '==', currentUser.uid)
        .get()
        .then(snapshot => {
            document.getElementById('accountListCount').textContent = snapshot.size;
        })
        .catch(error => {
            console.error('Liste sayısı yüklenemedi:', error);
        });
}

function upgradeToPremium() {
    showNotification('Premium üyelik özelliği yakında aktif olacak! 🚀', 'info');
}

// Contact form functions
function prefillContactForm() {
    if (currentUser) {
        const contactEmail = document.getElementById('contactEmail');
        if (contactEmail) {
            contactEmail.value = currentUser.email;
        }
        
        const contactName = document.getElementById('contactName');
        if (contactName && currentUser.displayName) {
            contactName.value = currentUser.displayName;
        }
    }
}

function prefillContactFormHome() {
    if (currentUser) {
        const contactEmailHome = document.getElementById('contactEmailHome');
        if (contactEmailHome) {
            contactEmailHome.value = currentUser.email;
        }
        
        const contactNameHome = document.getElementById('contactNameHome');
        if (contactNameHome && currentUser.displayName) {
            contactNameHome.value = currentUser.displayName;
        }
    }
}

// Contact form event listeners
document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!isEmailJSReady) {
        showNotification('E-posta servisi henüz hazır değil, lütfen bekleyin...', 'warning');
        return;
    }

    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const message = document.getElementById('contactMessage').value;

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            from_name: name,
            from_email: email,
            message: message,
            to_email: 'info@akilliliste.com'
        });

        showNotification('Mesajınız başarıyla gönderildi! 📧', 'success');
        document.getElementById('contactForm').reset();
    } catch (error) {
        console.error('E-posta gönderme hatası:', error);
        showNotification('Mesaj gönderilemedi, lütfen tekrar deneyin!', 'error');
    }
});

document.getElementById('contactFormHome').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!isEmailJSReady) {
        showNotification('E-posta servisi henüz hazır değil, lütfen bekleyin...', 'warning');
        return;
    }

    const name = document.getElementById('contactNameHome').value;
    const email = document.getElementById('contactEmailHome').value;
    const message = document.getElementById('contactMessageHome').value;

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            from_name: name,
            from_email: email,
            message: message,
            to_email: 'info@akilliliste.com'
        });

        showNotification('Mesajınız başarıyla gönderildi! 📧', 'success');
        document.getElementById('contactFormHome').reset();
    } catch (error) {
        console.error('E-posta gönderme hatası:', error);
        showNotification('Mesaj gönderilemedi, lütfen tekrar deneyin!', 'error');
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
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// URL parameter handling for shared lists
function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const listId = urlParams.get('list');
    
    if (listId) {
        viewSharedList(listId);
    }
}

async function viewSharedList(listId) {
    try {
        const doc = await db.collection('lists').doc(listId).get();
        
        if (!doc.exists) {
            showNotification('Paylaşılan liste bulunamadı!', 'error');
            return;
        }

        const listData = doc.data();
        
        currentListId = listId;
        currentListType = listData.type;
        currentItems = listData.items || [];

        setupCreateListSection(currentListType);
        showSection('create-list');

        setTimeout(() => {
            document.getElementById('listName').value = listData.name || '';
            
            if (listData.image) {
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = `
                    <div class="image-preview-container">
                        <img src="${listData.image}" alt="Liste Resmi" class="preview-image">
                    </div>
                `;
            }

            renderItems();
            
            showNotification('Paylaşılan liste yüklendi! 📋', 'success');
        }, 100);

    } catch (error) {
        console.error('Paylaşılan liste yüklenirken hata:', error);
        showNotification('Paylaşılan liste yüklenemedi!', 'error');
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing application...');
    
    initializeTheme();
    initializeFirebase();
    initializeEmailJS();
    handleURLParameters();
    
    // Hide all sections except home initially
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById('home-section').style.display = 'block';
    
    console.log('Application initialized successfully');
});
