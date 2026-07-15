# Vue + Tailwind Starter

Szkielet aplikacji oparty na Vue 3, Vite i Tailwind CSS 4.

## Uruchomienie

```bash
npm install
npm run dev
```

### Windows PowerShell

Jeśli PowerShell blokuje plik `npm.ps1`, użyj wersji wykonywalnej `.cmd`:

```powershell
npm.cmd install
npm.cmd run dev
```

Możesz też uruchomić dołączony plik:

```powershell
.\start-dev.cmd
```

Build produkcyjny:

```bash
npm run build
```

## Struktura

- `src/App.vue` — główny widok
- `src/components/` — komponenty wielokrotnego użytku
- `src/style.css` — import Tailwind CSS i globalne style
- `vite.config.js` — konfiguracja Vite i Tailwind CSS
