-- Migration: Add presenter_name column to knowledge_share_sessions
-- Run this in Supabase SQL Editor if the column doesn't exist

ALTER TABLE knowledge_share_sessions 
ADD COLUMN IF NOT EXISTS presenter_name TEXT;
