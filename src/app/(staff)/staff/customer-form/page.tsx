"use client";

import { useState, useRef } from "react";
import { CheckCircle, AlertCircle, Loader2, User, Camera, X, RotateCcw } from "lucide-react";
import Image from "next/image";

export default function CustomerFormPage() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [optIn, setOptIn] = useState(false);

    // Photo capture state
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoFile(file);
        const url = URL.createObjectURL(file);
        setPhotoPreview(url);
    }

    function clearPhoto() {
        setPhotoFile(null);
        if (photoPreview) URL.revokeObjectURL(photoPreview);
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    async function uploadPhoto(): Promise<string | null> {
        if (!photoFile) return null;
        setUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append("file", photoFile);
            const res = await fetch("/api/public/customer-photo", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) return null;
            const data = await res.json();
            return data.url ?? null;
        } catch {
            return null;
        } finally {
            setUploadingPhoto(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        setSuccess(false);

        try {
            // Upload photo first if one was captured
            let photoUrl: string | null = null;
            if (photoFile) {
                photoUrl = await uploadPhoto();
                if (!photoUrl) {
                    setError("Photo upload failed. Your info will be saved without the photo.");
                }
            }

            const res = await fetch("/api/public/customer-info", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    phone,
                    marketing_opt_in: optIn,
                    ...(photoUrl ? { photo_url: photoUrl } : {}),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                // Handle duplicate customer case
                if (data.error === "duplicate" || res.status === 409) {
                    setError("You are already in our system.");
                    setFirstName("");
                    setLastName("");
                    setEmail("");
                    setPhone("");
                    setOptIn(false);
                    clearPhoto();
                    setTimeout(() => {
                        setError(null);
                    }, 2000);
                    return;
                }
                setError(data.error || "Something went wrong. Please try again.");
                return;
            }

            setSuccess(true);
            setFirstName("");
            setLastName("");
            setEmail("");
            setPhone("");
            setOptIn(false);
            clearPhoto();
            setTimeout(() => {
                setSuccess(false);
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

                {/* Photo Capture Section */}
                <div className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Camera className="w-5 h-5 text-neutral-700" />
                        <h2 className="text-sm font-medium text-neutral-700">Profile Photo</h2>
                        <span className="text-xs text-neutral-400">(optional)</span>
                    </div>

                    {photoPreview ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative w-40 h-40 rounded-full overflow-hidden border-2 border-neutral-200">
                                <Image
                                    src={photoPreview}
                                    alt="Photo preview"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Retake
                                </button>
                                <button
                                    type="button"
                                    onClick={clearPhoto}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                    Remove
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-neutral-300 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer"
                        >
                            <Camera className="w-10 h-10 text-neutral-400" />
                            <span className="text-sm font-medium text-neutral-600">Tap to Take Photo</span>
                            <span className="text-xs text-neutral-400">Opens your camera</span>
                        </button>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={handlePhotoCapture}
                        className="hidden"
                    />
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
                    disabled={submitting || uploadingPhoto || !firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()}
                    className="w-full px-6 py-4 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                    {submitting || uploadingPhoto ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {uploadingPhoto ? "Uploading Photo..." : "Saving..."}
                        </>
                    ) : (
                        "Save Customer Information"
                    )}
                </button>
            </form>
        </div>
    );
}
