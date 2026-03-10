"use client";

import Link from "next/link";
import { User } from "lucide-react";

export default function ReceptionistWelcomePage() {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
            <div className="max-w-2xl w-full text-center">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-neutral-900 mb-6">
                    West Roxbury Framing <span className="text-gold">welcomes you!</span>
                </h1>
                
                <div className="bg-white rounded-lg border border-neutral-200 shadow-lg p-8 mb-6">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <User className="w-8 h-8 text-neutral-700" />
                        <h2 className="text-2xl font-semibold text-neutral-900">Customer Form</h2>
                    </div>
                    <p className="text-neutral-600 mb-6">
                        Help customers enter their information using the form below.
                    </p>
                    <Link
                        href="/staff/customer-form"
                        className="inline-block px-8 py-4 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors text-lg"
                    >
                        Open Customer Form
                    </Link>
                </div>
            </div>
        </div>
    );
}
