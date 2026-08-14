CREATE POLICY "Owners can update their chart screenshots"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'chart-screenshots' AND owner = auth.uid())
WITH CHECK (bucket_id = 'chart-screenshots' AND owner = auth.uid());