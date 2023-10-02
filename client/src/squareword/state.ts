import { createSignal } from 'solid-js';
import { baseUrl, daysEqual, getDay } from '../util';
import { token } from '../auth/auth';

export const [id, setId] = createSignal<string | null>(null);
export const [loading, setLoading] = createSignal(false);
export const [solution, setSolution] = createSignal<Array<string> | null>(null);
export const [guess, setGuess] = createSignal<Array<string>>([]);
export const [guessHistory, setGuessHistory] = createSignal<Array<string>>([]);
export const [puzzleDay, setPuzzleDay] = createSignal<Date | null>(null);
export const [winner, setWinner] = createSignal(false);

export function clearAll() {
    setId(null);
    setLoading(false);
    setSolution(null);
    setGuess([]);
    setGuessHistory([]);
    setPuzzleDay(null);
    setWinner(false);
}

export async function loadGameFromServer() {
    if (loading()) {
        return;
    }
    setLoading(true);

    const res = await fetch(`${baseUrl()}/squareword/state`, {
        headers: {
            'Authorization': `Bearer ${token()}`
        }
    });
    const resJson = await res.json();

    const sol = resJson.solution;
    setSolution([
        sol.slice(0, 5).toUpperCase(),
        sol.slice(5, 10).toUpperCase(),
        sol.slice(10, 15).toUpperCase(),
        sol.slice(15, 20).toUpperCase(),
        sol.slice(20, 25).toUpperCase(),
    ]);

    setId(resJson.id);

    let [y, m, d] = resJson.day.split('-');
    let date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    setPuzzleDay(new Date(date));

    if (resJson.state != null) {
        const parsed = JSON.parse(resJson.state);
        setGuess(parsed.guess);
        setGuessHistory(parsed.guessHistory);
        setWinner(resJson.winner);
    }

    setLoading(false);
}

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

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token()}`,
    };

    const body = JSON.stringify({
        puzzle_id: id(),
        state: JSON.stringify({
            'id': id(),
            'guess': guess(),
            'guessHistory': guessHistory(),
            'puzzleDay': puzzleDay(),
        }),
        winner: winner(),
    });

    await fetch(`${baseUrl()}/squareword/state`, {
        method: 'POST',
        headers: headers,
        body: body,
    });
}

export function formatScore(): string {
    return `Squareword: ${guessHistory().length} guesses`;
}

