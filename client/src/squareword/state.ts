import { createSignal } from 'solid-js';
import { baseUrl, daysEqual, getDay } from '../util';
import { setToken, token } from '../auth/auth';

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

export async function loadHistory() {
    const fromStorage = localStorage.getItem('squareword');

    if (fromStorage) {
        let { id, puzzleDay, solution, guess, guessHistory, winner } = JSON.parse(fromStorage);

        puzzleDay = new Date(puzzleDay);
        solution = solution?.map((s: string) => s.toUpperCase());

        // If the save is from today, we can use it
        if (daysEqual(puzzleDay, getDay())) {
            setWinner(winner);
            setId(id);
            setSolution(solution);
            setGuess(guess);
            setGuessHistory(guessHistory);
            setPuzzleDay(puzzleDay);

            return;
        }
    }

    await loadGameFromServer();
}

export async function loadGameFromServer() {
    if (loading()) {
        return;
    }
    setLoading(true);

    const res = await fetch(`${baseUrl()}/squareword/today`, {
        headers: {
            'Authorization': `Bearer ${token()}`
        }
    });
    const resJson = await res.json();

    const sol = resJson.solution;

    setId(resJson.id);

    let [y, m, d] = resJson.day.split('-');
    let date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    setPuzzleDay(new Date(date));

    if (resJson.guesses != null) {
        let guesses = [];
        while (resJson.guesses.length > 0) {
            guesses.push(resJson.guesses.slice(0, 5));
            resJson.guesses = resJson.guesses.slice(5);
        }

        setWinner(true);
        setGuessHistory(guesses);
    }

    setSolution([
        sol.slice(0, 5),
        sol.slice(5, 10),
        sol.slice(10, 15),
        sol.slice(15, 20),
        sol.slice(20, 25),
    ]);

    localStorage.setItem('squareword', JSON.stringify({
        'id': id(),
        'solution': solution(),
        'guess': [],
        'guessHistory': guessHistory(),
        'puzzleDay': puzzleDay(),
        'winner': winner(),
    }));

    setLoading(false);
}

export async function saveScore() {
    const res = await fetch(`${baseUrl()}/squareword/score`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token()}`,
        },
        body: JSON.stringify({
            puzzle_id: id(),
            guesses: guessHistory().join(''),
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
