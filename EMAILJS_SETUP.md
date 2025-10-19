# EmailJS Setup Guide

This document explains how to configure EmailJS for the contact form API.

## Required Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# EmailJS Configuration
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_TEMPLATE_ID=your_template_id
EMAILJS_PUBLIC_KEY=your_public_key
EMAILJS_TO_EMAIL=jordanthij@gmail.com
```

## EmailJS Setup Steps

1. **Create an EmailJS Account**
   - Go to [https://www.emailjs.com/](https://www.emailjs.com/)
   - Sign up for a free account

2. **Create an Email Service**
   - In the EmailJS dashboard, go to "Email Services"
   - Add a new service (Gmail, Outlook, etc.)
   - Follow the setup instructions for your chosen email provider
   - Copy the Service ID and add it to `EMAILJS_SERVICE_ID`

3. **Create an Email Template**
   - Go to "Email Templates" in the EmailJS dashboard
   - Create a new template with the following variables:
     - `{{to_email}}` - Recipient email
     - `{{from_email}}` - Sender email
     - `{{subject}}` - Email subject
     - `{{inquiry_type}}` - Type of inquiry
     - `{{user_email}}` - User's email
     - `{{message}}` - User's message
     - `{{submission_id}}` - Database submission ID
     - `{{is_paid_user}}` - Whether user is paid (Yes/No)
     - `{{priority_level}}` - Priority level (PRIORITY/GENERAL)
   - Copy the Template ID and add it to `EMAILJS_TEMPLATE_ID`

4. **Get Your Public Key**
   - In the EmailJS dashboard, go to "Account" → "General"
   - Copy your Public Key and add it to `EMAILJS_PUBLIC_KEY`

5. **Configure Recipient Email**
   - Set `EMAILJS_TO_EMAIL` to the email address where you want to receive contact form submissions

## Template Example

Here's an example EmailJS template you can use:

**Subject:** `{{subject}}`

**Body:**
```
New Contact Form Submission

Priority Level: {{priority_level}}
User Email: {{user_email}}
Inquiry Type: {{inquiry_type}}
Subject: {{subject}}
Paid User: {{is_paid_user}}
Submission ID: {{submission_id}}

Message:
{{message}}

---
This message was sent from the MarkitMinder contact form.
```

## Testing

After setting up the environment variables, test the contact form to ensure emails are being sent successfully. Check the console logs for any EmailJS errors.

## Fallback Behavior

If EmailJS is not configured (missing environment variables), the contact form will still work but will only log the submission to the console instead of sending an email.
