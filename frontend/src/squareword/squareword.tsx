import { createSignal, type Component, createEffect, onMount, Show, For } from 'solid-js';
import { FiDelete } from 'solid-icons/fi';
import { FaSolidCheck } from 'solid-icons/fa';
import { DICTIONARY } from './dictionary';
import { daysEqual, getDay } from '../util';
import { Portal } from 'solid-js/web';
import { setToken, token } from '../auth/auth';

const [solution, setSolution] = createSignal<Array<string> | null>(null);
const [puzzleDay, setPuzzleDay] = createSignal<Date | null>(null);
const [id, setId] = createSignal<string | null>(null);
const [loading, setLoading] = createSignal(false);

const [guess, setGuess] = createSignal<Array<string>>([]);

const [guessHistory, setGuessHistory] = createSignal<Array<string>>([]);

const [showGuess, setShowGuess] = createSignal<boolean>(false);

const [guessLock, setGuessLock] = createSignal<boolean>(false);
const [animatedRow1, setAnimatedRow1] = createSignal<boolean>(false);
const [animatedRow2, setAnimatedRow2] = createSignal<boolean>(false);
const [animatedRow3, setAnimatedRow3] = createSignal<boolean>(false);
const [animatedRow4, setAnimatedRow4] = createSignal<boolean>(false);
const [animatedRow5, setAnimatedRow5] = createSignal<boolean>(false);

const [guessError, setGuessError] = createSignal<boolean>(false);

const [winner, setWinner] = createSignal(false);

function isCorrectDay() {
    return daysEqual(puzzleDay(), getDay());
}

async function saveHistory() {
    // If local storage is for a different day, clear it and load from server
    if (!isCorrectDay()) {
        localStorage.removeItem('squareword');
        await loadGameFromServer();
    }

    localStorage.setItem('squareword', JSON.stringify({
        'id': id(),
        'solution': solution(),
        'guess': guess(),
        'guessHistory': guessHistory(),
        'puzzleDay': puzzleDay(),
        'winner': winner(),
    }));
}

function correctLetter(row: number, col: number) {
    return solution()![row - 1][col];
}

function animatingRow(row: number): boolean {
    return (row == 1 && animatedRow1()) ||
        (row == 2 && animatedRow2()) ||
        (row == 3 && animatedRow3()) ||
        (row == 4 && animatedRow4()) ||
        (row == 5 && animatedRow5());
}

function animatingRowOrBelow(row: number): boolean {
    let animatedRow = null;
    if (animatedRow1()) {
        animatedRow = 1;
    }
    if (animatedRow2()) {
        animatedRow = 2;
    }
    if (animatedRow3()) {
        animatedRow = 3;
    }
    if (animatedRow4()) {
        animatedRow = 4;
    }
    if (animatedRow5()) {
        animatedRow = 5;
    }

    if (animatedRow == null) {
        return false;
    }

    return animatedRow >= row;
}

function alreadyGuessedCorrectSolution(row: number, col: number): boolean {
    if (guessHistory().length < 1) {
        return false;
    }

    let toSub = 1;
    if (guessError()) {
        toSub = 0;
    }

    for (let guess of guessHistory().slice(0, guessHistory().length - toSub)) {
        if (guess[col] == correctLetter(row, col)) {
            return true;
        }
    }

    return false;
}

function winnerRow(row: number, col: number): boolean {
    if (alreadyGuessedCorrectSolution(row, col)) {
        return true;
    }

    if (guessLock() && !animatingRowOrBelow(row)) {
        return false;
    }

    for (let guess of guessHistory()) {
        if (guess[col] == correctLetter(row, col)) {
            return true;
        }
    }

    if (animatingRow(row)) {
        return false;
    }

    return false;
}

