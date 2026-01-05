// src/services/fileService.js
/**
 * ============================================================================ 
 *                           FILE SERVICE
 * Objectif :  
 * - Gérer l'upload de fichiers (images).
 * - Utilisation de fetch pour envoyer des fichiers au backend.
 * Convention : camelCase côté Front.
 * ============================================================================
 */

// Service dédié à l'upload de fichiers
// Utilisation de fetch pour envoyer des fichiers au backend
const UPLOAD_URL = "http://localhost:8080/EcorideBackAjlani/resources/files/upload";

export const uploadImage = async (file) => {
    try {
        const response = await fetch(UPLOAD_URL, {
            method: 'POST',
            body: file, // On envoie le fichier brut (Binary)
            headers: {
                // Important : on précise qu'on envoie un flux d'octets
                'Content-Type': 'application/octet-stream' 
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur upload: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.url; // Le serveur renvoie { "url": "..." }
    } catch (error) {
        console.error("Erreur lors de l'upload:", error);
        throw error;
    }
};