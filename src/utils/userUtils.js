/**
 * Calcule le pourcentage de complétion du profil
 * @param {Object} user 
 * @returns {number} Pourcentage (0-100)
 */

// Avec un vrai backend, on pourrait avoir plus de critères de complétion de profil (verification email, téléphone, documents, etc.)
// @@@@@@@@@@@@@@VOIR NICO!!!!@@@@@@@@@@@@@@@
export const calculateCompletion = (user) => {
    if (!user) return 0;

    let score = 0;
    const totalPoints = 5; // On reste sur 5 critères clés

    // Inscription de base (Email/Nom/Prénom)
    // C'est acquis dès la création du compte
    score += 1;

    // A une bio ? 
    if (user.bio && user.bio.length > 10) score += 1;

    // A un téléphone ? 
    if (user.phoneNumber && user.phoneNumber.length > 4) score += 1;

    // Identité Vérifiée ? 
    // Au lieu de "isVerified", on regarde si le National ID est renseigné
    if (user.nationalId && user.nationalId.length > 5) score += 1;

    // A une photo perso ? 
    // On vérifie que ce n'est pas l'avatar par défaut généré automatiquement
    // (Dicebear est ce qu'on utilise pour les avatars par défaut)
    const hasDefaultAvatar = !user.picture || user.picture.includes('dicebear') || user.picture.includes('placehold');
    if (!hasDefaultAvatar) score += 1;

    return (score / totalPoints) * 100;
};

// --- FONCTION DE NIVEAU  ---
export const getUserLevel = (completionPercentage) => {
    if (completionPercentage < 40) {
        return { label: "Nouveau Membre", color: "text-gray-400", barColor: "bg-gray-400" };
    } 
    if (completionPercentage < 80) {
        return { label: "Membre Actif", color: "text-emerald-300", barColor: "bg-emerald-400" };
    } 
    return { label: "Profil Certifié 🏅", color: "text-emerald-400 font-bold", barColor: "bg-emerald-500" };
};