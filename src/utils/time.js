// src/utils/time.js

/**
 * ============================================================================
 * UTILS : TIME
 * Objectif :
 * - Centraliser les helpers liés aux heures.
 * - Éviter les "Invalid Date" et les crashs UI.
 * ============================================================================
 */

/**
 * Ajoute un nombre de minutes à une heure HH:mm
 *
 * @param {string} timeStr - Heure au format "HH:mm" ou "HH:mm:ss"
 * @param {number} minutesToAdd - Minutes à ajouter (peut être 0)
 * @returns {string} Heure formatée "HH:mm" ou "--:--" si invalide
 */
export const addMinutesToTime = (timeStr, minutesToAdd = 0) => {
    // -------------------------------------------------------------------------
    // Sécurité : heure absente ou invalide
    // -------------------------------------------------------------------------
    if (!timeStr || typeof timeStr !== "string") {
        return "--:--";
    }

    // -------------------------------------------------------------------------
    // Normalisation :
    // - "15:03:12"  -> "15:03"
    // - "15:03"     -> "15:03"
    // -------------------------------------------------------------------------
    const cleanTime = timeStr.substring(0, 5);

    const [hours, mins] = cleanTime.split(":").map(Number);

    if (
        !Number.isFinite(hours) ||
        !Number.isFinite(mins)
    ) {
        return "--:--";
    }

    // -------------------------------------------------------------------------
    // Minutes à ajouter : fallback propre
    // -------------------------------------------------------------------------
    const safeMinutesToAdd = Number.isFinite(minutesToAdd)
        ? Math.round(minutesToAdd)
        : 0;

    // -------------------------------------------------------------------------
    // Calcul de l'heure finale
    // -------------------------------------------------------------------------
    const date = new Date();
    date.setHours(hours, mins + safeMinutesToAdd, 0, 0);

    // -------------------------------------------------------------------------
    // Retour formaté "HH:mm"
    // -------------------------------------------------------------------------
    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
};
