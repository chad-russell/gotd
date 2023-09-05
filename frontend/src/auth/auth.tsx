import { Component, createSignal, onMount } from "solid-js";

export const [token, setToken] = createSignal<string | null>(null);

export function loggedIn() {
    return token() !== null;
}

const LoginButton: Component = () => {
    const btn = <div id="buttonDiv"></div>;

    function handleCredentialResponse(response: { credential: any; }) {
        localStorage.setItem('token', response.credential);
        setToken(response.credential);
    }

    onMount(() => {
        google.accounts.id.initialize({
            client_id: "1012807370880-93eor5h650abjrreks9ut5f5dp5tv67q.apps.googleusercontent.com",
            callback: handleCredentialResponse
        });
        google.accounts.id.renderButton(
            document.getElementById("buttonDiv"),
            { theme: "outline", size: "large" }  // customization attributes
        );
        google.accounts.id.prompt(); // also display the One Tap dialog
    });

    return btn;
};

export const LoginScreen: Component = () => {
    return (
        <div class='flex flex-col justify-center items-center h-screen'>
            <h2 class='text-3xl md:text-4xl lg:text-5xl text-center my-2 h-[7vh] select-none'>
                Welcome to GOTD!
            </h2>
            <span class='text-xl'>
                Sign in using the button below, or the one in the top right corner if you see it.
            </span>
            <div>
                <LoginButton />
            </div>
        </div>
    );
};