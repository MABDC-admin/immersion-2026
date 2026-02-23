-- Create activities table
CREATE TABLE public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'join', 'leave', 'update', 'status'
    message TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'birthday', 'anniversary', 'holiday'
    title TEXT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activities
CREATE POLICY "Activities are viewable by authenticated users"
ON public.activities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Activities can be managed by admin or hr"
ON public.activities FOR ALL
TO authenticated
USING (public.is_admin_or_hr(auth.uid()));

-- RLS Policies for events
CREATE POLICY "Events are viewable by authenticated users"
ON public.events FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Events can be managed by admin or hr"
ON public.events FOR ALL
TO authenticated
USING (public.is_admin_or_hr(auth.uid()));

-- Add to codebase analysis wiki if needed (already mentioned missing functionality)
