// src/services/discountService.js
import apiClient, { isMock } from './apiClient';

const ENDPOINT = '/discounts';

/**
 * ============================================================================
 * SERVICE : DISCOUNTS
 * Objectif :
 * - Gérer les codes promo / remises.
 * - MockAPI : on récupère la liste et on filtre côté client.
 * - Symfony : plus tard, le backend pourra exposer un endpoint de validation.
 *
 * Convention : camelCase côté Front.
 * ==========================================================================
 */

export const DiscountService = {
    // ---------------------------------------------------------------------
    // Récupère toutes les remises
    // ---------------------------------------------------------------------
    getAll: async () => {
        try {
            const response = await apiClient.get(ENDPOINT);
            return Array.isArray(response) ? response : [];
        } catch (error) {
            // MockAPI : si la ressource n'existe pas encore, on retourne []
            console.error('Erreur chargement discounts:', error);
            return [];
        }
    },

    // ---------------------------------------------------------------------
    // Trouve une remise par code (case-insensitive)
    // - Retourne null si pas trouvé
    // ---------------------------------------------------------------------
    getByCode: async (code) => {
        try {
            const safeCode = String(code || '').trim();
            if (!safeCode) return null;

            // -----------------------------------------------------------------
            // MockAPI : pas de query param strict, on filtre côté client.
            // Symfony : on pourra faire un endpoint /discounts/validate?code=...
            // -----------------------------------------------------------------
            const list = await DiscountService.getAll();
            const found = list.find(d => String(d.code || '').toLowerCase() === safeCode.toLowerCase());

            return found || null;
        } catch (error) {
            console.error('Erreur recherche discount:', error);
            return null;
        }
    },
};
