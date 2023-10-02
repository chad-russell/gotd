-- Add 'winner' column to 'sudoku_scores'
alter table "sudoku_scores" add column "winner" boolean not null default false;

-- Add 'winner' column to 'squareword_scores'
alter table "squareword_scores" add column "winner" boolean not null default false;

