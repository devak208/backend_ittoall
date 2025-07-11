import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../database/connection.js";
import * as schema from "../database/schemas/auth.js";
import { EmailService } from "../services/emailService.js";
import { eq } from "drizzle-orm";

const emailService = new EmailService();

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:5000",
    "http://127.0.0.1:3000",
    "http://192.168.90.56:3000", // Add this line
    process.env.FRONTEND_URL || "http://localhost:3000"
  ],
  database: drizzleAdapter(db, {
    provider: "pg", // postgresql
    schema: {
      user: schema.users,
      account: schema.accounts,
      session: schema.sessions,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url, token }) => {
      try {
        console.log(`Password reset requested for: ${user.email}`);
        
        // Create frontend reset URL
        const frontendResetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        
        // Send email with reset link
        const emailSent = await emailService.sendPasswordResetEmail(
          user.email,
          frontendResetUrl,
          token
        );
        
        if (emailSent) {
          console.log(`✅ Password reset email sent to: ${user.email}`);
        } else {
          console.error(`❌ Failed to send password reset email to: ${user.email}`);
        }
        
        return emailSent;
      } catch (error) {
        console.error('Error in password reset email sending:', error);
        return false;
      }
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    database: {
      generateId: () => {
        // Generate a simple UUID-like string
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      },
    },
  },
  // Optional: Add password validation
  plugins: [],
});
