create table products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  price text,
  url text unique not null,
  availability text,
  last_checked timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create an index on the URL for faster lookups
create index products_url_idx on products(url); 