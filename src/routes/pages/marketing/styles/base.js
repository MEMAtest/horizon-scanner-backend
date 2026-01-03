// Base styles: CSS variables, reset, typography
function getBaseStyles() {
  return `
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap');

      :root {
        --ink: #0b1b33;
        --muted: #445069;
        --blue-900: #0b1b63;
        --blue-700: #1e3a8a;
        --blue-500: #2563eb;
        --blue-300: #93c5fd;
        --blue-100: #dbeafe;
        --yellow-500: #f5c542;
        --yellow-400: #fbbf24;
        --yellow-300: #fde68a;
        --yellow-100: #fef3c7;
        --green-500: #22c55e;
        --green-100: #dcfce7;
        --red-500: #ef4444;
        --red-100: #fee2e2;
        --sunset: #fff4cc;
        --cream: #fffdf7;
        --card: #ffffff;
        --border: rgba(15, 23, 42, 0.12);
        --shadow: 0 28px 70px rgba(15, 23, 42, 0.18);
        --shadow-sm: 0 4px 20px rgba(15, 23, 42, 0.08);
        --shadow-md: 0 12px 40px rgba(15, 23, 42, 0.12);
        --shadow-lg: 0 20px 50px rgba(15, 23, 42, 0.15);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: 'Manrope', sans-serif;
        color: var(--ink);
        background: #fafbfc;
        min-height: 100vh;
        overflow-x: hidden;
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      img {
        max-width: 100%;
      }

      .marketing-shell {
        overflow-x: hidden;
        position: relative;
      }
  `;
}

module.exports = { getBaseStyles };
