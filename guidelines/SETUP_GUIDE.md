# PayrollPro Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **pnpm** (v8 or higher) - Install via `npm install -g pnpm`
- **Visual Studio Code** - [Download](https://code.visualstudio.com/)
- **Git** - [Download](https://git-scm.com/)

## Getting Started with VSCode

### 1. Clone or Open the Project

```bash
# If cloning from a repository
git clone <repository-url>
cd payrollpro

# Or if you already have the project files
cd /path/to/payrollpro
```

### 2. Open in Visual Studio Code

```bash
# Open VSCode from the project directory
code .
```

Alternatively, you can:
- Open VSCode
- Go to **File → Open Folder**
- Navigate to your project directory and click **Select Folder**

### 3. Install Dependencies

Open the integrated terminal in VSCode:
- Press `` Ctrl + ` `` (backtick) or go to **Terminal → New Terminal**
- Run the following command:

```bash
pnpm install
```

This will install all required dependencies including React, TypeScript, Tailwind CSS, Recharts, and other packages.

### 4. Start the Development Server

```bash
pnpm dev
```

The application will start on `http://localhost:5173` (or another port if 5173 is in use).

### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

You should see the authentication screen with options to log in as either:
- **Admin Portal** (for payroll administrators)
- **Employee Portal** (for employees)

## Default Login Credentials

### Admin Login
- **Email:** Any email address (e.g., `admin@company.com`)
- **Password:** Any password (e.g., `admin123`)
- **MFA Code:** `123456` (or any 6-digit code)

### Employee Login
- **Email:** Any email address (e.g., `employee@company.com`)
- **Password:** Any password (e.g., `employee123`)
- **MFA Code:** `123456` (or any 6-digit code)

> **Note:** This is a frontend prototype. Authentication is simulated and does not connect to a real backend.

## Project Structure

```
payrollpro/
├── src/
│   ├── app/
│   │   ├── components/          # React components
│   │   │   ├── Authentication.tsx
│   │   │   ├── EmployeePortal.tsx
│   │   │   ├── EmployeeDirectory.tsx
│   │   │   ├── PayrollProcessing.tsx
│   │   │   ├── PayrollReports.tsx
│   │   │   ├── AuditQueue.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── Notifications.tsx
│   │   └── App.tsx              # Main application component
│   ├── styles/
│   │   ├── theme.css            # Design tokens and theme
│   │   └── fonts.css            # Font imports
│   └── imports/                 # Imported assets
├── public/                      # Static assets
├── package.json                 # Project dependencies
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite configuration
└── README.md                   # Project documentation
```

## Recommended VSCode Extensions

Install these extensions for the best development experience:

1. **ESLint** (`dbaeumer.vscode-eslint`)
   - Provides JavaScript/TypeScript linting

2. **Prettier - Code formatter** (`esbenp.prettier-vscode`)
   - Automatically formats your code

3. **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
   - Autocomplete, syntax highlighting for Tailwind

4. **TypeScript Vue Plugin (Volar)** (`Vue.volar`)
   - Enhanced TypeScript support

5. **ES7+ React/Redux/React-Native snippets** (`dsznajder.es7-react-js-snippets`)
   - Useful React snippets

6. **Path Intellisense** (`christian-kohler.path-intellisense`)
   - Autocomplete for file paths

To install extensions:
- Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac)
- Search for the extension name
- Click **Install**

## VSCode Settings Configuration

Create or update `.vscode/settings.json` in your project root:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.experimental.classRegex": [
    ["className\\s*=\\s*['\"`]([^'\"`]*)['\"`]", "([^'\"`]*)"]
  ]
}
```

## Development Workflow

### 1. Hot Module Replacement (HMR)
The development server supports HMR, meaning changes you make to your code will automatically reflect in the browser without a full page reload.

### 2. TypeScript Checking
VSCode will automatically show TypeScript errors in your editor. You can also run:

```bash
pnpm tsc --noEmit
```

### 3. Building for Production

```bash
pnpm build
```

This creates an optimized production build in the `dist/` directory.

### 4. Preview Production Build

```bash
pnpm preview
```

This serves the production build locally for testing.

## Troubleshooting

### Port Already in Use
If port 5173 is already in use, Vite will automatically try the next available port (5174, 5175, etc.). Check the terminal output for the actual URL.

### Module Not Found Errors
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### TypeScript Errors
```bash
# Restart TypeScript server in VSCode
# Press Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Tailwind Classes Not Working
Ensure `tailwind.config.js` is properly configured and the development server is running.

## Next Steps

Once you have the project running locally:

1. **Review the codebase** - Familiarize yourself with the component structure
2. **Set up a database** - See `DATABASE_SCHEMA.md` for cloud database options
3. **Configure backend API** - Connect to your backend services
4. **Deploy to production** - See `DEPLOYMENT_GUIDE.md` for deployment instructions

## Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [Recharts Documentation](https://recharts.org/)

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the `ARCHITECTURE.md` file for system design details
- Consult the `DATABASE_SCHEMA.md` for database setup
