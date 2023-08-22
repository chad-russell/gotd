import { createSignal, type Component } from 'solid-js';
import { FaSolidPencil } from 'solid-icons/fa'
import { IoArrowUndo } from 'solid-icons/io'
import { FiDelete } from 'solid-icons/fi'

const puzzle = {
  puzzle: "----4--------594-2-5--73-86------127---6--543----27-6--39-8----1--3-4---8----1-54",
  solution: "981246735367859412254173986648935127792618543513427869439582671175364298826791354",
  difficulty: "medium"
};

const [selectedCell, setSelectedCell] = createSignal<number | null>(null);

type CellState = {
  value: number | null;
  isGiven: boolean;
  notes: number[];
};

function getPuzzleState(puzzle: { puzzle: string }): CellState[][] {
  const firstState = puzzle.puzzle.split('').map((c) => {
    if (c === '-') {
      return {
        value: null,
        isGiven: false,
        notes: [],
      };
    }

    return {
      value: parseInt(c),
      isGiven: true,
      notes: []
    }
  });

  return [firstState];
}

const [puzzleState, setPuzzleState] = createSignal(getPuzzleState(puzzle), { equals: false });

function curPuzzleState(): CellState[] {
  return puzzleState()[puzzleState().length - 1];
}

function pushPuzzleState(fn: (ps: CellState[]) => void) {
  const newPuzzleState = [...curPuzzleState().map((cs) => ({ ...cs }))];
  fn(newPuzzleState);
  setPuzzleState([...puzzleState(), newPuzzleState]);
}

function inputNumber(n: number) {
  const sc = selectedCell();

  if (sc === null) {
    return;
  }

  pushPuzzleState((ps) => {
    if (!ps[sc].isGiven) {
      ps[sc].value = n;
    }
  });
}

function clearCell() {
  const sc = selectedCell();

  if (sc === null) {
    return;
  }

  pushPuzzleState((ps) => {
    if (!ps[sc].isGiven) {
      ps[sc].value = null;
    }
  });
}

function undo() {
  if (puzzleState().length === 1) {
    return;
  }

  setPuzzleState(puzzleState().slice(0, puzzleState().length - 1));
}

const SudokuCell: Component<{ n: number }> = (props) => {
  let selectedStyle = () => {
    const isSelected = selectedCell() === props.n;

    if (isSelected) {
      return 'bg-blue-200';
    }

    return '';
  };

  return (
    <div
      style='font-size: min(3.5vh, 7vw)' class={`border border-black select-none aspect-square text-center flex flex-col items-center justify-center ${selectedStyle()}`}
      onClick={() => {
        setSelectedCell(props.n);
      }}
    >
      {curPuzzleState()[props.n].value}
    </div >
  );
}

const Sudoku3x3: Component<{ n: number }> = (props) => {
  return (
    <div class='grid grid-cols-3 grid-rows-3 border border-black max-h-full aspect-square'>
      <SudokuCell n={props.n * 9} />
      <SudokuCell n={props.n * 9 + 1} />
      <SudokuCell n={props.n * 9 + 2} />
      <SudokuCell n={props.n * 9 + 3} />
      <SudokuCell n={props.n * 9 + 4} />
      <SudokuCell n={props.n * 9 + 5} />
      <SudokuCell n={props.n * 9 + 6} />
      <SudokuCell n={props.n * 9 + 7} />
      <SudokuCell n={props.n * 9 + 8} />
    </div>
  );
}

const SudokuInputNumber: Component<{ n: number }> = (props) => {
  return (
    <button
      style='font-size: min(4vh, 8vw)'
      class='border border-black text-center flex flex-col items-center justify-center py-3 hover:bg-slate-200'
      onClick={() => inputNumber(props.n)}
    >
      {props.n}
    </button >
  );
}

const SudokuNumberPad: Component = () => {
  return (
    <div class='grid grid-cols-3 grid-rows-3 border border-black mt-5 mb-2 w-[100vw] max-w-[50vh] aspect-video lg:max-h-[25vh] lg:ml-6'>
      <SudokuInputNumber n={1} />
      <SudokuInputNumber n={2} />
      <SudokuInputNumber n={3} />
      <SudokuInputNumber n={4} />
      <SudokuInputNumber n={5} />
      <SudokuInputNumber n={6} />
      <SudokuInputNumber n={7} />
      <SudokuInputNumber n={8} />
      <SudokuInputNumber n={9} />
    </div>
  );
}

const SudokuBoard: Component = () => {
  return (
    <div class='border border-black grid grid-cols-3 grid-rows-3 max-h-[50vh] max-w-[50vh] w-full aspect-square lg:max-h-[75vh] lg:max-w-[75vh]'>
      <Sudoku3x3 n={0} />
      <Sudoku3x3 n={1} />
      <Sudoku3x3 n={2} />
      <Sudoku3x3 n={3} />
      <Sudoku3x3 n={4} />
      <Sudoku3x3 n={5} />
      <Sudoku3x3 n={6} />
      <Sudoku3x3 n={7} />
      <Sudoku3x3 n={8} />
    </div>
  );
}

const SudokuIcons: Component = () => {
  return (
    <div class='grid grid-cols-3'>
      <button
        style='font-size: min(2.5vh, 5vw)' class='flex flex-col justify-end items-center'
        onClick={() => undo()}
      >
        <IoArrowUndo />
        <span>Undo</span>
      </button>
      <button
        style='font-size: min(2.5vh, 5vw)' class='flex flex-col justify-end items-center'
        onClick={() => clearCell()}
      >
        <FiDelete />
        <span>Clear</span>
      </button>
      <button style='font-size: min(2.5vh, 5vw)' class='flex flex-col justify-end items-center'>
        <FaSolidPencil />
        <span>Number</span>
      </button>
    </div>
  );
}

const Sudoku: Component = () => {
  return (
    <div class='h-[90vh] flex flex-col justify-between items-center lg:flex-row lg:justify-center'>
      <SudokuBoard />
      <div>
        <SudokuIcons />
        <SudokuNumberPad />
      </div>
    </div>
  );
};

const App: Component = () => {
  return (
    <div class='max-h-[100vh]'>
      <h2 class='text-3xl md:text-4xl lg:text-5xl text-center my-2 h-[7vh]'>
        Daily Sudoku (August 21)
      </h2>
      <Sudoku />
    </div>
  );
};

export default App;
