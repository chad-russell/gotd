import { createSignal, type Component, Show, onMount, createEffect } from 'solid-js';
import { IoArrowUndoOutline } from 'solid-icons/io'
import { TbNumbers } from 'solid-icons/tb'
import { FiDelete } from 'solid-icons/fi'
import { BsPatchQuestionFill, BsPauseCircle, BsPlayCircle } from 'solid-icons/bs'
import { BsPencil } from 'solid-icons/bs'
import { daysEqual, getDay } from '../util';
import { setToken, token } from '../auth/auth';
import * as state from './state';

// const puzzle = {
//     puzzle: "--89---6---6-2--45951----7----7-3----6-8---3---4--6-1---2---39-78-6---526-5-3----",
//     solution: "428975163376128945951364278819753624267841539534296817142587396783619452695432781",
//     difficulty: "medium",
// };
//
// const puzzle2 = {
//     puzzle: "42897516337612894595136427881975362426784153953429681714258739678361945269543278-",
//     solution: "428975163376128945951364278819753624267841539534296817142587396783619452695432781",
//     difficulty: "medium",
// };

const [noErrAnim, setNoErrAnim] = createSignal(false);
const [winnerColorChange, setWinnerColorChange] = createSignal(0);

function isCorrectDay() {
    return daysEqual(state.puzzleDay(), getDay());
}

function updateWinnerColorChange() {
    setWinnerColorChange(winnerColorChange() + 1);
    if (state.winner()) {
        setTimeout(updateWinnerColorChange, 500);
    }
}

function swapInputStyle() {
    if (state.inputStyle() === 'number') {
        state.setInputStyle('note');
    } else {
        state.setInputStyle('number');
    }
}

async function saveHistory() {
    // If local storage is for a different day, clear it and load from server
    if (!isCorrectDay()) {
        localStorage.removeItem('sudoku');
        await state.loadGameFromServer();
    }

    state.saveLocal();
}

function curGameState(): state.GameState {
    let h = state.history();
    if (!h) {
        throw 'ERROR: "history" not defined';
    }

    return h[h.length - 1];
}

function updateSelectedCell(fn: (_: state.CellState) => void) {
    const gs = curGameState();

    if (gs.selectedCell === null) {
        return;
    }

    const newCells = gs.cells.map(c => {
        let copied = { ...c, notes: [...c.notes] };
        return copied;
    });

    fn(newCells[gs.selectedCell]);

    state.setHistory(h => [...h!, { ...gs, cells: newCells }]);
}

function selectedNumber() {
    const gs = curGameState();

    if (gs.selectedCell === null) {
        return null;
    }

    return gs.cells[gs.selectedCell].value;
}

function inputNumber(n: number) {
    clearChecks();

    if (allFilled(n)) {
        return;
    }

    if (state.inputStyle() === 'note') {
        updateSelectedCell(sc => {
            if (sc.value !== null) {
                return;
            }

            if (sc.notes.includes(n)) {
                sc.notes = sc.notes.filter((i) => i !== n);
            } else {
                sc.notes = [...sc.notes, n];
            }
        });
    } else {
        updateSelectedCell(sc => {
            sc.value = n;
            sc.check = null;
        });

        const gs = curGameState();
        if (gs.selectedCell === null) {
            return;
        }

        for (let i = 0; i < 81; i++) {
            if (i == gs.selectedCell) {
                continue;
            }

            const notes = gs.cells[i].notes;

            // If the cell does not have notes, skip it
            if (notes.length === 0) {
                continue;
            }

            // If the cell has a value, clear its notes
            if (gs.cells[i].value !== null) {
                gs.cells[i].notes = [];
                continue;
            }

            // If the cell is in the same row, column, or box as the selected cell, remove the selected number from its notes
            const isSameRow = Math.floor(gs.selectedCell / 9) === Math.floor(i / 9);
            const isSameCol = gs.selectedCell % 9 === i % 9;
            const isSameBox = Math.floor(gs.selectedCell / 27) === Math.floor(i / 27) && Math.floor(gs.selectedCell / 3) % 3 === Math.floor(i / 3) % 3;
            if (isSameRow || isSameCol || isSameBox) {
                gs.cells[i].notes = notes.filter((n) => n !== selectedNumber());
            }
        }

        state.setHistory(h => {
            if (!h) { return h; };
            return [...h];
        });
    }
}

