create table if not exists "users" (
    "id" uuid primary key,
    "name" text not null,
    "email" text not null,
    "picture" text not null,
    "created_at" timestamp with time zone not null,
    "last_login" timestamp with time zone not null
);

create table if not exists "sudoku_puzzles" (
    "id" uuid primary key,
    "puzzle" varchar(81) not null,
    "solution" varchar(81) not null,
    "day" date not null,
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
    "puzzle" varchar(25) not null,
    "solution" varchar(25) not null,
    "day" date not null
);

create table if not exists "squareword_scores" (
    "id" uuid primary key,
    "user_id" uuid not null,
    "puzzle_id" uuid not null,
    "guesses" text not null,

    foreign key ("user_id") references "users" ("id"),
    foreign key ("puzzle_id") references "squareword_puzzles" ("id")
);
