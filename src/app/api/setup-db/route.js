import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST() {
  try {
    // Create the OTP verification table
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create OTP verification table for secure password reset
        CREATE TABLE IF NOT EXISTS otp_verification (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          otp TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_otp_verification_user_id ON otp_verification(user_id);
        CREATE INDEX IF NOT EXISTS idx_otp_verification_email ON otp_verification(email);
        CREATE INDEX IF NOT EXISTS idx_otp_verification_expires_at ON otp_verification(expires_at);

        -- Enable RLS (Row Level Security)
        ALTER TABLE otp_verification ENABLE ROW LEVEL SECURITY;

        -- Create policy to allow users to access OTP records
        CREATE POLICY "Users can access OTP records" ON otp_verification
          FOR ALL USING (true);

        -- Create policy to allow service role to manage OTP records
        CREATE POLICY "Service role can manage OTP records" ON otp_verification
          FOR ALL USING (auth.role() = 'service_role');
      `
    });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        hint: 'You need to run the SQL migration manually in Supabase dashboard'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Database table created successfully'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      hint: 'You need to run the SQL migration manually in Supabase dashboard'
    });
  }
}
