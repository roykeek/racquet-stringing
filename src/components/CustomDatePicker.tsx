"use client";

import { forwardRef } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { he } from "date-fns/locale/he";
import { CalendarIcon } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";

// Register Hebrew locale for the date picker globally
registerLocale("he", he);

interface CustomDatePickerProps {
    selected: Date | null;
    onChange: (date: Date | null) => void;
    minDate?: Date;
    maxDate?: Date;
    placeholderText?: string;
    className?: string;
    error?: boolean;
    disabled?: boolean;
}

const CustomDatePicker = forwardRef<DatePicker, CustomDatePickerProps>(
    (
        {
            selected,
            onChange,
            minDate,
            maxDate,
            placeholderText = "DD/MM/YYYY",
            className = "",
            error = false,
            disabled = false,
        },
        ref
    ) => {
        return (
            <div className="relative w-full">
                <DatePicker
                    ref={ref}
                    selected={selected}
                    onChange={onChange}
                    minDate={minDate}
                    maxDate={maxDate}
                    locale="he"
                    dateFormat="dd/MM/yyyy"
                    placeholderText={placeholderText}
                    disabled={disabled}
                    className={`w-full p-2.5 pr-10 border rounded-lg shadow-sm text-gray-900 bg-white transition-colors
                        ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200" : "hover:border-blue-400"}
                        ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"}
                        ${className}
                    `}
                    // These props help ensure the popper floats correctly above standard document flow
                    popperPlacement="bottom-start"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <CalendarIcon className="w-4 h-4" />
                </div>
            </div>
        );
    }
);

CustomDatePicker.displayName = "CustomDatePicker";
export default CustomDatePicker;
