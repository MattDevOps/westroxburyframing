"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Frame, Upload, CheckCircle, ArrowRight, X, ImageIcon } from "lucide-react";

const ITEM_TYPES = [
    { value: "art", label: "Art / Print" },
    { value: "photo", label: "Photograph" },
    { value: "diploma", label: "Diploma / Certificate" },
    { value: "object", label: "Object / Shadowbox" },
    { value: "memorabilia", label: "Memorabilia / Jersey" },
    { value: "mirror", label: "Mirror" },
    { value: "canvas", label: "Canvas" },
    { value: "restoration", label: "Restoration / Repair" },
    { value: "other", label: "Other" },
];

export default function CustomFramingContent() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [itemType, setItemType] = useState("");
    const [description, setDescription] = useState("");
    const [optIn, setOptIn] = useState(false);

    const [photos, setPhotos] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<{ orderNumber: string } | null>(null);

    function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files) return;

        const remaining = 6 - photos.length;
        const toProcess = Array.from(files).slice(0, remaining);

        for (const file of toProcess) {
            if (file.size > 5 * 1024 * 1024) {
                setError(`File "${file.name}" is too large (max 5MB). Please choose a smaller image.`);
                continue;
            }
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result as string;
                setPhotos((prev) => [...prev.slice(0, 5), dataUrl]);
            };
            reader.readAsDataURL(file);
        }

        // Reset file input so the same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function removePhoto(index: number) {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const res = await fetch("/api/public/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    phone,
                    item_type: itemType,
                    description,
                    notes: "",
                    marketing_opt_in: optIn,
                    photos,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Something went wrong. Please try again.");
                return;
            }

            setSuccess({ orderNumber: data.order_number });
        } catch {
            setError("Unable to submit. Please try again or call us at 617-327-3890.");
        } finally {
            setSubmitting(false);
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-background">
                <section className="pt-32 pb-16 bg-secondary">
                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <CheckCircle size={64} className="text-gold mx-auto mb-6" />
                            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
                                Request <span className="text-gold">Received!</span>
                            </h1>
                            <p className="text-muted-foreground max-w-2xl mx-auto mb-2">
                                Thank you for your custom framing request. Your order reference is:
                            </p>
                            <p className="text-gold text-2xl font-bold mb-6">{success.orderNumber}</p>
                            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                                We&apos;ll review your request and reach out to discuss pricing and options.
                                Most orders are reviewed within one business day.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/"
                                    className="px-8 py-3.5 bg-gold text-primary-foreground font-semibold tracking-wide uppercase text-sm rounded-sm hover:opacity-90 transition-colors"
                                >
                                    Back to Home
                                </Link>
                                <Link
                                    href="/contact"
                                    className="px-8 py-3.5 border border-gold text-gold font-semibold tracking-wide uppercase text-sm rounded-sm hover:bg-gold hover:text-primary-foreground transition-colors"
                                >
                                    Contact Us
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <section className="pt-32 pb-16 bg-secondary">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4"
                    >
                        Custom <span className="text-gold">Framing</span>
                    </motion.h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Tell us about your framing project and we&apos;ll get back to you with a personalized quote.
                        No obligation — just expert advice from Boston&apos;s trusted framers since 1981.
                    </p>
                </div>
            </section>

            {/* Form */}
            <section className="py-24">
                <div className="max-w-3xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-12"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Frame size={24} className="text-gold" />
                            <h2 className="font-serif text-2xl font-bold text-foreground">
                                How It <span className="text-gold">Works</span>
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {[
                                { step: "1", title: "Describe", desc: "Tell us what you'd like framed" },
                                { step: "2", title: "We Review", desc: "Drop off in store (no online quotes)" }
                            ].map((s) => (
                                <div key={s.step} className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gold text-primary-foreground flex items-center justify-center text-sm font-bold">
                                        {s.step}
                                    </span>
                                    <div>
                                        <h3 className="text-foreground font-semibold text-sm">{s.title}</h3>
                                        <p className="text-muted-foreground text-sm">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.form
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        onSubmit={handleSubmit}
                        className="bg-card rounded-sm border border-border p-8 space-y-8"
                    >
                        {/* Contact Info */}
                        <div>
                            <h3 className="font-serif text-xl text-foreground mb-4">Your Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-foreground/70">First Name *</label>
                                    <input
                                        className="rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none transition-colors"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                        placeholder="First name"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-foreground/70">Last Name *</label>
                                    <input
                                        className="rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none transition-colors"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                        placeholder="Last name"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-foreground/70">Email *</label>
                                    <input
                                        type="email"
                                        className="rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none transition-colors"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="you@email.com"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-foreground/70">Phone *</label>
                                    <input
                                        type="tel"
                                        className="rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none transition-colors"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                        placeholder="617-555-1234"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Item Details */}
                        <div>
                            <h3 className="font-serif text-xl text-foreground mb-4">What Are You Framing?</h3>
                            <div className="space-y-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-foreground/70">Item Type</label>
                                    <select
                                        className="rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none transition-colors"
                                        value={itemType}
                                        onChange={(e) => setItemType(e.target.value)}
                                    >
                                        <option value="">Select what you&apos;re framing...</option>
                                        {ITEM_TYPES.map((t) => (
                                            <option key={t.value} value={t.value}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-foreground/70">Description</label>
                                    <textarea
                                        className="rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none transition-colors min-h-[100px] resize-y"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Tell us about your piece — size, condition, any specific framing preferences, etc."
                                    />
                                </div>

                            </div>
                        </div>

                        {/* Photo Upload */}
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <ImageIcon size={20} className="text-gold" />
                                <h3 className="font-serif text-xl text-foreground">Upload Photos</h3>
                            </div>
                            <p className="text-muted-foreground text-sm mb-4">
                                Upload up to 6 photos of your artwork or item. This helps us give you a more accurate quote. (Max 5MB per image)
                            </p>

                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-3">
                                {photos.map((dataUrl, i) => (
                                    <div key={i} className="relative aspect-square rounded-sm overflow-hidden border border-border group">
                                        <img
                                            src={dataUrl}
                                            alt={`Upload ${i + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(i)}
                                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}

                                {photos.length < 6 && (
                                    <label className="aspect-square rounded-sm border-2 border-dashed border-border hover:border-gold/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-gold">
                                        <Upload size={20} />
                                        <span className="text-[10px] font-medium uppercase tracking-wide">Add</span>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handlePhotoSelect}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Opt-in */}
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="mt-0.5 accent-[hsl(45,60%,55%)]"
                                checked={optIn}
                                onChange={(e) => setOptIn(e.target.checked)}
                            />
                            <span className="text-sm text-muted-foreground">
                                Keep me in the loop! Sign me up for occasional emails about framing tips, seasonal specials, and shop updates.
                            </span>
                        </label>

                        {error && (
                            <div className="rounded-sm border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full px-8 py-4 bg-gold text-primary-foreground font-semibold tracking-wide uppercase text-sm rounded-sm hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                "Submitting..."
                            ) : (
                                <>
                                    Submit Framing Request
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </motion.form>

                    <div className="mt-8 text-center">
                        <p className="text-muted-foreground text-sm">
                            Prefer to talk in person?{" "}
                            <Link href="/book" className="text-gold hover:text-gold-light underline underline-offset-2">
                                Book a free consultation
                            </Link>{" "}
                            or{" "}
                            <Link href="/contact" className="text-gold hover:text-gold-light underline underline-offset-2">
                                contact us directly
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
