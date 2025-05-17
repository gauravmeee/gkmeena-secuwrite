-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own encryption key" ON user_encryption_keys;
DROP POLICY IF EXISTS "Users can insert/update their own encryption key" ON user_encryption_keys;

-- Enable RLS
ALTER TABLE user_encryption_keys ENABLE ROW LEVEL SECURITY;

-- Create policies with enhanced permissions
CREATE POLICY "Users can read their own encryption key"
    ON user_encryption_keys
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update their own encryption key"
    ON user_encryption_keys
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own encryption key"
    ON user_encryption_keys
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT ALL ON user_encryption_keys TO authenticated;

-- Verify policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_encryption_keys'; 