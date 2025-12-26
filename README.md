# Personal Finance Manager (₹)

A comprehensive, client-side personal finance tracking application built with **Next.js 13** and **React**. This app allows you to track income and expenses, import bank statements, visualize spending patterns through analytics, and manage budgets—all with 100% data privacy as everything is stored locally in your browser.

## ✨ Features

-   **Dashboard Overview**: Real-time summary of balance, income, and expenses with interactive charts.
-   **Smart Insights (AI-Lite)**: Automatic analysis of spending trends and budget predictions.
-   **Transaction Management**: Detailed list with category-based color coding and bulk actions (bulk delete/categorize).
-   **Easy Import**: Support for CSV bank statements and Splitwise exports with auto-categorization.
-   **Budget Tracking**: Set monthly limits for different categories and monitor progress visually.
-   **Custom Mappings**: Create rules to automatically categorize transactions based on merchant keywords.
-   **Responsive Design**: Fully functional on both desktop and mobile devices.
-   **Dark Mode**: Native support for light and dark themes with persistent user preferences.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 13](https://nextjs.org/) (App Router)
-   **UI Library**: [React 18](https://reactjs.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Charts**: [Chart.js](https://www.chartjs.org/) & [react-chartjs-2](https://react-chartjs-2.js.org/)
-   **Animations**: [Framer Motion](https://www.framer.com/motion/) & [GSAP](https://greensock.com/gsap/)
-   **Icons**: [React Icons](https://react-icons.github.io/react-icons/) & [Heroicons](https://heroicons.com/)
-   **Data Parsing**: [PapaParse](https://www.papaparse.com/) (CSV)
-   **Storage**: Browser `localStorage`

## 🚀 Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Run the development server**:
    ```bash
    npm run dev
    ```

3.  **Open the app**:
    Navigate to `http://localhost:5000` in your browser.

## 🔒 Privacy & Data

This application does **not** have a backend or database. Your financial data never leaves your computer.
-   Data is stored in your browser's `localStorage`.
-   Clearing your browser cache/data will remove your transactions unless you have exported them.

## 📄 License

MIT License - feel free to use and modify for personal use.
