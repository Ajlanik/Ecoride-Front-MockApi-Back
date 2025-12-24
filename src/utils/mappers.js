// src/utils/mappers.js

/**
 * Mappers : Fonctions de transformation de données.
 * * Rôle : 
 * 1. Convertir les données brutes de l'API (souvent en snake_case ou mal formatées) 
 * vers un format propre pour React (camelCase).
 * 2. Convertir les données de React vers le format attendu par l'API.
 * 3. Gérer les types (convertir "5" (string) en 5 (number)).
 * * C'est ici qu'on prépare le terrain pour la migration vers Symfony.
 */

// ============================================================================
//                                  USER (Utilisateur)
// ============================================================================

export const transformUserFromApi = (apiUser) => {
    if (!apiUser) return null;

    return {
        id: apiUser.id,
        email: apiUser.email,
        
        // Gestion double format (MockAPI vs Futur Symfony snake_case)
        firstName: apiUser.firstName || apiUser.first_name || "",
        lastName: apiUser.lastName || apiUser.last_name || "",
        
        // Sécurisation des champs optionnels
        phoneNumber: apiUser.phoneNumber || apiUser.phone_number || "",
        dateOfBirth: apiUser.dateOfBirth || apiUser.date_of_birth || "",
        nationalId: apiUser.nationalId || apiUser.national_id || "",
        bio: apiUser.bio || "",
        
        // Avatar : Si vide, on laisse vide (le composant Avatar gérera le fallback)
        picture: apiUser.picture || "",
        
        // Conversion des rôles et crédits en nombres
        roleId: parseInt(apiUser.roleId || 1, 10), 
        credits: parseInt(apiUser.credits || 0, 10),
        
        // Booléens (Parfois l'API renvoie "true" en string)
        isActive: apiUser.isActive === true || apiUser.isActive === "true",
        isVerified: apiUser.isVerified === true || apiUser.isVerified === "true"
    };
};

// ============================================================================
//                                  CAR (Véhicule)
// ============================================================================

export const transformCarFromApi = (apiCar) => {
    if (!apiCar) return null;

    return {
        id: apiCar.id,
        userId: apiCar.userId, // Lien vers le propriétaire
        
        brand: apiCar.brand || "Marque inconnue",
        model: apiCar.model || "Modèle inconnu",
        licensePlate: apiCar.licensePlate || "",
        
        // Conversion explicite en nombre pour les calculs de places
        numberOfSeat: parseInt(apiCar.numberOfSeat || 4, 10),
        
        engine: apiCar.engine || "Non spécifié",
        color: apiCar.color || "",
        
        // Gestion des images
        picture: apiCar.picture || "",
        
        // Dates (On garde la partie YYYY-MM-DD si elle existe)
        purchaseDate: apiCar.purchaseDate ? apiCar.purchaseDate.split('T')[0] : "",
        insuranceDate: apiCar.insurance ? apiCar.insurance.split('T')[0] : "",
        
        isActive: apiCar.isActive === true || apiCar.isActive === "true",
        isFavorite: apiCar.isFavorite === true || apiCar.isFavorite === "true"
    };
};

export const transformCarToApi = (appCar) => {
    return {
        // userId doit être injecté par le service avant l'envoi
        brand: appCar.brand,
        model: appCar.model,
        licensePlate: appCar.licensePlate,
        numberOfSeat: parseInt(appCar.numberOfSeat, 10),
        engine: appCar.engine,
        color: appCar.color,
        picture: appCar.picture,
        purchaseDate: appCar.purchaseDate,
        insurance: appCar.insurance, // MockAPI field name
        isActive: appCar.isActive,
        isFavorite: appCar.isFavorite
    };
};

// ============================================================================
//                                  RIDE (Trajet)
// ============================================================================

