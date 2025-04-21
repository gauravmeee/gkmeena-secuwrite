-- Create the user_encryption_keys table
create table if not exists public.user_encryption_keys (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    encrypted_key text not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    unique(user_id)
);

-- Enable RLS
alter table public.user_encryption_keys enable row level security;

-- Create policies
create policy "Users can view their own encryption key"
    on public.user_encryption_keys
    for select
    using (auth.uid() = user_id);

create policy "Users can insert their own encryption key"
    on public.user_encryption_keys
    for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own encryption key"
    on public.user_encryption_keys
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
    before update on public.user_encryption_keys
    for each row
    execute function public.handle_updated_at(); 