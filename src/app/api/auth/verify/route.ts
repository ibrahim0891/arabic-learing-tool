import { NextRequest, NextResponse } from 'next/server';

const APP_PASSCODE = 'kazimuhammadibrahim5033';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passcode } = body;

    if (!passcode || typeof passcode !== 'string') {
      return NextResponse.json({ success: false, error: 'Passcode is required' }, { status: 400 });
    }

    if (passcode.trim() === APP_PASSCODE) {
      const response = NextResponse.json({ success: true, message: 'Access granted' });
      // Set an HTTP-only secure cookie valid for 365 days
      response.cookies.set('fasih_auth', APP_PASSCODE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ success: false, error: 'Incorrect passcode. Access denied.' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error during authentication' }, { status: 500 });
  }
}
