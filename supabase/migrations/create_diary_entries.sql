-- Create diary_entries table
CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT, -- Encrypted title
  content TEXT, -- Encrypted content
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  has_manual_title BOOLEAN DEFAULT FALSE,
  entry_type TEXT DEFAULT 'text' CHECK (entry_type IN ('text', 'image')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own diary entries" ON diary_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diary entries" ON diary_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diary entries" ON diary_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diary entries" ON diary_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_id ON diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_created_at ON diary_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diary_entries_entry_type ON diary_entries(entry_type);

-- Create trigger for updated_at
CREATE TRIGGER update_diary_entries_updated_at 
  BEFORE UPDATE ON diary_entries 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 