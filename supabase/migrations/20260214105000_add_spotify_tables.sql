create table if not exists spotify_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  spotify_user_id text not null,
  refresh_token text not null,
  scopes text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table spotify_connections enable row level security;

create policy "Users can view their own spotify connection"
  on spotify_connections for select
  using (auth.uid() = user_id);

create policy "Users can insert their own spotify connection"
  on spotify_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own spotify connection"
  on spotify_connections for update
  using (auth.uid() = user_id);

create policy "Users can delete their own spotify connection"
  on spotify_connections for delete
  using (auth.uid() = user_id);

create table if not exists video_music (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  generation_id uuid references generations(id) on delete cascade,
  spotify_track_id text not null,
  track_uri text not null,
  track_name text not null,
  artist_name text not null,
  album_image_url text,
  preview_url text,
  start_ms int default 0,
  volume float default 0.9,
  mode text check (mode in ('preview_overlay', 'in_app_playback')),
  created_at timestamptz default now()
);

alter table video_music enable row level security;

create policy "Users can view their own video music"
  on video_music for select
  using (auth.uid() = user_id);

create policy "Anyone can view video music for published posts"
  on video_music for select
  using (exists (
    select 1 from generations 
    where generations.id = video_music.generation_id 
    and generations.is_published = true
  ));

create policy "Users can insert their own video music"
  on video_music for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own video music"
  on video_music for update
  using (auth.uid() = user_id);

alter table generations add column if not exists has_music boolean default false;
