-- Create post_templates table
CREATE TABLE IF NOT EXISTS public.post_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    hashtag_group_id UUID REFERENCES public.hashtag_groups(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.post_templates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own templates
CREATE POLICY "Users can view their own templates"
    ON public.post_templates
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own templates
CREATE POLICY "Users can create their own templates"
    ON public.post_templates
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own templates
CREATE POLICY "Users can update their own templates"
    ON public.post_templates
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own templates
CREATE POLICY "Users can delete their own templates"
    ON public.post_templates
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_post_templates_user_id ON public.post_templates(user_id);
CREATE INDEX idx_post_templates_hashtag_group_id ON public.post_templates(hashtag_group_id);
