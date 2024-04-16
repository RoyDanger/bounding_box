import { useState } from 'react';

export function useRectangleManager() {
    const [rectangles, setRectangles] = useState([]);
    const [selectedRectangle, setSelectedRectangle] = useState(null);
    const [isAdding, setIsAdding] = useState(false);

    const addRectangle = (startPosition) => {
        setIsAdding(true);
        setRectangles(prevRectangles => [...prevRectangles, {
            ...startPosition,
            width: 0,
            height: 0
        }]);
    };

    const updateRectangle = (currentPosition) => {
        if (!isAdding) return;
        setRectangles(prevRectangles =>
            prevRectangles.map((rect, index) => index === prevRectangles.length - 1 ? {
                ...rect,
                width: Math.abs(currentPosition.x - rect.x),
                height: Math.abs(currentPosition.y - rect.y)
            } : rect)
        );
    };

    const stopAdding = () => {
        setIsAdding(false);
    };

    const deleteRectangle = (index) => {
        setRectangles(prevRectangles => prevRectangles.filter((_, i) => i !== index));
    };

    return {
        rectangles,
        addRectangle,
        updateRectangle,
        deleteRectangle,
        selectedRectangle,
        setSelectedRectangle,
        isAdding,
        startAdding: () => setIsAdding(true),
        stopAdding: () => setIsAdding(false),
    };
}
