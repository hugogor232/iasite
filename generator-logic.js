import { supabase } from './supabaseClient.js';
import { protectPrivatePage } from './auth-oauth.js';

// --- State Management ---
let currentUser = null;
let currentStep = 1;
const totalSteps = 5;

const wizardData = {
    type: '',
    style: '',
    features: [],
    name: '',
    description: '',
    pages: ['index'] // 'index' is mandatory
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Security Check
    const session = await protectPrivatePage();
    if (!session) return;
    currentUser = session.user;

    // 2. Initialize UI
    updateProgressBar();
    updateButtons();
});

// --- Exposed Window Functions (for HTML onclick events) ---

/**
 * Sélectionne une option unique (Type, Style)
 */
window.selectOption = (category, value, element) => {
    wizardData[category] = value;
    
    // Update UI
    const container = element.parentElement;
    const cards = container.querySelectorAll('.selection-card');
    cards.forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
};

/**
 * Bascule une fonctionnalité (Checkbox behavior)
 */
window.toggleFeature = (feature, element) => {
    if (wizardData.features.includes(feature)) {
        wizardData.features = wizardData.features.filter(f => f !== feature);
        element.classList.remove('selected');
    } else {
        wizardData.features.push(feature);
        element.classList.add('selected');
    }
};

/**
 * Bascule une page à générer
 */
window.togglePage = (page, element) => {
    if (wizardData.pages.includes(page)) {
        wizardData.pages = wizardData.pages.filter(p => p !== page);
        element.classList.remove('selected');
    } else {
        wizardData.pages.push(page);
        element.classList.add('selected');
    }
};

/**
 * Met à jour les champs texte (Nom, Description)
 */
window.updateFormData = (field, value) => {
    wizardData[field] = value;
};

/**
 * Navigation entre les étapes
 */
window.changeStep = (direction) => {
    const nextStep = currentStep + direction;

    // Validation
    if (direction > 0) {
        if (!validateStep(currentStep)) return;
    }

    if (nextStep > 0 && nextStep <= totalSteps) {
        // Hide current
        document.getElementById(`step-${currentStep}`).classList.remove('active');
        const currIndicator = document.querySelector(`.step-indicator[data-step="${currentStep}"]`);
        currIndicator.classList.remove('active');
        
        if (direction > 0) {
            currIndicator.classList.add('completed');
        } else {
            currIndicator.classList.remove('completed');
        }

        // Show next
        currentStep = nextStep;
        document.getElementById(`step-${currentStep}`).classList.add('active');
        document.querySelector(`.step-indicator[data-step="${currentStep}"]`).classList.add('active');

        // Updates
        updateProgressBar();
        updateButtons();

        if (currentStep === 5) {
            updateReview();
        }
    }
};

// --- Internal Logic ---

function validateStep(step) {
    switch(step) {
        case 1:
            if (!wizardData.type) {
                window.showToast('Veuillez sélectionner un type de projet.', 'warning');
                return false;
            }
            return true;
        case 2:
            if (!wizardData.style) {
                window.showToast('Veuillez sélectionner un style visuel.', 'warning');
                return false;
            }
            return true;
        case 4:
            if (!wizardData.name.trim()) {
                window.showToast('Le nom du projet est obligatoire.', 'warning');
                return false;
            }
            return true;
        default:
            return true;
    }
}

function updateProgressBar() {
    const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;
    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = `${progressPercent}%`;
}

function updateButtons() {
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnGen = document.getElementById('btn-generate');

    if (btnPrev) btnPrev.disabled = currentStep === 1;

    if (currentStep === totalSteps) {
        if (btnNext) btnNext.style.display = 'none';
        if (btnGen) btnGen.style.display = 'inline-flex';
    } else {
        if (btnNext) btnNext.style.display = 'inline-flex';
        if (btnGen) btnGen.style.display = 'none';
    }
}

