import { betterAuth } from "better-auth";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: { enabled: true },
    baseURL: process.env.BETTER_AUTH_URL,
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            if (ctx.path === "/sign-up/email") {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const email = ctx.body?.email;

                if (typeof email === "string") {
                    if (!emailRegex.test(email)) {
                        throw new APIError("BAD_REQUEST", { message: "Invalid email format" });
                    }

                    const disposableDomains = ["tempmail.com", "mailinator.com"];
                    const domain = email.split('@')[1];
                    if (domain && disposableDomains.includes(domain)) {
                        throw new APIError("BAD_REQUEST", { message: "Disposable email addresses are not allowed" });
                    }

                    const apiKey = process.env.ZEROBOUNCE_API_KEY;
                    if (!apiKey) {
                        throw new APIError("INTERNAL_SERVER_ERROR", { message: "Email validation is not configured" });
                    }

                    try {
                        const zbRes = await fetch(
                            `https://api.zerobounce.net/v2/validate?api_key=${process.env.ZEROBOUNCE_API_KEY}&email=${encodeURIComponent(email)}&ip_address=`
                        );
                        const zbData = await zbRes.json();

                        if (!zbData.error && (zbData.status === "invalid" || zbData.status === "spamtrap" || zbData.status === "do_not_mail")) {
                            throw new APIError("BAD_REQUEST", { message: "Email address is invalid or doesn't exist." });
                        } 
                    } catch (err) {
                        if (err instanceof APIError) throw err;
                        console.warn("ZeroBounce check skipped:", err);
                    }
                }
            }
        })
    }
});
