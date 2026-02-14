# GarageAlert — Local Testing Guide
## Step-by-step for complete beginners

> This guide gets you from zero to running the app on your own computer.
> Each step has a ✅ checkbox — tick them off as you go.

---

## PHASE 1: Install the Tools (One-Time Setup — ~20 minutes)

### Step 1: Install Node.js

Node.js is the engine that runs your app. Think of it like installing Microsoft Office before you can use Word.

1. Go to **https://nodejs.org**
2. Click the big green **"LTS"** download button (NOT "Current")
3. Run the installer — click Next through everything, accept defaults
4. **Verify it worked:** Open your terminal:
   - **Windows:** Press `Win + R`, type `cmd`, press Enter
   - **Mac:** Open Spotlight (Cmd + Space), type `Terminal`, press Enter
5. Type this and press Enter:
   ```
   node --version
   ```
6. You should see something like `v20.11.0` — any number 18+ is fine

✅ Node.js installed

### Step 2: Install VS Code (Your Code Editor)

1. Go to **https://code.visualstudio.com**
2. Download and install
3. Open it once installed
4. Click the **Extensions** icon on the left sidebar (looks like 4 squares)
5. Search for and install these extensions:
   - **Tailwind CSS IntelliSense** (by Tailwind Labs)
   - **ESLint** (by Microsoft)

✅ VS Code installed with extensions

### Step 3: Install Git

1. Go to **https://git-scm.com/downloads**
2. Download for your system and install (accept all defaults)
3. Verify: `git --version` in terminal

✅ Git installed

---

## PHASE 2: Create Your Online Accounts (~15 minutes)

You need free accounts on these services. You won't pay anything yet.

### Step 4: Create a Supabase Account

1. Go to **https://supabase.com** → click **Start your project**
2. Sign up with GitHub or email
3. Click **New Project**
4. Fill in:
   - **Organisation:** Create one (e.g., your name)
   - **Project name:** `garagealert`
   - **Database password:** Use a strong password → **SAVE THIS SOMEWHERE SAFE**
   - **Region:** Select **West EU (London)**
5. Click **Create new project** — wait 2-3 minutes

✅ Supabase project created

### Step 5: Get Your Supabase Keys

