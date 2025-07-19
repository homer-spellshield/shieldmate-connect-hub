
# ShieldMate Connect Hub

A comprehensive platform connecting emergency services organizations with volunteers for mission-critical operations.

## About

ShieldMate Connect Hub is a web application designed to bridge the gap between emergency services organizations and skilled volunteers. The platform enables organizations to post missions, manage applications, and coordinate with volunteers who have the necessary skills and availability for emergency response operations.

## Features

- **Mission Management**: Organizations can create, edit, and manage emergency missions
- **Volunteer Matching**: Smart matching system based on skills and availability
- **Application System**: Streamlined application process for volunteers
- **Role-Based Access**: Different interfaces for volunteers, organizations, and administrators
- **Real-time Updates**: Live updates on mission status and applications
- **Skill Verification**: System for verifying and managing volunteer skills

## Technology Stack

This project is built with modern web technologies:

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui component library
- **Backend**: Supabase (Database, Authentication, Real-time)
- **State Management**: TanStack React Query
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Local Development

1. **Clone the repository**
   ```sh
   git clone <repository-url>
   cd shieldmate-connect-hub
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env.local` file in the root directory with your Supabase configuration:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```sh
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

### Database Setup

This project uses Supabase as the backend. You'll need to:

1. Create a new Supabase project
2. Run the provided SQL migrations in the `supabase/migrations/` directory
3. Configure Row Level Security (RLS) policies as defined in the migration files
4. Set up authentication providers as needed

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components and routes
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
├── lib/               # Utility functions and configurations
└── types/             # TypeScript type definitions

supabase/
├── migrations/        # Database migration files
└── functions/         # Edge functions
```

## User Roles

The platform supports three main user roles:

- **Volunteers**: Browse and apply for missions, manage their skills and availability
- **Organizations**: Create missions, review applications, manage team members
- **Administrators**: System-wide management, user verification, platform oversight

## Deployment

### Build for Production

```sh
npm run build
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

### Deployment Options

- **Vercel**: Connect your repository for automatic deployments
- **Netlify**: Deploy via Git integration or manual upload
- **Static Hosting**: Upload the `dist/` folder to any web server
- **Supabase Hosting**: Use Supabase's built-in hosting features

## Contributing

We welcome contributions to improve ShieldMate Connect Hub! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions, issues, or feature requests, please open an issue in the repository or contact the development team.

---

Built with ❤️ for emergency services and volunteer communities.
