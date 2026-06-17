-- Migration: Add claimed_by_name column to knowledge_share_backlog
-- Run this in Supabase SQL Editor if the column doesn't exist

-- Add the column if it doesn't exist
ALTER TABLE knowledge_share_backlog 
ADD COLUMN IF NOT EXISTS claimed_by_name TEXT;

-- Also ensure claimed_by is UUID type (fix from earlier TEXT type)
-- Note: This may fail if there are existing references, run only if needed
-- ALTER TABLE knowledge_share_backlog 
-- ALTER COLUMN claimed_by TYPE UUID USING claimed_by::UUID;
