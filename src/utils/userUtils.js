/**
 * Calcule le pourcentage de complétion du profil
 * @param {Object} user 
 * @returns {number} Pourcentage (0-100)
 */
export const calculateCompletion = (user) => {
    if (!user) return 0;

    let score = 0;
    const totalPoints = 5; // On reste sur 5 critères clés

    // 1. Inscription de base (Email/Nom/Prénom)
    // C'est acquis dès la création du compte
    score += 1;

    // 2. A une bio ? (Pour la confiance sociale)
    if (user.bio && user.bio.length > 10) score += 1;

    // 3. A un téléphone ? (Pour être joignable)
    if (user.phoneNumber && user.phoneNumber.length > 4) score += 1;

    // 4. Identité Vérifiée ? (CRITÈRE MAJEUR)
    // Au lieu de "isVerified", on regarde si le National ID est renseigné
    if (user.nationalId && user.nationalId.length > 5) score += 1;

    // 5. A une photo perso ? 
    // On vérifie que ce n'est pas l'avatar par défaut généré automatiquement
    // (Dicebear est ce qu'on utilise pour les avatars par défaut)
    const hasDefaultAvatar = !user.picture || user.picture.includes('dicebear') || user.picture.includes('placehold');
    if (!hasDefaultAvatar) score += 1;

    return (score / totalPoints) * 100;
};

// --- FONCTION DE NIVEAU (inchangée mais recalculée avec les nouveaux critères) ---
export const getUserLevel = (completionPercentage) => {
    if (completionPercentage < 40) {
        return { label: "Nouveau Membre", color: "text-gray-400", barColor: "bg-gray-400" };
    } 
    if (completionPercentage < 80) {
        return { label: "Membre Actif", color: "text-emerald-300", barColor: "bg-emerald-400" };
    } 
    return { label: "Profil Certifié 🏅", color: "text-emerald-400 font-bold", barColor: "bg-emerald-500" };
};