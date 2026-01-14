-- Create storage bucket for sound effects
INSERT INTO storage.buckets (id, name, public)
VALUES ('sounds', 'sounds', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to sounds
CREATE POLICY "Public can read sounds"
ON storage.objects
FOR SELECT
USING (bucket_id = 'sounds');

-- Allow authenticated admins to upload sounds
CREATE POLICY "Admins can upload sounds"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'sounds' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to update sounds
CREATE POLICY "Admins can update sounds"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'sounds' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to delete sounds
CREATE POLICY "Admins can delete sounds"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'sounds' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);