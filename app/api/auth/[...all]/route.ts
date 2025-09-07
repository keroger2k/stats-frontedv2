import { NextRequest } from "next/server";

// Ensure Node.js runtime for MongoDB compatibility
export const runtime = 'nodejs';

export const GET = async (request: NextRequest) => {
  try {
    const { auth } = await import("@/lib/auth");
    return auth.handler(request);
  } catch (error) {
    console.error('Auth error:', error);
    return Response.json({ error: 'Authentication service unavailable' }, { status: 500 });
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const { auth } = await import("@/lib/auth");
    return auth.handler(request);
  } catch (error) {
    console.error('Auth error:', error);
    return Response.json({ error: 'Authentication service unavailable' }, { status: 500 });
  }
};