function clearChecks() {
    for (let i = 0; i < 81; i++) {
        curGameState().cells[i].check = null;
    }
    state.setHistory(h => {
        if (!h) { return h; }
        return [...h];
    });
}

function clearCell() {
    clearChecks();

    const sc = curGameState().selectedCell;
    if (sc === null) {
        return;
    }

    if (curGameState().cells[sc].isGiven) {
        return;
    }

    updateSelectedCell(sc => {
        sc.notes = [];
        sc.value = null;
    });
}

function checkCell(n: number) {
    const sol = state.solution();
    if (!sol) { return; }

    const gs = curGameState();

    const cell = gs.cells[n];

    if (cell.isGiven) {
        return;
    }

    if (cell.value === null) {
        cell.check = null;
        return;
    }

    setNoErrAnim(true);
    setTimeout(() => setNoErrAnim(false), 1000);

    if (cell.value.toString() == sol[n]) {
        cell.check = true;
    } else {
        cell.check = false;
    }
}

function checkCells() {
    for (let i = 0; i < 81; i++) {
        checkCell(i);
    }
    state.setHistory(h => {
        if (!h) { return h; }
        return [...h];
    });
}

function setSelectedCell(n: number) {
    state.setHistory(h => {
        if (!h) { return h; }

        h[h.length - 1].selectedCell = n;
        return h;
    });
}

function undo() {
    if (state.winner()) {
        return;
    }

    const h = state.history();
    if (!h) { return; }

    if (h.length === 1) {
        return;
    }

    state.setHistory(h.slice(0, h.length - 1));
}

function allFilled(n: number | null) {
    if (n === null) {
        return false;
    }

    // Loop over every cell in the grid, keep track of how many of this number there are
    let count = 0;
    for (let i = 0; i < 81; i++) {
        if (curGameState().cells[i].value === n) {
            count++;
        }
    }

    return count === 9;
}

const Notes: Component<{ n: number }> = (props) => {
    const notes = () => curGameState()?.cells[props.n]?.notes;

    return (
        <div class='grid grid-rows-3 grid-cols-3 w-full h-full'>
            <div class='w-full h-full flex flex-col items-center justify-center text-[1.3vh] md:text-[1.9vh] text-gray-700 font-thin'>{notes()?.includes(1) ? 1 : null}</div>
            <div class='w-full h-full flex flex-col items-center justify-center text-[1.3vh] md:text-[1.9vh] text-gray-700 font-thin'>{notes()?.includes(2) ? 2 : null}</div>
            <div class='w-full h-full flex flex-col items-center justify-center text-[1.3vh] md:text-[1.9vh] text-gray-700 font-thin'>{notes()?.includes(3) ? 3 : null}</div>
            <div class='w-full h-full flex flex-col items-center justify-center text-[1.3vh] md:text-[1.9vh] text-gray-700 font-thin'>{notes()?.includes(4) ? 4 : null}</div>
            <div class='w-full h-full flex flex-col items-center justify-center text-[1.3vh] md:text-[1.9vh] text-gray-700 font-thin'>{notes()?.includes(5) ? 5 : null}</div>
            <div class='w-full h-full flex flex-col items-center justify-center text-[1.3vh] md:text-[1.9vh] text-gray-700 font-thin'>{notes()?.includes(6) ? 6 : null}</div>
            <div class='w-full h-full flex flex-col items-center justify-center text-[1.3vh] md:text-[1.9vh] text-gray-700 font-thin'>{notes()?.includes(7) ? 7 : null}</div>
            <div class='w-full h-full flex flex-col items-center justify-center text-[1.3vh] md:text-[1.9vh] text-gray-700 font-thin'>{notes()?.includes(8) ? 8 : null}</div>
            <div class='w-full h-full flex flex-col items-center justify-center text-[1.3vh] md:text-[1.9vh] text-gray-700 font-thin'>{notes()?.includes(9) ? 9 : null}</div>
        </div>
    );
}

