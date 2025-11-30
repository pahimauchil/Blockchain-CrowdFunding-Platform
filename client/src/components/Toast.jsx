import React, { useEffect } from "react";

const Toast = ({ message, type = "info", isVisible, onClose }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    const typeStyles = {
        success: "bg-green-500 text-white",
        error: "bg-red-500 text-white",
        info: "bg-blue-500 text-white",
        warning: "bg-yellow-500 text-black",
    };

    const iconStyles = {
        success: "✓",
        error: "✕",
        info: "ℹ",
        warning: "⚠",
    };

    return (
        <div
            className={`fixed top-4 right-4 z-[9999] ${typeStyles[type]} px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md transform transition-all duration-300 ${isVisible
                ? "translate-x-0 opacity-100"
                : "translate-x-full opacity-0"
                }`}
        >
            <span className="text-xl font-bold">{iconStyles[type]}</span>
            <p className="flex-1 font-epilogue font-medium">{message}</p>
            <button
                onClick={onClose}
                className="text-white/80 hover:text-white text-xl font-bold leading-none"
            >
                ×
            </button>
        </div>
    );
};

export default Toast;

