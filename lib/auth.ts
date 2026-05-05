/**
 * Auth helpers — wraps NextAuth session with Sui address
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export interface AuthUser {
  address: string;
  email?: string;
  name?: string;
  image?: string;
}

/**
 * Gets the authenticated user from the server session.
 * Returns null if not authenticated.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;

    const address = (session.user as { address?: string }).address;
    if (!address) return null;

    return {
      address,
      email: session.user.email ?? undefined,
      name: session.user.name ?? undefined,
      image: session.user.image ?? undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Requires authentication — throws 401 if not authenticated.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}
