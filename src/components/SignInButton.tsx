"use client";

import { signIn, signOut } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";
import { twMerge } from "tailwind-merge";

interface Props {
    isSignIn: boolean;
    className?: string;
}

export default function SignInButton({ isSignIn, className }: Props) {
    if (isSignIn) {
        return (
            <button
                onClick={() => signIn("google")}
                className={twMerge(
                    "flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm",
                    className
                )}
            >
                <LogIn size={18} />
                Googleでログインして始める
            </button>
        );
    }

    return (
        <button
            onClick={() => signOut()}
            className={twMerge(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors",
                className
            )}
        >
            <LogOut size={16} />
            ログアウト
        </button>
    );
}
