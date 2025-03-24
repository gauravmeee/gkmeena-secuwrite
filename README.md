# My Journal Application

A versatile writing platform for all your creative needs - from daily journal entries to poems, stories, and inspirational quotes.

## Features

- **Diary Entries**: Create and manage daily diary entries with a beautiful lined paper design
- **Journal Entries**: Format your ideas with a rich text editor
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
   - Enable Row Level Security (RLS) for both tables
   - Create RLS policies to allow users to only access their own entries

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

## Authentication Flow

1. Users can sign up or log in using the authentication modal
   - Email/password authentication
   - Google OAuth
2. After successful authentication, users can create and manage their diary and journal entries
3. All entries are securely stored in the Supabase database
4. Users can only access their own entries through Row Level Security policies

## Deployment

This application can be easily deployed on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/your-username/my-journal)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
