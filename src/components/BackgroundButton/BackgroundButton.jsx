import React from 'react';

const BackgroundButton = (props) => {
    const { Text, onClick, color } = props;
    const bgColor = color ? `bg-${color}-500` : 'bg-gray-200'; // Default to blue if color prop is not provided

    return (
        <div>
            <button className={`text-gray-600 font-semibold py-2 px-6 ${bgColor}`} onClick={onClick}>
                {Text}
            </button>
        </div>
    );
};


export default BackgroundButton;
