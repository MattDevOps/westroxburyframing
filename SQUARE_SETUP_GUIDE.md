# Square Setup Guide for Tablet Payments

## Where to Get Square Credentials

### Step 1: Square Developer Dashboard

1. **Go to**: https://developer.squareup.com
2. **Sign in** with your Square account (or create one if you don't have it)
3. **Create an Application**:
   - Click "Applications" → "New Application"
   - Give it a name (e.g., "West Roxbury Framing")
   - Select your Square account

### Step 2: Get Your Credentials

#### Application ID (Public - Safe to expose)
- In your application dashboard, you'll see **Application ID**
- This is what you need for `NEXT_PUBLIC_SQUARE_APPLICATION_ID`
- **Example**: `sandbox-sq0idb-xxxxxxxxxxxxx` (sandbox) or `sq0idb-xxxxxxxxxxxxx` (production)

#### Location ID (Public - Safe to expose)
1. Go to **Locations** in the Square Developer Dashboard
2. Select your business location
3. Copy the **Location ID**
- This is what you need for `NEXT_PUBLIC_SQUARE_LOCATION_ID`
- **Example**: `LXXXXXXXXXXXXX`

#### Access Token (PRIVATE - Never expose in frontend)
1. In your application dashboard, go to **Credentials**
2. Under **Sandbox** or **Production**, copy the **Access Token**
- This is what you need for `SQUARE_ACCESS_TOKEN` (server-side only)
- **Keep this secret!** Never put it in `NEXT_PUBLIC_*` variables

#### Environment
- `SQUARE_ENV`: Set to `"sandbox"` for testing or `"production"` for live payments
- `NEXT_PUBLIC_SQUARE_ENV`: Same value, but public (used by frontend SDK)

### Step 3: Add to Environment Variables

**In Vercel** (Production):
- Go to: Project → Settings → Environment Variables
- Add all 5 variables:

```
SQUARE_ENV=production
SQUARE_ACCESS_TOKEN=your_production_access_token_here
NEXT_PUBLIC_SQUARE_APPLICATION_ID=your_production_app_id_here
NEXT_PUBLIC_SQUARE_LOCATION_ID=your_production_location_id_here
NEXT_PUBLIC_SQUARE_ENV=production
```

**In `.env.local`** (Local Development):
```bash
SQUARE_ENV=sandbox
SQUARE_ACCESS_TOKEN=your_sandbox_access_token_here
NEXT_PUBLIC_SQUARE_APPLICATION_ID=your_sandbox_app_id_here
NEXT_PUBLIC_SQUARE_LOCATION_ID=your_sandbox_location_id_here
NEXT_PUBLIC_SQUARE_ENV=sandbox
```

---

## Hardware Options: Do You Need Square Hardware?

### ✅ **Option 1: No Hardware (What We Implemented) - RECOMMENDED TO START**

**Square Web Payments SDK** - Manual card entry on tablet

**Pros:**
- ✅ **No hardware needed** - Works immediately
- ✅ **No cost** - Free to use
- ✅ **Works on any tablet** - iPad, Android, Windows
- ✅ **Secure** - PCI compliant, card data never touches your server
- ✅ **Already implemented** - Ready to use right now

**Cons:**
- ❌ Customer must manually type card number
- ❌ Slightly slower than card swipe/insert
- ❌ No contactless payments (tap)

**Best For:**
- Getting started quickly
- Low to medium transaction volume
- Testing the system
- When hardware budget is limited

---

### Option 2: USB Card Reader (Free/Square Reader)

**Square offers free USB card readers** that plug into tablets

**Pros:**
- ✅ **Free** - Square often provides free readers
- ✅ **Card swipe/insert** - Faster than typing
- ✅ **Works with tablets** - Via USB adapter

**Cons:**
- ❌ **Requires different integration** - Would need Square Reader SDK (not implemented yet)
- ❌ **USB compatibility** - May need USB adapter for tablets
- ❌ **Limited features** - Basic swipe/insert only, no tap
- ❌ **Setup complexity** - More code changes needed

**What You'd Need:**
- Square Reader (free from Square)
- USB adapter for tablet (if needed)
- Integration with Square Reader SDK (would need to implement)

---

### Option 3: Square Terminal (Dedicated Hardware) - BEST FOR HIGH VOLUME

**Square Terminal** - Standalone payment device

**Pros:**
- ✅ **Professional** - Dedicated payment device
- ✅ **Fast** - Chip, swipe, tap, contactless
- ✅ **Reliable** - Built for high-volume transactions
- ✅ **Receipt printer** - Built-in receipt printing
- ✅ **Better security** - EMV compliant, PCI Level 1

**Cons:**
- ❌ **Cost** - ~$299 one-time purchase
- ❌ **Requires Terminal API** - Different integration (not implemented)
- ❌ **Separate device** - Not integrated into tablet screen

**Best For:**
- High transaction volume
- Professional retail environment
- When you want the best customer experience

---

### Option 4: Square Reader SDK (Mobile Reader)

**Square Reader** - Chip & Tap reader for mobile devices

**Pros:**
- ✅ **Chip & Tap** - Modern payment methods
- ✅ **Portable** - Small, wireless reader
- ✅ **Professional** - Better than USB swipe reader

**Cons:**
- ❌ **Cost** - ~$49 for the reader
- ❌ **Requires Reader SDK** - Different integration (not implemented)
- ❌ **Bluetooth setup** - More complex setup

---

## Recommendation

### **Start with Option 1 (No Hardware) - Already Implemented!**

**Why:**
1. ✅ **It's already working** - No additional setup needed
2. ✅ **Free** - No hardware costs
3. ✅ **Fast to deploy** - Just add your Square credentials
4. ✅ **Good enough** - Many businesses use manual entry successfully

**Then consider upgrading if:**
- You process 20+ transactions per day → Consider Square Terminal
- Customers complain about typing → Consider USB reader or Terminal
- You want contactless payments → Consider Square Reader or Terminal

---

## Current Implementation Status

✅ **What's Already Built:**
- Square Web Payments SDK integration (manual entry)
- Card payment processing
- Cash payment recording
- Payment tracking in orders
- Receipt generation with payment info

❌ **What Would Need to Be Built (if you want hardware):**
- Square Reader SDK integration (for USB/chip readers)
- Square Terminal API integration (for Square Terminal)
- Bluetooth/USB device pairing
- Card reader UI components

---

## Quick Start Checklist

1. ✅ Get Square Developer account → https://developer.squareup.com
2. ✅ Create application → Get Application ID
3. ✅ Get Location ID → From Square Dashboard
4. ✅ Get Access Token → From Square Developer Dashboard
5. ✅ Add to Vercel environment variables
6. ✅ Test in sandbox mode first
7. ✅ Switch to production when ready

**You're ready to accept payments!** 🎉

No hardware needed to start - just add your Square credentials and you can process card payments through the tablet.