1. In your Supabase project → click **Settings** (gear icon, bottom left)
2. Click **API** in the sidebar
3. Copy and save these values somewhere:
   - **Project URL** (looks like `https://abcdefg.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (another long string — KEEP THIS SECRET)

✅ Supabase keys saved

### Step 6: Create a Stripe Account

1. Go to **https://dashboard.stripe.com/register**
2. Sign up with email
3. You'll start in **Test Mode** (orange "Test mode" badge in top-right) — stay there
4. Go to **Developers → API Keys**
5. Copy:
   - **Publishable key** (`pk_test_...`)
   - **Secret key** (`sk_test_...`) — click "Reveal" first

✅ Stripe account created, keys saved

### Step 7: Create a Twilio Account (Optional for First Test)

> You can skip Twilio initially and just test the UI. Come back to this when you're ready to test actual SMS sending.

1. Go to **https://www.twilio.com/try-twilio**
2. Sign up and verify your phone number
3. Copy your **Account SID** and **Auth Token** from the dashboard
4. Buy a UK phone number (Phone Numbers → Buy a Number → search UK)

✅ Twilio account created (or skipped for now)

---

## PHASE 3: Set Up the Project (~10 minutes)

### Step 8: Download and Open the Project

1. Download the `garagealert-starter.tar.gz` file from this chat
2. Extract it to a folder you'll remember (e.g., `Documents/garagealert`)
   - **Windows:** Right-click → Extract All
   - **Mac:** Double-click the file
3. Open **VS Code**
4. Click **File → Open Folder** → navigate to the `garagealert` folder → Open

You should see all the project files in the left sidebar.

✅ Project open in VS Code

### Step 9: Create Your Environment File

1. In VS Code, look at the left sidebar — find the file `.env.local.example`
2. Right-click it → **Copy**
3. Right-click in the file list → **Paste** 
4. Rename the pasted file to `.env.local` (remove the `.example` part)
5. Open `.env.local` and fill in your real values:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-ACTUAL-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...YOUR-ACTUAL-ANON-KEY
SUPABASE_SERVICE_ROLE_KEY=eyJ...YOUR-ACTUAL-SERVICE-ROLE-KEY
```

For now, you can leave Twilio, Postmark, and Stripe keys as the placeholder values. The app will still run — it just won't send actual messages or process payments until you add real keys.

Set the `CRON_SECRET` to any random string, like: `my-secret-cron-key-12345`

✅ `.env.local` created with Supabase keys

### Step 10: Set Up the Database

1. Go to your **Supabase project** in the browser
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Open the file `supabase-setup.sql` from your project (it's in the root folder)
5. Copy the **ENTIRE** contents of that file
6. Paste it into the Supabase SQL Editor
7. Click the green **Run** button (or press Ctrl+Enter)
8. You should see "Success. No rows returned" — that's correct!
9. Verify: Click **Table Editor** in the left sidebar — you should see all your tables listed (garages, customers, vehicles, etc.)

✅ Database tables created

### Step 11: Configure Supabase Auth

1. In Supabase, go to **Authentication** → **URL Configuration**
2. Set:
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:** Add `http://localhost:3000/auth/callback`
3. Go to **Authentication** → **Providers**
4. Make sure **Email** is enabled (it should be by default)
5. **IMPORTANT for testing:** Go to **Authentication** → **Email Templates** → look for "Confirm signup". For local testing, you may want to disable email confirmation:
   - Go to **Authentication** → **Settings**
   - Under "Email Auth", toggle OFF "Enable email confirmations" (just for testing — turn it back on before going live)

✅ Auth configured

### Step 12: Install Dependencies and Start the App

1. In VS Code, open the terminal: **View → Terminal** (or press `` Ctrl+` ``)
2. Make sure you're in the `garagealert` folder (the terminal should show the path)
3. Run this command:
   ```
   npm install
   ```
   This downloads all the code libraries. It takes 1-2 minutes. You'll see a progress bar and lots of text — that's normal. Wait until it finishes.
4. Now start the app:
   ```
   npm run dev
   ```
5. You should see something like:
   ```
   ▲ Next.js 14.2.20
   - Local: http://localhost:3000
   ```

✅ App running locally!

---

## PHASE 4: Test It! (~10 minutes)

### Step 13: Open the App

1. Open your web browser (Chrome recommended)
2. Go to **http://localhost:3000**
3. You should be redirected to the **login page** with the GarageAlert logo

✅ Login page loads

### Step 14: Create Your First Account

1. Click **"Start free trial"** (the register link)
2. Fill in:
   - **Garage name:** `Test Garage`
   - **Email:** Use a real email you can check
   - **Password:** At least 6 characters
3. Click **Create Account**
4. If you disabled email confirmation (Step 11): You should be redirected to login
5. Sign in with your email and password
6. You should see the **Dashboard**!

✅ Account created and dashboard visible

### Step 15: Add a Test Customer

1. Click **"Add Customer"** button on the dashboard (or click "Customers" in sidebar)
2. Fill in:
   - **First name:** `John`
   - **Last name:** `Smith`
   - **Mobile:** `07700 900000` (fake test number)
   - **Email:** `john@test.com`
   - **Preferred channel:** SMS
   - **Consent:** Leave all three ticked
3. Click **Add Customer**
4. You should see John Smith's customer detail page

✅ Customer created

### Step 16: Add a Test Vehicle

To add a vehicle, you'll need to do it directly in Supabase for now (we'll add a UI form in the next iteration):

1. Go to **Supabase → Table Editor → vehicles**
2. Click **Insert row**
3. Fill in:
   - **customer_id:** Copy John Smith's ID from the customers table
   - **garage_id:** Copy your garage's ID from the garages table
   - **registration:** `AB12 CDE`
   - **make:** `Ford`
   - **model:** `Focus`
   - **mot_due_date:** Set to a date 30 days from today
   - **mot_reminder_enabled:** true
4. Click **Save**

✅ Vehicle created with MOT due date

### Step 17: Check the Dashboard

1. Go back to **http://localhost:3000/dashboard**
2. You should see:
   - Customers: **1**
   - Vehicles: **1**
   - The MOT due date in the "MOTs Due Soon" panel

✅ Dashboard shows your test data

### Step 18: Test the Cron Job Locally (Optional)

To test if reminders would be generated:

1. Open a new browser tab
2. Go to: `http://localhost:3000/api/cron/generate-reminders`
3. You'll see `{"error":"Unauthorized"}` — that's correct! It needs the secret.
4. To test it properly, you can use your browser's developer tools or a tool like **curl**:
   ```
   curl -H "Authorization: Bearer my-secret-cron-key-12345" http://localhost:3000/api/cron/generate-reminders
   ```
   (Replace `my-secret-cron-key-12345` with whatever you set in `.env.local`)

✅ Cron endpoint responds

---

## PHASE 5: Set Up Stripe for Testing (~15 minutes)

### Step 19: Create Products in Stripe

1. Go to **https://dashboard.stripe.com** (make sure you're in Test Mode)
2. Go to **Products → Add product**
3. Create 3 products:

**Product 1:**
- Name: `Starter`
- Add price: £29/month (recurring, monthly)
- Add another price: £290/year (recurring, yearly)
- Save

**Product 2:**
- Name: `Growth`
- Prices: £59/month and £590/year

**Product 3:**
- Name: `Pro`
- Prices: £99/month and £990/year

4. For each price you created, click on it and copy the **Price ID** (starts with `price_`)
5. Add these to your `.env.local`:
   ```
   STRIPE_PRICE_STARTER_MONTHLY=price_xxxxx
   STRIPE_PRICE_STARTER_YEARLY=price_xxxxx
   STRIPE_PRICE_GROWTH_MONTHLY=price_xxxxx
   STRIPE_PRICE_GROWTH_YEARLY=price_xxxxx
   STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
   STRIPE_PRICE_PRO_YEARLY=price_xxxxx
   ```
6. Restart your app (press `Ctrl+C` in the terminal, then `npm run dev` again)

✅ Stripe products created

### Step 20: Test Stripe Checkout

1. Go to **http://localhost:3000/settings/billing**
2. Click **"Get Started"** on any plan
3. You should be redirected to a **Stripe Checkout page**
4. Use the test card number: **4242 4242 4242 4242**
   - Expiry: any future date (e.g., 12/26)
   - CVC: any 3 digits (e.g., 123)
   - Postcode: any UK postcode
5. Click Pay
6. You should be redirected back to the billing page

✅ Stripe checkout works

---

## What to Do Next

### Immediate Next Steps
1. **Add a Vehicle Form in the UI** — Ask me to build the "Add Vehicle" form so you don't need to use Supabase directly
2. **Set up Twilio** — Follow Steps in the blueprint to test SMS sending
3. **Add message templates** — Insert some default templates into Supabase so reminders have content to send
4. **Test the full reminder flow** — Add a vehicle with MOT due in exactly 30 days, run the cron job, check that a reminder gets generated

### When You're Ready to Go Live
1. Buy a domain (e.g., garagealert.co.uk)
2. Push to GitHub and deploy to Vercel (see blueprint Step 8)
3. Switch Stripe to Live Mode
4. Enable email confirmations in Supabase
5. Set up Twilio webhook URL
6. Find your first beta garage!

---

## Troubleshooting

**"npm install" shows errors:**
- Make sure you're in the correct folder (the one with `package.json`)
- Try deleting the `node_modules` folder and running `npm install` again

**"Module not found" errors when running the app:**
- Stop the app (Ctrl+C) and run `npm install` again
- Then `npm run dev`

**Login page doesn't load:**
- Check your `.env.local` file has the correct Supabase URL and keys
- Make sure there are no spaces before or after the values
- Restart the app after changing `.env.local`

**"Unauthorized" on dashboard after login:**
- Make sure RLS policies were created (check Step 10)
- The trigger that creates a garage record may have failed — check the `garages` table in Supabase

**Can't see tables in Supabase:**
- Make sure the SQL ran without errors
- Try running it again — the `IF NOT EXISTS` clauses make it safe to re-run

**Need help?** Copy the exact error message and ask me — I can diagnose it.
