import { supabase } from './supabase';

class OTPService {
  // Generate a 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP via email using Supabase Auth
  async sendOTP(email) {
    try {
      // Use Supabase's built-in password reset to send OTP
      // This will send a reset email with a token
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=password-reset`,
      });

      if (error) {
        console.error('Error sending OTP:', error);
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        message: 'OTP sent to your email address. Please check your inbox.' 
      };
    } catch (error) {
      console.error('Unexpected error sending OTP:', error);
      return { 
        success: false, 
        error: 'Failed to send OTP. Please try again.' 
      };
    }
  }

  // Verify OTP token from email
  async verifyOTP(token) {
    try {
      // Verify the token with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery'
      });

      if (error) {
        console.error('Error verifying OTP:', error);
        return { success: false, error: 'Invalid or expired OTP' };
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Unexpected error verifying OTP:', error);
      return { 
        success: false, 
        error: 'Failed to verify OTP. Please try again.' 
      };
    }
  }

  // Alternative method: Store OTP in database for verification
  async storeOTP(userId, email, otp) {
    try {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      
      const { data, error } = await supabase
        .from('otp_verification')
        .upsert({
          user_id: userId,
          email: email,
          otp: otp,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing OTP:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error storing OTP:', error);
      return { 
        success: false, 
        error: 'Failed to store OTP. Please try again.' 
      };
    }
  }

  // Verify stored OTP
  async verifyStoredOTP(userId, otp) {
    try {
      const { data, error } = await supabase
        .from('otp_verification')
        .select('*')
        .eq('user_id', userId)
        .eq('otp', otp)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Invalid or expired OTP' };
        }
        console.error('Error verifying stored OTP:', error);
        return { success: false, error: 'Failed to verify OTP' };
      }

      if (!data) {
        return { success: false, error: 'Invalid or expired OTP' };
      }

      // Delete the OTP after successful verification
      await supabase
        .from('otp_verification')
        .delete()
        .eq('user_id', userId);

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error verifying stored OTP:', error);
      return { 
        success: false, 
        error: 'Failed to verify OTP. Please try again.' 
      };
    }
  }

  // Send OTP via custom email service (if you have one)
  async sendCustomOTP(email, otp) {
    try {
      // This would integrate with your email service (SendGrid, AWS SES, etc.)
      // For now, we'll use a simple fetch to a custom API endpoint
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp: otp,
          subject: 'Password Reset OTP - Unseen Stories',
          template: 'password-reset'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to send OTP' };
      }

      return { success: true, message: 'OTP sent to your email address' };
    } catch (error) {
      console.error('Error sending custom OTP:', error);
      return { 
        success: false, 
        error: 'Failed to send OTP. Please try again.' 
      };
    }
  }
}

export default new OTPService();