function updateReview() {
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setText('review-name', wizardData.name);
    setText('review-type', capitalize(wizardData.type));
    setText('review-style', capitalize(wizardData.style));
    setText('review-pages', wizardData.pages.map(p => capitalize(p)).join(', '));
    setText('review-features', wizardData.features.length > 0 ? wizardData.features.map(f => capitalize(f.replace('_', ' '))).join(', ') : 'Aucune');
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Generation Logic ---

window.generateProject = async () => {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    
    if (overlay) overlay.style.display = 'flex';

    try {
        // 1. Simulation UX de l'IA
        const steps = [
            "Analyse du prompt...",
            "Architecture du projet...",
            "Génération du code HTML/CSS...",
            "Optimisation du JavaScript...",
            "Déploiement sur Supabase..."
        ];

        for (const step of steps) {
            if (loadingText) loadingText.textContent = step;
            await new Promise(r => setTimeout(r, 800));
        }

        // 2. Création de l'entrée Projet dans Supabase
        const { data: project, error: projError } = await supabase
            .from('projects')
            .insert({
                user_id: currentUser.id,
                name: wizardData.name,
                status: 'draft',
                description: wizardData.description,
                settings: {
                    type: wizardData.type,
                    style: wizardData.style,
                    features: wizardData.features,
                    pages: wizardData.pages
                }
            })
            .select()
            .single();

        if (projError) throw projError;

        // 3. Génération du code (Mock local pour l'instant)
        // Note: Dans une version production, ceci appellerait une Edge Function OpenAI
        const generatedFiles = generateMockFiles(wizardData);

        // 4. Insertion des fichiers dans Supabase
        const fileInserts = generatedFiles.map(file => ({
            project_id: project.id,
            path: file.path,
            content: file.content,
            language: getLanguageFromPath(file.path)
        }));

        const { error: filesError } = await supabase
            .from('project_files')
            .insert(fileInserts);

        if (filesError) throw filesError;

        // 5. Redirection
        window.location.href = `editor.html?id=${project.id}`;

    } catch (err) {
        console.error("Generation Error:", err);
        if (overlay) overlay.style.display = 'none';
        window.showToast(`Erreur: ${err.message}`, 'error');
    }
};

function getLanguageFromPath(path) {
    if (path.endsWith('.css')) return 'css';
    if (path.endsWith('.js')) return 'javascript';
    return 'html';
}

// --- Mock AI Generator ---
// Génère un template de base selon les choix pour avoir un résultat fonctionnel
function generateMockFiles(data) {
    const isDark = data.style === 'tech' || data.style === 'modern';
    const primaryColor = data.style === 'tech' ? '#00f2ff' : (data.style === 'creative' ? '#ff0055' : '#6366f1');
    const bgColor = isDark ? '#1e1e2e' : '#ffffff';
    const textColor = isDark ? '#ffffff' : '#333333';

    // CSS
    const cssContent = `
:root {
    --primary: ${primaryColor};
    --bg: ${bgColor};
    --text: ${textColor};
    --font: 'Inter', sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: var(--font);
    background-color: var(--bg);
    color: var(--text);
    line-height: 1.6;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

header {
    padding: 2rem 0;
    border-bottom: 1px solid rgba(128,128,128,0.1);
}

nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo { font-weight: bold; font-size: 1.5rem; color: var(--primary); }

.hero {
    padding: 5rem 0;
    text-align: center;
}

h1 { font-size: 3.5rem; margin-bottom: 1rem; }
p { font-size: 1.2rem; opacity: 0.8; margin-bottom: 2rem; }

.btn {
    display: inline-block;
    padding: 12px 24px;
    background: var(--primary);
    color: ${isDark ? '#000' : '#fff'};
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    transition: transform 0.2s;
}

.btn:hover { transform: translateY(-2px); }

.features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    padding: 4rem 0;
}

.card {
    padding: 2rem;
    border: 1px solid rgba(128,128,128,0.2);
    border-radius: 12px;
}
    `;

    // HTML
    const navLinks = data.pages.map(p => `<a href="${p === 'index' ? 'index.html' : p + '.html'}" style="margin-left:20px; color:inherit; text-decoration:none;">${capitalize(p)}</a>`).join('');
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.name}</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>

    <header>
        <div class="container">
            <nav>
                <div class="logo">${data.name}</div>
                <div class="links">
                    ${navLinks}
                </div>
            </nav>
        </div>
    </header>

    <main>
        <section class="hero">
            <div class="container">
                <h1>Bienvenue sur ${data.name}</h1>
                <p>${data.description || 'Un site généré par WebForge AI.'}</p>
                <a href="#" class="btn" onclick="handleClick()">En savoir plus</a>
            </div>
        </section>

        <section class="container features">
            <div class="card">
                <h3>Feature 1</h3>
                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit.</p>
            </div>
            <div class="card">
                <h3>Feature 2</h3>
                <p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            </div>
            <div class="card">
                <h3>Feature 3</h3>
                <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco.</p>
            </div>
        </section>
    </main>

    <script src="script.js"></script>
</body>
</html>
    `;

    // JS
    const jsContent = `
console.log('Site ${data.name} chargé avec succès');

function handleClick() {
    alert('Merci de votre intérêt pour ${data.name} !');
}
    `;

    const files = [
        { path: 'index.html', content: htmlContent },
        { path: 'style.css', content: cssContent },
        { path: 'script.js', content: jsContent }
    ];

    // Générer les pages supplémentaires vides
    data.pages.forEach(page => {
        if (page !== 'index') {
            files.push({
                path: `${page}.html`,
                content: htmlContent.replace(`<h1>Bienvenue sur ${data.name}</h1>`, `<h1>Page ${capitalize(page)}</h1>`)
            });
        }
    });

    return files;
}