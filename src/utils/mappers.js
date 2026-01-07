// src/utils/mappers.js

/**
 * Mappers : Transformation stricte Frontend <-> Backend.
 * Règle : Le Frontend impose le vocabulaire (camelCase).
 * Le Backend Symfony doit adapter ses noms de colonnes (snake_case) côté serveur.
 */

// ============================================================================
//                                  USER
// ============================================================================

export const transformUserFromApi = (apiUser) => {
    if (!apiUser) return null;

    return {
        id: apiUser.id,
        email: apiUser.email,

        // Front: firstName -> DB: first_name
        firstName: apiUser.firstName || apiUser.first_name || "",
        lastName: apiUser.lastName || apiUser.last_name || "",

        // Front: phoneNumber -> DB: phone_number
        phoneNumber: apiUser.phoneNumber || apiUser.phone_number || "",

        // Front: dateOfBirth -> DB: date_of_birth
        dateOfBirth: apiUser.dateOfBirth || apiUser.date_of_birth || "",

        // Front: nationalId -> DB: national_id
        nationalId: apiUser.nationalId || apiUser.national_id || "",

        bio: apiUser.bio || "",
        //picture: apiUser.picture || "",

        roleId: parseInt(apiUser.roleId || 1, 10),
        credits: parseFloat(apiUser.credits || 0),

        isActive: apiUser.isActive ?? apiUser.is_active ?? true,
        isVerified: apiUser.isVerified ?? apiUser.is_verified ?? false,

        picture: apiUser.avatar || apiUser.picture || ""
        
    };
};

// ============================================================================
//                                  CAR
// ============================================================================

export const transformCarFromApi = (apiCar) => {
    if (!apiCar) return null;

    return {
        id: apiCar.id,
        userId: apiCar.userId || apiCar.user_id,

        brand: apiCar.brand || "",
        model: apiCar.model || "",

        // Front: licensePlate -> DB: license_plate
        licensePlate: apiCar.licensePlate || apiCar.license_plate || "",

        // Front: numberOfSeat -> DB: number_of_seat
        numberOfSeat: parseInt(apiCar.numberOfSeat || apiCar.number_of_seat || 4, 10),

        // Front: engine -> DB: engine
        engine: apiCar.engine || "Electrique",


        picture: apiCar.picture || "",

        // Front: purchaseDate -> DB: purchase_date
        purchaseDate: apiCar.purchaseDate || apiCar.purchase_date || "",

        // Front: insurance -> DB: insurance (ou insurance_date tolérance)
        insuranceDate: apiCar.insuranceDate || apiCar.insurance_date || "",

        isActive: apiCar.isActive ?? apiCar.is_active ?? true,
        isFavorite: (apiCar.isFavorite === true || apiCar.is_favorite === true)
        
    };
};

/**
 * ----------------------------------------------------------------------------
 * IMPORTANT :
 * - On envoie TOUJOURS du camelCase côté Front (mock ET symfony).
 * - Symfony fera le mapping vers snake_case en interne.
 * ----------------------------------------------------------------------------
 */
export const transformCarToApi = (appCar) => {
    if (!appCar) return null;

    return {
        userId: appCar.userId,
        brand: appCar.brand,
        model: appCar.model,
        licensePlate: appCar.licensePlate,

        numberOfSeat: parseInt(appCar.numberOfSeat, 10),
        engine: appCar.engine,


        picture: appCar.picture,
        purchaseDate: appCar.purchaseDate,
        insurance: appCar.insurance,
        isActive: appCar.isActive
    };
};

// ============================================================================
//                                  RIDE
// ============================================================================

// Dans src/utils/mappers.js

