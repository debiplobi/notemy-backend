import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { user, session, account, verification } from "@/db/schema";
import { db } from "@/db";
import { transporter } from "./mailer";
import { openAPI } from "better-auth/plugins";

export const auth = betterAuth({
  defaultCookieAttributes: {
    sameSite: "none",
    secure: false,
    partitioned: true, // New browser standards will mandate this for foreign cookies
  },
  baseURL: process.env.BACKEND_URL,
  trustedOrigins: [process.env.FRONTEND_URL as string],

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await transporter.sendMail({
        to: user.email,
        from: process.env.MAIL_FROM,
        subject: "Notemy Email Verification",
        html: `Click <a href="${url}">here</a> to verify`,
      });
    },
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      redirectURI: process.env.GITHUB_CALLBACK_URI!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: process.env.GOOGLE_CALLBACK_URI!,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },
  plugins: [openAPI()],
});
