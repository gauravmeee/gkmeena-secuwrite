import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Verify OTP from database
    const { data, error } = await supabase
      .from('otp_verification')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      console.error('OTP verification failed:', { error, data, email, otp });
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    console.log('OTP verification successful:', { email, otp });

    // OTP is valid, return success
    // We don't need to verify the user session here since this is for password reset
    // The user will be verified during the actual password reset step
    
    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      email: email
    });

  } catch (error) {
    console.error('Error in OTP verify API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
