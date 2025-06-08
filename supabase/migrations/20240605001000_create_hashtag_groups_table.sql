-- Create hashtag_groups table
CREATE TABLE IF NOT EXISTS public.hashtag_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    hashtags TEXT[] NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.hashtag_groups ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own hashtag groups
CREATE POLICY "Users can view their own hashtag groups"
    ON public.hashtag_groups
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own hashtag groups
CREATE POLICY "Users can create their own hashtag groups"
    ON public.hashtag_groups
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own hashtag groups
CREATE POLICY "Users can update their own hashtag groups"
    ON public.hashtag_groups
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own hashtag groups
CREATE POLICY "Users can delete their own hashtag groups"
    ON public.hashtag_groups
    FOR DELETE
    USING (auth.uid() = user_id);
