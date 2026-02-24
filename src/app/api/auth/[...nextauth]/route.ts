import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

async function refreshAccessToken(token: any) {
    try {
        const url =
            "https://oauth2.googleapis.com/token?" +
            new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID || "",
                client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
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
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
        }
    } catch (error) {
        console.error("Error refreshing access token", error)
        return {
            ...token,
            error: "RefreshAccessTokenError",
        }
    }
}


export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                    // Google DriveとGoogle Sheetsへのフルアクセス権限を要求するスコープ
                    scope: "openid email profile https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets",
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, account }: { token: any, account: any }) {
            // 初回ログイン時
            if (account) {
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                token.expiresAt = account.expires_at * 1000;
                return token;
            }

            // トークンの有効期限内であれば既存のトークンを返す
            if (Date.now() < token.expiresAt) {
                return token;
            }

            // 有効期限切れの場合はリフレッシュトークンを使って新しいアクセストークンを取得
            return await refreshAccessToken(token);
        },
        async session({ session, token }: any) {
            session.accessToken = token.accessToken;
            session.error = token.error;
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
