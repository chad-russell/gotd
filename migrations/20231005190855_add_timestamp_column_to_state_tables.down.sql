-- Remove 'timestamp' column from 'sudoku_scores'
alter table "sudoku_scores" drop column "timestamp";

-- Remove 'timestamp' column from 'squareword_scores'
alter table "squareword_scores" drop column "timestamp";
