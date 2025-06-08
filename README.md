# Social Media Scheduler

A Next.js application for scheduling and managing posts across multiple social media platforms.

## Features

- Schedule posts for multiple social media platforms (Facebook, Instagram, Twitter, LinkedIn)
- Dashboard to view and manage scheduled posts
- Connect and manage social media accounts
- Automated posting via Supabase Edge Functions

## Setup

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Add these when you create your social media apps
# NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
# FACEBOOK_APP_SECRET=your_facebook_app_secret
```

4. Run the development server:

```bash
npm run dev
```

## Database Structure

The application uses the following tables in Supabase:

### `accounts`

Stores connected social media accounts:

- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to auth.users)
- `platform`: Text (facebook, instagram, twitter, linkedin)
- `access_token`: Text
- `refresh_token`: Text
- `expires_at`: Timestamp
- `created_at`: Timestamp
- `updated_at`: Timestamp

### `ads` (Scheduled Posts)

Stores scheduled posts:

- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to auth.users)
- `platform`: Text
- `content`: Text
- `media_url`: Text (optional)
- `schedule_at`: Timestamp
- `status`: Text (scheduled, published, failed)
- `posted_at`: Timestamp (optional)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### `logs`

Stores posting logs:

- `id`: UUID (primary key)
- `ad_id`: UUID (foreign key to ads)
- `platform`: Text
- `status`: Text (success, failed)
- `response`: JSONB
- `created_at`: Timestamp

## Edge Functions

The application uses Supabase Edge Functions to handle the posting of scheduled content:

### `post-scheduler`

Checks for scheduled posts that are due and posts them to the appropriate social media platforms.

### `cron-scheduler`

A function that can be triggered by a cron job to regularly check for and process scheduled posts.

## Connecting Social Media Accounts

To connect social media accounts, you need to:

1. Create developer accounts on each platform
2. Register your application
3. Configure OAuth settings
4. Add the appropriate API keys to your environment variables

## Troubleshooting

If you're unable to schedule posts, check the following:

1. Ensure your Supabase database has the correct tables (accounts, ads, logs)
2. Verify that the Edge Functions are deployed correctly
3. Check that you have connected at least one social media account
4. Ensure your environment variables are set correctly

## License

MIT
