import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * FUTURE-PROOFING: Plan Gating
 * Stub function to check user subscription plan.
 */
async function checkUserPlan(userId: string): Promise<string> {
    return 'free';
}

/**
 * PROXY (Next.js 16 Request Interception)
 * 
 * Replaces the deprecated middleware.ts convention.
 * Handles authentication gating and session refreshing.
 */
export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // This will refresh session if expired - required for Server Components
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // PUBLIC ROUTES: Accessible without authentication
    const publicRoutes = [
        '/',
        '/sign-in',
        '/login',
        '/signup',
        '/pricing',
        '/reset-password',
        '/favicon.ico',
    ];

    const isPublicRoute = publicRoutes.some(route => pathname === route) ||
        pathname.startsWith('/api/public/') ||
        pathname.startsWith('/api/razorpay/webhook') ||
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/images/');

    // PROTECT PRIVATE ROUTES
    if (!user && !isPublicRoute) {
        const url = new URL('/sign-in', request.url);
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    // AUTHENTICATED USER: Redirect away from auth pages to dashboard
    if (user && (pathname === '/sign-in' || pathname === '/login' || pathname === '/signup')) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // FUTURE-PROOF: Add plan to response headers if user exists
    if (user) {
        const plan = await checkUserPlan(user.id);
        response.headers.set('x-user-plan', plan);
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
