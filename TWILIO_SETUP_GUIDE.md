# Twilio SMS Setup Guide

## Overview

Twilio SMS integration is already implemented in the system. Once you configure your Twilio credentials, the system will automatically send SMS notifications to customers who have opted in.

## What SMS Features Are Available

1. **Automatic Pickup Reminders** - When an order status changes to `ready_for_pickup`, SMS is automatically sent (if customer opted in)
2. **Status Update Notifications** - SMS sent for key status changes (`in_production`, `quality_check`, `completed`)
3. **Manual Pickup Reminders** - Staff can manually send pickup reminder SMS from the order detail page
4. **SMS Opt-In Page** - Public page at `/sms-opt-in` for customers to opt in to SMS notifications

## Setup Steps

### 1. Get Your Twilio Credentials

1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign in or create an account
3. From the dashboard, you'll see:
   - **Account SID** - Copy this
   - **Auth Token** - Click to reveal and copy
4. Go to **Phone Numbers** → **Manage** → **Active numbers**
5. If you don't have a number, click **Get a number** and purchase one
6. Copy your phone number (will be in format like `+16175551234`)

### 2. Add Environment Variables to Vercel

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables** and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `TWILIO_ACCOUNT_SID` | Your Account SID | From Twilio Console dashboard |
| `TWILIO_AUTH_TOKEN` | Your Auth Token | From Twilio Console (click to reveal) |
| `TWILIO_PHONE_NUMBER` | Your Twilio number | E.164 format: `+16175551234` |
| `PUBLIC_BASE_URL` | Your Vercel URL | e.g. `https://westroxburyframing.vercel.app` (no trailing slash) |

**Important:** 
- Add these to **Production** environment (and Preview if you want to test)
- After adding, **redeploy** your Vercel app for changes to take effect

### 3. Configure Twilio Phone Number Webhooks

1. Go to **Twilio Console → Phone Numbers → Manage → Active numbers**
2. Click on your phone number `(855) 359-5007`
3. Go to the **Configure** tab
4. Under **Messaging Configuration**:
   - **A message comes in:** Set to "Webhook"
   - **URL:** Enter `https://YOUR-VERCEL-URL.vercel.app/api/webhooks/twilio/sms`
     - Replace `YOUR-VERCEL-URL` with your actual Vercel domain
     - Example: `https://westroxburyframing.vercel.app/api/webhooks/twilio/sms`
   - **HTTP:** Select "HTTP POST"
   - **Primary handler fails:** Leave empty (or set to same URL)
5. Under **Voice Configuration** (optional - only if you use voice):
   - You can leave these as-is or set to empty if you're not using voice features
6. Click **Save configuration**

**Note:** The webhook endpoint handles incoming SMS messages (like "STOP" to unsubscribe). If you only send SMS and don't need to receive replies, you can leave the webhook empty, but it's recommended to set it up for compliance.

### 4. Test SMS Functionality

1. **Test the opt-in page:**
   - Visit `https://your-domain.com/sms-opt-in`
   - Enter a phone number and submit
   - Check your database to verify the customer record has `smsOptIn: true`

2. **Test automatic SMS:**
   - Create a test order with a customer who has opted in
   - Change the order status to `ready_for_pickup`
   - The customer should receive an SMS automatically

3. **Test manual pickup reminder:**
   - Go to an order detail page
   - Click "Send Pickup Reminder"
   - Both email and SMS will be sent (if customer opted in)

## How It Works

### Customer Opt-In

Customers must explicitly opt in to receive SMS. They can do this by:
- Visiting `/sms-opt-in` page
- Entering their phone number and/or email
- The system will find or create their customer record and mark `smsOptIn: true`

### Automatic SMS Triggers

SMS is automatically sent when:
- Order status changes to `ready_for_pickup` → Pickup reminder SMS
- Order status changes to `in_production` → Status update SMS
- Order status changes to `quality_check` → Status update SMS
- Order status changes to `completed` → Status update SMS

**Note:** SMS is only sent if:
1. Customer has a phone number on file
2. Customer has opted in (`smsOptIn: true`)
3. Twilio credentials are configured

### Manual SMS

Staff can manually send pickup reminders from:
- Order detail page → "Send Pickup Reminder" button
- Incomplete orders page → Individual order actions

## SMS Message Templates

### Pickup Reminder
```
Hi [Customer Name], your framing order [Order Number] is ready for pickup at West Roxbury Framing, 1741 Centre Street. Hours: Mon-Fri 10am-6pm, Sat 10am-4pm. Thank you!
```

### Status Updates
- **In Production:** "Hi [Name], your framing order [Order] status has been updated to: In Production. We're working on your order now!"
- **Quality Check:** "Hi [Name], your framing order [Order] status has been updated to: Quality Check. Your order is being quality checked before final assembly."
- **Completed:** "Hi [Name], your framing order [Order] status has been updated to: Completed. Your order is complete and ready for pickup!"

## Troubleshooting

### SMS Not Sending

1. **Check environment variables:**
   - Verify all three Twilio variables are set in Vercel
   - Make sure you redeployed after adding them

2. **Check customer opt-in:**
   - Verify customer has `smsOptIn: true` in database
   - Check that customer has a phone number

3. **Check Twilio console:**
   - Go to Twilio Console → Monitor → Logs → Messaging
   - Look for any error messages
   - Check if your account has sufficient credits

4. **Check application logs:**
   - Look for "SMS not configured" warnings (means env vars missing)
   - Look for "SMS: Customer has not opted in" (means opt-in required)

### Common Issues

**"SMS not configured"**
- One or more Twilio environment variables are missing
- Add all three variables to Vercel and redeploy

**"Customer has not opted in"**
- Customer needs to visit `/sms-opt-in` and opt in
- Or manually set `smsOptIn: true` in database

**"Invalid phone number format"**
- Phone numbers must be in E.164 format: `+16175551234`
- The system auto-formats US numbers, but international numbers need the `+` prefix

**SMS sent but not received**
- Check Twilio Console → Logs for delivery status
- Verify phone number is correct
- Check if number is on a DNC (Do Not Call) list in Twilio

## Compliance

**Important:** SMS compliance requirements:
- Customers must explicitly opt in before receiving SMS
- The `/sms-opt-in` page serves as proof of consent
- Customers can opt out by contacting you (you can manually set `smsOptIn: false` in database)
- Include opt-out instructions in SMS messages (optional but recommended)

## Cost Considerations

- Twilio charges per SMS sent (typically $0.0075 - $0.01 per message in US)
- Monitor usage in Twilio Console → Usage
- Set up billing alerts in Twilio Console → Billing

## Next Steps

Once Twilio is configured:
1. ✅ Test with a real order
2. ✅ Share the opt-in page URL with customers: `https://your-domain.com/sms-opt-in`
3. ✅ Monitor SMS delivery in Twilio Console
4. ✅ Consider adding opt-in checkbox to order intake form (future enhancement)
