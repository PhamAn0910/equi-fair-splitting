# BillPaint 🎨

A modern, intuitive expense-splitting web application that makes managing shared expenses effortless. Split bills, track balances, and settle up with friends using a beautiful, mobile-first interface.

## ✨ Features

### Group Management
- **Create & Manage Groups**: Organize expenses by trip, event, or household
- **Member Management**: Add/remove members with colorful avatars
- **Active Group Selection**: Quickly switch between different expense groups
- **Group Overview**: View total spending and balances at a glance

### Expense Tracking
- **Smart Receipt Scanning**: AI-powered OCR to extract items and amounts from receipt photos
- **Multiple Split Methods**:
  - Equal split across members
  - Custom shares/ratios
  - Percentage-based splits
  - Exact amount allocation
- **Flexible Item Assignment**: Paint-style interface to assign receipt items to members
- **Category Organization**: Categorize expenses (food, transport, drinks, shopping, entertainment, accommodation)
- **Detailed Expense History**: Track who paid, when, and for what

### Settlement & Balances
- **Real-time Balance Calculation**: Always know who owes what
- **Optimized Settlement Algorithm**: Minimizes the number of transactions needed
- **Visual Settlement Graph**: Interactive network graph showing payment relationships
- **Settlement Tracking**: Mark payments as complete
- **Balance Dashboard**: Clear overview of all your group balances

### User Experience
- **Mobile-First Design**: Optimized for touch and mobile screens
- **Warm, Earthy Theme**: Beautiful color palette with member color coding
- **Bottom Navigation**: Easy access to all main features
- **Responsive Layout**: Works seamlessly on all device sizes
- **Real-time Updates**: Instant feedback on all actions

## 🛠 Tech Stack

### Frontend Framework
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server

### Styling & UI
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality, accessible component library
- **Lucide React** - Beautiful icon set
- **Custom Design System** - Warm, earthy color palette with member color coding

### State Management
- **Zustand** - Lightweight, flexible state management
- **Zustand Persist** - Local storage persistence for offline-first experience

### Routing & Data Fetching
- **React Router v6** - Client-side routing
- **TanStack Query (React Query)** - Powerful async state management

### AI & OCR
- **Google Gemini** - Advanced receipt parsing and OCR
- **Qwen** - Alternative OCR model option
- **Custom Receipt Parser** - Extracts items, prices, fees, and totals

### Developer Tools
- **ESLint** - Code quality and consistency
- **PostCSS** - CSS processing
- **Bun** - Fast package manager (lockfile present)

### Key Libraries
- `clsx` & `tailwind-merge` - Dynamic className composition
- `date-fns` - Date manipulation
- `react-hook-form` - Form management
- `sonner` - Toast notifications
- `zod` - Schema validation

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or bun package manager

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd bill-painter

# Install dependencies
npm install
# or
bun install

# Start the development server
npm run dev
# or
bun run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```sh
npm run build
# or
bun run build
```

## 📱 Application Structure

```
src/
├── components/        # Reusable UI components
│   ├── ui/           # shadcn/ui components
│   └── ...           # Custom components
├── hooks/            # Custom React hooks
├── lib/              # Utilities and constants
├── pages/            # Page components (routes)
├── stores/           # Zustand state stores
└── integrations/     # External service integrations
```

## 🎨 Key Components

- **Dashboard**: Home view with quick actions and recent activity
- **ScanPaint**: Interactive receipt scanning and item assignment
- **GroupDetail**: Detailed view of group expenses and members
- **Settlement**: Optimized payment settlement interface
- **Bills**: Comprehensive expense list with filtering

## 📦 State Management

The app uses Zustand with persistence for:
- `expenseStore`: Expense tracking and balance calculations
- `groupStore`: Group and member management
- `paintStore`: Receipt scanning and item assignment state
- `settingsStore`: User preferences and OCR model selection

## 🤝 Contributing

This project uses a mobile-first approach with a focus on intuitive UX. When contributing:
- Follow the existing TypeScript patterns
- Use the established color system for consistency
- Ensure mobile responsiveness
- Test thoroughly on touch devices

## 📄 License

[Add your license here]
