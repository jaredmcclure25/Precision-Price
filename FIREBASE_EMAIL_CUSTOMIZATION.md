# Customizing Firebase Password Reset Email

The password reset email is currently showing the default Firebase template with "project-1019654984116" which looks robotic. Here's how to customize it:

## Steps to Customize

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `precision-prices` (project-1019654984116)

2. **Navigate to Email Templates**
   - Click **Authentication** in the left sidebar
   - Click the **Templates** tab at the top
   - Select **Password reset** from the list

3. **Customize the Email Template**

   Replace the template with this friendly version:

   **Subject:**
   ```
   Reset your Precision Prices password
   ```

   **Email body:**
   ```
   Hi there,

   We received a request to reset your Precision Prices password for %EMAIL%.

   Click the link below to choose a new password:
   %LINK%

   This link will expire in 1 hour for security reasons.

   If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

   Happy pricing! 🎯

   The Precision Prices Team
   https://precisionprices.com
   ```

4. **Customize the Sender Name** (Optional but recommended)
   - Scroll down to **Sender name**
   - Change from "project-1019654984116" to: `Precision Prices`
   - This makes the email appear as from "Precision Prices" instead of the project ID

5. **Update the Reply-To Email** (Optional)
   - Scroll down to **Reply-to email**
   - Set to: `contact@precisionprices.com`
   - This allows users to reply if they have questions

6. **Save Changes**
   - Click **Save** button at the top right

## Additional Customization (Advanced)

### Customize the Action Page
Firebase hosts the password reset form. To customize it:

1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Make sure `precisionprices.com` is listed
3. The reset form will use Firebase's default styling

### Avoid Spam Folder

To improve email deliverability:

1. **Set up a custom email domain** (Advanced - requires domain verification)
   - Go to **Authentication** → **Templates** → **SMTP settings**
   - This requires setting up SMTP with your domain
   - Recommended: Use SendGrid, Mailgun, or AWS SES

2. **For now** (easier option):
   - The customized template above should help
   - Firebase emails from `noreply@precisionprices.firebaseapp.com` may still go to spam
   - Ask users to check spam folder if they don't see the email

## Testing

After making changes:
1. Go to your site
2. Click "Forgot password?"
3. Enter your test email
4. Check the email (and spam folder)
5. Verify the email looks friendly and professional

## Result

Users will now receive:
- Subject: "Reset your Precision Prices password"
- From: "Precision Prices" (instead of project ID)
- Friendly, professional message
- Clear call-to-action
- After reset, they'll be redirected to https://precisionprices.com/
