import { describe, it, expect, vi, beforeEach } from 'vitest';
import { proxy } from '../proxy';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Mock Supabase SSR Client
vi.mock('@supabase/ssr', () => ({
    createServerClient: vi.fn(),
}));

// Mock Next.js Response
vi.mock('next/server', async () => {
    const actual = await vi.importActual('next/server');
    return {
        ...actual as any,
        NextResponse: {
            next: vi.fn(() => ({
                headers: { set: vi.fn() },
                cookies: { set: vi.fn() },
            })),
            redirect: vi.fn((url) => ({ url, status: 302 })),
        },
    };
});

describe('Auth Middleware (@supabase/ssr)', () => {
    const mockGetUser = vi.fn();
    const mockSupabase = {
        auth: {
            getUser: mockGetUser,
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (createServerClient as any).mockReturnValue(mockSupabase);
        // Mock env vars for tests
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key';
    });

    it('should redirect unauthenticated users to /sign-in for private routes', async () => {
        // Setup: No user
        mockGetUser.mockResolvedValue({ data: { user: null } });

        // Request to a private route
        const req = new NextRequest(new URL('http://localhost:3000/settings'));
        await proxy(req);

        expect(NextResponse.redirect).toHaveBeenCalled();
        const redirectUrl = (NextResponse.redirect as any).mock.calls[0][0];
        expect(redirectUrl.pathname).toBe('/sign-in');
        expect(redirectUrl.searchParams.get('redirect')).toBe('/settings');
    });

    it('should allow access to public routes even without a user', async () => {
        // Setup: No user
        mockGetUser.mockResolvedValue({ data: { user: null } });

        // Request to a public route (homepage)
        const req = new NextRequest(new URL('http://localhost:3000/'));
        await proxy(req);

        expect(NextResponse.next).toHaveBeenCalled();
        expect(NextResponse.redirect).not.toHaveBeenCalled();
    });

    it('should allow authenticated users to access private routes', async () => {
        // Setup: Active user
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

        // Request to a private route
        const req = new NextRequest(new URL('http://localhost:3000/analytics'));
        await proxy(req);

        expect(NextResponse.next).toHaveBeenCalled();
        expect(NextResponse.redirect).not.toHaveBeenCalled();
    });

    it('should redirect authenticated users away from sign-in to home', async () => {
        // Setup: Active user
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

        // Request to sign-in page
        const req = new NextRequest(new URL('http://localhost:3000/sign-in'));
        await proxy(req);

        expect(NextResponse.redirect).toHaveBeenCalled();
        const redirectUrl = (NextResponse.redirect as any).mock.calls[0][0];
        expect(redirectUrl.pathname).toBe('/');
    });

    it('should add the user plan to headers for authenticated requests', async () => {
        // Setup: Active user
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

        const req = new NextRequest(new URL('http://localhost:3000/analytics'));
        const res = await proxy(req);

        // Verify that x-user-plan header was set on the response
        expect(res.headers.set).toHaveBeenCalledWith('x-user-plan', 'free');
    });
});
