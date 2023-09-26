import { createSignal } from "solid-js";
import { daysEqual, getDay } from "../util";

export const [id, setId] = createSignal<string | null>(null);
export const [paused, setPaused] = createSignal(false);
export const [seconds, setSeconds] = createSignal(0);
export const [inputStyle, setInputStyle] = createSignal<'number' | 'note'>('number');
export const [puzzleDay, setPuzzleDay] = createSignal<Date | null>(null);
export const [solution, setSolution] = createSignal<string | null>(null);
export const [loading, setLoading] = createSignal(false);
export const [winner, setWinner] = createSignal(false);

export function clearAll() {
    setId(null);
    setPaused(false);
    setSeconds(0);
    setInputStyle('number');
    setPuzzleDay(null);
    setSolution(null);
    setLoading(false);
    setWinner(false);
    setHistory(null);
}

export type CellState = {
    value: number | null,
    isGiven: boolean,
    check: boolean | null,
    notes: number[],
};

export type GameState = {
    selectedCell: number | null,
    cells: CellState[],
};

export type History = GameState[];

export const [history, setHistory] = createSignal<History | null>(null, { equals: false });

export async function loadHistory() {
    // Look in local storage first
    const fromStorage = localStorage.getItem('sudoku');

    if (fromStorage !== null) {
        let { id, puzzleDay, seconds, paused, history, solution, winner } = JSON.parse(fromStorage);
        puzzleDay = new Date(puzzleDay);

        // If the save is from today, we can use it
        if (daysEqual(puzzleDay, getDay())) {
            setId(id);
            setSeconds(seconds);
            setPaused(paused);
            setHistory(history);
            setPuzzleDay(puzzleDay);
            setSolution(solution);
            setWinner(winner);

            return;
        }
    }

    await loadGameFromServer();
}

export async function saveLocal() {
    localStorage.setItem('sudoku', JSON.stringify({
        'id': id(),
        'paused': paused(),
        'seconds': seconds(),
        'inputStyle': inputStyle(),
        'history': history(),
        'puzzleDay': puzzleDay(),
        'solution': solution(),
        'winner': winner(),
    }));
}

export async function loadGameFromServer() {
    if (loading()) {
        return;
    }
    setLoading(true);

    // read from the `/sudoku/today` endpoint of the server
    let res = await fetch('http://server:3001/sudoku/today');
    let p = await res.json();

    const cells: CellState[] = p.puzzle.split('').map((c: string) => {
        if (c === '-') {
            return {
                value: null,
                isGiven: false,
                notes: [],
                check: null,
            };
        }

        return {
            value: parseInt(c),
            isGiven: true,
            notes: [],
            check: null,
        };
    });

    setHistory([{
        selectedCell: null,
        cells,
    }]);

    setSolution(p.solution);

    setId(p.id);

    setSeconds(0);

    if (p.seconds != null) {
        setSeconds(p.seconds);
        setWinner(true);
        setPaused(true);
    }

    let [y, m, d] = p.day.split('-');
    let date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    setPuzzleDay(date);

    setLoading(false);

    saveLocal();
}
