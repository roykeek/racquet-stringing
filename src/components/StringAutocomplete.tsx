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
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Ref to always hold the latest value — avoids stale closure in handleBlur
    const valueRef = useRef(value);
    useEffect(() => { valueRef.current = value; }, [value]);

    // Filter options based on input value
    const handleInputChange = useCallback(
        (inputValue: string) => {
            onChange(inputValue);

            if (inputValue.trim().length === 0) {
                setFilteredOptions([]);
                setIsOpen(false);
                return;
            }

            const query = inputValue.toLowerCase();
            const matches = allStrings.filter((s) => {
                const fullName = `${s.brand} ${s.name}`.toLowerCase();
                return fullName.includes(query);
            });

            setFilteredOptions(matches);
            setActiveIndex(-1);
            setIsOpen(true);
        },
        [onChange]
    );

    // Select an option from the dropdown
    const handleSelect = useCallback(
        (option: StringOption) => {
            const fullName = `${option.brand} ${option.name}`;
            // Update ref immediately — blur timer may fire before React re-renders,
            // so we can't rely solely on the useEffect to keep valueRef in sync.
            valueRef.current = fullName;
            // Cancel any pending blur validation — we're selecting a valid option.
            if (blurTimerRef.current !== null) {
                clearTimeout(blurTimerRef.current);
                blurTimerRef.current = null;
            }
            onChange(fullName);
            setIsOpen(false);
            setActiveIndex(-1);
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

    // Scroll active item into view when activeIndex changes
    useEffect(() => {
        if (activeIndex < 0 || !listRef.current) return;
        const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
        item?.scrollIntoView({ block: "nearest" });
    }, [activeIndex]);

    // Show filtered options on focus; do nothing on empty input
    const handleFocus = () => {
        if (value.trim().length === 0) return;
        const query = value.toLowerCase();
        setFilteredOptions(
            allStrings.filter((s) =>
                `${s.brand} ${s.name}`.toLowerCase().includes(query)
            )
        );
        setIsOpen(true);
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen || filteredOptions.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((prev) => (prev + 1) % filteredOptions.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) =>
                prev <= 0 ? filteredOptions.length - 1 : prev - 1
            );
        } else if (e.key === "Enter") {
            if (activeIndex >= 0) {
                e.preventDefault();
                handleSelect(filteredOptions[activeIndex]);
            }
        } else if (e.key === "Escape") {
            setIsOpen(false);
            setActiveIndex(-1);
        }
    };

    // Clear invalid input on blur (e.g. partial search terms like "Rz")
    const handleBlur = useCallback(() => {
        // Small delay so dropdown click registers before blur clears the value.
        // Use valueRef so we always check the latest value, not a stale closure.
        blurTimerRef.current = setTimeout(() => {
            const trimmed = valueRef.current.trim();
            if (trimmed.length === 0) return;
            const isValid = allStrings.some(
                (s) => `${s.brand} ${s.name}`.toLowerCase() === trimmed.toLowerCase()
            );
            if (!isValid) {
                onChange("");
            }
        }, 150);
    }, [onChange]);

    // Cancel pending blur timer on unmount to avoid state updates on an unmounted component
    useEffect(() => {
        return () => {
            if (blurTimerRef.current !== null) clearTimeout(blurTimerRef.current);
        };
    }, []);

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
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-gray-900 bg-white"
                placeholder={placeholder}
                autoComplete="off"
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}

            {/* Dropdown */}
            {isOpen && filteredOptions.length > 0 && (
                <ul ref={listRef} className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredOptions.map((option, idx) => (
                        <li key={`${option.brand}-${option.name}-${idx}`}>
                            <button
                                type="button"
                                onClick={() => handleSelect(option)}
                                className={`w-full text-right px-3 py-2 text-sm transition-colors cursor-pointer ${
                                    idx === activeIndex
                                        ? "bg-blue-100 text-blue-700"
                                        : "hover:bg-blue-50 hover:text-blue-700"
                                }`}
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
