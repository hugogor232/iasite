import { supabase } from './supabaseClient.js';
import { protectPrivatePage } from './auth-oauth.js';

// --- State Management ---
let projectId = null;
let files = [];
let currentFile = null;
let editor = null;
let saveTimeout = null;
const SAVE_DELAY_MS = 1000;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Security Check
    const session = await protectPrivatePage();
    if (!session) return;

    // 2. Get Project ID from URL
    const params = new URLSearchParams(window.location.search);
    projectId = params.get('id');

    if (!projectId) {
        window.showToast('Projet non spécifié', 'error');
        setTimeout(() => window.location.href = 'dashboard.html', 1500);
        return;
    }

    // 3. Initialize UI & Data
    await loadProjectMetadata();
    await loadProjectFiles();
    initMonacoEditor();
    setupEventListeners();
});

// --- Data Fetching ---

async function loadProjectMetadata() {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('name')
            .eq('id', projectId)
            .single();

        if (error) throw error;

        // Update UI
        const nameDisplay = document.getElementById('project-name-display');
        const urlDisplay = document.getElementById('preview-url-display');
        const extLink = document.getElementById('btn-external-preview');

        if (nameDisplay) nameDisplay.textContent = data.name;
        if (urlDisplay) urlDisplay.textContent = `${data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.webforge.app`;
        if (extLink) extLink.href = `preview.html?id=${projectId}`;

    } catch (err) {
        console.error("Error loading metadata:", err);
        window.showToast('Erreur lors du chargement du projet', 'error');
    }
}

async function loadProjectFiles() {
    try {
        const { data, error } = await supabase
            .from('project_files')
            .select('*')
            .eq('project_id', projectId)
            .order('path');

        if (error) throw error;

        files = data;
        renderFileList();

        // Determine initial file (index.html or first available)
        const indexFile = files.find(f => f.path === 'index.html');
        currentFile = indexFile || files[0];

    } catch (err) {
        console.error("Error loading files:", err);
        window.showToast('Impossible de charger les fichiers', 'error');
    }
}

// --- UI Rendering ---

function renderFileList() {
    const list = document.getElementById('file-list');
    if (!list) return;

    list.innerHTML = '';

    files.forEach(file => {
        const li = document.createElement('li');
        li.className = `file-item ${currentFile && currentFile.id === file.id ? 'active' : ''}`;
        li.dataset.id = file.id;
        
        // Icon selection
        let iconClass = 'fa-file';
        let colorClass = '';
        if (file.path.endsWith('.html')) { iconClass = 'fa-brands fa-html5'; colorClass = 'icon-html'; }
        else if (file.path.endsWith('.css')) { iconClass = 'fa-brands fa-css3-alt'; colorClass = 'icon-css'; }
        else if (file.path.endsWith('.js')) { iconClass = 'fa-brands fa-js'; colorClass = 'icon-js'; }
        else if (file.path.endsWith('.json')) { iconClass = 'fa-solid fa-code'; colorClass = 'icon-json'; }

        li.innerHTML = `
            <span class="file-icon ${colorClass}"><i class="${iconClass}"></i></span>
            ${file.path}
        `;

        li.addEventListener('click', () => switchFile(file));
        list.appendChild(li);
    });
}

// --- Monaco Editor Logic ---

function initMonacoEditor() {
    // Ensure Monaco loader is present (loaded in HTML via CDN)
    if (typeof require === 'undefined') {
        console.error('Monaco loader not found');
        return;
    }

    require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});

    require(['vs/editor/editor.main'], function() {
        if (!currentFile) return;

        const container = document.getElementById('monaco-editor');
        if (!container) return;

        editor = monaco.editor.create(container, {
            value: currentFile.content,
            language: getLanguageFromPath(currentFile.path),
            theme: 'vs-dark',
            automaticLayout: true,
            fontFamily: 'Fira Code, monospace',
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 16, bottom: 16 },
            tabSize: 2
        });

        // Listen for changes
        editor.onDidChangeModelContent(() => {
            handleContentChange();
        });

        // Initial preview render
        updatePreview();
    });
}

