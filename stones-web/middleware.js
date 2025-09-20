import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('fb_token')?.value;

  // In development, be more lenient with auth
  const isDev = process.env.NODE_ENV === 'development';
  
  // We won't verify token server-side here (no admin in middleware), just presence check.
  // For stricter checks, call an internal verification endpoint or use Next 15 server APIs.
  const isAuthenticated = Boolean(token) || (isDev && pathname.startsWith('/ask_doc'));
  // If you encode role/claims in custom token, you can parse it at the edge if needed.
  const userType = 'patient';

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/about',
    '/(auth)/login',
    '/(auth)/register', 
    '/(auth)/forgot-password',
    '/api/auth/login',
    '/api/auth/register'
  ];

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );

  // If user is not authenticated and trying to access protected route
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL('/(auth)/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated but accessing wrong dashboard
  if (isAuthenticated) {
    if (pathname.startsWith('/patient') && userType !== 'patient') {
      return NextResponse.redirect(new URL('/doctor', request.url));
    }
    if (pathname.startsWith('/doctor') && userType !== 'doctor') {
      return NextResponse.redirect(new URL('/patient', request.url));
    }
  }

  // Continue with the request
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};