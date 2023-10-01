import { Component, Show, createSignal } from "solid-js";
import { logout, profilePic, username } from "../auth/auth";
import { FiHome } from 'solid-icons/fi'

export const TopBar: Component<{ title: string }> = (props) => {
    const [showDropdown, setShowDropdown] = createSignal(false);

    function display(): string {
        if (!showDropdown()) {
            return 'hidden';
        }

        return 'animate-fadeInWithTranslate';
    }

    function dismissDropdown() {
        setShowDropdown(false);
        document.removeEventListener('click', dismissDropdown);
    }

    function toggleShowDropdown() {
        if (showDropdown()) {
            dismissDropdown();
        }
        else {
            setShowDropdown(true);
            document.addEventListener('click', dismissDropdown);
        }
    }

    function signOut(e: Event) {
        e.stopImmediatePropagation();
        logout();
    }

    return (
        <div class='w-full h-[9dvh] md:h-16 bg-blue-500 grid grid-cols-3 z-50'>
            <Show when={props.title !== 'GOTD'} fallback={<div />}>
                <div class='flex items-center justify-start'>
                    <FiHome class='text-white m-3 w-7 h-7' onClick={() => window.location.href = '/'} />
                </div>
            </Show>

            <div class='flex flex-row items-center justify-center'>
                <div class='text-3xl text-white font-bold ml-3 select-none'>{props.title}</div>
            </div>

            <div class='flex flex-row w-full justify-end'>
                <div class='relative inline-block' onClick={() => toggleShowDropdown()}>
                    <img src={profilePic()} class='w-10 h-10 rounded-full m-3' />

                    <div
                        class={`absolute right-0 -mt-2 flex flex-col justify-start items-start bg-white shadow-lg rounded-lg text-stone-800 whitespace-nowrap transform ${display()}`}
                        onClick={(e) => e.stopImmediatePropagation()}
                    >
                        <div class='p-3'>{username()}</div>
                        <div class='w-[100%] h-0 border-b border-stone-400' />
                        <button class='w-full p-3 hover:bg-stone-200 text-start' onClick={signOut}>
                            Sign out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