function switchFile(file) {
    if (!editor || (currentFile && currentFile.id === file.id)) return;

    currentFile = file;
    
    // Update UI
    renderFileList();
    const tabName = document.getElementById('current-tab-name');
    if (tabName) tabName.textContent = file.path;

    // Update Editor
    const model = editor.getModel();
    monaco.editor.setModelLanguage(model, getLanguageFromPath(file.path));
    editor.setValue(file.content);
}

function getLanguageFromPath(path) {
    if (path.endsWith('.html')) return 'html';
    if (path.endsWith('.css')) return 'css';
    if (path.endsWith('.js')) return 'javascript';
    if (path.endsWith('.json')) return 'json';
    return 'plaintext';
}

// --- Save & Persistence ---

function handleContentChange() {
    if (!currentFile || !editor) return;

    // Update local state immediately
    const content = editor.getValue();
    currentFile.content = content;

    // Update UI Status
    updateSaveStatus('saving');

    // Debounce DB Save
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        await saveToSupabase(currentFile.id, content);
        updatePreview(); // Refresh preview after "save"
    }, SAVE_DELAY_MS);
}

async function saveToSupabase(fileId, content) {
    try {
        const { error } = await supabase
            .from('project_files')
            .update({ content: content })
            .eq('id', fileId);

        if (error) throw error;

        updateSaveStatus('saved');
    } catch (err) {
        console.error("Save error:", err);
        updateSaveStatus('error');
    }
}

function updateSaveStatus(status) {
    const statusEl = document.getElementById('save-status');
    if (!statusEl) return;

    if (status === 'saving') {
        statusEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sauvegarde...';
        statusEl.className = 'save-status saving';
    } else if (status === 'saved') {
        statusEl.innerHTML = '<i class="fa-regular fa-circle-check"></i> À jour';
        statusEl.className = 'save-status saved';
    } else if (status === 'error') {
        statusEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Erreur';
        statusEl.style.color = '#ef4444';
    }
}

// --- Preview System ---

function updatePreview() {
    const frame = document.getElementById('preview-frame');
    if (!frame) return;

    // Find core files
    const htmlFile = files.find(f => f.path === 'index.html');
    const cssFile = files.find(f => f.path === 'style.css');
    const jsFile = files.find(f => f.path === 'script.js');

    if (!htmlFile) {
        // Fallback if no index.html
        frame.srcdoc = '<body style="color:white; background:#1e1e2e; font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh;">Pas de fichier index.html</body>';
        return;
    }

    let htmlContent = htmlFile.content;
    const cssContent = cssFile ? cssFile.content : '';
    const jsContent = jsFile ? jsFile.content : '';

    // Inject CSS
    if (cssContent) {
        const styleTag = `<style>${cssContent}</style>`;
        // Remove existing link to style.css to avoid 404
        htmlContent = htmlContent.replace(/<link[^>]*href=["']style\.css["'][^>]*>/gi, '');
        
        if (htmlContent.includes('</head>')) {
            htmlContent = htmlContent.replace('</head>', `${styleTag}</head>`);
        } else {
            htmlContent += styleTag;
        }
    }

    // Inject JS
    if (jsContent) {
        const scriptTag = `<script>${jsContent}</script>`;
        // Remove existing script src to script.js
        htmlContent = htmlContent.replace(/<script[^>]*src=["']script\.js["'][^>]*><\/script>/gi, '');

        if (htmlContent.includes('</body>')) {
            htmlContent = htmlContent.replace('</body>', `${scriptTag}</body>`);
        } else {
            htmlContent += scriptTag;
        }
    }

    // Use Blob URL for better isolation than srcdoc
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Clean up old blob
    if (frame.dataset.blobUrl) {
        URL.revokeObjectURL(frame.dataset.blobUrl);
    }
    
    frame.src = url;
    frame.dataset.blobUrl = url;
}

// --- Event Listeners ---

function setupEventListeners() {
    const refreshBtn = document.getElementById('btn-refresh-preview');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const icon = refreshBtn.querySelector('i');
            icon.classList.add('fa-spin');
            updatePreview();
            setTimeout(() => icon.classList.remove('fa-spin'), 500);
        });
    }

    // Handle window resize for Monaco
    window.addEventListener('resize', () => {
        if (editor) editor.layout();
    });
}