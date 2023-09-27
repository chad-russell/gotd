create table if not exists "users" (
    "id" uuid primary key,
    "name" text not null,
    "email" text not null,
    "picture" text not null,
    "created_at" timestamp with time zone not null,
    "last_login" timestamp with time zone not null,

    constraint "users_email_key" unique ("email")
);

create table if not exists "sudoku_puzzles" (
    "id" uuid primary key,
    "puzzle" varchar(81) not null,
    "solution" varchar(81) not null,
    "day" date not null,

    constraint "sudoku_puzzles_day_key" unique ("day")
);

create table if not exists "sudoku_scores" (
    "id" uuid primary key,
    "user_id" uuid not null,
    "puzzle_id" uuid not null,
    "state" text,

    foreign key ("user_id") references "users" ("id"),
    foreign key ("puzzle_id") references "sudoku_puzzles" ("id"),

    constraint "sudoku_scores_user_id_puzzle_id_key" unique ("user_id", "puzzle_id")
);

create table if not exists "squareword_puzzles" (
    "id" uuid primary key,
    "solution" varchar(25) not null,
    "day" date not null,

    constraint "squareword_puzzles_day_key" unique ("day")
);

create table if not exists "squareword_scores" (
    "id" uuid primary key,
    "user_id" uuid not null,
    "puzzle_id" uuid not null,
    "state" text,

    foreign key ("user_id") references "users" ("id"),
    foreign key ("puzzle_id") references "squareword_puzzles" ("id"),

    constraint "squareword_scores_user_id_puzzle_id_key" unique ("user_id", "puzzle_id")
);
