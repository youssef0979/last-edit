# Resolve - Personal Wellness Tracking App

A comprehensive web application for tracking and improving your daily wellness through performance monitoring, habit building, sleep tracking, and calendar management.

## 🌟 Features

### 📊 Performance Tracker
- Track multiple performance habits with custom names and colors
- Score each habit daily (1-10 scale)
- View 2-week cycle performance charts with interactive tooltips
- Lock system prevents future date entries until today is complete
- Access historical data through "Previous Tracks"
- Calculate cycle averages and track progress

### ✅ Habit Tracker
- 9 preloaded wellness habits (customizable)
- Add unlimited custom habits with difficulty weights and priority levels
- Daily completion tracking with streak calculation
- Weighted points system based on habit difficulty
- 2-week cycle tracking with automatic cycling
- Daily notes for personal reflections
- Weekly insights and statistics
- Lock system: only today's habits can be toggled

### 😴 Sleep Tracker
- Log daily sleep hours with optional bedtime and wake time
- Track mood (😃 😐 😔) and sleep quality (1-10 scale)
- Add personal notes for each sleep entry
- Interactive sleep pattern charts
- Weekly sleep statistics and averages
- Set and track sleep goals
- Lock system prevents future date logging
- Access historical sleep data

### 📅 Calendar
- Month view with current day highlighting
- Add, edit, and delete notes for any date
- Color-coded notes with optional reminders
- View all notes for selected dates
- Access historical notes
- No lock system (can add notes to any date)

### 👤 Profile & Dashboard
- Personalized dashboard with real-time statistics
- Avatar upload and custom bio
- Theme toggle (Light/Dark/System)
- Comprehensive tracker overview with mini-charts
- Access to all "Previous Tracks" from one location
- User data summary across all trackers

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A Supabase account (for backend - automatically configured in Lovable)

### Installation

