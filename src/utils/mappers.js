// lien vers ce fichier : EcorideTestOne/src/utils/mappers.js

// Fonction pour nettoyer les données (Snake_case -> CamelCase)
// Utilisée dans authService.js, carService.js et rideService.js

// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------
//                                               USERS
// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------

// ------Transforme un User venant de l'API vers le format App (camelCase)------//
export const transformUserFromApi = (apiUser) => {
    if (!apiUser) return null;

    return {
        id: apiUser.id,
        email: apiUser.email,

        // Gestion des deux formats possibles (MockAPI CamelCase vs DB SnakeCase)
        firstName: apiUser.firstName || apiUser.first_name || "",
        lastName: apiUser.lastName || apiUser.last_name || "",
        phoneNumber: apiUser.phoneNumber || apiUser.phone_number || "",
        dateOfBirth: apiUser.dateOfBirth || apiUser.date_of_birth || "",
        nationalId: apiUser.nationalId || apiUser.national_id || "",

        // Gestion du rôle (Entier)
        role: (apiUser.roleId || apiUser.role_id) ? parseInt(apiUser.roleId || apiUser.role_id, 10) : 1,

        // Image
        picture: apiUser.picture || apiUser.img || null, // @@@@@@@@FAUT QUE LE BACK ENVOIE CA COMME CA

        bio: apiUser.bio || "",
        credits: parseFloat(apiUser.credits || 0) // on stocke ca ici ??????
    };
};

//------ Transforme le format App vers l'API (utile pour le POST/PUT) ------//
export const transformUserToApi = (appUser) => {
    return {
        // On envoie du CamelCase pour MockAPI (et le Back s'adaptera ou on changera ici)
        firstName: appUser.firstName,
        lastName: appUser.lastName,
        phoneNumber: appUser.phoneNumber,
        dateOfBirth: appUser.dateOfBirth,
        nationalId: appUser.nationalId,
        bio: appUser.bio,
        picture: appUser.picture
        // Note: On n'envoie pas l'email/password ici généralement pour un update simple
    };
};

// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------
//                                                CARS
// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------
//                                              CARRIDE
// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------

//------Transforme un Trajet (carRide) de l'API (CamelCase ou Snake_case DB) vers l'App (CamelCase)------//
export const transformRideFromApi = (apiRide) => {
    if (!apiRide) return null;

    // Gestion date/heure pour l'affichage
    let dateOnly = "";
    let timeOnly = "";

    // On checke dateStart (CamelCase MockAPI) OU date_start (SnakeCase DB)
    const rawDate = apiRide.dateStart || apiRide.date_start;

    if (rawDate) {
        try {
            const dateObj = new Date(rawDate);
            dateOnly = dateObj.toISOString().split('T')[0];
            timeOnly = dateObj.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' });
        } catch (e) { console.error("Erreur date ride", e); }
    }

    return {
        // --- CHAMPS EXISTANTS DB ---
        id: apiRide.id || apiRide.carRide_id, // MockAPI = id

        userId: apiRide.userId || apiRide.user_id,
        carId: apiRide.carId || apiRide.car_id,

        departurePlace: apiRide.placeStart || apiRide.place_start,
        arrivalPlace: apiRide.placeEnd || apiRide.place_end,

        departureDate: dateOnly,   // Extrait
        departureTime: timeOnly,   // Extrait

        arrivalDate: apiRide.dateEnd || apiRide.date_end,

        seatsTotal: parseInt(apiRide.numberOfSeat || apiRide.number_of_seat || 1, 10),
        seatsAvailable: parseInt(apiRide.seatLeft || apiRide.seat_left || 1, 10),
        price: parseFloat(apiRide.price || 0),
        duration: apiRide.travelTime || apiRide.travel_time,

        allowDetour: apiRide.detour || false, // Checkbox "Détour autorisé"
        isRecurring: apiRide.isRecurrent || apiRide.is_reccurent || false, // Checkbox "Récurrence"

        // --- CHAMPS MANQUANTS / AJOUTÉS ---
        name: apiRide.name || "Trajet sans nom",
        description: apiRide.description || "", // @@@@@ AJOUT POUR DETAIL
        promoCode: apiRide.promoCode || apiRide.promo_code || "",

        // Coordonnées pour la carte (Vital pour OpenStreetMap)
        startLat: apiRide.startLat || apiRide.start_lat,
        startLon: apiRide.startLon || apiRide.start_lon,
        endLat: apiRide.endLat || apiRide.end_lat,
        endLon: apiRide.endLon || apiRide.end_lon,

        // Statut calculé (Front uniquement) ou récupéré
        status: apiRide.status || (rawDate && new Date(rawDate) < new Date() ? "completed" : "scheduled")
    };
};

//------Transforme l'objet App vers l'API (Pour MockAPI en CamelCase)------//
export const transformRideToApi = (appRide) => {
    // Recombinaison Date + Heure pour le DATETIME ISO
    let fullDateTime = new Date().toISOString();
    if (appRide.departureDate && appRide.departureTime) {
        fullDateTime = new Date(`${appRide.departureDate}T${appRide.departureTime}`).toISOString();
    }

    return {
        // On envoie en CamelCase pour correspondre à notre config MockAPI
        // userId est ajouté dans le service (rideService)
        
        carId: appRide.carId,
        placeStart: appRide.departurePlace,
        placeEnd: appRide.arrivalPlace,
        dateStart: fullDateTime,
        // dateEnd: Sera calculé ou null pour l'instant

        numberOfSeat: parseInt(appRide.seatsTotal, 10),
        seatLeft: parseInt(appRide.seatsTotal, 10), // À la création, reste = total
        price: parseFloat(appRide.price),
        travelTime: appRide.duration,

        detour: appRide.allowDetour || false,
        isRecurrent: appRide.isRecurring || false,

        //@@@@@@@@@@ Nouveaux champs @@@@@@@@@@
        name: appRide.name,
        description: appRide.description,
        promoCode: appRide.promoCode,
        status: "scheduled", // Force le statut à la création

        startLat: appRide.startLat,
        startLon: appRide.startLon,
        endLat: appRide.endLat,
        endLon: appRide.endLon
    };
};