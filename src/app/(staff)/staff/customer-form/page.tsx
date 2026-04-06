"use client";

import { useState, useRef } from "react";
import { CheckCircle, AlertCircle, Loader2, User, Camera, X, Plus } from "lucide-react";
import Image from "next/image";

interface PhotoEntry {
    file: File;
    preview: string;
}

export default function CustomerFormPage() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [optIn, setOptIn] = useState(false);

    // Multi-photo capture state
    const [photos, setPhotos] = useState<PhotoEntry[]>([]);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setPhotos((prev) => [...prev, { file, preview }]);
        // Reset input so the same file can be re-selected if needed
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function removePhoto(index: number) {
        setPhotos((prev) => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].preview);
            updated.splice(index, 1);
            return updated;
        });
    }

    function clearAllPhotos() {
        photos.forEach((p) => URL.revokeObjectURL(p.preview));
        setPhotos([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    async function uploadPhotos(): Promise<string[]> {
        if (photos.length === 0) return [];
        setUploadingPhotos(true);
        const urls: string[] = [];
        try {
            for (const photo of photos) {
                const formData = new FormData();
                formData.append("file", photo.file);
                const res = await fetch("/api/public/customer-photo", {
                    method: "POST",
                    body: formData,
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.url) urls.push(data.url);
                }
            }
        } finally {
            setUploadingPhotos(false);
        }
        return urls;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        setSuccess(false);

        try {
            // Upload photos first
            let photoUrls: string[] = [];
            if (photos.length > 0) {
                photoUrls = await uploadPhotos();
                if (photoUrls.length < photos.length) {
                    setError(`${photos.length - photoUrls.length} photo(s) failed to upload. The rest will be saved.`);
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
                    ...(photoUrls.length > 0 ? { photo_urls: photoUrls } : {}),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.error === "duplicate" || res.status === 409) {
                    setError("You are already in our system.");
                    setFirstName("");
                    setLastName("");
                    setEmail("");
                    setPhone("");
                    setOptIn(false);
                    clearAllPhotos();
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
            clearAllPhotos();
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

                {/* Artwork Photo Capture Section */}
                <div className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Camera className="w-5 h-5 text-neutral-700" />
                        <h2 className="text-sm font-medium text-neutral-700">Photos of Your Artwork</h2>
                        <span className="text-xs text-neutral-400">(optional)</span>
                    </div>
                    <p className="text-xs text-neutral-500 mb-3">
                        Take photos of the pieces you&apos;re bringing in to be framed. You can add multiple photos.
                    </p>

                    {/* Photo grid */}
                    {photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mb-3">
                            {photos.map((photo, i) => (
                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-neutral-200 group">
                                    <Image
                                        src={photo.preview}
                                        alt={`Artwork photo ${i + 1}`}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(i)}
                                        className="absolute top-1 right-1 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5">
                                        {i + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add photo button */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-neutral-300 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer"
                    >
                        {photos.length === 0 ? (
                            <>
                                <Camera className="w-10 h-10 text-neutral-400" />
                                <span className="text-sm font-medium text-neutral-600">Tap to Photograph Your Artwork</span>
                                <span className="text-xs text-neutral-400">Take a photo of the piece you&apos;re bringing in to be framed</span>
                            </>
                        ) : (
                            <>
                                <Plus className="w-8 h-8 text-neutral-400" />
                                <span className="text-sm font-medium text-neutral-600">Add Another Photo</span>
                            </>
                        )}
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
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
                    disabled={submitting || uploadingPhotos || !firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()}
                    className="w-full px-6 py-4 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                    {submitting || uploadingPhotos ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {uploadingPhotos ? `Uploading Photos (${photos.length})...` : "Saving..."}
                        </>
                    ) : (
                        "Save Customer Information"
                    )}
                </button>
            </form>
        </div>
    );
}
