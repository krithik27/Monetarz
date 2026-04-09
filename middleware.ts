import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * EDGE SECURITY: Route Protection Middleware
 *
 * Prevents unauthenticated access to protected routes.
 * Uses Supabase session cookies for authentication.
 *
 * SECURITY FIX: The `monetarz_dev_mode` cookie bypass is now restricted
 * to local development (NODE_ENV=development) ONLY. In production this
 * cookie is ignored entirely, closing the authentication bypass vulnerability.
 */

const PROTECTED_ROUTES = ['/weekly', '/calendar', '/analytics', '/settings', '/admin', '/horizon'];

function isProtectedRoute(pathname: string): boolean {
    return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

function hasSupabaseSession(request: NextRequest): boolean {
    const allCookies = request.cookies.getAll();
    const sessionId = allCookies.some(c =>
        c.name.includes('-auth-token') ||
        c.name.includes('supabase-auth') ||
        c.name === 'sb-access-token'
    );
    return sessionId;
}

/**
 * Main Middleware
 */

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Root is ALWAYS public (it handles its own Landing vs App logic)
    if (pathname === '/') {
        return NextResponse.next();
    }

    if (!isProtectedRoute(pathname)) {
        return NextResponse.next();
    }

    if (hasSupabaseSession(request)) {
        return NextResponse.next();
    }

    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|fonts|images|sign-in).*)',
    ],
};
