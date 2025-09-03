# EmailJS OTP Setup Guide

## Overview

The OTP (One-Time Password) feature for password reset now uses EmailJS to send verification codes via email. This guide explains how to set up EmailJS for OTP functionality.

## Required Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# EmailJS Configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_emailjs_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
NEXT_PUBLIC_EMAILJS_OTP_TEMPLATE_ID=your_otp_specific_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

## EmailJS Template Setup

### 1. Create an OTP Email Template

In your EmailJS dashboard, create a new email template with the following variables:

**Template Variables:**
- `{{to_email}}` - Recipient's email address
- `{{otp_code}}` - 6-digit verification code
- `{{app_name}}` - Application name (Secuwrite)
- `{{expiry_minutes}}` - OTP expiry time in minutes

### 2. Sample Email Template

**Subject:** Password Reset Verification Code - {{app_name}}

**Body:**
```
Hello,

You have requested to reset your password for {{app_name}}.

Your verification code is: {{otp_code}}

This code will expire in {{expiry_minutes}} minutes.

If you did not request this password reset, please ignore this email.

Best regards,
The {{app_name}} Team
```

### 3. Template Configuration

- **Template ID**: Use this as `NEXT_PUBLIC_EMAILJS_OTP_TEMPLATE_ID`
- **Service ID**: Your EmailJS service ID
- **Public Key**: Your EmailJS public key

## Testing

### Development Mode
In development mode, the OTP will be:
1. Sent via EmailJS (if configured)
2. Logged to console
3. **NOT returned in the API response by default** (emails are sent normally)

To enable development OTP display, add to your `.env.local`:
```bash
NEXT_PUBLIC_SHOW_OTP=true
```

### Production Mode
In production mode, the OTP will only be sent via email and not returned in the response.

## Troubleshooting

### Common Issues

1. **"Email service not configured" error**
   - Check that all EmailJS environment variables are set
   - Verify the values are correct in your EmailJS dashboard

2. **Email not received**
   - Check spam/junk folder
   - Verify email address is correct
   - Check EmailJS service status
   - Review EmailJS dashboard for delivery logs

3. **Template variables not working**
   - Ensure template variables match exactly: `{{to_email}}`, `{{otp_code}}`, etc.
   - Check template syntax in EmailJS dashboard

### Debug Mode

To debug email sending issues, check the browser console and server logs for:
- EmailJS configuration errors
- Template parameter mismatches
- Network connectivity issues

## Security Notes

- OTP codes expire after 10 minutes
- Each OTP can only be used once
- Failed verification attempts are logged
- Email addresses are validated before sending

## Fallback Behavior

If EmailJS fails to send the email:
- **Development**: OTP is still returned in response for testing
- **Production**: User receives an error message to try again
