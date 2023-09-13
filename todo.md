* (x) TODO
** (x) Sudoku 
*** (x) Frontend
**** (x) Pull new game from backend
**** (x) Upon win, call save_sudoku endpoint
**** (x) If winner, all input buttons are disabled
** (x) Squareword
*** (x) Frontend
**** (x) Modal for guess history
**** (x) Don't allow to guess the same word twice
**** (x) Detect win condition and show colorful happy squares
**** (x) Pull new game from backend
**** (x) Upon win, call save_squareword endpoint
**** ( ) Make the "X Guesses" modal prettier
***** ( ) Animate the "X Guesses" modal appearing and disappearing
**** ( ) Animation on win needs some work. It recognizes the win before the animation finishes, and also the green bubbles don't bounce like the white ones do
** (x) General
*** (x) Backend
**** (x) Receive auth from frontend, create user if needed, hand back JWT token
**** (x) Create save_sudoku endpoint
**** (x) Create save_squareword endpoint
