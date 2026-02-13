-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('outputs', 'outputs', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('user_videos', 'user_videos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for outputs bucket
CREATE POLICY "Users can upload to outputs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'outputs' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own outputs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'outputs' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can read published outputs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'outputs');

-- Storage policies for user_videos bucket
CREATE POLICY "Users can upload to user_videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user_videos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own user_videos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'user_videos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can read user_videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user_videos');

CREATE POLICY "Users can delete own user_videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user_videos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for thumbnails bucket
CREATE POLICY "Users can upload thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'thumbnails' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can read thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'thumbnails');

-- Storage policies for avatars bucket
CREATE POLICY "Users can upload their avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
