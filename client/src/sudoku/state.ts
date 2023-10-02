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

    const historyLast5 = (history() ?? []).slice(-1);

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token()}`,
    };

    const body = JSON.stringify({
        puzzle_id: id(),
        state: JSON.stringify({
            'id': id(),
            'paused': paused(),
            'seconds': seconds(),
            'inputStyle': inputStyle(),
            'history': historyLast5,
            'puzzleDay': puzzleDay(),
        }),
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

    let res = await fetch(`${baseUrl()}/sudoku/state`, {
        headers: {
            'Authorization': `Bearer ${token()}`
        }
    });
    let p = await res.json();

    let [y, m, d] = p.day.split('-');
    let date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    setPuzzleDay(date);

    if (p.state !== null) {
        let { id, seconds, paused, history } = JSON.parse(p.state);

        setId(id);
        setSeconds(seconds);
        setPaused(paused);
        setHistory(history);
        setSolution(p.solution);
        setWinner(p.winner);
    } else {
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
    }

    setLoading(false);

    saveState();
}

export function formatScore(): string {
    return `Sudoku: ${formatTime(seconds())}`;
}

