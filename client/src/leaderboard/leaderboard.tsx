import { Component, For, createSignal, onMount } from "solid-js";
import { baseUrl } from "../util";

type Leader = {
    name: string,
    picture: string | null,
    sudoku_score: number,
    squareword_score: number,
}

export const Leaderboard: Component = () => {
    const [leaders, setLeaders] = createSignal<Leader[]>([]);

    onMount(() => {
        fetch(`${baseUrl()}/leaderboard`)
            .then(res => res.json())
            .then(data => {
                console.log(data.users);
                setLeaders(data.users);
            });
    });

    return (
        <div>
            <div>Leaderboard</div>
            <For each={leaders()}>
                {(l, i) => <div>{JSON.stringify(l)} {i()}</div>}
            </For>
        </div>
    );
};