const SudokuCell: Component<{ n: number }> = (props) => {
    function err() {
        const curCell = curGameState().cells[props.n];

        if (curCell.check === false) {
            return true;
        }

        if (curCell.value === null) {
            return false;
        }

        // Loop over every cell in the same row, column, and box
        for (let i = 0; i < 81; i++) {
            const isSameRow = Math.floor(props.n / 9) === Math.floor(i / 9);
            const isSameCol = props.n % 9 === i % 9;
            const isSameBox = Math.floor(props.n / 27) === Math.floor(i / 27) && Math.floor(props.n / 3) % 3 === Math.floor(i / 3) % 3;

            if (isSameRow || isSameCol || isSameBox) {
                if (i !== props.n && curGameState().cells[i].value === curCell.value) {
                    return true;
                }
            }
        }
    }

    function bgStyle() {
        if (state.winner()) {
            // subscribe to changes in winnerColorChange
            winnerColorChange();

            let tailwindColorsList = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-purple-400', 'bg-pink-400'];
            let randomIndex = Math.floor(Math.random() * tailwindColorsList.length);
            let randomTailwindColor = tailwindColorsList[randomIndex];
            return `${randomTailwindColor} transition linear duration-500`;
        }

        if (state.paused()) {
            return 'bg-white';
        }

        const isSelected = curGameState().selectedCell === props.n;
        const curCell = curGameState().cells[props.n];
        const isErr = err();

        if (isSelected) {
            if (isErr) {
                return 'bg-red-300';
            }

            if (curCell.check) {
                return 'bg-green-400';
            }

            return 'bg-blue-400';
        }

        if (isErr) {
            return 'bg-red-200';
        }

        const sn = selectedNumber();
        const numberIsSelected = sn != null && sn === curCell.value;
        if (numberIsSelected) {
            if (curCell.check) {
                return 'bg-green-200';
            }
            return 'bg-blue-200';
        }

        const sc = curGameState().selectedCell!;
        if (sc === null) {
            return 'bg-white';
        }

        const isSameRow = Math.floor(props.n / 9) === Math.floor(sc / 9);
        const isSameCol = props.n % 9 === sc % 9;
        const isSameBox = Math.floor(props.n / 27) === Math.floor(sc / 27) && Math.floor(props.n / 3) % 3 === Math.floor(sc / 3) % 3;
        if (isSameRow || isSameCol || isSameBox) {
            if (curCell.check) {
                return 'bg-green-200';
            }
            return 'bg-blue-100';
        }

        if (curCell.check) {
            return 'bg-green-200';
        }

        return 'bg-white';
    }

    function textStyle() {
        if (state.paused()) {
            return 'text-slate-600';
        }

        const curCell = curGameState().cells[props.n];

        if (err()) {
            return 'text-red-600 animate-wiggle';
        }

        if (allFilled(curCell.value) || curCell.check) {
            return 'text-green-600';
        }

        if (curCell.isGiven) {
            return 'text-slate-600';
        }

        return 'text-blue-600';
    }

    function hasValue() {
        return curGameState().cells[props.n].value !== null;
    }

    function radiusStyle() {
        if (props.n === 0) {
            return 'rounded-tl-xl md:rounded-tl-2xl border-t-[1px] md:border-t-[2px] border-l-[1px] md:border-l-[2px]';
        }
        else if (props.n > 0 && props.n < 8) {
            return 'border-t-[1px] md:border-t-[2px]';
        }
        else if (props.n === 8) {
            return 'rounded-tr-xl md:rounded-tr-2xl border-t-[1px] md:border-t-[2px] border-r-[1px] md:border-r-[2px]';
        }
        else if (props.n === 72) {
            return 'rounded-bl-xl md:rounded-bl-2xl border-b-[1px] md:border-b-[2px] border-l-[1px] md:border-l-[2px]';
        }
        else if (props.n > 72 && props.n < 80) {
            return 'border-b-[1px] md:border-b-[2px]';
        }
        else if (props.n === 80) {
            return 'rounded-br-xl md:rounded-br-2xl border-b-[1px] md:border-b-[2px] border-r-[1px] md:border-r-[2px]';
        }

        // Left side
        if (props.n % 9 === 0) {
            return 'border-l-[1px] md:border-l-[2px]';
        }

        // Right side
        if (props.n % 9 === 8) {
            return 'border-r-[1px] md:border-r-[2px]';
        }
    }

    function value() {
        if (state.winner()) {
            return '🎉';
        }

        if (state.paused()) {
            return '?';
        }

        return curGameState().cells[props.n].value
    }

    return (
        <div
            class={`w-full h-full border-[0.5px] border-slate-300 aspect-square text-center flex flex-col items-center overflow-hidden justify-center ${bgStyle()} ${radiusStyle()}`}
            onClick={() => {
                setSelectedCell(props.n);
            }}
        >
            <Show when={hasValue() || state.paused()} fallback={<Notes n={props.n} />}>
                <span style='font-size: min(4vh, 8vw)' class={`z-10 select-none ${textStyle()} transition ease-in-out duration-100`}>
                    {value()}
                </span>
            </Show>
        </div >
    );
}

