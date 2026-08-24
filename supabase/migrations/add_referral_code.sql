-- Add referral_code column to requests table
ALTER TABLE requests ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Add index for faster referral code lookups
CREATE INDEX IF NOT EXISTS idx_requests_referral_code ON requests(referral_code);

-- Add referral_code column to company_requests table
ALTER TABLE company_requests ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Add referral_code column to bulk_requests table
ALTER TABLE bulk_requests ADD COLUMN IF NOT EXISTS referral_code TEXT;
