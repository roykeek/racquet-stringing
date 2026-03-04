"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { format, addDays } from "date-fns";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getModelsByManufacturerId, createServiceJob } from "@/app/actions";
import { Manufacturer, RacquetModel } from "@prisma/client";
import { loadPersistedData, savePersistedData } from "@/hooks/usePersistedState";

const bookingSchema = z.object({
    clientName: z.string().min(2, "שם מלא חייב להכיל לפחות 2 תווים"),
    clientPhone: z.string()
        .regex(/^05\d{8}$/, "מספר טלפון לא תקין — יש להזין 10 ספרות (לדוגמה: 0501234567)"),
    manufacturerId: z.coerce.number().min(1, "יש לבחור יצרן"),
    modelId: z.coerce.number().optional().nullable(),
    customRacquetInfo: z.string().optional(),
    stringTypes: z.string().optional(),
    mainsTensionLbs: z.string().optional(),
    crossTensionLbs: z.string().optional(),
    racquetCount: z.coerce.number().min(1).default(1),
    urgency: z.enum(["Standard", "Express", "Immediate"]),
    dueDate: z.string().min(1, "יש לבחור תאריך מוערך"),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function BookingForm({
    initialManufacturers,
}: {
    initialManufacturers: Manufacturer[];
}) {
    const [models, setModels] = useState<RacquetModel[]>([]);
    const [isOtherManufacturer, setIsOtherManufacturer] = useState(false);
    const [isOtherModel, setIsOtherModel] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successTrackingId, setSuccessTrackingId] = useState<string | null>(null);
    const [isPreFilled, setIsPreFilled] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        setValue,
        formState: { errors },
    } = useForm<BookingFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(bookingSchema) as any,
        defaultValues: {
            racquetCount: 1,
            stringTypes: "",
            mainsTensionLbs: "52",
            crossTensionLbs: "51",
            urgency: "Standard",
            dueDate: format(addDays(new Date(), 3), "yyyy-MM-dd"), // Default to 3 days from now
        },
    });

    // Ref to hold a modelId that should be applied after models are fetched
    const pendingModelIdRef = useRef<string | null>(null);

    // Load persisted client data on first mount and pre-fill the form
    useEffect(() => {
        const saved = loadPersistedData();
        if (!saved) return;

        // Store modelId for deferred application — models haven't loaded yet
        if (saved.modelId) pendingModelIdRef.current = saved.modelId;

        reset({
            clientName: saved.clientName,
            clientPhone: saved.clientPhone,
            // Select elements with register() use string values — pass strings, not numbers.
            // z.coerce.number() handles string→number on validation, so raw form values are strings.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            manufacturerId: (saved.manufacturerId || undefined) as any,
            // modelId is NOT set here — the models dropdown is still empty at this point.
            // It will be applied by the models-loaded effect below via pendingModelIdRef.
            stringTypes: saved.stringTypes,
            mainsTensionLbs: saved.mainsTensionLbs,
            crossTensionLbs: saved.crossTensionLbs,
            // Non-persisted fields keep their defaults
            racquetCount: 1,
            urgency: "Standard",
            dueDate: format(addDays(new Date(), 3), "yyyy-MM-dd"),
        });
        setIsPreFilled(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // eslint-disable-next-line react-hooks/incompatible-library
    const selectedManufacturerId = watch("manufacturerId");
    const selectedModelId = watch("modelId");

    useEffect(() => {
        async function loadModels() {
            if (!selectedManufacturerId) return;

            const m = initialManufacturers.find((m) => m.id === Number(selectedManufacturerId));
            if (m?.name === "Other") {
                setIsOtherManufacturer(true);
                setModels([]);
            } else {
                setIsOtherManufacturer(false);
                const fetchedModels = await getModelsByManufacturerId(Number(selectedManufacturerId));
                setModels(fetchedModels);

                // Apply deferred modelId from localStorage now that models are available
                if (pendingModelIdRef.current) {
                    const matchExists = fetchedModels.some(
                        (mdl) => String(mdl.id) === pendingModelIdRef.current
                    );
                    if (matchExists) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        setValue("modelId", pendingModelIdRef.current as any);
                    }
                    pendingModelIdRef.current = null; // only apply once
                }
            }
        }
        loadModels();
    }, [selectedManufacturerId, initialManufacturers, setValue]);

    useEffect(() => {
        if (models.length > 0 && selectedModelId) {
            const model = models.find((m) => m.id === Number(selectedModelId));
            setIsOtherModel(model?.name === "Other");
        } else {
            setIsOtherModel(false);
        }
    }, [selectedModelId, models]);

    const onSubmit = async (data: BookingFormValues) => {
        setIsSubmitting(true);
        // Convert dueDate string to Date object
        // Destructure manufacturerId out so it doesn't get sent to Prisma (which throws an Unknown Field error)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { manufacturerId, ...restData } = data;
        const payload = {
            ...restData,
            // If "Other" manufacturer is selected, modelId is null
            modelId: isOtherManufacturer ? null : restData.modelId ?? null,
            customRacquetInfo: restData.customRacquetInfo ?? null,
            dueDate: new Date(restData.dueDate),
            stringTypes: restData.stringTypes || null,
            // Parse tension strings to numbers or null
            mainsTensionLbs: restData.mainsTensionLbs ? Number(restData.mainsTensionLbs) : null,
            crossTensionLbs: restData.crossTensionLbs ? Number(restData.crossTensionLbs) : null,
        };

        const result = await createServiceJob(payload);
        if (result.success && result.trackingId) {
            // Persist the client's details for their next visit
            savePersistedData({
                clientName: data.clientName,
                clientPhone: data.clientPhone,
                manufacturerId: String(data.manufacturerId ?? ""),
                modelId: String(data.modelId ?? ""),
                stringTypes: data.stringTypes ?? "",
                mainsTensionLbs: data.mainsTensionLbs ?? "",
                crossTensionLbs: data.crossTensionLbs ?? "",
            });
            setSuccessTrackingId(result.trackingId);
        } else {
            alert("אירעה שגיאה בביצוע ההזמנה. אנא נסה שנית.");
        }
        setIsSubmitting(false);
    };

    if (successTrackingId) {
        return (
            <div className="text-center p-8 bg-green-50 rounded-xl border border-green-200">
                <h2 className="text-2xl font-bold text-green-700 mb-4">הזמנתך התקבלה בהצלחה!</h2>
                <p className="text-green-900 mb-6">
                    שמרנו את בקשתך. תוכל/י לעקוב אחר סטטוס השזירה בקישור הבא:
                </p>
                <div className="bg-white p-4 rounded-lg shadow-inner mb-6 flex items-center justify-center">
                    <code className="text-sm text-gray-800 break-all select-all dir-ltr">
                        {`/status/${successTrackingId}`}
                    </code>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="text-white bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-medium transition"
                >
                    בצע הזמנה חדשה
                </button>
            </div>
        );
    }

    return (
        <>
            {/* Pre-filled banner — shown only when localStorage data was found */}
            {isPreFilled && (
                <div className="flex items-center justify-between gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-xl px-4 py-2.5 mb-2">
                    <span>👋 ברוכ/ה השב/ה! מילאנו מראש את הפרטים מהביקור הקודם שלך.</span>
                    <button
                        type="button"
                        onClick={() => setIsPreFilled(false)}
                        className="text-blue-400 hover:text-blue-600 font-bold text-base leading-none flex-shrink-0"
                        aria-label="סגור"
                    >✕</button>
                </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* 1. Client Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
                        <input
                            {...register("clientName")}
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-gray-900 bg-white"
                            placeholder="ישראל ישראלי"
                        />
                        {errors.clientName && (
                            <p className="mt-1 text-sm text-red-600">{errors.clientName.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">טלפון (נייד)</label>
                        <input
                            {...register("clientPhone")}
                            type="tel"
                            dir="ltr"
                            maxLength={10}
                            pattern="05\d{8}"
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-left text-gray-900 bg-white"
                            placeholder="0501234567"
                        />
                        {errors.clientPhone && (
                            <p className="mt-1 text-sm text-red-600">{errors.clientPhone.message}</p>
                        )}
                    </div>
                </div>

                <hr className="border-gray-200" />

                {/* 2. Racquet Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">יצרן מחבט</label>
                        <select
                            {...register("manufacturerId")}
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border bg-white text-gray-900"
                        >
                            <option value="">-- בחר יצרן --</option>
                            {initialManufacturers.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
                        {errors.manufacturerId && (
                            <p className="mt-1 text-sm text-red-600">{errors.manufacturerId.message}</p>
                        )}
                    </div>

                    {!isOtherManufacturer && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">דגם מחבט</label>
                            <select
                                {...register("modelId")}
                                disabled={models.length === 0}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                            >
                                <option value="">-- בחר דגם --</option>
                                {models.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {(isOtherManufacturer || isOtherModel) && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            נא לפרט דגם / יצרן:
                        </label>
                        <input
                            {...register("customRacquetInfo")}
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-gray-900 bg-white"
                            placeholder="למשל: סלאזינגר פרו 95"
                        />
                    </div>
                )}

                <hr className="border-gray-200" />

                {/* 3. Stringing Preferences */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">סוג גיד מבוקש</label>
                    <input
                        {...register("stringTypes")}
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-gray-900 bg-white"
                        placeholder="למשל: Babolat RPM Blast או שילוב (היברידי)"
                    />
                    {errors.stringTypes && (
                        <p className="mt-1 text-sm text-red-600">{errors.stringTypes.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            מתיחת אורך (Mains) - Lbs
                        </label>
                        <input
                            {...register("mainsTensionLbs")}
                            type="number"
                            dir="ltr"
                            className={`w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-left bg-white ${watch("mainsTensionLbs") === "52" ? "text-gray-400" : "text-gray-900"}`}
                            placeholder="52"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            מתיחת לרוחב (Crosses) - Lbs
                        </label>
                        <input
                            {...register("crossTensionLbs")}
                            type="number"
                            dir="ltr"
                            className={`w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-left bg-white ${watch("crossTensionLbs") === "51" ? "text-gray-400" : "text-gray-900"}`}
                            placeholder="52"
                        />
                    </div>
                </div>

                <hr className="border-gray-200" />

                {/* 4. Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">כמות מחבטים</label>
                        <input
                            {...register("racquetCount")}
                            type="number"
                            min="1"
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-gray-900 bg-white"
                        />
                        <p className="mt-1 text-xs text-gray-500">עבור שזירה שונה, צור הזמנה נפרדת.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">דחיפות</label>
                        <select
                            {...register("urgency")}
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border bg-white text-gray-900"
                        >
                            <option value="Standard">רגיל (Standard)</option>
                            <option value="Express">אקספרס (Express)</option>
                            <option value="Immediate">דחוף - עכשיו! (Immediate)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">תאריך איסוף מבוקש</label>
                        <input
                            {...register("dueDate")}
                            type="date"
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-gray-900 bg-white"
                        />
                    </div>
                </div>

                {/* Submit */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl disabled:bg-blue-300 transition"
                    >
                        {isSubmitting ? "שולח..." : "שלח בקשת הזמנה"}
                    </button>
                </div>
            </form>
        </>
    );
}