// Lecture (API -> App)
export const transformRideFromApi = (apiRide) => {
    if (!apiRide) return null;

    // Nettoyage des dates pour éviter le bug "Invalid Date"
    let dateStr = apiRide.departureDate || "";
    if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];

    let timeStr = apiRide.departureTime || "";
    if (timeStr.includes('T')) timeStr = timeStr.split('T')[1].substring(0, 5);

    return {
        id: apiRide.id,
        userId: apiRide.userId, // ID Conducteur
        carId: apiRide.carId,   // ID Véhicule utilisé

        status: apiRide.status || "scheduled", // scheduled, completed, cancelled
        name: apiRide.name || "Trajet",
        description: apiRide.description || "",
        
        // Adresses
        departurePlace: apiRide.startAddress || apiRide.placeStart || "",
        arrivalPlace: apiRide.endAddress || apiRide.placeEnd || "",
        
        // Coordonnées GPS (Important : parseFloat pour les calculs de carte)
        startLat: parseFloat(apiRide.startLat || 0),
        startLon: parseFloat(apiRide.startLon || 0),
        endLat: parseFloat(apiRide.endLat || 0),
        endLon: parseFloat(apiRide.endLon || 0),

        // Dates propres
        departureDate: dateStr, 
        departureTime: timeStr, 
        
        // Logistique
        seatsAvailable: parseInt(apiRide.seatsAvailable || 0, 10),
        seatsTotal: parseInt(apiRide.seatsTotal || apiRide.numberOfSeat || 0, 10),
        price: parseFloat(apiRide.price || 0),
        
        // Infos techniques
        duration: parseInt(apiRide.duration || 0, 10),
        distance: parseFloat(apiRide.distance || 0),
        geometry: apiRide.geometry || null, // Le tracé encodé

        allowDetour: apiRide.allowDetour === true || apiRide.allowDetour === "true",
        isRecurring: apiRide.isRecurring === true || apiRide.isRecurring === "true",
        
        createdAt: apiRide.createdAt
    };
};

// Écriture (App -> API)
export const transformRideToApi = (appRide) => {
    
    // Création d'une date ISO complète pour le tri en base de données
    let fullDateTime = new Date().toISOString();
    if (appRide.departureDate && appRide.departureTime) {
        // On combine YYYY-MM-DD et HH:MM pour faire un timestamp
        fullDateTime = new Date(`${appRide.departureDate}T${appRide.departureTime}`).toISOString();
    }

    return {
        // IDs
        userId: appRide.driverId, // On s'assure que c'est bien l'ID du créateur
        carId: appRide.carId,
        status: appRide.status || 'scheduled',

        // Adresses
        startAddress: appRide.departurePlace,
        endAddress: appRide.arrivalPlace,
        startLat: appRide.startLat,
        startLon: appRide.startLon,
        endLat: appRide.endLat,
        endLon: appRide.endLon,

        // --- CLES POUR ÉVITER LE BUG INVALID DATE ---
        departureDate: appRide.departureDate, // Format court YYYY-MM-DD
        departureTime: appRide.departureTime, // Format court HH:MM
        dateStart: fullDateTime,              // Format long ISO (Backup)
        // ------------------------------------------

        seatsAvailable: parseInt(appRide.seatsTotal, 10),
        seatsTotal: parseInt(appRide.seatsTotal, 10),
        price: parseFloat(appRide.price),

        duration: appRide.duration,
        distance: appRide.distance,
        geometry: appRide.geometry,

        name: appRide.name,
        description: appRide.description,
        promoCode: appRide.promoCode || "",
        
        allowDetour: !!appRide.allowDetour,
        isRecurring: !!appRide.isRecurring,
        
        createdAt: new Date().toISOString()
    };
};

// ============================================================================
//                                  BOOKING (Réservation)
// ============================================================================

export const transformBookingFromApi = (apiBooking) => {
    if (!apiBooking) return null;

    return {
        id: apiBooking.id,
        carRideId: apiBooking.carRideId,
        userId: apiBooking.userId, // ID Passager
        
        status: apiBooking.status || "PENDING", // PENDING, ACCEPTED, REJECTED, COMPLETED, CANCELLED
        
        price: parseFloat(apiBooking.price || 0),
        nbSeats: parseInt(apiBooking.nbSeats || 1, 10),
        
        // Détails du trajet spécifique au passager (si différent du global)
        pickupAddress: apiBooking.pickupAddress || "",
        pickupLat: parseFloat(apiBooking.pickupLat || 0),
        pickupLon: parseFloat(apiBooking.pickupLon || 0),
        
        dropoffAddress: apiBooking.dropoffAddress || "",
        dropoffLat: parseFloat(apiBooking.dropoffLat || 0),
        dropoffLon: parseFloat(apiBooking.dropoffLon || 0),
        
        // Système de notation 
        isPassengerRated: apiBooking.isPassengerRated === true || apiBooking.isPassengerRated === "true",
        isDriverRated: apiBooking.isDriverRated === true || apiBooking.isDriverRated === "true",
        
        // Contenu des avis 
        passengerRating: parseInt(apiBooking.passengerRating || 0, 10),
        passengerComment: apiBooking.passengerComment || "",
        driverRating: parseInt(apiBooking.driverRating || 0, 10),
        driverComment: apiBooking.driverComment || "",

        createdAt: apiBooking.date // MockAPI met souvent la date de création dans 'date'
        // avec un vrai backend Symfony, on aurait un champ createdAt dédié @@@@@@@@@@@@@@@VOIR NICO!!!!@@@@@@@@@@@@@@@
    };
};