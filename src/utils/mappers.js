// lien vers ce fichier : EcorideTestOne/src/utils/mappers.js
// Fonction pour nettoyer les données (Snake_case -> CamelCase)
// Utilisée dans authService.js
// Users endpoint
// src/utils/mappers.js

// ------Transforme un User venant de l'API (snake_case) vers le format App (camelCase)------//
 
export const transformUserFromApi = (apiUser) => { 
    if (!apiUser) return null;

    return {
        id: apiUser.id,
        email: apiUser.email,
        // Gestion des deux formats possibles (MockAPI vs Symfony TERMPORAIRE)
        firstName: apiUser.firstName || apiUser.first_name || "",
        lastName: apiUser.lastName || apiUser.last_name || "",
        phoneNumber: apiUser.phoneNumber || apiUser.phone_number || "",
        dateOfBirth: apiUser.dateOfBirth || apiUser.date_of_birth || "",
        nationalId: apiUser.nationalId || apiUser.national_id || "", 
        role: apiUser.roleId || apiUser.role_id ? parseInt(apiUser.roleId || apiUser.role_id, 10) : 1, 
        picture: apiUser.picture || apiUser.img || null, // @@@@@@@@FAUT QUE LE BACK ENVOIE CA COMME CA

        bio: apiUser.bio || "",
        credits: parseFloat(apiUser.credits || 0) // on stocke ca ici ??????
    };
};

//------ Transforme une Voiture venant de l'API vers le format App------//

export const transformCarFromApi = (apiCar) => {
    if (!apiCar) return null;

    return {
        id: apiCar.id || apiCar.car_id, // MockAPI met 'id', SQL mettra 'id'
        userId: apiCar.userId || apiCar.user_id,
        
        brand: apiCar.brand,
        model: apiCar.model,
        licensePlate: apiCar.licensePlate || apiCar.license_plate,
        
        numberOfSeat: parseInt(apiCar.numberOfSeat || apiCar.number_of_seat || 4, 10),
        engine: apiCar.engine,

        // Booléens importants
        isActive: apiCar.isActive !== undefined ? apiCar.isActive : (apiCar.is_active === 1 || apiCar.is_active === true),
        isFavorite: apiCar.isFavorite !== undefined ? apiCar.isFavorite : (apiCar.is_favorite === 1 || apiCar.is_favorite === true),
        
        // Dates
        purchaseDate: apiCar.purchaseDate || apiCar.purchase_date,
        insurance: apiCar.insurance || apiCar.insurance_date,
        
        // Image (Si pas d'image, on laisse null, le composant gère le placeholder)
        picture: apiCar.picture || apiCar.img || null
    };
};

//------ Transforme le format App vers l'API (utile pour le POST/PUT vers Symfony) ------//
export const transformUserToApi = (appUser) => {
    return {
        // Symfony attendra du snake_case
        first_name: appUser.firstName,
        last_name: appUser.lastName,
        phone_number: appUser.phoneNumber,
        date_of_birth: appUser.dateOfBirth,
        national_id: appUser.nationalId,
        bio: appUser.bio
        // Note: On n'envoie pas l'email/password ici généralement pour un update simple
    };
};