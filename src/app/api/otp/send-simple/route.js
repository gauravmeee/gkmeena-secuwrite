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
    
    // Find the user_id for this email from the lock settings table
    const { data: lockSettings, error: lockError } = await supabase
      .from('user_lock_settings')
      .select('user_id')
      .eq('user_id', (await supabase.auth.getUser()).data?.user?.id)
      .single();

    // For now, we'll use a temporary approach - store the email and handle user lookup during reset
    const { error: otpError } = await supabase
      .from('otp_verification')
      .upsert({
        user_id: 'temp-' + Date.now(), // Temporary ID - will be resolved during reset
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

    // Return OTP for client-side email sending
    console.log(`OTP generated for ${email}: ${otp}`);
    
    // For development, also return the OTP in response
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        message: 'OTP generated. Please send email from client-side.',
        otp: otp,
        emailConfig: {
          serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
          templateId: process.env.NEXT_PUBLIC_EMAILJS_OTP_TEMPLATE_ID || process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
          publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'OTP generated. Please send email from client-side.',
      emailConfig: {
        serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
        templateId: process.env.NEXT_PUBLIC_EMAILJS_OTP_TEMPLATE_ID || process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
        publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
      }
    });

  } catch (error) {
    console.error('Error in OTP send API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