export const transformRideFromApi = (apiRide) => {
    if (!apiRide) return null;

    // --- FONCTION DE SÉCURITÉ ---
    // Elle renvoie NULL si la valeur est 0, invalide ou absente
    const parseCoord = (val) => {
        const num = parseFloat(val);
        // Si ce n'est pas un nombre, ou si c'est 0 (océan), on renvoie null
        if (!isFinite(num) || Math.abs(num) < 0.0001) return null;
        return num;
    };

    let dateStr = apiRide.departureDate || apiRide.departure_date || "";
    if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];

    let timeStr = apiRide.departureTime || apiRide.departure_time || "";
    if (timeStr.includes('T')) timeStr = timeStr.split('T')[1].substring(0, 5);
    else if (timeStr.length > 5) timeStr = timeStr.substring(0, 5);

    return {
        id: apiRide.id,
      
        bookingList: apiRide.bookingList || [], 
  
        
        // --- ET C EST PARTIIIIIIIIIIIIIIIIII ON BLINDE ID CONDUCTEUR ---
        // On cherche l'ID partout : userId standard, snake_case, driverId explicite, ou objet driver
        userId: apiRide.userId || apiRide.user_id || apiRide.driverId || (apiRide.driver ? apiRide.driver.id : null),
        
        // On stocke aussi driverId explicitement au cas où un composant le chercherait spécifiquement
        driverId: apiRide.driverId || (apiRide.driver ? apiRide.driver.id : null),
        // --- FIN MODIFICATION ---

        carId: apiRide.carId || apiRide.car_id,
        status: apiRide.status || "scheduled",

        departurePlace: apiRide.departurePlace || apiRide.departure_place || "",
        arrivalPlace: apiRide.arrivalPlace || apiRide.arrival_place || "",

        // --- UTILISATION DE LA SÉCURITÉ ---
        startLat: parseCoord(apiRide.startLat || apiRide.start_lat),
        startLon: parseCoord(apiRide.startLon || apiRide.start_lon),
        endLat: parseCoord(apiRide.endLat || apiRide.end_lat),
        endLon: parseCoord(apiRide.endLon || apiRide.end_lon),
        // ----------------------------------

        departureDate: dateStr,
        departureTime: timeStr,

        seatsAvailable: parseInt(apiRide.seatsAvailable || apiRide.seats_available || 0, 10),
        seatsTotal: parseInt(apiRide.seatsTotal || apiRide.seats_total || 0, 10),
        price: parseFloat(apiRide.price || 0),

        duration: parseInt(apiRide.duration || 0, 10),
        distance: parseFloat(apiRide.distance || 0),
        geometry: apiRide.geometry || null,

        allowDetour: apiRide.allowDetour ?? apiRide.allow_detour ?? true,
        isRecurring: apiRide.isRecurring ?? apiRide.is_recurring ?? false,
        createdAt: apiRide.createdAt || apiRide.created_at,
        
        // On récupère aussi les champs de récurrence s'ils existent
        recurrenceDays: apiRide.recurrenceDays || apiRide.recurrence_days || [],
        recurrenceEndDate: apiRide.recurrenceEndDate || apiRide.recurrence_end_date || null
    };
};

/**
 * ----------------------------------------------------------------------------
 * IMPORTANT :
 * - Il renvoie du camelCase, comme le reste du Front.
 * ----------------------------------------------------------------------------
 */
export const transformRideToApi = (appRide) => {
    if (!appRide) return null;

    return {
        userId: String(appRide.userId),
        carId: String(appRide.carId),

        departurePlace: appRide.departurePlace,
        arrivalPlace: appRide.arrivalPlace,

        departureDate: appRide.departureDate,
        departureTime: appRide.departureTime,

        startLat: appRide.startLat,
        startLon: appRide.startLon,
        endLat: appRide.endLat,
        endLon: appRide.endLon,

        seatsTotal: parseInt(appRide.seatsTotal, 10),
        seatsAvailable: parseInt(appRide.seatsAvailable ?? appRide.seatsTotal, 10),

        price: parseFloat(appRide.price),

        status: appRide.status || 'scheduled',
        allowDetour: !!appRide.allowDetour,
        isRecurring: !!appRide.isRecurring,

        distance: appRide.distance,
        duration: appRide.duration,
        geometry: appRide.geometry ?? null,

        description: appRide.description || "",
        promoCode: appRide.promoCode || ""
    };
};
