"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { ChevronDown } from "lucide-react";

interface SelectOption {
    id: string | number;
    name: string;
}

interface CustomSelectProps {
    options: SelectOption[];
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: boolean;
    className?: string;
    icon?: React.ReactNode;
}

export default function CustomSelect({
    options,
    value,
    onChange,
    placeholder = "-- בחר --",
    disabled = false,
    error = false,
    className = "",
    icon
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Find the currently selected option to display its name
    const selectedOption = options.find(opt => String(opt.id) === String(value));

    // Handle clicking outside to close the dropdown
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Reset focused index when opened/closed
    useEffect(() => {
        if (!isOpen) {
            setFocusedIndex(-1);
        } else {
            const currentIndex = options.findIndex(opt => String(opt.id) === String(value));
            setFocusedIndex(currentIndex !== -1 ? currentIndex + 1 : 0);
        }
    }, [isOpen, options, value]);

    // Scroll active item into view
    useEffect(() => {
        if (isOpen && focusedIndex >= 0 && listRef.current) {
            const listItems = listRef.current.querySelectorAll("li");
            if (focusedIndex < listItems.length) {
                listItems[focusedIndex].scrollIntoView({ block: "nearest" });
            }
        }
    }, [focusedIndex, isOpen]);

    const handleSelect = useCallback((optionValue: string | number) => {
        onChange(optionValue);
        setIsOpen(false);
    }, [onChange]);

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (disabled) return;

        if (!isOpen) {
            if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        const totalItems = options.length + 1; // +1 for placeholder

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setFocusedIndex(prev => (prev < totalItems - 1 ? prev + 1 : prev));
                break;
            case "ArrowUp":
                e.preventDefault();
                setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
                break;
            case "Enter":
            case " ":
                e.preventDefault();
                if (focusedIndex === 0) {
                    handleSelect("");
                } else if (focusedIndex > 0 && focusedIndex <= options.length) {
                    handleSelect(options[focusedIndex - 1].id);
                } else {
                    setIsOpen(false);
                }
                break;
            case "Escape":
                e.preventDefault();
                setIsOpen(false);
                break;
            case "Tab":
                setIsOpen(false);
                break;
            default:
                break;
        }
    };

    return (
        <div ref={wrapperRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
            <button
                type="button"
                className={`w-full flex items-center justify-between p-2.5 sm:p-3 bg-white border rounded-lg shadow-sm text-right transition-colors
                    ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200" : "text-gray-900 cursor-pointer hover:border-blue-400"}
                    ${error ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"}
                    ${isOpen && !disabled ? "border-blue-500 ring-1 ring-blue-500" : ""}
                `}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {icon && <span className="text-gray-400">{icon}</span>}
                    <span className={`block truncate ${!selectedOption ? "text-gray-500" : ""}`}>
                        {selectedOption ? selectedOption.name : placeholder}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && !disabled && (
                <ul ref={listRef} className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {/* Optional clear/placeholder selection */}
                    <li>
                        <button
                            type="button"
                            className={`w-full text-right px-4 py-2.5 text-sm transition-colors
                                ${focusedIndex === 0 ? "bg-gray-100 text-gray-700" : "text-gray-500 hover:bg-gray-50"}
                            `}
                            onClick={() => handleSelect("")}
                            tabIndex={-1}
                        >
                            {placeholder}
                        </button>
                    </li>

                    {options.map((option, index) => {
                        const isFocused = focusedIndex === index + 1;
                        const isSelected = String(value) === String(option.id);
                        return (
                            <li key={option.id}>
                                <button
                                    type="button"
                                    className={`w-full text-right px-4 py-2.5 text-sm transition-colors
                                        ${isSelected ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"}
                                        ${isFocused && !isSelected ? "bg-gray-100" : ""}
                                    `}
                                    onClick={() => handleSelect(option.id)}
                                    tabIndex={-1}
                                >
                                    {option.name}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
