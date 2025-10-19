# Contact Form API Setup Guide

## Overview
The contact form API has been set up to receive form submissions and send email notifications. Here's how to configure it:

## 1. Database Setup

Run the SQL script to create the contact_submissions table:

```sql
-- Execute the contents of database/contact_submissions.sql in your Supabase SQL editor
```

## 2. Email Service Configuration

Choose one of the following email services and add the required environment variables:

### Option 1: Resend (Recommended)
1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add to your `.env.local`:
```
RESEND_API_KEY=re_your_api_key_here
```

### Option 2: SMTP (Gmail/Other)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password
3. Add to your `.env.local`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@yourdomain.com
```

### Option 3: SendGrid
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Get your API key
3. Add to your `.env.local`:
```
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM=noreply@yourdomain.com
```

## 3. API Endpoint

The contact form API is available at:
```
POST /api/contact
```

### Request Body:
```json
{
  "subject": "Contact form subject",
  "message": "User's message",
  "type": "general|technical|billing|feature|bug"
}
```

### Response:
```json
{
  "success": true,
  "message": "Contact form submitted successfully",
  "submissionId": "uuid"
}
```

## 4. Features

### Database Storage
- All submissions are stored in the `contact_submissions` table
- Includes user information, subscription status, and timestamps
- Row Level Security (RLS) ensures users can only see their own submissions

### Email Notifications
- Automatic email notifications sent to `jordanthij@gmail.com`
- Priority labeling for paid users: `[PRIORITY]` vs `[GENERAL]`
- Includes all form data and user information

### User Experience
- Real-time form validation
- Loading states and success/error messages
- Form reset after successful submission

## 5. Testing

1. Fill out the contact form on the account page
2. Check your email for the notification
3. Verify the submission appears in the database

## 6. Admin Features (Future)

You can extend this by:
- Creating an admin dashboard to view all submissions
- Adding status updates and admin notes
- Implementing email responses to users

## Troubleshooting

### No emails received?
1. Check your environment variables are set correctly
2. Verify your email service API key is valid
3. Check the server logs for email errors
4. Ensure your email service allows sending to your target email

### Database errors?
1. Make sure the `contact_submissions` table exists
2. Verify RLS policies are set up correctly
3. Check that the user is authenticated

### Form submission errors?
1. Check browser console for JavaScript errors
2. Verify the API endpoint is accessible
3. Ensure all required fields are filled
