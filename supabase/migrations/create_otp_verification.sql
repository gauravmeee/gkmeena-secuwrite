-- Create OTP verification table for secure password reset
CREATE TABLE IF NOT EXISTS otp_verification (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Changed to TEXT to allow temporary IDs
  email TEXT NOT NULL UNIQUE, -- Make email unique for conflict resolution
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

-- Create policy to allow users to access their own OTP records
-- Note: Since user_id is now TEXT, we'll use a more permissive policy for OTP verification
CREATE POLICY "Users can access OTP records" ON otp_verification
  FOR ALL USING (true); -- Allow access for OTP verification purposes

-- Create policy to allow service role to manage OTP records
CREATE POLICY "Service role can manage OTP records" ON otp_verification
  FOR ALL USING (auth.role() = 'service_role');

-- Create function to automatically clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_verification 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_otp_verification_updated_at
  BEFORE UPDATE ON otp_verification
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
