create table if not exists "users" (
    "id" uuid primary key,
    "name" varchar(255) not null,
    "email" varchar(255) not null,
    "created_at" timestamp not null,
    "last_login" timestamp not null
);

create table if not exists "sudoku_puzzles" (
    "id" uuid primary key,
    "puzzle" varchar(82) not null,
    "solution" varchar(82) not null,
    "day" int not null,
    "difficulty" int not null
);

create table if not exists "sudoku_scores" (
    "id" uuid primary key,
    "user_id" uuid not null,
    "puzzle_id" uuid not null,
    "seconds" int not null,

    foreign key ("user_id") references "users" ("id"),
    foreign key ("puzzle_id") references "sudoku_puzzles" ("id")
);

create table if not exists "squareword_puzzles" (
    "id" uuid primary key,
    "puzzle" varchar(26) not null,
    "solution" varchar(26) not null,
    "difficulty" int not null
);

create table if not exists "squareword_scores" (
    "id" uuid primary key,
    "user_id" uuid not null,
    "puzzle_id" uuid not null,
    "seconds" int not null,

    foreign key ("user_id") references "users" ("id"),
    foreign key ("puzzle_id") references "squareword_puzzles" ("id")
);