const Sudoku3x3: Component<{ n: number, border: string[] }> = (props) => {
    function borderStyle() {
        let styles = [];
        for (let b of props.border) {
            styles.push(`border-${b}-[1px]`);
        }

        return styles.join(' ');
    }

    return (
        <div class={`grid grid-cols-3 overflow-hidden grid-rows-3 max-h-full w-full aspect-square border-stone-600 ${borderStyle()}`}>
            <SudokuCell n={props.n} />
            <SudokuCell n={props.n + 1} />
            <SudokuCell n={props.n + 2} />
            <SudokuCell n={props.n + 9} />
            <SudokuCell n={props.n + 10} />
            <SudokuCell n={props.n + 11} />
            <SudokuCell n={props.n + 18} />
            <SudokuCell n={props.n + 19} />
            <SudokuCell n={props.n + 20} />
        </div>
    );
}

const SudokuInputNumber: Component<{ n: number }> = (props) => {
    function style(): string {
        if (state.winner() || allFilled(props.n)) {
            return 'text-gray-400 lg:py-5';
        }

        return 'hover:bg-none sm:hover:bg-blue-100 active:bg-blue-200 sm:active:bg-blue-200 text-slate-600 lg:py-5 border border-stone-300';
    }

    return (
        <button
            disabled={state.winner() || allFilled(props.n)}
            style='font-size: min(4vh, 8vw)'
            class={`text-center flex flex-col items-center justify-center m-1 rounded-xl select-none ${style()}`}
            onClick={() => inputNumber(props.n)}
        >
            {props.n}
        </button >
    );
}

const SudokuNumberPad: Component = () => {
    return (
        <div class='grid grid-cols-3 grid-rows-3 mt-5 mb-2 w-[100vw] max-w-[50vh] lg:max-h-[35vh] lg:ml-6'>
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
        <div class='grid grid-cols-3 grid-rows-3 overflow-hidden aspect-square'>
            <Sudoku3x3 n={0} border={['b', 'r']} />
            <Sudoku3x3 n={3} border={['b']} />
            <Sudoku3x3 n={6} border={['b', 'l']} />
            <Sudoku3x3 n={27} border={['r', 'b']} />
            <Sudoku3x3 n={30} border={['b']} />
            <Sudoku3x3 n={33} border={['l', 'b']} />
            <Sudoku3x3 n={54} border={['r']} />
            <Sudoku3x3 n={57} border={[]} />
            <Sudoku3x3 n={60} border={['l']} />
        </div>
    );
}

