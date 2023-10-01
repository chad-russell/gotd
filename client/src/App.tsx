import { type Component, Show, onMount, createEffect } from 'solid-js';
import { Router, Route, Routes } from "@solidjs/router";
import { Sudoku } from './sudoku/sudoku';
import { LoginScreen, loggedIn, token, setToken } from './auth/auth';
import { Squareword } from './squareword/squareword';
import { Leaderboard } from './leaderboard/leaderboard';
import * as squarewordState from './squareword/state';
import * as sudokuState from './sudoku/state';
import { TopBar } from './common/topBar';
import toast, { Toaster } from 'solid-toast';
import { IoShareOutline } from 'solid-icons/io';

const SudokuHome: Component = () => {
    return (
        <div class='h-full max-h-[100dvh] w-full flex flex-col justify-between items-center'>
            <TopBar title={'Sudoku'} />
            <Sudoku />
        </div>
    );
};

const SquarewordHome: Component = () => {
    return (
        <div class='max-h-[100dvh] w-full flex-col justify-between items-center'>
            <TopBar title={'Squareword'} />
            <Squareword />
        </div>
    );
};

const LeaderboardHome: Component = () => {
    return (
        <div class='h-full w-full flex-col justify-between items-center'>
            <TopBar title={'🏆 Leaderboard 🏆'} />
            <Leaderboard />
        </div>
    );
};

const ChipSudokuSquare: Component<{ num: number, filled: boolean }> = (props) => {
    function borderClasses(): string {
        if (props.num == 1) {
            // top left square == fill in bottom and right border
            return 'border-b border-r';
        } else if (props.num == 3) {
            // top right square == fill in bottom and left border
            return 'border-b border-l';
        } else if (props.num == 7) {
            // bottom left square == fill in top and right border
            return 'border-t border-r';
        } else if (props.num == 9) {
            // bottom right square == fill in top and left border
            return 'border-t border-l';
        } else if (props.num % 3 == 0) {
            // right edge square == fill in left border
            return 'border-l';
        } else if (props.num % 3 == 1) {
            // left edge square == fill in right border
            return 'border-r';
        } else if (props.num <= 3) {
            // top edge square == fill in bottom border
            return 'border-b';
        } else if (props.num >= 7) {
            // bottom edge square == fill in top border
            return 'border-t';
        }

        return '';
    }

    return (
        <div class={`flex flex-row justify-center items-center text-center text-sm sm:text-lg border-stone-400 border-1 ${borderClasses()}`}>{props.filled ? props.num : null}</div>
    );
};

const ChipSquarewordSquare: Component<{ letter: string | null, color: string, filled: boolean }> = (props) => {
    return (
        <div class={`justify-center items-center text-center text-sm sm:text-lg border border-stone-600 border-1 ${props.color} rounded`}>
            {props.filled ? props.letter : null}
        </div>
    );
}

