import NextAuth, { NextAuthConfig } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

async function refreshAccessToken(token: any) {
    try {
        const url =
            "https://oauth2.googleapis.com/token?" +
            new URLSearchParams({
                client_id: getEnv("GOOGLE_CLIENT_ID"),
                client_secret: getEnv("GOOGLE_CLIENT_SECRET"),
                grant_type: "refresh_token",
                refresh_token: token.refreshToken,
            })

        const response = await fetch(url, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            method: "POST",
        })

        const refreshedTokens = await response.json()

        if (!response.ok) {
            throw refreshedTokens
        }

        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            expiresAt: Date.now() + refreshedTokens.expires_in * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
        }
    } catch (error) {
        console.error("Error refreshing access token", error)
        return {
            ...token,
            error: "RefreshAccessTokenError",
        }
    }
}

function getEnv(key: string): string {
    if (typeof process !== 'undefined' && process.env[key]) return process.env[key] as string;
    if (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.[key]) return (globalThis as any).process.env[key] as string;
    return "";
}

const nextAuthUrl = getEnv("NEXTAUTH_URL");
const isHttps = nextAuthUrl.startsWith("https://");

export const config = {
    trustHost: true,
    providers: [
        GoogleProvider({
            clientId: getEnv("GOOGLE_CLIENT_ID"),
            clientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                    scope: "openid email profile https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets",
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                // v4とv5の挙動差異（ミリ秒単位への変換が必要なケース）を考慮
                token.expiresAt = account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000;
                return token;
            }
            if (Date.now() < (token.expiresAt as number)) {
                return token;
            }
            return await refreshAccessToken(token);
        },
        async session({ session, token }: any) {
            session.accessToken = token.accessToken;
            session.error = token.error;
            return session;
        }
    },
    useSecureCookies: true,
    secret: getEnv("NEXTAUTH_SECRET") || "development-secret",
    debug: true,
    session: {
        strategy: "jwt",
    },
    cookies: {
        sessionToken: {
            name: `${isHttps ? "__Secure-" : ""}next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: true,
            },
        },
    },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)
