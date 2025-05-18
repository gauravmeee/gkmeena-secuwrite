-- Create the diary_lock_passwords table
create table if not exists public.diary_lock_passwords (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    password_hash text not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    unique(user_id)
);

-- Enable RLS
alter table public.diary_lock_passwords enable row level security;

-- Create policies
create policy "Users can view their own lock password"
    on public.diary_lock_passwords
    for select
    using (auth.uid() = user_id);

create policy "Users can insert their own lock password"
    on public.diary_lock_passwords
    for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own lock password"
    on public.diary_lock_passwords
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Create function to automatically update updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- Create trigger for updated_at
create trigger handle_updated_at
    before update on public.diary_lock_passwords
    for each row
    execute function public.handle_updated_at(); 