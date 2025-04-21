# Unseen Stories Application

A versatile writing platform for all your creative needs - from daily journal entries to poems, stories, and inspirational quotes. Features end-to-end encryption to ensure your personal writings remain private and secure.

## Features

- **Diary Entries**: Create and manage daily diary entries with a beautiful lined paper design
- **Journal Entries**: Format your ideas with a rich text editor
- **End-to-End Encryption**: All your entries are encrypted before being stored
  - Client-side encryption ensures data privacy
  - Recovery key system for backup and device synchronization
  - Zero-knowledge encryption (server never sees unencrypted data)
- **User Authentication**: Secure login and signup powered by Supabase
  - Email/Password authentication
  - Google OAuth integration
- **Cloud Storage**: Your entries are securely stored in the cloud
- **Modern Design**: Clean, intuitive interface with responsive design

## Getting Started

### Prerequisites

- Node.js 14.x or later
- npm or yarn
- Supabase account (for authentication and database)
- Google Cloud Platform account (for Google OAuth)

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/my-journal.git
cd my-journal
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up Supabase
   - Create a new project on [Supabase](https://supabase.io)
   - Create the following tables in your Supabase database:
     - `diary_entries` with columns:
       - `id` (uuid, primary key)
       - `user_id` (uuid, foreign key to auth.users)
       - `title` (text)
       - `content` (text)
       - `date` (text)
       - `time` (text)
       - `has_manual_title` (boolean)
       - `created_at` (timestamp with timezone)
       - `updated_at` (timestamp with timezone)
     - `journal_entries` with columns:
       - `id` (uuid, primary key)
       - `user_id` (uuid, foreign key to auth.users)
       - `title` (text)
       - `content` (text)
       - `date` (text)
       - `created_at` (timestamp with timezone)
       - `updated_at` (timestamp with timezone)
     - `user_encryption_keys` with columns:
       - `id` (uuid, primary key)
       - `user_id` (uuid, foreign key to auth.users)
       - `encrypted_key` (text)
       - `created_at` (timestamp with timezone)
       - `updated_at` (timestamp with timezone)
   - Enable Row Level Security (RLS) for all tables
   - Create RLS policies to allow users to only access their own data

4. Set up Google OAuth
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth Client ID"
   - Select "Web application" as the application type
   - Add your domain to "Authorized JavaScript origins" (e.g., http://localhost:3000 for development)
   - Add your redirect URI to "Authorized redirect URIs". This should be:
     - `https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback` for Supabase
   - Save and copy your Client ID and Client Secret
   - In your Supabase dashboard, go to "Authentication" > "Providers"
   - Enable Google and paste your Client ID and Client Secret
   - Save the changes

5. Set up environment variables
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase URL and anon key to `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

6. Run the development server
```bash
npm run dev
# or
yarn dev
```

7. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result

## Security Features

### End-to-End Encryption

The application implements client-side encryption to ensure your data remains private:

1. **Key Generation**: Each user gets a unique encryption key when they first use the system
2. **Recovery System**: 
   - A recovery key is generated for backup purposes
   - The recovery key is shown to the user ONCE and must be saved securely
   - The encryption key is encrypted with the recovery key before being stored
3. **Multi-Device Support**:
   - Users can access their data from multiple devices using their recovery key
   - The encryption key is stored locally for convenience
4. **Zero-Knowledge Design**:
   - All encryption/decryption happens in the browser
   - The server never sees unencrypted data
   - Even if the database is compromised, the data remains secure

### Authentication Flow

1. Users can sign up or log in using the authentication modal
   - Email/password authentication
   - Google OAuth
2. After successful authentication:
   - New users get a new encryption key and recovery key
   - Existing users either:
     - Use their locally stored encryption key
     - Or recover their key using their recovery key
3. All entries are encrypted before being stored in the database
4. Users can only access their own entries through Row Level Security policies

## Deployment

This application can be easily deployed on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/your-username/my-journal)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
