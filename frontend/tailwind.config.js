/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "index.html",
        "./src/**/*.{html,tsx}",
    ],
    theme: {
        extend: {
            keyframes: {
                wiggle: {
                    '0%, 100%': { transform: 'rotate(0deg)' },
                    '25%': { transform: 'rotate(-13deg)' },
                    '75%': { transform: 'rotate(13deg)' },
                },
                flashError: {
                    '0%, 100%': { backgroundColor: 'rgb(204 251 241);' },
                    '50%': { backgroundColor: 'rgb(248 113 113);' },
                },
                wow: {
                    '0%': { transform: 'scale(1.0)', borderWidth: '1px' },
                    '30%': { transform: 'scale(1.05)', borderWidth: '2.5px' },
                    '85%': { transform: 'scale(0.98)', borderWidth: '1px' },
                    '100%': { transform: 'scale(1.0)', borderWidth: '1px' },
                },
                fadeOutWithTranslate: {
                    '0%': { opacity: 1, transform: 'translateY(0px)' },
                    '100%': { opacity: 0, transform: 'translateY(20px)' },
                },
                fadeIn: {
                    '0%': { opacity: 0 },
                    '100%': { opacity: 1 },
                },
                wowFadeIn: {
                    '0%': { transform: 'scale(1.0)', opacity: 0, borderWidth: '1px' },
                    '30%': { transform: 'scale(1.05)', opacity: 0.3, borderWidth: '2.5px' },
                    '85%': { transform: 'scale(0.98)', opacity: 0.85, borderWidth: '1px' },
                    '100%': { transform: 'scale(1.0)', opacity: 1, borderWidth: '1px' },
                },
                fadeInWithTranslate: {
                    '0%': { opacity: 0, transform: 'translateY(-20px)' },
                    '100%': { opacity: 1, transform: 'translateY(0px)' },
                },
            },
            animation: {
                wiggle: 'wiggle 0.3s ease-in-out',
                flashError: 'flashError 0.3s ease-in-out',
                wow: 'wow 0.3s ease-in-out',
                fadeOutWithTranslate: 'fadeOutWithTranslate 0.2s ease-in-out',
                fadeIn: 'fadeIn 0.2s linear',
                wowFadeIn: 'wowFadeIn 0.2s ease-in-out',
                fadeInWithTranslate: 'fadeInWithTranslate 0.2s ease-in-out',
            }
        },
    },
    plugins: [],
}

