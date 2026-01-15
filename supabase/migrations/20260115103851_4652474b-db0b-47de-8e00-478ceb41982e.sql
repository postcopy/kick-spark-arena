-- Add PERMISSIVE policies for INSERT and UPDATE on profiles table
-- The existing RESTRICTIVE policies only add checks, they don't grant access

CREATE POLICY "Allow users to insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);