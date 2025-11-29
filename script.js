/*
 * WebForge AI - Global UI Script
 * Gestion des interactions interface, animations et utilitaires
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initSmoothScroll();
    initScrollAnimations();
    initStickyNav();
    initTabs();
    initFormValidation();
});

/* =========================================
   1. Navigation & Menu Mobile
   ========================================= */
function initMobileMenu() {
    const burger = document.getElementById('burger-menu');
    const navLinks = document.getElementById('nav-links');
    
    if (burger && navLinks) {
        burger.addEventListener('click', () => {
            // Toggle Menu
            navLinks.classList.toggle('active');
            
            // Animation Burger (Transformation en croix via CSS si implémenté)
            burger.classList.toggle('open');
            
            // Gestion de l'aria-expanded pour l'accessibilité
            const isExpanded = navLinks.classList.contains('active');
            burger.setAttribute('aria-expanded', isExpanded);
        });

        // Fermer le menu si on clique sur un lien
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                burger.classList.remove('open');
            });
        });

        // Fermer le menu si on clique en dehors
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !burger.contains(e.target) && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                burger.classList.remove('open');
            }
        });
    }
}

function initStickyNav() {
    const nav = document.querySelector('.main-nav');
    if (nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                nav.classList.add('scrolled');
                nav.style.background = 'rgba(15, 15, 22, 0.95)';
                nav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
            } else {
                nav.classList.remove('scrolled');
                nav.style.background = ''; // Retour au style CSS (glass)
                nav.style.boxShadow = '';
            }
        });
    }
}

/* =========================================
   2. Smooth Scroll
   ========================================= */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const navHeight = document.querySelector('.main-nav') ? document.querySelector('.main-nav').offsetHeight : 0;
                
                window.scrollTo({
                    top: targetElement.offsetTop - navHeight - 20,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* =========================================
   3. Animations au Scroll (Intersection Observer)
   ========================================= */
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target); // Animer une seule fois
            }
        });
    }, observerOptions);

    // Éléments à animer
    const elementsToAnimate = document.querySelectorAll('.card, .hero-text, .hero-image, .section-header, .step');
    
    elementsToAnimate.forEach((el, index) => {
        // État initial
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        
        observer.observe(el);
    });
}

/* =========================================
   4. Système de Notifications (Toast)
   ========================================= */
window.showToast = function(message, type = 'info') {
    // Créer le conteneur s'il n'existe pas
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(toastContainer);
    }

    // Créer le toast
    const toast = document.createElement('div');
    
    // Couleurs selon le type
    let bg, icon;
    switch(type) {
        case 'success':
            bg = 'rgba(16, 185, 129, 0.9)';
            icon = '<i class="fa-solid fa-check-circle"></i>';
            break;
        case 'error':
            bg = 'rgba(239, 68, 68, 0.9)';
            icon = '<i class="fa-solid fa-circle-exclamation"></i>';
            break;
        case 'warning':
            bg = 'rgba(245, 158, 11, 0.9)';
            icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
            break;
        default:
            bg = 'rgba(99, 102, 241, 0.9)';
            icon = '<i class="fa-solid fa-info-circle"></i>';
    }

    toast.style.cssText = `
        background: ${bg};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 300px;
        backdrop-filter: blur(5px);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        font-size: 0.95rem;
    `;
    
    toast.innerHTML = `${icon} <span>${message}</span>`;
    toastContainer.appendChild(toast);

    // Animation d'entrée
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
    });

    // Auto suppression
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, 4000);
};

/* =========================================
   5. Logique des Onglets (Tabs)
   ========================================= */
function initTabs() {
    const tabContainers = document.querySelectorAll('.tabs-container'); // Classe générique à ajouter si besoin

    // Gestion spécifique pour l'éditeur Monaco (si structure .editor-tabs existe)
    const editorTabs = document.querySelectorAll('.editor-tabs .tab');
    if (editorTabs.length > 0) {
        editorTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Retirer active des frères
                const siblings = this.parentElement.children;
                for (let sibling of siblings) {
                    sibling.classList.remove('active');
                }
                this.classList.add('active');
                // La logique de changement de contenu est gérée par editor.html
            });
        });
    }
}

/* =========================================
   6. Validation de Formulaires
   ========================================= */
function initFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            // Validation en temps réel
            input.addEventListener('input', () => {
                validateField(input);
            });
            
            // Validation au blur
            input.addEventListener('blur', () => {
                validateField(input);
            });
        });
    });
}

function validateField(input) {
    const type = input.type;
    const value = input.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Reset style
    input.style.borderColor = 'rgba(255, 255, 255, 0.1)';

    // Required check
    if (input.hasAttribute('required') && value === '') {
        isValid = false;
        errorMessage = 'Ce champ est requis';
    }

    // Email check
    if (type === 'email' && value !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Email invalide';
        }
    }

    // Password length check
    if (type === 'password' && value !== '' && input.getAttribute('minlength')) {
        const min = parseInt(input.getAttribute('minlength'));
        if (value.length < min) {
            isValid = false;
            errorMessage = `Minimum ${min} caractères`;
        }
    }

    // Visual Feedback
    if (!isValid) {
        input.style.borderColor = '#ef4444';
        // On pourrait ajouter un tooltip d'erreur ici
    } else if (value !== '') {
        input.style.borderColor = '#10b981';
    }

    return isValid;
}

/* =========================================
   7. Fonctions Utilitaires
   ========================================= */

// Debounce : Limite la fréquence d'appel d'une fonction
window.debounce = function(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
};

// Throttle : Assure qu'une fonction n'est appelée qu'une fois par intervalle
window.throttle = function(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Formatage de nombre (ex: 1 200)
window.formatNumber = function(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

// Formatage de date (FR)
window.formatDate = function(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
};

// Copier dans le presse-papier
window.copyToClipboard = async function(text) {
    try {
        await navigator.clipboard.writeText(text);
        window.showToast('Copié dans le presse-papier', 'success');
    } catch (err) {
        console.error('Erreur copie:', err);
        window.showToast('Erreur lors de la copie', 'error');
    }
};