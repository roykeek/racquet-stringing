"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import stringsData from "@/data/strings.json";

interface StringOption {
    brand: string;
    name: string;
}

const allStrings: StringOption[] = stringsData;

interface StringAutocompleteProps {
    /** Field label text */
    label: string;
    /** Placeholder text */
    placeholder?: string;
    /** Current value */
    value: string;
    /** Called when the value changes */
    onChange: (value: string) => void;
    /** Optional error message */
    error?: string;
}

export default function StringAutocomplete({
    label,
    placeholder = "הקלד לחיפוש...",
    value,
    onChange,
    error,
}: StringAutocompleteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState<StringOption[]>([]);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter options based on input value
    const handleInputChange = useCallback(
        (inputValue: string) => {
            onChange(inputValue);

            if (inputValue.trim().length === 0) {
                setFilteredOptions(allStrings);
                setIsOpen(true);
                return;
            }

            const query = inputValue.toLowerCase();
            const matches = allStrings.filter((s) => {
                const fullName = `${s.brand} ${s.name}`.toLowerCase();
                return fullName.includes(query);
            });

            setFilteredOptions(matches);
            setIsOpen(true);
        },
        [onChange]
    );

    // Select an option from the dropdown
    const handleSelect = useCallback(
        (option: StringOption) => {
            onChange(`${option.brand} ${option.name}`);
            setIsOpen(false);
            inputRef.current?.blur();
        },
        [onChange]
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Show all options when focusing on an empty input
    const handleFocus = () => {
        if (value.trim().length === 0) {
            setFilteredOptions(allStrings);
        } else {
            const query = value.toLowerCase();
            setFilteredOptions(
                allStrings.filter((s) =>
                    `${s.brand} ${s.name}`.toLowerCase().includes(query)
                )
            );
        }
        setIsOpen(true);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={handleFocus}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-gray-900 bg-white"
                placeholder={placeholder}
                autoComplete="off"
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}

            {/* Dropdown */}
            {isOpen && filteredOptions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredOptions.map((option, idx) => (
                        <li key={`${option.brand}-${option.name}-${idx}`}>
                            <button
                                type="button"
                                onClick={() => handleSelect(option)}
                                className="w-full text-right px-3 py-2 text-sm hover:bg-blue-50 
                                           hover:text-blue-700 transition-colors cursor-pointer"
                            >
                                <span className="font-medium">{option.brand}</span>{" "}
                                <span className="text-gray-600">{option.name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
