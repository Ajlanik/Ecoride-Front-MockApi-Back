/**
 * src/utils/userUtils.js
 * TODO: Idéalement, cette donnée 'completion_score' doit venir de l'API User.
 */

export const calculateCompletion = (user) => {
    if (!user) return 0;

    let score = 0;
    const totalPoints = 5;

    // 1. Compte actif
    score += 1;

    // 2. Bio
    if (user.bio && user.bio.length > 10) score += 1;

    // 3. Téléphone
    if (user.phoneNumber && user.phoneNumber.length > 4) score += 1;

    // 4. Identité (National ID)
    if (user.nationalId && user.nationalId.length > 5) score += 1;

    // 5. Avatar (non défaut)
    const hasDefaultAvatar = !user.picture || user.picture.includes("dicebear") || user.picture.includes("ui-avatars");
    if (!hasDefaultAvatar) score += 1;

    return (score / totalPoints) * 100;
};

export const getUserLevel = (completionPercentage) => {
    if (completionPercentage < 40) {
        return { label: "Nouveau Membre", color: "text-gray-400", barColor: "bg-gray-400" };
    } 
    if (completionPercentage < 80) {
        return { label: "Membre Actif", color: "text-emerald-300", barColor: "bg-emerald-400" };
    } 
    return { label: "Profil Certifié", color: "text-emerald-400 font-bold", barColor: "bg-emerald-500" };
};