1. Clone the repository:
```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## 🔑 Authentication

The app uses Supabase authentication with email/password:

1. Navigate to `/auth` to sign up or log in
2. Email confirmation is auto-enabled for quick onboarding
3. All user data is isolated and secured with Row Level Security (RLS)

## 📱 Usage Guide

### First Time Setup
1. **Sign Up**: Create an account with email and password
2. **Profile**: Upload an avatar and add a bio (optional)
3. **Habits**: Review preloaded habits, add custom ones
4. **Performance**: Create performance habits to track (e.g., "Work Quality", "Exercise")
5. **Set Goals**: Configure your sleep goal in the Sleep Tracker

### Daily Workflow
1. **Morning**: 
   - Log yesterday's sleep data
   - Check the Dashboard for overview
   - Set daily intentions in Calendar

2. **Throughout Day**:
   - Toggle habit completions as you complete them
   - Add notes to Calendar for important events

3. **Evening**:
   - Score your performance habits (1-10)
   - Complete any remaining habit tracking
   - Review your progress on the Dashboard

### Understanding Lock Systems

#### Performance & Sleep Trackers
- Can only log data for today or past dates
- Future dates are locked until today's data is entered
- Once today is complete, tomorrow becomes available

#### Habit Tracker
- Can only toggle today's habits
- No future date tracking allowed
- Streaks calculated automatically

#### Calendar
- No lock system - add notes to any date
- Great for planning and retrospection

## 🎨 Themes

Toggle between Light, Dark, and System modes:
- **Light Mode**: Clean, bright interface
- **Dark Mode**: Easy on the eyes, battery-friendly
- **System Mode**: Automatically follows your device settings

Access theme toggle from:
- Sidebar (bottom section)
- Profile page settings

## 📊 Data Management

### Previous Tracks
Each tracker maintains independent historical data:
- **Performance**: View all past 2-week cycles
- **Habits**: Access completed cycle data
- **Sleep**: Review historical sleep patterns
- All accessible via "Previous Tracks" buttons

### Data Persistence
- All data automatically saved to Supabase
- Real-time synchronization across devices
- Secure with Row Level Security
- Automatic cycle management

### Data Privacy
- Your data is private and isolated
- RLS policies ensure only you can access your data
- No sharing or social features

## 🛠 Technical Stack

- **Frontend**: React 18 + TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts for data visualization
- **Backend**: Supabase (PostgreSQL database)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for avatars)
- **Build Tool**: Vite
- **Date Handling**: date-fns

## 📦 Project Structure

```
src/
├── components/
│   ├── ui/              # Shadcn UI components
│   ├── calendar/        # Calendar-specific components
│   ├── habits/          # Habit tracker components
│   ├── performance/     # Performance tracker components
│   ├── profile/         # Profile page components
│   ├── sleep/           # Sleep tracker components
│   ├── Layout.tsx       # Main layout wrapper
│   ├── Sidebar.tsx      # Navigation sidebar
│   └── ThemeToggle.tsx  # Theme switcher
├── pages/
│   ├── Dashboard.tsx    # Main dashboard
│   ├── Performance.tsx  # Performance tracker page
│   ├── Habits.tsx       # Habit tracker page
│   ├── Sleep.tsx        # Sleep tracker page
│   ├── CalendarPage.tsx # Calendar page
│   ├── Profile.tsx      # User profile page
│   └── Auth.tsx         # Authentication page
├── integrations/
│   └── supabase/        # Supabase client & types
├── lib/
│   ├── utils.ts         # Utility functions
│   └── theme-provider.tsx # Theme context
├── hooks/               # Custom React hooks
├── App.tsx              # App router
└── main.tsx             # Entry point
```

## 🗄 Database Schema

### Main Tables
- `profiles`: User profiles (bio, avatar)
- `habits`: User habits with difficulty weights
- `habit_completions`: Daily habit completion tracking
- `habit_cycles`: 2-week habit tracking cycles
- `habit_notes`: Daily notes for reflection
- `performance_habits`: Performance tracking categories
- `performance_scores`: Daily performance scores (1-10)
- `performance_cycles`: 2-week performance cycles
- `sleep_entries`: Daily sleep logs
- `sleep_cycles`: 2-week sleep tracking cycles
- `calendar_notes`: Calendar notes with reminders

All tables have Row Level Security (RLS) enabled with user-specific policies.

## 🚀 Deployment

### Deploy with Lovable (Recommended)
1. Open your project in [Lovable](https://lovable.dev)
2. Click "Share" → "Publish"
3. Your app will be deployed automatically
4. Get a unique lovable.app subdomain

### Deploy to Vercel
```bash
npm run build
vercel --prod
```

### Deploy to Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Environment Variables
The following are automatically configured in Lovable:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase anon key

## 🔧 Configuration

### Sleep Goal
Default: 8 hours (customizable in Sleep Tracker)

### Habit Difficulty Weights
- Easy: 1 point
- Medium: 2 points  
- Hard: 3 points

### Cycle Duration
All trackers use 2-week (14-day) cycles that automatically roll over

## 📱 Mobile Responsive

Fully responsive design works on:
- Mobile phones (320px+)
- Tablets (768px+)
- Desktops (1024px+)

## 🐛 Troubleshooting

### Data Not Loading
- Check your internet connection
- Ensure you're logged in
- Refresh the page
- Check browser console for errors

### Login Issues
- Verify email and password
- Check for email confirmation (auto-confirmed in this app)
- Clear browser cache and cookies

### Charts Not Displaying
- Ensure you have data for the current cycle
- Try refreshing the page
- Check that your device supports JavaScript

### Theme Not Persisting
- Check browser localStorage is enabled
- Theme preference is saved per device

## 🤝 Support

For issues or questions:
1. Check the [Lovable Documentation](https://docs.lovable.dev)
2. Review this README
3. Check browser console for error messages
4. Contact support through Lovable platform

## 📄 License

This project is part of the Lovable platform. See your project settings for specific licensing information.

## 🎯 Roadmap

Future enhancements (not yet implemented):
- Data export (CSV/JSON)
- Goal setting and tracking
- Achievements and badges system
- Advanced analytics and insights
- Notification system
- Social features (optional)
- Mobile app version

## 🙏 Acknowledgments

Built with [Lovable](https://lovable.dev) - The AI-powered full-stack development platform.

Technologies:
- React Team for React
- Vercel for Next.js patterns
- Supabase for backend infrastructure
- Shadcn for UI components
- Recharts for data visualization

---

**Happy Tracking! 🎉**

Start your wellness journey today with Resolve.