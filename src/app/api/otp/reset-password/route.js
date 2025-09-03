import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sha256 } from 'js-sha256';

export async function POST(request) {
  try {
    const { email, otp, newPassword, userId } = await request.json();
    
    // Get the authorization token from the request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }
    
    // Create authenticated Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    if (!email || !otp || !newPassword || !userId) {
      return NextResponse.json(
        { success: false, error: 'Email, OTP, new password, and user ID are required' },
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

    // Use the userId passed from the client
    console.log('Resetting lock password for user:', userId, 'email:', email);

    // Hash the new password
    const passwordHash = sha256(newPassword);

    // Try to update existing lock settings first
    const { data: existingLock, error: updateError } = await supabase
      .from('user_lock_settings')
      .update({
        password_hash: passwordHash,
        has_password: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    let lockData = existingLock;
    let lockError = updateError;

    // If update failed (no existing record), try to insert
    if (updateError && updateError.code === 'PGRST116') {
      const { data: newLock, error: insertError } = await supabase
        .from('user_lock_settings')
        .insert({
          user_id: userId,
          password_hash: passwordHash,
          has_password: true,
          lock_journal: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      lockData = newLock;
      lockError = insertError;
    }

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
