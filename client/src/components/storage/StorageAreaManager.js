import React, { useState, useEffect } from 'react';
import api from '../../api';

const StorageAreaManager = () => {
    const [storageAreas, setStorageAreas] = useState([]);
    const [newAreaName, setNewAreaName] = useState('');

    useEffect(() => {
        fetchStorageAreas();
    }, []);

    const fetchStorageAreas = async () => {
        try {
            const res = await api.get('/api/storage');
            setStorageAreas(res.data);
        } catch (err) {
            console.error('Failed to fetch storage areas', err);
        }
    };

    const handleAddArea = async (e) => {
        e.preventDefault();
        if (!newAreaName.trim()) return;
        try {
            await api.post('/api/storage', { name: newAreaName });
            fetchStorageAreas();
            setNewAreaName('');
        } catch (err) {
            console.error('Failed to add storage area', err);
        }
    };

    const handleDeleteArea = async (id) => {
        if (window.confirm('Are you sure you want to delete this storage area?')) {
            try {
                await api.delete(`/api/storage/${id}`);
                fetchStorageAreas();
            } catch (err) {
                console.error('Failed to delete storage area', err);
            }
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Manage Storage Areas</h2>
            <form onSubmit={handleAddArea} className="flex mb-6">
                <input
                    type="text"
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    placeholder="New storage area name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-l-md"
                />
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700">
                    Add
                </button>
            </form>
            <div className="space-y-4">
                {storageAreas.map(area => (
                    <div key={area.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
                        <p className="font-semibold">{area.name}</p>
                        <button onClick={() => handleDeleteArea(area.id)} className="text-red-500 hover:text-red-700">
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StorageAreaManager;
