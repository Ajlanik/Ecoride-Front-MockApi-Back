// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------
//                                        Replacé par Dashboard
// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------
import React, { useState } from 'react';

export default function CarManager() {
  // Liste fictive de voitures (simule la DB)
  const [cars, setCars] = useState([
    { id: 1, brand: "Tesla", model: "Model 3", licensePlate: "AB-123-CD", seats: 5, engine: "Electrique" },
    { id: 2, brand: "Renault", model: "Zoe", licensePlate: "EF-456-GH", seats: 4, engine: "Electrique" }
  ]);

  const [showForm, setShowForm] = useState(false);
  
  // État du formulaire d'ajout
  const [newCar, setNewCar] = useState({
    brand: '',
    model: '',
    licensePlate: '',
    seats: 4,
    engine: 'Electrique'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCar(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCar = (e) => {
    e.preventDefault();
    // Simulation d'ajout (Ici il faudra faire un POST /api/cars)
    const carToAdd = { ...newCar, id: Date.now() };
    setCars([...cars, carToAdd]);
    setShowForm(false);
    setNewCar({ brand: '', model: '', licensePlate: '', seats: 4, engine: 'Electrique' }); // Reset
  };

  const handleDelete = (id) => {
    if(confirm("Supprimer ce véhicule ?")) {
        // Simulation suppression (DELETE /api/cars/:id)
        setCars(cars.filter(c => c.id !== id));
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mes Véhicules</h1>
        <button 
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
        >
            {showForm ? 'Annuler' : '+ Ajouter un véhicule'}
        </button>
      </div>

      {/* --- Formulaire d'ajout (Visible si showForm est true) --- */}
      {showForm && (
        <div className="card bg-base-100 shadow-lg mb-8 border border-base-200">
            <div className="card-body">
                <h2 className="card-title text-lg">Ajouter une nouvelle voiture</h2>
                <form onSubmit={handleAddCar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                        type="text" name="brand" placeholder="Marque (ex: Peugeot)" 
                        className="input input-bordered w-full" required 
                        value={newCar.brand} onChange={handleInputChange}
                    />
                    <input 
                        type="text" name="model" placeholder="Modèle (ex: 208)" 
                        className="input input-bordered w-full" required 
                        value={newCar.model} onChange={handleInputChange}
                    />
                    <input 
                        type="text" name="licensePlate" placeholder="Immatriculation (AA-123-BB)" 
                        className="input input-bordered w-full" required 
                        value={newCar.licensePlate} onChange={handleInputChange}
                    />
                    <select 
                        name="engine" 
                        className="select select-bordered w-full"
                        value={newCar.engine} onChange={handleInputChange}
                    >
                        <option value="Electrique">Électrique</option>
                        <option value="Hybride">Hybride</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Essence">Essence</option>
                    </select>
                    
                    <div className="form-control">
                        <label className="label-text mb-2">Nombre de places : {newCar.seats}</label>
                        <input 
                            type="range" min="1" max="9" name="seats" 
                            className="range range-primary" 
                            value={newCar.seats} onChange={handleInputChange}
                        />
                    </div>

                    <div className="md:col-span-2 mt-4">
                        <button type="submit" className="btn btn-success w-full text-white">Valider l'ajout</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- Liste des voitures --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cars.map(car => (
            <div key={car.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                <figure className="h-32 bg-gray-200 flex items-center justify-center">
                    <span className="text-4xl"></span> 
                </figure>
                <div className="card-body p-5">
                    <h2 className="card-title justify-between">
                        {car.brand} {car.model}
                        <div className="badge badge-secondary badge-outline text-xs">{car.engine}</div>
                    </h2>
                    <p className="text-sm text-gray-500">Plaque : <span className="font-mono bg-base-200 px-1 rounded">{car.licensePlate}</span></p>
                    <p className="text-sm">Places disponibles : <strong>{car.seats}</strong></p>
                    
                    <div className="card-actions justify-end mt-4">
                        <button className="btn btn-sm btn-outline btn-error" onClick={() => handleDelete(car.id)}>
                            Supprimer
                        </button>
                        <button className="btn btn-sm btn-ghost">Modifier</button>
                    </div>
                </div>
            </div>
        ))}

        {cars.length === 0 && !showForm && (
            <div className="col-span-full text-center py-10 opacity-50">
                <p>Aucun véhicule enregistré pour le moment.</p>
            </div>
        )}
      </div>
    </div>
  );
}