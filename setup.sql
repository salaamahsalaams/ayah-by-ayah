-- Run this in Supabase SQL Editor

create table user_progress (
  id uuid primary key references auth.users(id) on delete cascade,
  learned int not null default 0,
  last_date date,
  streak int not null default 0,
  start_date date,
  updated_at timestamptz default now()
);

alter table user_progress enable row level security;

create policy "Users can read own progress"
  on user_progress for select using (auth.uid() = id);

create policy "Users can insert own progress"
  on user_progress for insert with check (auth.uid() = id);

create policy "Users can update own progress"
  on user_progress for update using (auth.uid() = id);

-- User settings
create table user_settings (
  id uuid primary key references auth.users(id) on delete cascade,
  daily_goal int not null default 1,
  reciter text not null default 'ar.alafasy',
  font_size text not null default 'medium',
  playback_speed float not null default 1.0,
  tajweed_colors boolean not null default true,
  theme text not null default 'dark',
  direction text not null default 'front',
  show_translation boolean not null default false,
  notifications_enabled boolean not null default false,
  notification_frequency text not null default 'daily',
  notification_count int not null default 1,
  notification_times jsonb not null default '["08:00"]'::jsonb,
  completed_surahs jsonb not null default '[]'::jsonb,
  progression_mode text not null default 'quran',
  updated_at timestamptz default now()
);

alter table user_settings enable row level security;

create policy "Users can read own settings"
  on user_settings for select using (auth.uid() = id);

create policy "Users can insert own settings"
  on user_settings for insert with check (auth.uid() = id);

create policy "Users can update own settings"
  on user_settings for update using (auth.uid() = id);

-- Delete own account RPC
create or replace function delete_own_account()
returns void as $$
  delete from auth.users where id = auth.uid();
$$ language sql security definer;
