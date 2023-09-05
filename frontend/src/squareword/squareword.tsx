import { createSignal, type Component } from 'solid-js';

const [guess, setGuess] = createSignal<Array<string>>(['t', 'h', 'e', 's', 'e']);

export const Squareword: Component = () => {
    window.addEventListener('keydown', (e) => {
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
            default:
                return null;
        }
    });

    return (
        <div class='h-[90vh] flex flex-col justify-center items-center m-1'>
            <div class='flex flex-col max-h-[90vh] max-w-[60vh] w-full'>
                <SquarewordBoard />
                <SquarewordKeyboard />
            </div>
        </div>
    );
};

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
                <KeyboardLetter letter='BSP' />
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
    return <button style='font-size: min(6vw, 4vh)' class='py-1 px-2 md:px-3 mx-[1px] md:mx-[2px] border border-stone-800 rounded-md select-none'>
        {props.letter}
    </button>
};

const GuessTile: Component<{ index: number }> = (props) => {
    function letter() {
        if (guess().length <= props.index) {
            return null;
        }

        return guess()[props.index].toUpperCase();
    }

    return (
        <div style='font-size: min(6vw, 5vh)' class='bg-teal-100 border border-teal-800 rounded-md m-[1px] overflow-hidden flex flex-col justify-center items-center'>
            {letter()}
        </div>
    );
};

const ViewGuessTile: Component = () => {
    return (
        <div class='bg-blue-500 border border-blue-800 rounded-md m-[1px]'></div>
    );
};

const SolutionTile: Component = () => {
    return (
        <div class='border border-stone-800 rounded-md m-[1px]'></div>
    );
};

const MisplacedLettersTile: Component = () => {
    return (
        <div class='bg-yellow-400 border border-stone-800 rounded-md m-[1px]'></div>
    );
};

const SquarewordBoard: Component = () => {
    const color = 'blue';

    return (
        <div class='grid grid-cols-6 grid-rows-6 overflow-hidden aspect-square'>
            {/* Row 1 */}
            <GuessTile index={0} />
            <GuessTile index={1} />
            <GuessTile index={2} />
            <GuessTile index={3} />
            <GuessTile index={4} />
            <ViewGuessTile />

            {/* Row 2 */}
            <SolutionTile />
            <SolutionTile />
            <SolutionTile />
            <SolutionTile />
            <SolutionTile />
            <MisplacedLettersTile />

            {/* Row 3 */}
            <SolutionTile />
            <SolutionTile />
            <SolutionTile />
            <SolutionTile />
            <SolutionTile />
            <MisplacedLettersTile />

            {/* Row 4 */}
            <SolutionTile />
            <SolutionTile />
            <SolutionTile />
            <SolutionTile />
            <SolutionTile />
            <MisplacedLettersTile />

            {/* Row 5 */}
            <SolutionTile />
            <SolutionTile />
            <SolutionTile />
            <SolutionTile />
            <SolutionTile />
            <MisplacedLettersTile />

            {/* Row 6 */}
            <SolutionTile />
            <SolutionTile />
            <SolutionTile />
            <SolutionTile />
            <SolutionTile />
            <MisplacedLettersTile />
        </div>
    );
};