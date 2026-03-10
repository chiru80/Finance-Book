/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                indigo: {
                    600: "#4F46E5",
                },
                slate: {
                    50: "#F8FAFC",
                    900: "#0F172A",
                },
            },
            borderRadius: {
                'xl': '12px',
                '2xl': '16px',
            },
            boxShadow: {
                'soft': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            },
        },
    },
    plugins: [],
};
