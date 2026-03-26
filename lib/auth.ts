import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
// import { PrismaClient } from "@/app/generated/prisma/client";
// import { PrismaNeon } from "@prisma/adapter-neon";

// const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
// const prisma = new PrismaClient({ adapter });

export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: { enabled: true },
    baseURL: process.env.BETTER_AUTH_URL,
});