const GameCard: Component<{ title: string, href: string, winner: boolean }> = (props) => {
    function sudokuChip() {
        return (
            <div class='border border-1 rounded border border-stone-800 
                w-[10vh] h-[10vh]
                sm:w-[12vh] sm:h-[12vh]
                md:w-[10vh] md:h-[10vh]
                grid grid-rows-3 grid-cols-3
            '>
                <ChipSudokuSquare num={1} filled={true} />
                <ChipSudokuSquare num={2} filled={true} />
                <ChipSudokuSquare num={3} filled={true} />
                <ChipSudokuSquare num={4} filled={true} />
                <ChipSudokuSquare num={5} filled={true} />
                <ChipSudokuSquare num={6} filled={true} />
                <ChipSudokuSquare num={7} filled={true} />
                <ChipSudokuSquare num={8} filled={true} />
                <ChipSudokuSquare num={9} filled={true} />
            </div>
        );
    }

    function squarewordChip() {
        return (
            <div class='
                w-[10vh] h-[10vh]
                sm:w-[12vh] sm:h-[12vh]
                md:w-[10vh] md:h-[10vh]
                grid grid-rows-3 grid-cols-3
            '>
                <ChipSquarewordSquare letter={null} color={'bg-white'} filled={true} />
                <ChipSquarewordSquare letter={null} color={'bg-white'} filled={true} />
                <ChipSquarewordSquare letter={squarewordState.guessHistory().length.toString()} color={'bg-blue-500'} filled={true} />

                <ChipSquarewordSquare letter={'A'} color={'bg-green-400'} filled={true} />
                <ChipSquarewordSquare letter={'B'} color={'bg-green-400'} filled={true} />
                <ChipSquarewordSquare letter={null} color={'bg-yellow-400'} filled={true} />

                <ChipSquarewordSquare letter={'C'} color={'bg-white'} filled={true} />
                <ChipSquarewordSquare letter={'D'} color={'bg-green-400'} filled={true} />
                <ChipSquarewordSquare letter={null} color={'bg-yellow-400'} filled={true} />
            </div>
        );
    }

    function chip() {
        if (props.title === 'Sudoku') {
            return sudokuChip();
        }
        else if (props.title === 'Squareword') {
            return squarewordChip();
        }
        else {
            return <div>Unknown game</div>;
        }
    }

    function dynamicClasses(): string {
        if (props.winner) {
            return 'border border-2 border-green-800 bg-green-200';
        } else {
            return 'border border-1';
        }
    }

    return (
        <a href={props.href} class={
            `w-[80vw] md:w-[60vw] lg:w-[24vw] 
             h-[18vh] md:h-[15vh] lg:h-[25vh] 
             rounded-xl shadow-md
             my-5 mx-0 lg:mx-5
             p-3 pr-5 sm:p-5
             grid grid-cols-4 grid-rows-1
             lg:flex lg:flex-col lg:justify-around lg:items-center
             text-slate-800 text-3xl sm:text-4xl md:text-4xl lg:text-4xl lg:text-center
             transition ease-out hover:-translate-y-1 hover:scale-110 duration-200
             ${dynamicClasses()}
             `
        }>
            <div class='col-span-3 lg:col-span-1 flex flex-col justify-center'>{props.title}</div>
            <div class='flex flex-col justify-center items-center px-5'>{chip()}</div>
        </a>
    );
};

const ShareButton: Component = () => {
    return (
        <button
            style='font-size: min(2.5vh, 5vw)'
            class='flex flex-row justify-center items-center h-[min(60px, 10vh)] py-4 px-10 border border-stone-800 text-slate-700 bg-white rounded-md m-1 hover:bg-none sm:hover:bg-blue-100 active:bg-blue-200 sm:active:bg-blue-200'
            onClick={() => {
                navigator.clipboard.writeText(`${sudokuState.formatScore()}\n${squarewordState.formatScore()}\nhttps://gotd.crussell.io/`);
                toast.success('Copied to clipboard', { duration: 2000 });
            }}
        >
            <IoShareOutline class='mr-3' color="rgb(47, 41, 36)" />
            <span>Share</span>
        </button>
    );
}

const Home: Component = () => {
    return (
        <div class='w-full h-full flex flex-col justify-start items-center'>
            <TopBar title='GOTD' />

            <div class='w-full h-full flex flex-col justify-center items-center'>
                <div class='flex flex-col items-center'>
                    <div class='flex flex-col lg:flex-row'>
                        <GameCard winner={sudokuState.winner()} title='Sudoku' href='/sudoku' />
                        <GameCard winner={squarewordState.winner()} title='Squareword' href='/squareword' />
                    </div>
                    <Show when={sudokuState.winner() && squarewordState.winner()}>
                        <ShareButton />
                    </Show>
                </div>
            </div>
        </div>
    );
}

const App: Component = () => {
    onMount(() => {
        const localToken = localStorage.getItem('token');
        if (localToken !== null) {
            setToken(localToken);

            squarewordState.loadGameFromServer();
            sudokuState.loadGameFromServer();
        }
    });

    createEffect(() => {
        const t = token();
        if (t !== null) {
            localStorage.setItem('token', t);
        } else {
            localStorage.removeItem('token');
        }
    });

    return (
        <Show when={loggedIn()} fallback={<LoginScreen />}>
            <div class='w-full h-full max-h-[100dvh]'>
                <Toaster
                    position="top-center"
                    // Spacing between each toast in pixels
                    gutter={8}
                    containerClassName=""
                    containerStyle={{}}
                    toastOptions={{
                        // Define default options that each toast will inherit. Will be overwritten by individual toast options
                        className: '',
                        duration: 5000,
                        style: {
                            background: '#363636',
                            color: '#fff',
                        },
                    }}
                />
                <Router>
                    <Routes>
                        <Route path="/" component={Home} />
                        <Route path="/sudoku" component={SudokuHome} />
                        <Route path="/squareword" component={SquarewordHome} />
                        <Route path="/leaderboard" component={LeaderboardHome} />
                    </Routes>
                </Router>
            </div>
        </Show >
    );
};

export default App;
