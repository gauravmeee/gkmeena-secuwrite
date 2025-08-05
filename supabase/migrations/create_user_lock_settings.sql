-- Create user_lock_settings table
CREATE TABLE IF NOT EXISTS user_lock_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  has_password BOOLEAN DEFAULT FALSE,
  password_hash TEXT, -- Store hashed password, not plain text
  lock_journal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_lock_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own lock settings" ON user_lock_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lock settings" ON user_lock_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lock settings" ON user_lock_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lock settings" ON user_lock_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_user_lock_settings_updated_at 
  BEFORE UPDATE ON user_lock_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 