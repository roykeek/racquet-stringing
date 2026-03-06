import React from "react";

export default function NativeSelectTestPage() {
    return (
        <div className="p-10" dir="rtl">
            <h1 className="text-2xl font-bold mb-6">Native Positioning Test</h1>

            <div className="max-w-md p-6 bg-white shadow-xl rounded-xl border border-gray-200">
                <label className="block text-sm mb-2">Select an Option</label>
                <select className="w-full border p-2 rounded-md bg-white">
                    <option value="1">Option 1</option>
                    <option value="2">Option 2</option>
                    <option value="3">Option 3</option>
                </select>

                <label className="block text-sm mb-2 mt-6">Select a Date</label>
                <input type="date" className="w-full border p-2 rounded-md bg-white" />
            </div>
        </div>
    );
}
