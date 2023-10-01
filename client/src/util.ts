// import { throttle } from "@solid-primitives/scheduled";
import { setToken } from "./auth/auth";

export function baseUrl(): string {
    // return 'https://mpro.crussell.io:3001';
    // return 'http://localhost:3001';
    return 'https://gotd.crussell.io/api';
}

export function dateAtMidnight(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function getDay(): Date {
    return dateAtMidnight(new Date());
}

export function daysEqual(d1: Date | null, d2: Date | null): boolean {
    if (d1 === null && d2 === null) {
        return true;
    } else if (d1 === null || d2 === null) {
        return false;
    }

    return dateAtMidnight(d1).getTime() === dateAtMidnight(d2).getTime();
}

// export const throttledServerCall = throttle(async (url: string, args: any) => {
//     const res = await fetch(url, args);
//
//     if (res.status === 401) {
//         setToken(null);
//     }
// }, 2000);

export const throttledServerCall = async (url: string, args: any) => {
    const res = await fetch(url, args);

    if (res.status === 401) {
        setToken(null);
    }
};

export function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secondsLeft = seconds % 60;
    return `${minutes}:${secondsLeft.toString().padStart(2, '0')} `;
}
