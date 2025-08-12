import React, { useState, useMemo } from 'react';
import api from '../../api';

const ItemList = ({ items, groups, storageAreas, onItemUpdated, onItemDeleted }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [openStorages, setOpenStorages] = useState({});

    const handleQuantityChange = async (item, newQuantity) => {
        if (newQuantity < 0) return;
        try {
            const updatedItem = { ...item, quantity: newQuantity };
            const res = await api.put(`/api/items/${item.id}`, updatedItem);
            onItemUpdated(res.data);
        } catch (err) {
            console.error('Failed to update quantity', err);
        }
    };

    const deleteItem = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await api.delete(`/api/items/${id}`);
                onItemDeleted(id);
            } catch (err) {
                console.error('Failed to delete item', err);
            }
        }
    };

    const { itemsInStorage, itemsNotInStorage } = useMemo(() => {
        const inStorage = [];
        const notInStorage = [];
        items.forEach(item => {
            if (item.quantity > 0) {
                inStorage.push(item);
            } else {
                notInStorage.push(item);
            }
        });
        return { itemsInStorage: inStorage, itemsNotInStorage: notInStorage };
    }, [items]);

    const filteredItems = useMemo(() => {
        return itemsInStorage.filter(item =>
            item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [itemsInStorage, searchTerm]);

    const itemsByStorage = useMemo(() => {
        if (!storageAreas) {
            return {};
        }

        const byStorage = storageAreas.reduce((acc, area) => {
            acc[area.id] = { ...area, items: [] };
            return acc;
        }, {});

        filteredItems.forEach(item => {
            if (item.storage_area_id && byStorage[item.storage_area_id]) {
                byStorage[item.storage_area_id].items.push(item);
            }
        });

        // Sort items alphabetically within each storage area
        Object.values(byStorage).forEach(storage => {
            storage.items.sort((a, b) => a.item_name.localeCompare(b.item_name));
        });

        return byStorage;
    }, [filteredItems, storageAreas]);

    const toggleStorage = (storageId) => {
        setOpenStorages(prev => ({ ...prev, [storageId]: !prev.hasOwnProperty(storageId) ? false : !prev[storageId] }));
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-2">Inventory</h2>
            <p className="text-gray-600 mb-6">Manage your current items, grouped by storage area.</p>
            
            <input
                type="text"
                placeholder="Search all items..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-6"
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="space-y-8">
                {Object.values(itemsByStorage).map((storage, index) => (
                    <div key={storage.id}>
                        <button onClick={() => toggleStorage(storage.id)} className={`w-full text-left flex justify-between items-center p-4 rounded-t-lg ${index % 2 === 0 ? 'bg-sky-100' : 'bg-teal-100'}`}>
                            <h3 className="text-xl font-bold">{storage.name}</h3>
                            <svg className={`w-6 h-6 transition-transform transform ${openStorages.hasOwnProperty(storage.id) && !openStorages[storage.id] ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {(!openStorages.hasOwnProperty(storage.id) || openStorages[storage.id]) && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white">
                                    <thead className="bg-gray-200">
                                        <tr>
                                            <th className="py-2 px-4 text-left">Item</th>
                                            <th className="py-2 px-4 text-left">Quantity</th>
                                            <th className="py-2 px-4 text-left">Group</th>
                                            <th className="py-2 px-4 text-left">Added Date</th>
                                            <th className="py-2 px-4 text-left">Expires</th>
                                            <th className="py-2 px-4 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {storage.items.map(item => (
                                            <tr key={item.id} className="border-b">
                                                <td className="py-2 px-4">{item.item_name}</td>
                                                <td className="py-2 px-4">
                                                    <div className="flex items-center">
                                                        <button onClick={() => handleQuantityChange(item, item.quantity - 1)} className="px-2 py-1 border rounded-l-md">-</button>
                                                        <span className="px-4 py-1 border-t border-b">{item.quantity}</span>
                                                        <button onClick={() => handleQuantityChange(item, item.quantity + 1)} className="px-2 py-1 border rounded-r-md">+</button>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-4">{groups.find(g => g.id === item.group_id)?.group_name || 'N/A'}</td>
                                                <td className="py-2 px-4">{formatDate(item.date_added)}</td>
                                                <td className="py-2 px-4">{formatDate(item.expiry_date)}</td>
                                                <td className="py-2 px-4">
                                                    <div className="flex items-center space-x-2">
                                                        <button className="text-gray-500 hover:text-gray-700">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                                                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                        <button onClick={() => deleteItem(item.id)} className="text-gray-500 hover:text-red-500">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))}
                {itemsNotInStorage.length > 0 && (
                    <div>
                        <h3 className="text-xl font-bold mb-4">Items Not in Storage</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white">
                                <thead className="bg-gray-200">
                                    <tr>
                                        <th className="py-2 px-4 text-left">Item</th>
                                        <th className="py-2 px-4 text-left">Group</th>
                                        <th className="py-2 px-4 text-left">Storage Area</th>
                                        <th className="py-2 px-4 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemsNotInStorage.map(item => (
                                        <tr key={item.id} className="border-b">
                                            <td className="py-2 px-4">{item.item_name}</td>
                                            <td className="py-2 px-4">{groups.find(g => g.id === item.group_id)?.group_name || 'N/A'}</td>
                                            <td className="py-2 px-4">{storageAreas.find(sa => sa.id === item.storage_area_id)?.name || 'N/A'}</td>
                                            <td className="py-2 px-4">
                                                <button onClick={() => handleQuantityChange(item, 1)} className="text-blue-500 hover:text-blue-700">
                                                    Add to Storage
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItemList;
