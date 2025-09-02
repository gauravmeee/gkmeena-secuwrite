import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in database with expiration (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    // Store OTP in otp_verification table
    // We'll use a temporary user_id for now and validate the email exists when verifying
    const { error: otpError } = await supabase
      .from('otp_verification')
      .upsert({
        user_id: 'temp-' + Date.now(), // Temporary ID, will be updated during verification
        email: email,
        otp: otp,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'email' // Use email as the conflict resolution key
      });

    if (otpError) {
      console.error('Error storing OTP:', otpError);
      return NextResponse.json(
        { success: false, error: 'Failed to store OTP' },
        { status: 500 }
      );
    }

    // Send email using Supabase Auth (this will send a password reset email)
    // The user will receive an email with a reset link
    const { error: emailError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?type=password-reset`,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      return NextResponse.json(
        { success: false, error: 'Failed to send OTP email' },
        { status: 500 }
      );
    }

    // For development/testing, you might want to return the OTP
    // Remove this in production!
    if (process.env.NODE_ENV === 'development') {
      console.log(`OTP for ${email}: ${otp}`);
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email address. Please check your inbox.',
      // Don't return OTP in production
      ...(process.env.NODE_ENV === 'development' && { otp })
    });

  } catch (error) {
    console.error('Error in OTP send API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
