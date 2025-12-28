// src/utils/pricing.js

/**
 * TODO: BACKEND MIGRATION REQUIRED
 * Pour la version finale avec Symfony :
 * Le calcul du prix DOIT être fait côté serveur pour éviter les manipulations.
 * Endpoint suggéré : POST /api/bookings/simulate
 */

export const PLATFORM_FEE = 2.00;

// Codes temporaires pour le dev Front. 
// Le Backend devra gérer une table "discount".
const MOCK_PROMO_CODES = {
    'BIENVENUE': { type: 'fixed', value: 5.00 },   
    'ECORIDE10': { type: 'percent', value: 10 },   
};

export const calculateFinalPrice = (unitPrice, seats, promoCodeName = '') => {
    const subtotal = unitPrice * seats;
    let discountAmount = 0;
    let discountLabel = null;
    
    const code = promoCodeName ? promoCodeName.toUpperCase().trim() : '';

    if (code && MOCK_PROMO_CODES[code]) {
        const promo = MOCK_PROMO_CODES[code];
        
        if (promo.type === 'fixed') {
            discountAmount = promo.value;
            discountLabel = `-${promo.value}€`;
        } else if (promo.type === 'percent') {
            discountAmount = subtotal * (promo.value / 100);
            discountLabel = `-${promo.value}%`;
        }
    }

    if (discountAmount > subtotal) {
        discountAmount = subtotal;
    }

    const total = subtotal + PLATFORM_FEE - discountAmount;

    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        fee: PLATFORM_FEE,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        discountLabel,
        total: parseFloat(total.toFixed(2)),
        isValidCode: !!MOCK_PROMO_CODES[code]
    };
};