import React, { useEffect } from 'react';

const Notification = ({ message, clearMessage }) => {
    // Specify the duration in milliseconds for the message to stay visible
    const messageDuration = 2000; // 5000 milliseconds = 5 seconds

    useEffect(() => {
        if (!message) return;

        const timer = setTimeout(() => {
            clearMessage(); // Call a method to clear the message
        }, messageDuration);

        return () => clearTimeout(timer); // Clear the timer if the component unmounts
    }, [message, clearMessage, messageDuration]);

    if (!message) return null; // Don't render if there's no message

    return (
        <div className="fixed bottom-0 left-0 mb-4 ml-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded" role="alert">
            <span className="block sm:inline">{message}</span>
        </div>
    );
};

export default Notification;