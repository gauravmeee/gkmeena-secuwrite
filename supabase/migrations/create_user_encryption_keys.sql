-- Create a table for storing user encryption keys
CREATE TABLE IF NOT EXISTS user_encryption_keys (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    key_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE user_encryption_keys ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read only their own key
CREATE POLICY "Users can read their own encryption key"
    ON user_encryption_keys
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy to allow users to insert/update their own key
CREATE POLICY "Users can insert/update their own encryption key"
    ON user_encryption_keys
    FOR ALL
    USING (auth.uid() = user_id);

-- Create an index on user_id
CREATE INDEX IF NOT EXISTS idx_user_encryption_keys_user_id ON user_encryption_keys(user_id); 