import React, { useState, useEffect } from 'react';
import api from '../../api';
import ItemList from '../items/ItemList';
import AddItemForm from '../items/AddItemForm';
import VoiceRemove from '../items/VoiceRemove';
import StorageAreaManager from '../storage/StorageAreaManager';

const Dashboard = ({ user }) => {
    const [items, setItems] = useState([]);
    const [groups, setGroups] = useState([]);
    const [storageAreas, setStorageAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchItems = async () => {
        try {
            const res = await api.get('/items');
            setItems(res.data);
        } catch (err) {
            setError('Could not fetch items.');
        }
    };

    const fetchGroups = async () => {
        try {
            const res = await api.get('/groups');
            setGroups(res.data);
        } catch (err) {
            setError('Could not fetch groups.');
        }
    };

    const fetchStorageAreas = async () => {
        try {
            const res = await api.get('/storage');
            setStorageAreas(res.data);
        } catch (err) {
            setError('Could not fetch storage areas.');
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchItems(), fetchGroups(), fetchStorageAreas()]);
            setLoading(false);
        };
        loadData();
    }, []);

    const handleItemAdded = (newItem) => {
        fetchItems();
        fetchGroups();
        fetchStorageAreas();
    };

    const handleItemUpdated = (updatedItem) => {
        fetchItems();
        fetchGroups();
    };

    const handleItemDeleted = (id) => {
        fetchItems();
        fetchGroups();
    };

    if (loading) {
        return <div className="text-center mt-10">Loading...</div>;
    }

    if (error) {
        return <div className="text-center mt-10 text-red-500">{error}</div>;
    }

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Your Freezer</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <ItemList 
                        items={items} 
                        groups={groups}
                        storageAreas={storageAreas}
                        onItemUpdated={handleItemUpdated} 
                        onItemDeleted={handleItemDeleted} 
                    />
                </div>
                <div>
                    <AddItemForm 
                        groups={groups} 
                        storageAreas={storageAreas}
                        onItemAdded={handleItemAdded} 
                    />
                    <div className="mt-8">
                        <StorageAreaManager />
                    </div>
                    <div className="mt-8">
                        <VoiceRemove items={items} onItemUpdated={handleItemUpdated} onItemDeleted={handleItemDeleted} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
