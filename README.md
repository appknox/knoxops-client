# KnoxAdmin Client — Frontend Portal

React + TypeScript + Vite frontend for the KnoxAdmin admin portal.

- **Framework:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Build Tool:** Vite with HMR (Hot Module Reload)

---

## Getting Started

### Prerequisites

- Node.js 22+
- npm / pnpm
- Backend running on `http://localhost:3000` (see `../knoxadmin/README.md`)

### Setup

```bash
npm install
npm run dev            # Starts on http://localhost:5173
```

The dev server automatically **proxies `/api` requests to `http://localhost:3000`** (configured in `vite.config.ts`).

### Build for Production

```bash
npm run build          # Creates optimized production build in `dist/`
npm run preview        # Preview production build locally
```

### Development

```bash
npm run dev            # Start dev server with HMR
npm run lint           # Run ESLint
npm run type-check     # Check TypeScript types
```

---

## Architecture Notes

- **API Communication:** All API calls proxy through Vite's dev server to the backend
- **Authentication:** Uses JWT tokens from backend (stored in browser)
- **Zustand Stores:** Located in `src/stores/` for state management
- **Components:** Modular components in `src/components/`

---

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
