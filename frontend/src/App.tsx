import { type Component, Show, onMount, createEffect } from 'solid-js';
import { Router, Route, Routes } from "@solidjs/router";
import { Sudoku } from './sudoku/sudoku';
import { LoginScreen, loggedIn, token, setToken } from './auth/auth';
import { Squareword } from './squareword/squareword';

const SudokuHome: Component = () => {
    return (
        <div class='h-[99vh] w-screen'>
            <h2 class='text-3xl md:text-4xl lg:text-5xl lg:pt-10 text-center my-2 h-[7vh] select-none text-slate-700'>
                Daily Sudoku (August 21)
            </h2>
            <Sudoku />
        </div>
    );
};

const SquarewordHome: Component = () => {
    return (
        <div class='h-[99vh] w-screen'>
            <h2 class='text-3xl md:text-4xl lg:text-5xl lg:pt-10 text-center my-2 h-[7vh] select-none text-slate-700'>
                Daily Squareword (August 21)
            </h2>
            <Squareword />
        </div>
    );
};

const Home: Component = () => {
    function logout() {
        localStorage.removeItem('token');
        setToken(null);
        window.location.href = '/';
    }

    async function testToken() {
        const res = await fetch('http://localhost:3001/check_auth', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token(),
            },
        });
        const text = await res.text();
        alert(text);
    }

    return (
        <div class='w-full h-[90vh] flex flex-col justify-center items-center'>
            <a href='/sudoku'>Sudoku</a>
            <a href='/squareword'>Squareword</a>
            <button onClick={logout}>Logout</button>
            <button onClick={testToken}>Test Token</button>
        </div>
    );
}

const App: Component = () => {
    const localToken = localStorage.getItem('token');
    if (localToken !== null) {
        setToken(localToken);
    }

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
            <Router>
                <Routes>
                    <Route path="/" component={Home} />
                    <Route path="/sudoku" component={SudokuHome} />
                    <Route path="/squareword" component={SquarewordHome} />
                </Routes>
            </Router>
        </Show >
    );
};

export default App;