async function loadHistory() {
    const fromStorage = localStorage.getItem('squareword');

    if (fromStorage) {
        let { id, puzzleDay, solution, guess, guessHistory, winner } = JSON.parse(fromStorage);

        puzzleDay = new Date(puzzleDay);

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

async function loadGameFromServer() {
    if (loading()) {
        return;
    }
    setLoading(true);

    // read from the `/squareword/today` endpoint of the server
    const res = await fetch('http://localhost:3001/squareword/today');
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

async function saveScore() {
    const res = await fetch('http://localhost:3001/squareword/score', {
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

function notifyGuessError() {
    setGuessLock(true);
    setTimeout(() => {
        setGuessLock(false);
    }, 302);

    setGuessError(true);
    setTimeout(() => {
        setGuessError(false);
    }, 301);
}

function enterGuess() {
    if (guess().length != 5) {
        return;
    }

    for (let g of guessHistory()) {
        if (g == guess().join('')) {
            notifyGuessError();
            return;
        }
    }

    if (!DICTIONARY.includes(guess().join(''))) {
        notifyGuessError();
        return;
    }

    if (guessLock()) {
        return;
    }

    setGuessHistory([...guessHistory(), guess().join('')]);

    setGuessLock(true);
    setTimeout(() => {
        setGuessLock(false);
    }, 999);

    setAnimatedRow1(true);
    setTimeout(() => {
        setGuess([]);
        setAnimatedRow1(false);
    }, 201);

    setTimeout(() => {
        setAnimatedRow2(true);
    }, 100);
    setTimeout(() => {
        setAnimatedRow2(false);
    }, 401);

    setTimeout(() => {
        setAnimatedRow3(true);
    }, 300);
    setTimeout(() => {
        setAnimatedRow3(false);
    }, 601);

    setTimeout(() => {
        setAnimatedRow4(true);
    }, 500);
    setTimeout(() => {
        setAnimatedRow4(false);
    }, 801);

    setTimeout(() => {
        setAnimatedRow5(true);
    }, 700);
    setTimeout(() => {
        setAnimatedRow5(false);
    }, 1001);
}

const SquarewordKeyboard: Component = () => {
    return (
        <div class='flex flex-col font-mono'>
            {/* Row 1 */}
            <div class='flex flex-row w-full px-5 justify-center py-1'>
                <KeyboardLetter letter='Q' />
                <KeyboardLetter letter='W' />
                <KeyboardLetter letter='E' />
                <KeyboardLetter letter='R' />
                <KeyboardLetter letter='T' />
                <KeyboardLetter letter='Y' />
                <KeyboardLetter letter='U' />
                <KeyboardLetter letter='I' />
                <KeyboardLetter letter='O' />
                <KeyboardLetter letter='P' />
            </div>

            {/* Row 2 */}
            <div class='flex flex-row w-full px-5 justify-center py-1'>
                <KeyboardLetter letter='A' />
                <KeyboardLetter letter='S' />
                <KeyboardLetter letter='D' />
                <KeyboardLetter letter='F' />
                <KeyboardLetter letter='G' />
                <KeyboardLetter letter='H' />
                <KeyboardLetter letter='J' />
                <KeyboardLetter letter='K' />
                <KeyboardLetter letter='L' />
            </div>

            {/* Row 3 */}
            <div class='flex flex-row px-5 justify-center py-1'>
                <KeyboardLetter letter='ENT' />
                <KeyboardLetter letter='Z' />
                <KeyboardLetter letter='X' />
                <KeyboardLetter letter='C' />
                <KeyboardLetter letter='V' />
                <KeyboardLetter letter='B' />
                <KeyboardLetter letter='N' />
                <KeyboardLetter letter='M' />
                <KeyboardLetter letter='DEL' />
            </div>
        </div>
    );
}

const KeyboardLetter: Component<{ letter: string }> = (props) => {
    let letter = <span>{props.letter}</span>;
    function colorClasses(): string {
        if (props.letter == 'DEL') {
            letter = <FiDelete />;
            return 'bg-red-300';
        }

        else if (props.letter == 'ENT') {
            letter = <FaSolidCheck />;
            return 'bg-blue-300';
        }

        let ml = new Set<string>();
        for (var i = 1; i < 6; i++) {
            let mli = misplacedLetters(i);
            for (const l of mli) {
                ml.add(l.toUpperCase());
            }
        }

        if (ml.has(props.letter)) {
            return 'bg-yellow-200';
        }

        // If the letter has been guessed at all and we haven't already returned yellow,
        // then it's correct so return green
        for (let guess of guessHistory()) {
            if (guess.includes(props.letter.toLowerCase())) {
                return 'bg-green-200';
            }
        }

        return '';
    };

    return <button
        style='font-size: min(6vw, 4vh)'
        class={`py-1 px-2 md:px-3 mx-[1px] md:mx-[2px] border border-stone-800 rounded-md select-none ${colorClasses()}`}
        onClick={() => {
            if (props.letter == 'DEL') {
                if (guess().length > 0) {
                    guess().pop();
                    setGuess([...guess()]);
                }
            }
            else if (props.letter == 'ENT') {
                enterGuess();
            }
            else {
                guess().push(props.letter);
                setGuess([...guess()]);
            }
        }}
    >
        {letter}
    </button>
};

const GuessTile: Component<{ index: number }> = (props) => {
    function letter() {
        if (guess().length <= props.index) {
            return null;
        }

        return guess()[props.index].toUpperCase();
    }

    function divAnimatedStyle() {
        if (guessError()) {
            return 'animate-flashError';
        }

        return '';
    }

    function spanAnimatedStyle() {
        if (guessError()) {
            return 'animate-wiggle';
        }

        if (guessLock()) {
            return 'animate-fadeOutWithTranslate';
        }

        return '';
    }

    return (
        <div class={`bg-teal-100 border border-teal-800 rounded-md m-[1px] overflow-hidden flex flex-col justify-center items-center ${divAnimatedStyle()}`}>
            <span style='font-size: min(6vw, 5vh);' class={`${spanAnimatedStyle()}`}>{letter()}</span>
        </div>
    );
};

const ViewGuessTile: Component = () => {
    function pluralize(n: number, s: string) {
        if (n == 1) {
            return `${s}`;
        }
        else {
            return `${s}es`;
        }
    }

    function value() {
        return (
            <div class='flex flex-col items-center justify-center'>
                <span class='text-xl'>{guessHistory().length}</span>
                <span class='text-xs md:text-xl'>{pluralize(guessHistory().length, 'Guess')}</span>
            </div>
        );
    }

    return (
        <div class='bg-blue-500 border border-blue-800 rounded-md m-[1px] flex flex-col items-center justify-center' onClick={() => setShowGuess(!showGuess())}>
            {value()}
        </div>
    );
};

const SolutionTile: Component<{ col: number, row: number }> = (props) => {
    if (!solution()) {
        return <div />;
    }

    function letter(): string {
        if (alreadyGuessedCorrectSolution(props.row, props.col)) {
            return correctLetter(props.row, props.col).toUpperCase();
        }

        if (guessLock() && !animatingRowOrBelow(props.row)) {
            return '';
        }

        for (let guess of guessHistory()) {
            if (guess[props.col] == correctLetter(props.row, props.col)) {
                return correctLetter(props.row, props.col).toUpperCase();
            }
        }

        return '';
    }

    function animateReveal(): string {
        if (alreadyGuessedCorrectSolution(props.row, props.col)) {
            return '';
        }

        if (!animatingRow(props.row)) {
            return '';
        }

        if (letter() == '') {
            return '';
        }

        return 'animate-fadeInWithTranslate';
    }

    function animateBg() {
        if (alreadyGuessedCorrectSolution(props.row, props.col)) {
            return 'bg-green-500';
        }

        if (guessLock() && !animatingRowOrBelow(props.row)) {
            return '';
        }

        for (let guess of guessHistory()) {
            if (guess[props.col] == correctLetter(props.row, props.col)) {
                if (animatingRow(props.row)) {
                    return 'animate-wowFadeIn bg-green-500';
                }

                return 'bg-green-500';
            }
        }

        if (animatingRow(props.row)) {
            return 'animate-wow';
        }

        return '';
    }

    function value() {
        if (winner()) {
            return '🎉';
        }
        else {
            return letter();
        }
    }

    return (
        <div class={`border border-stone-800 rounded-md m-[1px] overflow-hidden flex flex-col justify-center items-center ${animateBg()}`}>
            <span style='font-size: min(6vw, 5vh);' class={`${animateReveal()}`}>{value()}</span>
        </div>
    );
};

function misplacedLetters(row: number): Array<string> {
    const ml = new Set<string>();

    const a = solution();
    const gLen = guessHistory().length;

    if (!a || gLen == 0) {
        return [];
    }

    const ans = a[row - 1];

    const consideredGuesses = guessHistory();

    for (let ai = 0; ai < 5; ai++) {
        // Did we guess it at all?
        let correctGuess = false;
        for (const g of consideredGuesses) {
            if (g[ai] == ans[ai]) {
                correctGuess = true;
                break;
            }
        }

        if (correctGuess) {
            continue;
        }

        // Did we guess it in the wrong spot?
        for (const g of consideredGuesses) {
            for (let gi = 0; gi < 5; gi++) {
                if (gi != ai && g[gi] == ans[ai]) {
                    ml.add(g[gi]);
                }
            }
        }
    }

    let mlArr = [...ml];
    mlArr.sort();

    return mlArr;
}

const MisplacedLettersTile: Component<{ row: number }> = (props) => {
    function value() {
        if (winner()) {
            return '🎉';
        }
        else {
            return [...misplacedLetters(props.row).map((ml) => ml.toUpperCase())].join(' ');
        }
    }

    function fontSize() {
        if (winner()) {
            return 'min(6vw, 5vh)';
        }
        else {
            return 'min(3vw, 2vh)';
        }
    }

    return (
        <div style={`font-size: ${fontSize()}`} class='flex flex-row items-center justify-center bg-yellow-400 border border-stone-800 rounded-md m-[1px]'>
            {value()}
        </div>
    );
};

const SquarewordBoard: Component = () => {
    function guessRow() {
        if (winner()) {
            return (
                <div class='col-span-6 flex flex-row items-center justify-center text-3xl md:text-4xl lg:text-5xl text-slate-700 select-none'>
                    <span>WINNER!!</span>
                    <span class='ml-3 text-blue-700' onClick={() => setShowGuess(true)}>{`(${guessHistory().length}) Guesses`}</span>
                </div>
            );
        }
        else {
            return (
                <>
                    <GuessTile index={0} />
                    <GuessTile index={1} />
                    <GuessTile index={2} />
                    <GuessTile index={3} />
                    <GuessTile index={4} />
                    <ViewGuessTile />
                </>
            );
        }
    }
    return (
        <div class='grid grid-cols-6 grid-rows-6 overflow-hidden aspect-square p-3'>
            {/* Guess Row */}
            {guessRow()}

            {/* Solution Row 1 */}
            <SolutionTile col={0} row={1} />
            <SolutionTile col={1} row={1} />
            <SolutionTile col={2} row={1} />
            <SolutionTile col={3} row={1} />
            <SolutionTile col={4} row={1} />
            <MisplacedLettersTile row={1} />

            {/* Solution Row 2 */}
            <SolutionTile col={0} row={2} />
            <SolutionTile col={1} row={2} />
            <SolutionTile col={2} row={2} />
            <SolutionTile col={3} row={2} />
            <SolutionTile col={4} row={2} />
            <MisplacedLettersTile row={2} />

            {/* Solution Row 3 */}
            <SolutionTile col={0} row={3} />
            <SolutionTile col={1} row={3} />
            <SolutionTile col={2} row={3} />
            <SolutionTile col={3} row={3} />
            <SolutionTile col={4} row={3} />
            <MisplacedLettersTile row={3} />

            {/* Solution Row 4 */}
            <SolutionTile col={0} row={4} />
            <SolutionTile col={1} row={4} />
            <SolutionTile col={2} row={4} />
            <SolutionTile col={3} row={4} />
            <SolutionTile col={4} row={4} />
            <MisplacedLettersTile row={4} />

            {/* Solution Row 5 */}
            <SolutionTile col={0} row={5} />
            <SolutionTile col={1} row={5} />
            <SolutionTile col={2} row={5} />
            <SolutionTile col={3} row={5} />
            <SolutionTile col={4} row={5} />
            <MisplacedLettersTile row={5} />
        </div>
    );
};

const GuessModal = () => {
    return (
        <div
            class='fixed inset-x-0 inset-y-0 flex flex-col justify-center items-center bg-black bg-opacity-50'
            onClick={() => setShowGuess(false)}
        >
            <div class='w-1/2 max-w-[200px] h-1/2 py-2 bg-blue-300 p-30 flex flex-col items-center justify-center rounded-md' onClick={(e) => { e.stopPropagation() }}>
                <div class='overflow-scroll w-full flex flex-col items-center'>
                    <For each={guessHistory()}>
                        {(guess) => <div class='text-2xl my-2'>{guess.toUpperCase()}</div>}
                    </For>
                </div>
            </div>
        </div>
    );
};

export const Squareword: Component = () => {
    onMount(() => {
        loadHistory();

        createEffect(() => {
            saveHistory();
        });

        createEffect(() => {
            const a = solution();
            const gs = guessHistory();

            if (!a) {
                return;
            }

            if (gs.length < 5) {
                return;
            }

            for (let row = 1; row < 6; row++) {
                for (let col = 1; col < 6; col++) {
                    if (!winnerRow(row, col)) {
                        return false;
                    }
                }
            }

            if (winner()) {
                return;
            }

            setWinner(true);
            saveScore();
        });
    });

    window.addEventListener('keydown', (e) => {
        // If holding down command or control, ignore
        if (e.metaKey || e.ctrlKey) {
            return null;
        }

        if (e.key >= 'a' && e.key <= 'z') {
            if (guess().length < 5) {
                guess().push(e.key);
                setGuess([...guess()]);
            }
        }
        switch (e.key) {
            case 'Backspace':
            case 'Delete':
                if (guess().length > 0) {
                    guess().pop();
                    setGuess([...guess()]);
                }
                return null;
            case 'Enter':
                enterGuess();
            default:
                return null;
        }
    });

    return (
        <Show when={id() && !loading()} fallback={<div>Loading...</div>}>
            <div class='h-[90vh] flex flex-col justify-center items-center m-1'>
                <div class='flex flex-col max-h-[90vh] max-w-[60vh] w-full'>
                    <SquarewordBoard />
                    <SquarewordKeyboard />
                </div>
            </div>
            <Show when={showGuess()}>
                <Portal mount={document.body}><GuessModal /></Portal>
            </Show>
        </Show>
    );
};
