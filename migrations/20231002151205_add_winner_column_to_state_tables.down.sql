-- Remove 'winner' column from 'sudoku_scores'
alter table "sudoku_scores" drop column "winner";

-- Remove 'winner' column from 'squareword_scores'
alter table "squareword_scores" drop column "winner";