const InputStyle: Component = () => {
    function transform(style: 'number' | 'note') {
        if (state.inputStyle() == style) {
            return '';
        }

        return 'transform: translate(40%, -60%) scale(0, 0)';
    }

    return (
        <div
            class='col-span-1 flex flex-col items-center justify-center border text-slate-700 bg-white border-stone-800 rounded-md py-1 m-1 hover:bg-none sm:hover:bg-blue-100 active:bg-blue-200 sm:active:bg-blue-200'
            onClick={() => swapInputStyle()}
        >
            <button
                style={`font-size: min(2.5vh, 5vw); ${transform('number')}`}
                class='flex flex-col justify-end items-center absolute transition-all'
            >
                <TbNumbers color="rgb(47, 41, 36)" />
                <span>Number</span>
            </button>
            <button
                style={`font-size: min(2.5vh, 5vw); ${transform('note')}`}
                class='flex flex-col justify-end items-center relative transition-all'
            >
                <BsPencil color="rgb(47, 41, 36)" />
                <span>Note</span>
            </button>
        </div>
    )
};

const SudokuIcons: Component = () => {
    return (
        <div class='grid grid-cols-4 lg:ml-6 select-none'>
            <button
                style='font-size: min(2.5vh, 5vw)'
                class='flex flex-col justify-end items-center border border-stone-800 text-slate-700 bg-white rounded-md py-1 m-1 hover:bg-none sm:hover:bg-red-100 active:bg-red-200 sm:active:bg-red-200'
                disabled={state.winner() || state.paused() || state.history()?.length === 1}
                onClick={() => undo()}
            >
                <IoArrowUndoOutline color="rgb(47, 41, 36)" />
                <span>Undo</span>
            </button>
            <button
                style='font-size: min(2.5vh, 5vw)'
                class='flex flex-col justify-end items-center border text-slate-700 bg-white border-stone-800 rounded-md py-1 m-1 hover:bg-none sm:hover:bg-blue-100 active:bg-blue-200 sm:active:bg-blue-200'
                disabled={state.winner() || state.paused()}
                onClick={() => clearCell()}
            >
                <FiDelete color="rgb(47, 41, 36)" />
                <span>Clear</span>
            </button>
            <InputStyle />
            <button
                disabled={state.winner() || noErrAnim() || state.paused()}
                style='font-size: min(2.5vh, 5vw)' class='flex flex-col justify-end items-center border text-slate-700 bg-white border-stone-800 rounded-md py-1 m-1 hover:bg-none sm:hover:bg-blue-100 active:bg-blue-200 sm:active:bg-blue-200'
                onClick={() => checkCells()}
            >
                <BsPatchQuestionFill color="rgb(47, 41, 36)" />
                <span>Check</span>
            </button>
        </div>
    );
}

const Timer: Component = () => {
    function formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const secondsLeft = seconds % 60;
        return `${minutes}:${secondsLeft.toString().padStart(2, '0')} `;
    }

    function time() {
        if (state.winner()) {
            return 'Final Time:';
        }

        return 'Time:';
    }

    return (
        <div class='flex flex-row items-center justify-center'>
            <div
                class='flex flex-row items-center py-1 px-4 my-1 text-lg md:text-xl lg:text-2xl text-center text-blue-600 bg-white border border-stone-800 rounded-md shadow-lg'
                onClick={() => {
                    if (state.winner()) { return; }
                    state.setPaused(!state.paused());
                }}
            >
                <span class='select-none'>{time()} {formatTime(state.seconds())}</span>
                <Show when={state.paused() && !state.winner()}>
                    <div class='ml-3'>
                        <BsPlayCircle font-size='22' color="rgb(37, 99, 235)" />
                    </div>
                </Show>
                <Show when={!state.winner() && !state.paused()}>
                    <div class='ml-3'>
                        <BsPauseCircle font-size='22' color="rgb(37, 99, 235)" />
                    </div>
                </Show>
            </div>
        </div>
    );
}

