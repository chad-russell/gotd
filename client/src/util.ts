export function baseUrl(): string {
    return 'http://localhost:3001';
    // return 'https://gotd.crussell.io/api';
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

export const breakpoints = {
    sm: "640px",
    md: "768px",
    lg: "1024px",
};


