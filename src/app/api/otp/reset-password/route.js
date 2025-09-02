import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { sha256 } from 'js-sha256';

export async function POST(request) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Email, OTP, and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 4 characters' },
        { status: 400 }
      );
    }

    // First verify the OTP
    const { data: otpData, error: otpError } = await supabase
      .from('otp_verification')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (otpError || !otpData) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Get the current user to verify they match the email
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user || userData.user.email !== email) {
      return NextResponse.json(
        { success: false, error: 'User verification failed' },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = sha256(newPassword);

    // Update the lock password in user_lock_settings
    const { data: lockData, error: lockError } = await supabase
      .from('user_lock_settings')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userData.user.id)
      .select()
      .single();

    if (lockError) {
      console.error('Error updating lock password:', lockError);
      return NextResponse.json(
        { success: false, error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Delete the OTP after successful password reset
    await supabase
      .from('otp_verification')
      .delete()
      .eq('email', email);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Error in reset password API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
