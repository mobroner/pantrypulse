import React, { useState, useEffect } from 'react';
import api from '../../api';

const GroupManager = () => {
    const [groups, setGroups] = useState([]);
    const [storageAreas, setStorageAreas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [selectedStorageAreas, setSelectedStorageAreas] = useState([]);
    const [editingGroup, setEditingGroup] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [groupsRes, storageAreasRes] = await Promise.all([
                api.get('/groups'),
                api.get('/storage')
            ]);
            setGroups(groupsRes.data);
            setStorageAreas(storageAreasRes.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch data.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;
        try {
            // Create the group
            const groupRes = await api.post('/groups', { group_name: newGroupName, description: newGroupDesc });
            const groupId = groupRes.data.id || (await api.get('/groups')).data.slice(-1)[0]?.id;
            // Assign storage areas if any selected
            for (const areaId of selectedStorageAreas) {
                await api.post(`/storage/${areaId}/groups`, { group_id: groupId });
            }
            fetchData();
            setNewGroupName('');
            setNewGroupDesc('');
            setSelectedStorageAreas([]);
        } catch (err) {
            setError('Failed to create group.');
            console.error(err);
        }
    };

    const handleDeleteGroup = async (id) => {
        if (window.confirm('Are you sure you want to delete this group? Associated items will be ungrouped.')) {
            try {
                await api.delete(`/groups/${id}`);
                fetchData(); // Refetch all data to ensure consistency
            } catch (err) {
                setError('Failed to delete group.');
                console.error(err);
            }
        }
    };

    const handleUpdateGroup = async (e) => {
        e.preventDefault();
        if (!editingGroup || !editingGroup.group_name.trim()) return;
        try {
            await api.put(`/groups/${editingGroup.id}`, {
                group_name: editingGroup.group_name,
                description: editingGroup.description
            });
            // Update storage area associations
            const originalAreaIds = editingGroup.storage_areas ? editingGroup.storage_areas.map(sa => sa.id) : [];
            const newAreaIds = editingGroup.selected_storage_areas || [];
            const toAdd = newAreaIds.filter(id => !originalAreaIds.includes(id));
            const toRemove = originalAreaIds.filter(id => !newAreaIds.includes(id));
            for (const areaId of toAdd) {
                await api.post(`/storage/${areaId}/groups`, { group_id: editingGroup.id });
            }
            for (const areaId of toRemove) {
                await api.delete(`/storage/${areaId}/groups/${editingGroup.id}`);
            }
            setEditingGroup(null);
            fetchData();
        } catch (err) {
            setError('Failed to update group.');
            console.error(err);
        }
    };

    const startEditing = (group) => {
        setEditingGroup({
            ...group,
            selected_storage_areas: group.storage_areas ? group.storage_areas.map(sa => sa.id) : []
        });
    };

    if (isLoading) return <p>Loading groups...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Manage Item Groups</h2>

            {/* Create Group Form */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 className="text-2xl font-bold mb-4">Create New Group</h3>
                <form onSubmit={handleCreateGroup} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Group Name</label>
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="e.g., Top Shelf"
                            required
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                        <input
                            type="text"
                            value={newGroupDesc}
                            onChange={(e) => setNewGroupDesc(e.target.value)}
                            placeholder="e.g., For quick access items"
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Assign to Storage Areas</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                            {storageAreas.map(area => (
                                <label key={area.id} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        value={area.id}
                                        checked={selectedStorageAreas.includes(area.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedStorageAreas([...selectedStorageAreas, area.id]);
                                            } else {
                                                setSelectedStorageAreas(selectedStorageAreas.filter(id => id !== area.id));
                                            }
                                        }}
                                    />
                                    <span>{area.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="py-2 px-4 text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        Create Group
                    </button>
                </form>
            </div>

            {/* Edit Group Modal/Form */}
            {editingGroup && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                     <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-2xl font-bold mb-4">Edit Group</h3>
                        <form onSubmit={handleUpdateGroup} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Group Name</label>
                                <input
                                    type="text"
                                    value={editingGroup.group_name}
                                    onChange={(e) => setEditingGroup({ ...editingGroup, group_name: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <input
                                    type="text"
                                    value={editingGroup.description || ''}
                                    onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
                                    className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Assign to Storage Areas</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                                    {storageAreas.map(area => (
                                        <label key={area.id} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                value={area.id}
                                                checked={editingGroup.selected_storage_areas.includes(area.id)}
                                                onChange={(e) => {
                                                    const newSelection = e.target.checked
                                                        ? [...editingGroup.selected_storage_areas, area.id]
                                                        : editingGroup.selected_storage_areas.filter(id => id !== area.id);
                                                    setEditingGroup({ ...editingGroup, selected_storage_areas: newSelection });
                                                }}
                                            />
                                            <span>{area.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end space-x-4">
                                <button type="button" onClick={() => setEditingGroup(null)} className="py-2 px-4 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                                    Cancel
                                </button>
                                <button type="submit" className="py-2 px-4 text-white bg-green-600 rounded-md hover:bg-green-700">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Groups List */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-2xl font-bold mb-4">Your Groups</h3>
                <div className="space-y-4">
                    {groups.length > 0 ? groups.map(group => (
                        <div key={group.id} className="p-4 rounded-lg border bg-gray-50 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-lg">{group.group_name}</p>
                                <p className="text-sm text-gray-600">{group.description}</p>
                            </div>
                            <div className="space-x-2">
                                <button onClick={() => startEditing(group)} className="text-blue-500 hover:text-blue-700">Edit</button>
                                <button onClick={() => handleDeleteGroup(group.id)} className="text-red-500 hover:text-red-700">Delete</button>
                            </div>
                        </div>
                    )) : <p>You haven't created any groups yet.</p>}
                </div>
            </div>
        </div>
    );
};

export default GroupManager;
