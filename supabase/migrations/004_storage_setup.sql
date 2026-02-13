-- Migration to set up storage buckets for ClipDrop
-- This should be run in the Supabase SQL Editor if not automatically applied.

-- 1. Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('user_videos', 'user_videos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS for user_videos
-- Allow public read
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'user_videos');

-- Allow authenticated uploads
CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user_videos' AND 
    auth.role() = 'authenticated'
  );

-- Allow users to delete their own videos
CREATE POLICY "User Delete Own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user_videos' AND 
    auth.uid() = owner
  );

-- 3. Set up RLS for thumbnails
-- Allow public read
CREATE POLICY "Thumbnails Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails');

-- Allow authenticated uploads
CREATE POLICY "Thumbnails Authenticated Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'thumbnails' AND 
    auth.role() = 'authenticated'
  );

-- Allow users to delete their own thumbnails
CREATE POLICY "Thumbnails User Delete Own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'thumbnails' AND 
    auth.uid() = owner
  );
