-- Add 'timestamp' column to 'sudoku_scores'
alter table "sudoku_scores" add column "timestamp" bigint not null default 0;

-- Add 'timestamp' column to 'squareword_scores'
alter table "squareword_scores" add column "timestamp" bigint not null default 0;
