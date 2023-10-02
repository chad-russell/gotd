import { createSignal, type Component, Show, onMount, createEffect } from 'solid-js';
import { IoArrowUndoOutline, IoShareOutline } from 'solid-icons/io'
import { TbNumbers } from 'solid-icons/tb'
import { FiDelete } from 'solid-icons/fi'
import { BsPatchQuestionFill, BsPauseCircle, BsPlayCircle } from 'solid-icons/bs'
import { BsPencil } from 'solid-icons/bs'
import toast from 'solid-toast';
import { formatTime } from '../util';
import * as state from './state';
import { createMediaQuery } from "@solid-primitives/media";

const [noErrAnim, setNoErrAnim] = createSignal(false);
const [winnerColorChange, setWinnerColorChange] = createSignal(0);

const isSmall = createMediaQuery("(max-width: 640px)");

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

const Note: Component<{ n: number, notenum: number }> = (props) => {
    const notes = () => curGameState()?.cells[props.n]?.notes;

    return (
        <div class='w-full h-full flex flex-col items-center justify-center text-[1.3vh] md:text-[1.9vh] text-gray-700 font-thin'>
            {notes()?.includes(props.notenum) ? props.notenum : null}
        </div>
    );
}

const Notes: Component<{ n: number }> = (props) => {

    return (
        <div class='grid grid-rows-3 grid-cols-3 w-full h-full'>
            <Note n={props.n} notenum={1} />
            <Note n={props.n} notenum={2} />
            <Note n={props.n} notenum={3} />
            <Note n={props.n} notenum={4} />
            <Note n={props.n} notenum={5} />
            <Note n={props.n} notenum={6} />
            <Note n={props.n} notenum={7} />
            <Note n={props.n} notenum={8} />
            <Note n={props.n} notenum={9} />
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
            // For subscription purposes only
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
        // Top left corner
        if (props.n === 0) {
            return 'rounded-tl-xl md:rounded-tl-2xl border-t-[1px] md:border-t-[2px] border-l-[1px] md:border-l-[2px]';
        }

        // Top side
        else if (props.n > 0 && props.n < 8) {
            return 'border-t-[1px] md:border-t-[2px]';
        }

        // Top right corner
        else if (props.n === 8) {
            return 'rounded-tr-xl md:rounded-tr-2xl border-t-[1px] md:border-t-[2px] border-r-[1px] md:border-r-[2px]';
        }

        // Bottom left corner
        else if (props.n === 72) {
            return 'rounded-bl-xl md:rounded-bl-2xl border-b-[1px] md:border-b-[2px] border-l-[1px] md:border-l-[2px]';
        }

        // Bottom side
        else if (props.n > 72 && props.n < 80) {
            return 'border-b-[1px] md:border-b-[2px]';
        }

        // Bottom right corner
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

    function fontSize(): string {
        if (isSmall()) {
            return '3vh';
        }

        return 'min(4vh, 8vw)';
    }

    return (
        <div
            class={`w-full h-full border-[0.5px] border-slate-300 aspect-square text-center flex flex-col items-center overflow-hidden justify-center ${bgStyle()} ${radiusStyle()}`}
            onClick={() => {
                setSelectedCell(props.n);
            }}
        >
            <Show when={hasValue() || state.paused()} fallback={<Notes n={props.n} />}>
                <span style={`font-size: ${fontSize()}`} class={`z-10 select-none ${textStyle()} transition ease-in-out duration-100`}>
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
        <div class={`grid grid-cols-3 overflow-hidden grid-rows-3 h-full w-full aspect-square border-stone-600 ${borderStyle()}`}>
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

        return 'hover:bg-none sm:hover:bg-blue-100 active:bg-blue-200 sm:active:bg-blue-200 text-slate-600 py-1 lg:py-5 border border-stone-300';
    }

    function fontSize(): string {
        if (isSmall()) {
            return '2.8vh';
        }

        return 'min(4vh, 8vw)';
    }

    return (
        <button
            disabled={state.winner() || allFilled(props.n)}
            style={`font-size: ${fontSize()}`}
            class={`text-center flex flex-col items-center justify-center m-1 rounded-xl select-none ${style()}`}
            onClick={() => inputNumber(props.n)}
        >
            {props.n}
        </button >
    );
}

const SudokuNumberPad: Component = () => {
    return (
        <div class='grid grid-cols-3 grid-rows-3 pt-2 mb-2 w-full lg:w-[100%] lg:max-h-[70%]'>
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
    function style(): string {
        if (isSmall()) {
            return 'calc(min(50dvh, 90vw))';
        }

        return `calc(min(45dvh, 85vw) + 12vw)`;
    }

    return (
        <div style={`height: ${style()}; width: ${style()};`} class='grid grid-cols-3 grid-rows-3'>
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

    function fontSize(): string {
        if (isSmall()) {
            return '2vh';
        }

        return '2.5vh';
    }

    return (
        <div
            class='col-span-1 flex flex-col items-center justify-center h-[90%] border text-slate-700 bg-white border-stone-800 rounded-md py-1 m-1 hover:bg-none sm:hover:bg-blue-100 active:bg-blue-200 sm:active:bg-blue-200'
            onClick={() => swapInputStyle()}
        >
            <button
                style={`font-size: ${fontSize()}; ${transform('number')}`}
                class='flex flex-col justify-end items-center absolute transition-all'
            >
                <TbNumbers color="rgb(47, 41, 36)" />
                <span>Number</span>
            </button>
            <button
                style={`font-size: ${fontSize()}; ${transform('note')}`}
                class='flex flex-col justify-end items-center relative transition-all'
            >
                <BsPencil color="rgb(47, 41, 36)" />
                <span>Note</span>
            </button>
        </div>
    )
};

const ShareButton: Component = () => {
    return (
        <div class='w-full flex flex-row justify-center'>
            <button
                style={`font-size: 2.5vh`}
                class='flex flex-row justify-center items-center h-[min(60px, 10vh)] py-2 md:py-4 mt-4 md:mt-2 px-10 border border-stone-800 text-slate-700 bg-white rounded-md m-1 hover:bg-none sm:hover:bg-blue-100 active:bg-blue-200 sm:active:bg-blue-200'
                onClick={() => {
                    navigator.clipboard.writeText(`${state.formatScore()}\nhttps://gotd.crussell.io/`);
                    toast.success('Copied to clipboard', { duration: 2000 });
                }}
            >
                <IoShareOutline class='mr-3' color="rgb(47, 41, 36)" />
                <span>Share</span>
            </button>
        </div>
    );
};

const SudokuIcons: Component = () => {
    function fontSize(): string {
        if (isSmall()) {
            return '2vh';
        }

        return '2.5vh';
    }

    return (
        <div class='grid grid-cols-4 select-none w-full'>
            <button
                style={`font-size: ${fontSize()}`}
                class='flex flex-col justify-center items-center h-[90%] border border-stone-800 text-slate-700 bg-white rounded-md m-1 hover:bg-none sm:hover:bg-red-100 active:bg-red-200 sm:active:bg-red-200'
                disabled={state.winner() || state.paused() || state.history()?.length === 1}
                onClick={() => undo()}
            >
                <IoArrowUndoOutline color="rgb(47, 41, 36)" />
                <span>Undo</span>
            </button>
            <button
                style={`font-size: ${fontSize()}`}
                class='flex flex-col justify-center items-center h-[90%] border text-slate-700 bg-white border-stone-800 rounded-md m-1 hover:bg-none sm:hover:bg-blue-100 active:bg-blue-200 sm:active:bg-blue-200'
                disabled={state.winner() || state.paused()}
                onClick={() => clearCell()}
            >
                <FiDelete color="rgb(47, 41, 36)" />
                <span>Clear</span>
            </button>
            <InputStyle />
            <button
                disabled={state.winner() || noErrAnim() || state.paused()}
                style={`font-size: ${fontSize()}`}
                class='flex flex-col justify-center items-center h-[90%] border text-slate-700 bg-white border-stone-800 rounded-md m-1 hover:bg-none sm:hover:bg-blue-100 active:bg-blue-200 sm:active:bg-blue-200'
                onClick={() => checkCells()}
            >
                <BsPatchQuestionFill color="rgb(47, 41, 36)" />
                <span>Check</span>
            </button>
        </div>
    );
};

const Timer: Component = () => {
    function time() {
        if (state.winner()) {
            return 'Final Time:';
        }

        return 'Time:';
    }

    return (
        <div class='flex flex-row h-[8dvh] md:h-[10dvh] items-center justify-center'>
            <div
                class={`flex flex-row items-center py-1 px-4 md:my-1 text-lg md:text-xl lg:text-2xl text-center text-blue-600 bg-white border border-stone-800 rounded-md shadow-lg`}
                onClick={() => {
                    if (state.winner()) {
                        return;
                    }

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

export const Sudoku: Component = () => {
    onMount(() => {
        state.loadGameFromServer();

        setInterval(() => {
            if (!state.winner() && !state.paused()) {
                state.setSeconds(s => s + 1);
            }
        }, 1000);

        createEffect(() => {
            state.saveState();
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

            if (state.loading()) {
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
                    console.log('YOU WIN!!');
                    state.setWinner(true);
                    state.saveState(true);
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
                    case 'n':
                        swapInputStyle();
                        return null;
                    case ' ':
                        state.setPaused(!state.paused());
                        return null;
                    case 'z':
                        if (e.metaKey || e.ctrlKey) {
                            undo();
                        }
                        return null;
                    default:
                        // console.log(e.key);
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
            <div class='h-full w-full flex flex-col items-center lg:flex-row lg:justify-center p-1'>
                <div class='flex flex-col w-full max-h-[60dvh] md:max-h-full overflow-hidden lg:h-[80%] items-center justify-start xl:mx-8 xl:w-[42%]'>
                    <Timer />
                    <SudokuBoard />
                </div>
                <div class='w-full max-h-[32dvh] md:max-h-full overflow-hidden flex flex-row items-center justify-center xl:w-[30%]'>
                    <div class='w-full h-full lg:h-[80%] lg:flex lg:flex-col lg:items-center lg:justify-center'>
                        <Show when={!state.winner()} fallback={<ShareButton />}>
                            <SudokuIcons />
                            <SudokuNumberPad />
                        </Show>
                    </div>
                </div>
            </div>
        </Show>
    );
};
