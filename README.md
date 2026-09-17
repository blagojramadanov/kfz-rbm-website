# KFZ RBM - Premium Used Car Dealership Platform

A modern, professional web platform for KFZ RBM, Germany's premium used-car dealership. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase PostgreSQL.

## Features

- **Vehicle Management**: Browse, filter, and search premium used cars
- **Trade-in (Inzahlungnahme) Workflow**: Streamlined vehicle exchange process
- **Customer Portal**: Users can submit vehicles, manage trade-in requests, and track inquiries
- **Admin Dashboard**: Manage inventory, review submissions, and handle customer requests
- **Multi-language Support**: German (DE) and English (EN) interfaces
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Supabase Integration**: PostgreSQL database with Row Level Security policies

## Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kfzrbm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_DEFAULT_LOCALE=de
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Set up the database**
   - Run migrations using Supabase CLI:
     ```bash
     supabase db push
     ```
   - Or use the Supabase Dashboard SQL Editor

## Project Structure

```
kfzrbm/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard pages
│   ├── dashboard/         # Customer dashboard
│   ├── fahrzeuge/         # Vehicle browsing
│   ├── register/          # User registration
│   ├── login/             # User login
│   └── layout.tsx         # Root layout
├── components/            # Reusable React components
├── lib/                   # Utilities and helpers
│   ├── auth-context.tsx   # Authentication context
│   ├── supabase.ts        # Supabase client setup
│   └── utils.ts           # Helper functions
├── public/                # Static assets
├── supabase/
│   └── migrations/        # Database migrations
├── .env.example           # Environment template
├── middleware.ts          # Next.js middleware
├── next.config.js         # Next.js configuration
└── package.json           # Dependencies
```

## Database Schema

The application uses the following main tables:

- **user_profiles**: User accounts with roles (ADMIN, CUSTOMER)
- **vehicles**: Dealership inventory
- **submitted_vehicles**: Customer vehicle submissions
- **trade_in_requests**: Trade-in inquiries
- **customer_inquiries**: General customer inquiries
- **vehicle_images**: Vehicle photos

Detailed schema documentation available in migrations.

## Security

- **Authentication**: Supabase Auth with email/password
- **Authorization**: Role-based access control (Admin/Customer)
- **Database**: PostgreSQL with Row Level Security (RLS) policies
- **Environment**: Sensitive credentials in `.env.local` (never committed)
- **Admin Routes**: Protected at middleware and component level

## Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
npm run start
```

### Code Quality
- TypeScript for type safety
- ESLint for code standards
- Prettier for code formatting

## Deployment

Recommended platforms:
- [Vercel](https://vercel.com/) (official Next.js hosting)
- [AWS Amplify](https://aws.amazon.com/amplify/)
- [Netlify](https://www.netlify.com/)

Set environment variables in your platform's configuration panel before deploying.

## License

Private project for KFZ RBM. All rights reserved.

## Support

For questions or issues, contact the development team.
