"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginStringer } from "@/app/actions";
import { useRouter } from "next/navigation";
import { Wrench, Lock } from "lucide-react";

type StringerOption = {
    id: number;
    name: string;
};

import { loginSchema, LoginFormValues } from "@/lib/validations";
import CustomSelect from "@/components/CustomSelect";

export default function StringerLoginForm({
    stringers,
}: {
    stringers: StringerOption[];
}) {
    const router = useRouter();
    const [errorMsg, setErrorMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        reset,
        setFocus,
        formState: { errors },
    } = useForm<LoginFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(loginSchema) as any,
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsSubmitting(true);
        setErrorMsg("");

        const result = await loginStringer(data.stringerId, data.password);

        if (result.success) {
            router.push("/stringer"); // Redirect to stringer dashboard
            router.refresh();
        } else {
            setErrorMsg(result.error || "שגיאה לא ידועה");
            setIsSubmitting(false);

            // Clear just the password field on failure
            reset({ ...data, password: "" });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {errorMsg && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 text-sm">
                    {errorMsg}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם שוזר/ת</label>
                <div className="relative">
                    <Controller
                        name="stringerId"
                        control={control}
                        render={({ field }) => (
                            <CustomSelect
                                options={stringers}
                                value={field.value}
                                onChange={(val) => {
                                    field.onChange(val);
                                    if (val) setFocus("password");
                                }}
                                placeholder="-- בחר עובד --"
                                error={!!errors.stringerId}
                                className="w-full text-base"
                                icon={<Wrench size={18} />}
                            />
                        )}
                    />
                </div>
                {errors.stringerId && (
                    <p className="mt-1 text-sm text-red-600">{errors.stringerId.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
                <div className="relative">
                    <input
                        {...register("password")}
                        type="password"
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-3 pr-10 border text-left text-gray-900"
                        dir="ltr"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                        <Lock size={18} />
                    </div>
                </div>
                {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-xl disabled:bg-emerald-300 transition shadow-md text-lg"
            >
                {isSubmitting ? "מתחבר..." : "כניסה למערכת"}
            </button>
        </form>
    );
}
