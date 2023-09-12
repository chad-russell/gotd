import { Component, createEffect, createSignal, onMount } from "solid-js";

export const [token, setToken] = createSignal<string | null>(null);

export function loggedIn() {
    return token() !== null;
}

const LoginButton: Component = () => {
    const btn = <div id="buttonDiv"></div>;

    async function handleCredentialResponse(response: { credential: any; }) {
        // send response.credential to backend for validation
        // if valid, setToken(response.credential)
        // else, show error message
        const res = await fetch('http://localhost:3001/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: response.credential })
        });

        const text = await res.text();

        if (res.status !== 200) {
            alert(`Login failed: ${text}`);
            return;
        }

        setToken(text);
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
            <span class='text-xl text-center mx-4 mb-3'>
                Sign in using the button below, or use the google popup if you see it.
            </span>
            <div>
                <LoginButton />
            </div>
        </div>
    );
};
