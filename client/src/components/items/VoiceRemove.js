import React, { useState } from 'react';
import api from '../../api';

const VoiceRemove = ({ items, onItemUpdated, onItemDeleted }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState('');

    const handleListen = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setFeedback('Speech recognition is not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        setIsListening(true);
        setFeedback('Listening...');

        recognition.onresult = (event) => {
            const speechResult = event.results[0][0].transcript;
            setTranscript(speechResult);
            processCommand(speechResult);
        };

        recognition.onspeechend = () => {
            recognition.stop();
            setIsListening(false);
            setFeedback('');
        };

        recognition.onerror = (event) => {
            setFeedback(`Error occurred in recognition: ${event.error}`);
            setIsListening(false);
        };

        recognition.start();
    };

    const processCommand = (command) => {
        const lowerCommand = command.toLowerCase();
        // Simple parsing: "remove 2 chicken"
        const match = lowerCommand.match(/remove (\d+)? (.+)/);
        if (!match) {
            setFeedback(`Could not understand: "${command}"`);
            return;
        }

        const quantityToRemove = match[1] ? parseInt(match[1], 10) : 1;
        const itemName = match[2].trim();

        const foundItem = items.find(item => item.item_name.toLowerCase().includes(itemName));

        if (!foundItem) {
            setFeedback(`Could not find item: "${itemName}"`);
            return;
        }

        if (window.confirm(`Confirm removal of ${quantityToRemove} ${foundItem.item_name}?`)) {
            updateItemQuantity(foundItem, quantityToRemove);
        } else {
            setFeedback('Removal cancelled.');
        }
    };

    const updateItemQuantity = async (item, quantityToRemove) => {
        const newQuantity = item.quantity - quantityToRemove;
        if (newQuantity <= 0) {
            try {
                await api.delete(`/api/items/${item.id}`);
                onItemDeleted(item.id);
                setFeedback(`Removed all ${item.item_name}.`);
            } catch (err) {
                setFeedback('Failed to remove item.');
            }
        } else {
            try {
                const res = await api.put(`/api/items/${item.id}`, { ...item, quantity: newQuantity });
                onItemUpdated(res.data);
                setFeedback(`Updated ${item.item_name} quantity to ${newQuantity}.`);
            } catch (err) {
                setFeedback('Failed to update item quantity.');
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
            <h3 className="text-2xl font-bold mb-4">Remove by Voice</h3>
            <button
                onClick={handleListen}
                disabled={isListening}
                className={`w-full py-2 px-4 text-white rounded-md ${isListening ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}
            >
                {isListening ? 'Listening...' : 'Remove Item (Voice)'}
            </button>
            {feedback && <p className="mt-4 text-center text-gray-600">{feedback}</p>}
            {transcript && <p className="mt-2 text-center text-gray-800">You said: "{transcript}"</p>}
        </div>
    );
};

export default VoiceRemove;
