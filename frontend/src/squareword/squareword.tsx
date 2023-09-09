import { createSignal, type Component, createEffect, onMount, Show, For } from 'solid-js';
import { FiDelete } from 'solid-icons/fi';
import { FaSolidCheck } from 'solid-icons/fa';
import { DICTIONARY } from './dictionary';
import { daysEqual, getDay } from '../util';
import { Portal } from 'solid-js/web';

const [answer, setAnswer] = createSignal<Array<string> | null>(null);
const [puzzleDay, setPuzzleDay] = createSignal<Date | null>(null);

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
        'answer': answer(),
        'guess': guess(),
        'guessHistory': guessHistory(),
        'puzzleDay': puzzleDay(),
    }));
}

async function loadHistory() {
    const fromStorage = localStorage.getItem('squareword');

    if (fromStorage) {
        let { puzzleDay, answer, guess, guessHistory } = JSON.parse(fromStorage);
        puzzleDay = new Date(puzzleDay);

        // If the save is from today, we can use it
        if (daysEqual(puzzleDay, getDay())) {
            setAnswer(answer);
            setGuess(guess);
            setGuessHistory(guessHistory);
            setPuzzleDay(puzzleDay);

            return;
        }
    }

    await loadGameFromServer();
}

async function loadGameFromServer() {
    setAnswer(null);

    // read from the `/squareword/today` endpoint of the server
    let res = await fetch('http://localhost:3001/squareword/today');
    let answer = await res.json();
    setAnswer([
        answer.slice(0, 5),
        answer.slice(5, 10),
        answer.slice(10, 15),
        answer.slice(15, 20),
        answer.slice(20, 25),
    ]);

    setPuzzleDay(getDay());
}

function enterGuess() {
    if (guess().length != 5) {
        return;
    }

    if (!DICTIONARY.includes(guess().join(''))) {
        setGuessLock(true);
        setTimeout(() => {
            setGuessLock(false);
        }, 302);

        setGuessError(true);
        setTimeout(() => {
            setGuessError(false);
        }, 301);
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
            guess().push(props.letter);
            setGuess([...guess()]);
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
    return (
        <div class='bg-blue-500 border border-blue-800 rounded-md m-[1px]' onClick={() => setShowGuess(!showGuess())} />
    );
};

const SolutionTile: Component<{ col: number, row: number }> = (props) => {
    if (!answer()) {
        return <div />;
    }

    function correctLetter() {
        return answer()![props.row - 1][props.col];
    }

    function animatingSelf(): boolean {
        return (props.row == 1 && animatedRow1()) ||
            (props.row == 2 && animatedRow2()) ||
            (props.row == 3 && animatedRow3()) ||
            (props.row == 4 && animatedRow4()) ||
            (props.row == 5 && animatedRow5());
    }

    function animatingSelfOrBelow(): boolean {
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

        return animatedRow >= props.row;
    }

    function alreadyGuessedCorrectAnswer(): boolean {
        if (guessHistory().length < 1) {
            return false;
        }

        let toSub = 1;
        if (guessError()) {
            toSub = 0;
        }

        for (let guess of guessHistory().slice(0, guessHistory().length - toSub)) {
            if (guess[props.col] == correctLetter()) {
                return true;
            }
        }

        return false;
    }

    function letter(): string {
        if (alreadyGuessedCorrectAnswer()) {
            return correctLetter().toUpperCase();
        }

        if (guessLock() && !animatingSelfOrBelow()) {
            return '';
        }

        for (let guess of guessHistory()) {
            if (guess[props.col] == correctLetter()) {
                return correctLetter().toUpperCase();
            }
        }

        return '';
    }

    function animateReveal(): string {
        if (alreadyGuessedCorrectAnswer()) {
            return '';
        }

        if (!animatingSelf()) {
            return '';
        }

        if (letter() == '') {
            return '';
        }

        return 'animate-fadeInWithTranslate';
    }

    function animateBg() {
        if (alreadyGuessedCorrectAnswer()) {
            return 'bg-green-500';
        }

        if (guessLock() && !animatingSelfOrBelow()) {
            return '';
        }

        for (let guess of guessHistory()) {
            if (guess[props.col] == correctLetter()) {
                if (animatingSelf()) {
                    return 'animate-wowFadeIn bg-green-500';
                }

                return 'bg-green-500';
            }
        }

        if (animatingSelf()) {
            return 'animate-wow';
        }

        return '';
    }

    return (
        <div class={`border border-stone-800 rounded-md m-[1px] overflow-hidden flex flex-col justify-center items-center ${animateBg()}`}>
            <span style='font-size: min(6vw, 5vh);' class={`${animateReveal()}`}>{letter()}</span>
        </div>
    );
};

function misplacedLetters(row: number): Array<string> {
    const ml = new Set<string>();

    const a = answer();
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
    return (
        <div style='font-size: min(3vw, 2vh)' class='flex flex-row items-center justify-center bg-yellow-400 border border-stone-800 rounded-md m-[1px]'>
            {[...misplacedLetters(props.row).map((ml) => ml.toUpperCase())].join(' ')}
        </div>
    );
};

const SquarewordBoard: Component = () => {
    return (
        <div class='grid grid-cols-6 grid-rows-6 overflow-hidden aspect-square p-3'>
            {/* Guess Row */}
            <GuessTile index={0} />
            <GuessTile index={1} />
            <GuessTile index={2} />
            <GuessTile index={3} />
            <GuessTile index={4} />
            <ViewGuessTile />

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
                        {(guess) => <div class='text-2xl'>{guess}</div>}
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
        <Show when={answer()} fallback={<div>Loading...</div>}>
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
