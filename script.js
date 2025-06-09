// Menu toggle function
function toggleMobileMenu() {
    const menuBtn = document.getElementById('menuToggleBtn');
    const navButtons = document.getElementById('navButtons');
    
    if (navButtons.classList.contains('open')) {
        // Closing menu
        navButtons.classList.remove('open');
        menuBtn.textContent = '+';
    } else {
        // Opening menu
        navButtons.classList.add('open');
        menuBtn.textContent = 'X';
    }
    
    // Close user dropdown when toggling mobile menu
    document.getElementById('userDropdown').classList.remove('show');
}

// Close mobile menu when clicking on a nav item
document.querySelectorAll('.nav-buttons .nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
            const menuBtn = document.getElementById('menuToggleBtn');
            const navButtons = document.getElementById('navButtons');
            
            navButtons.classList.remove('open');
            menuBtn.textContent = '+';
        }
    });
});

// Add event listener to menu toggle button after DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
    // Existing initialization code...
    
    // Add menu toggle button event listener
    const menuBtn = document.getElementById('menuToggleBtn');
    if (menuBtn) {
        menuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // Close mobile menu and dropdowns when window resizes
    window.addEventListener('resize', function() {
        const menuBtn = document.getElementById('menuToggleBtn');
        const navButtons = document.getElementById('navButtons');
        const userDropdown = document.getElementById('userDropdown');
        
        if (window.innerWidth > 768) {
            if (navButtons?.classList.contains('open')) {
                navButtons.classList.remove('open');
                if (menuBtn) menuBtn.textContent = '+';
            }
        }
        
        if (userDropdown) {
            userDropdown.classList.remove('show');
        }
    });
});
