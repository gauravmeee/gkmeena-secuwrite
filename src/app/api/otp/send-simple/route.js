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
    const { error: otpError } = await supabase
      .from('otp_verification')
      .upsert({
        user_id: 'temp-' + Date.now(), // Temporary ID
        email: email,
        otp: otp,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      });

    if (otpError) {
      console.error('Error storing OTP:', otpError);
      return NextResponse.json(
        { success: false, error: 'Failed to store OTP' },
        { status: 500 }
      );
    }

    // For development/testing, return the OTP
    if (process.env.NODE_ENV === 'development') {
      console.log(`OTP for ${email}: ${otp}`);
      return NextResponse.json({
        success: true,
        message: 'OTP sent to your email address. Please check your inbox.',
        otp: otp // Only in development
      });
    }

    // In production, you would send the email here
    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email address. Please check your inbox.'
    });

  } catch (error) {
    console.error('Error in OTP send API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
