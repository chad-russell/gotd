import { type Component, Show, onMount } from 'solid-js';
import { Router, Route, Routes } from "@solidjs/router";
import { Sudoku } from './sudoku/sudoku';
import { LoginScreen, loggedIn, setToken } from './auth/auth';
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
  return (
    <div class='w-full h-[90vh] flex flex-col justify-center items-center'>
      <a href='/sudoku'>Sudoku</a>
      <a href='/squareword'>Squareword</a>
    </div>
  );
}

const App: Component = () => {
  onMount(() => {
    const token = localStorage.getItem('token');
    if (token !== null) {
      setToken(token);
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