# CodeVerse Campus - Level Up Your Coding Skills

A gamified coding practice platform designed for college students to practice programming problems organized by year and semester.

## Features

- 🎯 **Organized Problem Sets** - Problems categorized by academic year and semester
- 🏆 **Gamification** - Earn badges, climb leaderboards, and track your progress
- 📊 **Analytics Dashboard** - Detailed performance insights for both students and admins
- 💻 **Syntax Highlighting** - Professional code display with multi-language support
- 🔥 **Streak Tracking** - Maintain your coding momentum
- 👥 **Admin Panel** - Comprehensive management tools for educators

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```sh
git clone <YOUR_GIT_URL>
cd codeverse-campus
```

2. Install dependencies:
```sh
npm install
```

3. Set up environment variables:
```sh
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. Start the development server:
```sh
npm run dev
```

The application will be available at `http://localhost:8080`

## Tech Stack

This project is built with modern web technologies:

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui components
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Database, Auth, Real-time)
- **Charts**: Recharts
- **Code Highlighting**: Prism.js
- **Icons**: Lucide React

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin panel components
│   ├── student/        # Student-specific components
│   └── ui/             # Base UI components
├── pages/              # Main application pages
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
└── lib/                # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Made By 
-----------------------------------------------------------------------

Made By Meet G. Dave with Under The guidence of Prof. Parth D. Joshi

----------------------------------------------------------------------- 
