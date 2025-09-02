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
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Get the actual user ID from auth.users by email
    // We'll use a different approach - get user from the current session
    // For now, we'll store the email and get user_id during password reset
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user || userData.user.email !== email) {
      return NextResponse.json(
        { success: false, error: 'User verification failed' },
        { status: 400 }
      );
    }

    // Update the OTP record with the actual user ID
    await supabase
      .from('otp_verification')
      .update({ user_id: userData.user.id })
      .eq('email', email)
      .eq('otp', otp);

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      userId: userData.user.id
    });

  } catch (error) {
    console.error('Error in OTP verify API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
