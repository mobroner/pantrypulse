import React, { useState, useMemo } from 'react';
import api from '../../api';

const AddItemForm = ({ groups, storageAreas, onItemAdded }) => {
    const [formData, setFormData] = useState({
        item_name: '',
        quantity: 1,
        category: 'Other',
        expiry_date: '',
        barcode: '',
        group_id: '',
        date_added: new Date().toISOString().slice(0, 10),
        storage_area_id: ''
    });

    const { item_name, quantity, expiry_date, barcode, group_id, date_added, storage_area_id } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const res = await api.post('/api/items', formData);
            onItemAdded(res.data);
            setFormData({
                item_name: '',
                quantity: 1,
                category: 'Other',
                expiry_date: '',
                barcode: '',
                group_id: '',
                date_added: new Date().toISOString().slice(0, 10),
                storage_area_id: ''
            });
        } catch (err) {
            console.error('Failed to add item', err);
            if (err.response) {
                console.error('Error response:', err.response.data);
            }
        }
    };

    const availableGroups = useMemo(() => {
        if (!storage_area_id || !groups) return [];
        return groups.filter(group => group.storage_areas && group.storage_areas.some(sa => sa.id === storage_area_id));
    }, [storage_area_id, groups]);

    return (
        <div className="bg-white p-8 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-bold mb-2">Add New Item</h2>
            <p className="text-gray-600 mb-6">Add a new food item to your inventory.</p>
            
            <form onSubmit={onSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Item Name</label>
                        <input type="text" name="item_name" value={item_name} onChange={onChange} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" placeholder="e.g., Frozen Corn" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                        <input type="number" name="quantity" value={quantity} onChange={onChange} required min="1" className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date Added</label>
                        <input type="date" name="date_added" value={date_added} onChange={onChange} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Expiration Date (Optional)</label>
                        <input type="date" name="expiry_date" value={expiry_date} onChange={onChange} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Barcode (Optional)</label>
                        <input type="text" name="barcode" value={barcode} onChange={onChange} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" placeholder="e.g., 01234567890" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Storage Area</label>
                        <select name="storage_area_id" value={storage_area_id} onChange={onChange} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md">
                            <option value="">Select a storage area</option>
                            {storageAreas && storageAreas.map(area => (
                                <option key={area.id} value={area.id}>{area.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Group (Optional)</label>
                        <select name="group_id" value={group_id} onChange={onChange} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" disabled={!storage_area_id}>
                            <option value="">Select a group</option>
                            {availableGroups.map(group => (
                                <option key={group.id} value={group.id}>{group.group_name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end mt-6">
                    <button type="submit" className="py-2 px-6 bg-gray-800 text-white rounded-md hover:bg-gray-900">
                        Add Item
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddItemForm;
