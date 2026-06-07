-- Schema for Study Management Dashboard
-- Run this in the Supabase SQL Editor

-- 1. Study Materials Table
create table if not exists public.study_materials (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text,
    subject text not null,
    file_url text not null,
    file_name text not null,
    file_size bigint,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Notifications Table
create table if not exists public.notifications (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    message text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. YouTube Videos Table
create table if not exists public.youtube_videos (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text,
    subject text not null,
    youtube_url text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Live Class Links Table
create table if not exists public.live_class_links (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    url text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- App Users Table (Custom Auth)
create table if not exists public.app_users (
    id uuid default gen_random_uuid() primary key,
    username text not null unique,
    password text not null,
    name text not null,
    role text not null check (role in ('student', 'teacher')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default teacher for initial access
insert into public.app_users (username, password, name, role) 
values ('teacher1', 'teacher123', 'Default Teacher', 'teacher')
on conflict (username) do nothing;

-- Grant privileges to anon and authenticated roles
grant usage on schema public to anon, authenticated;
grant all privileges on all tables in schema public to anon, authenticated;
grant all privileges on all sequences in schema public to anon, authenticated;
grant all privileges on all routines in schema public to anon, authenticated;
grant delete on public.study_materials to anon, authenticated;
grant delete on public.notifications to anon, authenticated;
grant delete on public.youtube_videos to anon, authenticated;
grant delete on public.live_class_links to anon, authenticated;
grant delete on public.app_users to anon, authenticated;

-- Set Replica Identity so DELETE events work perfectly in Realtime
alter table public.study_materials replica identity full;
alter table public.notifications replica identity full;
alter table public.youtube_videos replica identity full;
alter table public.live_class_links replica identity full;
alter table public.app_users replica identity full;

-- Disable RLS explicitly
alter table public.study_materials disable row level security;
alter table public.notifications disable row level security;
alter table public.youtube_videos disable row level security;
alter table public.live_class_links disable row level security;
alter table public.app_users disable row level security;

-- 4. Enable Realtime for all tables (Idempotent)
DO $$ 
BEGIN 
    -- study_materials
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'study_materials') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.study_materials;
    END IF;
    
    -- notifications
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
    
    -- youtube_videos
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'youtube_videos') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.youtube_videos;
    END IF;

    -- live_class_links
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'live_class_links') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.live_class_links;
    END IF;

    -- app_users
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'app_users') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.app_users;
    END IF;
END $$;

-- 5. Storage Bucket for study materials
insert into storage.buckets (id, name, public) 
values ('study-materials', 'study-materials', true)
on conflict (id) do nothing;

-- Drop existing policies if any, just to be safe before recreating
drop policy if exists "Allow public viewing of study materials" on storage.objects;
drop policy if exists "Allow public uploads to study materials" on storage.objects;
drop policy if exists "Allow public updates to study materials" on storage.objects;
drop policy if exists "Allow public deletes of study materials" on storage.objects;

-- Set up basic allow-all policies for the bucket (since no auth is implemented yet)
create policy "Allow public viewing of study materials" on storage.objects for select using ( bucket_id = 'study-materials' );
create policy "Allow public uploads to study materials" on storage.objects for insert with check ( bucket_id = 'study-materials' );
create policy "Allow public updates to study materials" on storage.objects for update using ( bucket_id = 'study-materials' );
create policy "Allow public deletes of study materials" on storage.objects for delete using ( bucket_id = 'study-materials' );

-- Reload schema cache so PostgREST picks up the new tables and permissions immediately
notify pgrst, 'reload schema';
