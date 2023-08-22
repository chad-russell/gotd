create table if not exists "users" (
    "id" uuid primary key,
    "name" varchar(255) not null,
    "email" varchar(255) not null,
    "password" varchar(255) not null,
    "created_at" timestamp not null,
    "updated_at" timestamp not null
);