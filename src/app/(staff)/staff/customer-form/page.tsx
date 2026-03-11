"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, Loader2, User } from "lucide-react";

export default function CustomerFormPage() {
    const router = useRouter();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [optIn, setOptIn] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        setSuccess(false);

        try {
            const res = await fetch("/api/public/customer-info", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    phone,
                    marketing_opt_in: optIn,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Something went wrong. Please try again.");
                return;
            }

            setSuccess(true);
            // Clear form
            setFirstName("");
            setLastName("");
            setEmail("");
            setPhone("");
            setOptIn(false);
            
            // Redirect to welcome page after 2 seconds
            setTimeout(() => {
                router.push("/staff/welcome");
            }, 2000);
        } catch {
            setError("Unable to save. Please try again or contact support.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <User className="w-6 h-6 text-neutral-700" />
                    <h1 className="text-2xl font-bold text-neutral-900">Customer Information</h1>
                </div>
                <p className="text-sm text-neutral-600">
                    Enter your information.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-neutral-200 p-6 space-y-6">
                {error && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm">Customer information saved successfully!</p>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="First name"
                            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Last name"
                            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@email.com"
                            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="617-555-1234"
                            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={optIn}
                            onChange={(e) => setOptIn(e.target.checked)}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-blue-400 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-blue-900">
                            <strong>I agree to receive account updates and notifications</strong> from West Roxbury Framing at the phone number provided. This includes order status updates, pickup reminders, and other account-related notifications. You can opt out at any time by replying STOP to any message. Reply HELP for assistance. Message frequency varies. Message and data rates may apply.
                        </span>
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={submitting || !firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()}
                    className="w-full px-6 py-4 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Save Customer Information"
                    )}
                </button>
            </form>
        </div>
    );
}