async function saveScore() {
    const res = await fetch('http://localhost:3001/sudoku/score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token()}`,
        },
        body: JSON.stringify({
            puzzle_id: state.id(),
            seconds: state.seconds(),
        }),
    });

    if (res.status === 401) {
        setToken(null);
        return;
    }

    else if (res.status !== 200) {
        console.log('Error saving score');
        return;
    }
}

export const Sudoku: Component = () => {
    onMount(() => {
        setInterval(() => {
            if (!state.winner() && !state.paused()) {
                state.setSeconds(s => s + 1);
            }
        }, 1000);

        state.loadHistory();

        createEffect(() => {
            saveHistory();
        });

        createEffect(() => {
            if (state.winner()) {
                setWinnerColorChange(0);
                setTimeout(updateWinnerColorChange, 500);
            }
        });

        createEffect(() => {
            if (!state.history()) {
                return;
            }

            const gs = curGameState();
            const sol = state.solution();

            if (!gs || !sol) { return; }

            if (gs.cells.every((c) => c.value !== null)) {
                for (let i = 0; i < 81; i++) {
                    if (gs.cells[i].value?.toString() !== sol[i]) {
                        return;
                    }
                }

                if (!state.winner()) {
                    console.log('YOU WIN!!!!');
                    state.setWinner(true);
                    saveScore();
                }
            }
        });

        window.addEventListener('keydown', (e) => {
            const gs = curGameState();
            if (gs.selectedCell === null) {
                return;
            }

            const newSelectedCell = (() => {
                switch (e.key) {
                    case 'ArrowUp':
                        if (gs.selectedCell - 9 < 0) {
                            return gs.selectedCell + 72;
                        }
                        return gs.selectedCell - 9;
                    case 'ArrowDown':
                        if (gs.selectedCell + 9 > 80) {
                            return gs.selectedCell - 72;
                        }
                        return gs.selectedCell + 9;
                    case 'ArrowLeft':
                        if (gs.selectedCell % 9 === 0) {
                            return gs.selectedCell + 8;
                        }
                        return gs.selectedCell - 1;
                    case 'ArrowRight':
                        if (gs.selectedCell % 9 === 8) {
                            return gs.selectedCell - 8;
                        }
                        return gs.selectedCell + 1;
                    case '1':
                        inputNumber(1);
                        return null;
                    case '2':
                        inputNumber(2);
                        return null;
                    case '3':
                        inputNumber(3);
                        return null;
                    case '4':
                        inputNumber(4);
                        return null;
                    case '5':
                        inputNumber(5);
                        return null;
                    case '6':
                        inputNumber(6);
                        return null;
                    case '7':
                        inputNumber(7);
                        return null;
                    case '8':
                        inputNumber(8);
                        return null;
                    case '9':
                        inputNumber(9);
                        return null;
                    case 'Backspace':
                    case 'Delete':
                        clearCell();
                        return null;
                    case 'z':
                        if (e.metaKey || e.ctrlKey) {
                            undo();
                        }
                        return null;
                    default:
                        return null;
                }
            })();

            if (newSelectedCell === null || newSelectedCell < 0 || newSelectedCell > 80) {
                return;
            }

            setSelectedCell(newSelectedCell);
        });
    });

    return (
        <Show when={state.id() != null && state.history() !== null && !state.loading()} fallback={<div>Loading...</div>}>
            <div class='h-[90vh] flex flex-col justify-between items-center lg:flex-row lg:justify-center m-1'>
                <div class='flex flex-col max-h-[50vh] max-w-[50vh] w-full lg:max-h-[75vh] lg:max-w-[75vh]'>
                    <Timer />
                    <SudokuBoard />
                </div>
                <div>
                    <SudokuIcons />
                    <SudokuNumberPad />
                </div>
            </div>
        </Show>
    );
};
