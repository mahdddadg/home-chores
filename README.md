# Mela + Mahdi Chores

A lightweight, frontend-only chore manager for two fixed users: Mela and Mahdi. It generates each day's chores from recurring rules, stores the rules in `localStorage`, and can be hosted directly on GitHub Pages.

## Features

- Today view split into `Mela` and `Mahdi`
- Recurring chores with `daily`, `weekly`, `every X days`, and `monthly` rules
- Checkbox completion and optional comments for each generated task
- Simple calendar that lets you inspect any date's generated chores
- No login, no backend, no database

## Files

- `index.html`
- `styles.css`
- `app.js`

## Run locally

Open `index.html` in a browser.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. In GitHub, open `Settings` -> `Pages`.
3. Under `Build and deployment`, choose `Deploy from a branch`.
4. Select your main branch and `/ (root)`.
5. Save. GitHub Pages will serve `index.html` automatically.

## Notes

- Chore rules and per-day task notes/checkmarks are stored in the browser via `localStorage`.
- The app does not require a backend and does not save shared history across devices.
