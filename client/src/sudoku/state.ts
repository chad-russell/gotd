import { createSignal } from "solid-js";
import { baseUrl, daysEqual, formatTime, getDay } from "../util";
import { token } from "../auth/auth";

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

export async function saveState() {
    if (!daysEqual(puzzleDay(), getDay())) {
        await loadGameFromServer();
    }

    if (id() === null) {
        return;
    }

    if (loading()) {
        return;
    }

    const historyLast1 = (history() ?? []).slice(-1);

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token()}`,
    };

    const timestamp = Date.now();

    localStorage.setItem('sudoku', JSON.stringify({
        id: id(),
        seconds: seconds(),
        paused: paused(),
        history: history(),
        winner: winner(),
        inputStyle: inputStyle(),
        puzzleDay: puzzleDay(),
        timestamp: timestamp,
    }));

    const body = JSON.stringify({
        puzzle_id: id(),
        state: JSON.stringify({
            id: id(),
            paused: paused(),
            seconds: seconds(),
            inputStyle: inputStyle(),
            history: historyLast1,
            puzzleDay: puzzleDay(),
        }),
        timestamp: timestamp,
        winner: winner(),
    });

    await fetch(`${baseUrl()}/sudoku/state`, {
        method: 'POST',
        headers: headers,
        body: body
    });
}

export async function loadGameFromServer() {
    if (loading()) {
        return;
    }
    setLoading(true);

    let local = localStorage.getItem('sudoku');
    let localTimestamp = null;
    if (local !== null) {
        let { id, solution, seconds, paused, history, inputStyle, puzzleDay, winner, timestamp } = JSON.parse(local);

        puzzleDay = new Date(puzzleDay);

        if (timestamp && puzzleDay && daysEqual(puzzleDay, getDay())) {
            localTimestamp = timestamp;

            setId(id);
            setSeconds(seconds);
            setPaused(paused);
            setHistory(history);
            setInputStyle(inputStyle);
            setPuzzleDay(puzzleDay);
            setWinner(winner);
            setSolution(solution);

            if (timestamp >= Date.now() - 1000 * 60) {
                setLoading(false);
                return;
            }
        }
    }

    const res = await fetch(`${baseUrl()}/sudoku/state`, {
        headers: {
            'Authorization': `Bearer ${token()}`
        }
    });
    const resJson = await res.json();

    if (resJson.timestamp) {
        let serverTimestamp = resJson.timestamp;
        if (localTimestamp && serverTimestamp <= localTimestamp) {
            setLoading(false);
            return;
        }
    }

    let [y, m, d] = resJson.day.split('-');
    let date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    setPuzzleDay(date);

    setSolution(resJson.solution);
    setId(resJson.id);

    if (resJson.state !== null) {
        localStorage.setItem('sudoku', JSON.stringify({
            ...JSON.parse(resJson.state),
            solution: resJson.solution,
            winner: resJson.winner,
            puzzleDay: date,
            timestamp: resJson.timestamp,
        }));

        let { seconds, paused, inputStyle, history } = JSON.parse(resJson.state);

        setSeconds(seconds);
        setPaused(paused);
        setHistory(history);
        setInputStyle(inputStyle);
        setWinner(resJson.winner);
    } else {
        const cells: CellState[] = resJson.puzzle.split('').map((c: string) => {
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

        setSeconds(0);

        localStorage.setItem('sudoku', JSON.stringify({
            id: resJson.id,
            seconds: 0,
            paused: false,
            history: history(),
            inputStyle: inputStyle(),
            winner: false,
            puzzleDay: date,
            timestamp: Date.now(),
        }));
    }

    setLoading(false);

    // saveState();
}

export function formatScore(): string {
    return `Sudoku: ${formatTime(seconds())}`;
}

