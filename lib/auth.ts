import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

let authInstance: any = null;

export const auth = (() => {
  if (authInstance) return authInstance;
  
  // Only initialize on server side
  if (typeof window === 'undefined') {
    const { MongoClient } = require("mongodb");
    const client = new MongoClient(process.env.MONGODB_URI!);
    const db = client.db();

    authInstance = betterAuth({
      database: mongodbAdapter(db),
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
      },
      secret: process.env.BETTER_AUTH_SECRET!,
      baseURL: process.env.BETTER_AUTH_URL!,
    });
  }
  
  return authInstance;
})();