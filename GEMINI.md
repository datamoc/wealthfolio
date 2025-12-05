# Project Overview

Wealthfolio is a desktop investment tracker application built with a modern tech stack. It provides a local-first experience, meaning all data is stored on the user's machine, with no reliance on cloud services. The application is designed to be extensible through a powerful addon system.

The frontend is built with **React**, **TypeScript**, and **Tailwind CSS**. It uses **Vite** for frontend tooling. The backend is written in **Rust** and is divided into a `core` library and a `server` component. The desktop application is built using the **Tauri** framework, which enables the creation of cross-platform applications with web technologies. The application uses **SQLite** for its database.

The project is structured as a monorepo using **pnpm workspaces**, with shared packages and addons located in the `packages/` and `addons/` directories, respectively.

# Building and Running

## Prerequisites

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/)
- [Tauri](https://tauri.app/)

## Development

To run the application in development mode, which includes hot-reloading for both the frontend and backend, use the following command:

```bash
pnpm tauri dev
```

## Building for Production

To build the application for production, which will create a standalone executable for your platform, use the following command:

```bash
pnpm tauri build
```

## Web Mode

The application can also be run in web mode, which starts a local web server for the frontend and a separate server for the backend API.

```bash
pnpm run dev:web
```

## Testing

The project uses **vitest** for testing. To run the test suite, use the following command:

```bash
pnpm test
```

# Development Conventions

## Code Style

The project uses **Prettier** for code formatting and **ESLint** for linting. To format the code, run:

```bash
pnpm format
```

To lint the code, run:

```bash
pnpm lint
```

## Addon Development

Addons are a key feature of Wealthfolio. They allow for the extension of the application's functionality. The project includes a dedicated SDK and development tools for creating addons. To create a new addon, use the following command:

```bash
npx @wealthfolio/addon-dev-tools create my-addon
```

## Commit Style

The project does not have a strict commit message format, but it is recommended to follow conventional commit standards.
