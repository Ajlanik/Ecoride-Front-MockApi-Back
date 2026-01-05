// EcorideAKNProd/EcorideAKNProd/src/components/ui/ImageUploader.jsx

/**
 * ============================================================================ 
 *                         IMAGE UPLOADER COMPONENT
 * Objectif :
 * - Composant React pour uploader et prévisualiser une image.
 * - Utilise le service fileService pour envoyer l'image au backend Java.
 * - Affiche une zone circulaire avec l'aperçu de l'image.
 * - Affiche un spinner de chargement pendant l'upload.
 * Convention : camelCase côté Front.
 * ============================================================================
 */


import React, { useState } from 'react';
import { uploadImage } from '../../services/fileService'; 
import Button from './Button';

const ImageUploader = ({ currentImage, onImageUploaded }) => {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            // 1. On envoie l'image au serveur Java
            const newUrl = await uploadImage(file);
            // 2. Le serveur répond avec l'URL, on la passe au formulaire parent
            onImageUploaded(newUrl);
        } catch (err) {
            alert("Erreur lors de l'envoi de l'image. Vérifiez que le serveur est lancé.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
            {/* Zone d'aperçu circulaire */}
            <div className="w-32 h-32 bg-gray-200 rounded-full overflow-hidden shadow-inner relative ring-4 ring-white">
                {currentImage ? (
                    <img 
                        src={currentImage} 
                        alt="Aperçu" 
                        className="w-full h-full object-cover"
                        onError={(e) => e.target.style.display = 'none'} 
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[10px] font-semibold uppercase">Photo</span>
                    </div>
                )}
                
                {/* Overlay de chargement */}
                {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                        <div className="loading loading-spinner loading-md text-white"></div>
                    </div>
                )}
            </div>

            {/* Bouton Input Caché */}
            <label className="cursor-pointer">
                <input 
                    type="file" 
                    accept="image/jpeg, image/png, image/webp" 
                    className="hidden" 
                    onChange={handleFileChange} 
                    disabled={uploading}
                />
                <span className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700 border-none shadow-sm gap-2 normal-case font-medium px-4">
                    {uploading ? "Envoi en cours..." : (currentImage ? "Changer la photo" : "Ajouter une photo")}
                </span>
            </label>
            
            <p className="text-[10px] text-gray-400 text-center max-w-[200px]">
                Format JPG ou PNG. Max 5 Mo.
            </p>
        </div>
    );
};

export default ImageUploader;