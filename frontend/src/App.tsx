import { createSignal, type Component } from 'solid-js';
import { FaSolidPencil } from 'solid-icons/fa'
import { IoArrowUndo } from 'solid-icons/io'
import { FiDelete } from 'solid-icons/fi'
import { List, Map } from 'immutable';

const puzzle = {
  puzzle: "----4--------594-2-5--73-86------127---6--543----27-6--39-8----1--3-4---8----1-54",
  solution: "981246735367859412254173986648935127792618543513427869439582671175364298826791354",
  difficulty: "medium"
};

type CellState = {
  value: number | null,
  isGiven: boolean,
  notes: number[],
};

type GameState = {
  selectedCell: number | null,
  cells: CellState[],
};

type History = GameState[];

function createInitialHistory(puzzle: { puzzle: string }): History {
  const cells: CellState[] = puzzle.puzzle.split('').map((c) => {
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
    };
  });

  return [{
    selectedCell: null,
    cells,
  }];
}

const [history, setHistory] = createSignal(createInitialHistory(puzzle), { equals: false });

function curGameState(): GameState {
  let h = history();
  return h[h.length - 1];
}

function pushGameState(fn: (_: GameState) => void) {
  let copiedGameState: GameState = curGameState();
  copiedGameState = {
    selectedCell: copiedGameState.selectedCell,
    cells: copiedGameState.cells.map(gs => ({ ...gs })),
  };
  fn(copiedGameState);
  setHistory((ps) => [...ps, copiedGameState]);
}

function updateSelectedCell(fn: (_: CellState) => void) {
  const sc = curGameState().selectedCell;

  if (sc === null) {
    return;
  }

  pushGameState((ps) => {
    if (!ps.cells[sc].isGiven) {
      fn(ps.cells[sc]);
    } else {
      return ps;
    }
  });
}

function inputNumber(n: number) {
  updateSelectedCell(sc => sc.value = n);
}

function clearCell() {
  updateSelectedCell(sc => sc.value = null);
}

function setSelectedCell(n: number) {
  setHistory(h => {
    h[h.length - 1].selectedCell = n;
    return h;
  });
}

function undo() {
  if (history().length === 1) {
    return;
  }

  setHistory(history().slice(0, history().length - 1));
}

function monkey() {
  for (let i = 0; i < 1000; i++) {
    setSelectedCell(Math.floor(Math.random() * 81));
    inputNumber(Math.floor(Math.random() * 9) + 1);

    setSelectedCell(Math.floor(Math.random() * 81));
    clearCell();
  }

  console.log('monkey-ing');

  // for (let i = 0; i < 10000; i++) {
  //   undo();
  // }

  console.log('done monkey-ing');
}

const SudokuCell: Component<{ n: number }> = (props) => {
  let selectedStyle = () => {
    const isSelected = curGameState().selectedCell === props.n;

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
      {curGameState().cells[props.n].value}
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
      <button
        style='font-size: min(2.5vh, 5vw)' class='flex flex-col justify-end items-center'
        onClick={() => monkey()}
      >
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

