import { supabase } from './supabaseClient.js';

/**
 * Connexion avec Email et Mot de passe
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{data: any, error: any}>}
 */
export const loginWithEmail = async (email, password) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        return { data, error };
    } catch (err) {
        return { data: null, error: err };
    }
};

/**
 * Inscription avec Email et Mot de passe
 * @param {string} email 
 * @param {string} password 
 * @param {object} metadata (ex: { full_name: 'John Doe' })
 * @returns {Promise<{data: any, error: any}>}
 */
export const registerWithEmail = async (email, password, metadata = {}) => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });
        return { data, error };
    } catch (err) {
        return { data: null, error: err };
    }
};

/**
 * Connexion via OAuth (Google, GitHub, LinkedIn, etc.)
 * @param {string} provider ('google', 'github', 'linkedin')
 */
export const loginWithOAuth = async (provider) => {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: `${window.location.origin}/dashboard.html`
            }
        });
        if (error) throw error;
        return { data, error: null };
    } catch (err) {
        console.error("OAuth Error:", err);
        return { data: null, error: err };
    }
};

/**
 * Déconnexion de l'utilisateur
 * @returns {Promise<{error: any}>}
 */
export const logout = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            window.location.href = 'index.html';
        }
        return { error };
    } catch (err) {
        return { error: err };
    }
};

/**
 * Envoi d'un email de réinitialisation de mot de passe
 * @param {string} email 
 * @returns {Promise<{data: any, error: any}>}
 */
export const resetPassword = async (email) => {
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`,
        });
        return { data, error };
    } catch (err) {
        return { data: null, error: err };
    }
};

/**
 * Mise à jour du mot de passe (une fois connecté ou via lien reset)
 * @param {string} newPassword 
 * @returns {Promise<{data: any, error: any}>}
 */
export const updatePassword = async (newPassword) => {
    try {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });
        return { data, error };
    } catch (err) {
        return { data: null, error: err };
    }
};

/**
 * Vérifie la session active sans redirection
 * Utile pour l'UI (afficher bouton Login ou Dashboard)
 * @returns {Promise<object|null>} Session object or null
 */
export const checkSession = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    } catch (err) {
        console.error("Session check error:", err);
        return null;
    }
};

/**
 * Protège une page privée
 * Redirige vers login.html si pas de session
 * @returns {Promise<object>} Session object if valid
 */
export const protectPrivatePage = async () => {
    const session = await checkSession();
    if (!session) {
        // Sauvegarder l'URL actuelle pour redirection post-login si besoin
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = 'login.html';
        return null;
    }
    return session;
};

/**
 * Récupère le profil utilisateur depuis la table 'profiles'
 * @param {string} userId 
 * @returns {Promise<{data: any, error: any}>}
 */
export const getUserProfile = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        return { data, error };
    } catch (err) {
        return { data: null, error: err };
    }
};

// Listener global pour les changements d'état d'authentification
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
        // Nettoyage optionnel du stockage local ou redirection
        // window.location.href = 'index.html';
    }
});