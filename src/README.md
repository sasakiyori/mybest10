# Book Best10 Generator - Source Structure

## Directory Structure

```
src/
├── components/     # React components
├── services/       # Service layer (API, storage, rendering)
├── types/          # TypeScript type definitions
├── utils/          # Utility functions and helpers
├── test/           # Test setup and utilities
├── App.tsx         # Main application component
├── main.tsx        # Application entry point
└── index.css       # Global styles with Tailwind CSS
```

## Technology Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **Testing**: Vitest + @testing-library/react
- **Property Testing**: fast-check

## Testing

Run tests with:
```bash
npm test              # Run tests once
npm run test:watch    # Run tests in watch mode
npm run test:ui       # Run tests with UI
```

## Development

Start the development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```
