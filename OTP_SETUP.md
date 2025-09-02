# OTP-Based Password Reset Setup

This document explains how to set up the OTP (One-Time Password) based password reset feature for the diary lock system.

## Overview

The OTP-based password reset adds an extra layer of security by requiring email verification before allowing password changes. This prevents unauthorized users from resetting passwords even if they have access to the application.

## Features

- **Email Verification**: Users must verify their email address before resetting their password
- **6-Digit OTP**: Secure 6-digit verification code sent via email
- **Time-Limited**: OTP expires after 10 minutes
- **One-Time Use**: Each OTP can only be used once
- **Automatic Cleanup**: Expired OTPs are automatically removed

## Database Setup

### 1. Run the Migration

Execute the SQL migration to create the OTP verification table:

```sql
-- Run this in your Supabase SQL Editor
-- File: supabase/migrations/create_otp_verification.sql
```

### 2. Verify Table Creation

Check that the `otp_verification` table was created with the following structure:

- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `email` (TEXT)
- `otp` (TEXT)
- `expires_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

## API Endpoints

### 1. Send OTP
- **Endpoint**: `POST /api/otp/send`
- **Body**: `{ "email": "user@example.com" }`
- **Response**: `{ "success": true, "message": "OTP sent..." }`

### 2. Verify OTP
- **Endpoint**: `POST /api/otp/verify`
- **Body**: `{ "email": "user@example.com", "otp": "123456" }`
- **Response**: `{ "success": true, "userId": "uuid" }`

### 3. Reset Password
- **Endpoint**: `POST /api/otp/reset-password`
- **Body**: `{ "email": "user@example.com", "otp": "123456", "newPassword": "newpass" }`
- **Response**: `{ "success": true, "message": "Password reset successfully" }`

## User Flow

1. **User clicks "Change Password"** in the lock menu
2. **Email Verification**: User enters their email address (pre-filled if logged in)
3. **OTP Sent**: System sends a 6-digit code to the user's email
4. **OTP Entry**: User enters the 6-digit code from their email
5. **New Password**: User sets their new password
6. **Success**: Password is updated and user is redirected

## Security Features

- **Rate Limiting**: OTP requests are limited to prevent spam
- **Expiration**: OTPs expire after 10 minutes
- **Single Use**: Each OTP can only be used once
- **Email Validation**: Only registered users can request OTPs
- **Secure Storage**: OTPs are hashed and stored securely

## Environment Variables

Make sure these environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=your_site_url  # For email redirects
```

## Testing

### Development Mode
In development mode, the OTP is logged to the console for testing purposes.

### Production Mode
In production, OTPs are only sent via email and not logged.

## Troubleshooting

### Common Issues

1. **"User not found" error**
   - Ensure the user is registered in Supabase Auth
   - Check that the email matches the user's registered email

2. **"Failed to send OTP" error**
   - Check Supabase email settings
   - Verify SMTP configuration in Supabase
   - Check rate limiting settings

3. **"Invalid or expired OTP" error**
   - OTP may have expired (10-minute limit)
   - OTP may have already been used
   - Check system clock synchronization

### Database Issues

1. **Table doesn't exist**
   - Run the migration script
   - Check database permissions

2. **RLS (Row Level Security) issues**
   - Ensure policies are properly set up
   - Check user authentication status

## Customization

### Email Templates
You can customize the email templates in Supabase Auth settings or implement custom email sending.

### OTP Length
To change the OTP length, modify the `generateOTP()` function in `src/lib/otpService.js`.

### Expiration Time
To change the OTP expiration time, modify the expiration calculation in the API routes.

## Security Considerations

- **Never log OTPs in production**
- **Use HTTPS in production**
- **Implement rate limiting**
- **Monitor for suspicious activity**
- **Regular security audits**

## Support

For issues or questions about the OTP implementation, please check:
1. This documentation
2. Supabase documentation
3. Application logs
4. Database logs
