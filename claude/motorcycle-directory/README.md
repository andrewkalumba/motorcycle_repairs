# EU Motorcycle Repair Directory - Next.js Application

A modern, responsive Next.js application for browsing motorcycle repair shops across Europe. Built with TypeScript, Tailwind CSS, and Supabase.

## Features

- **Dynamic Filtering**: Filter shops by country, city, rating, and search terms
- **Smart City Dropdown**: City options automatically update based on selected country
- **Real-time Search**: Search shops by name or address
- **Rating System**: Filter shops by minimum rating (3.0+ to 4.5+)
- **Responsive Design**: Fully responsive with mobile-first approach
- **Smooth Animations**: Beautiful fade-in and slide-up animations
- **Google Maps Integration**: Direct links to shop locations on Google Maps
- **Back to Top Button**: Smooth scroll to top functionality
- **Loading States**: Elegant loading indicators
- **Error Handling**: User-friendly error messages

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Deployment**: Vercel-ready

## Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- Supabase account (for database)

## Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd /Users/andrewkalumba/Desktop/claude/motorcycle-directory
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```

3. **Environment Variables**:

   The `.env.local` file is already configured with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://mcfyffbyiohcsimzwhoh.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
   ```

   If you need to change these, edit `.env.local` file.

## Running the Application

### Development Mode

```bash
npm run dev
```
or
```bash
yarn dev
```

The application will start on [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```
or
```bash
yarn build
yarn start
```

## Project Structure

```
motorcycle-directory/
├── public/
│   └── motor.jpg              # Background image
├── src/
│   ├── app/
│   │   ├── globals.css        # Global styles and Tailwind imports
│   │   ├── layout.tsx         # Root layout component
│   │   └── page.tsx           # Main page with filtering logic
│   ├── components/
│   │   ├── BackToTop.tsx      # Back to top button component
│   │   ├── Filters.tsx        # Filter controls component
│   │   └── ShopCard.tsx       # Individual shop card component
│   ├── lib/
│   │   └── supabase.ts        # Supabase client and data fetching
│   └── types/
│       └── shop.ts            # TypeScript interfaces
├── .env.local                 # Environment variables
├── .env.example               # Environment variables template
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Project dependencies
```

## Database Schema

The application expects a Supabase table named `motorcycle_repairs` with the following columns:

- `id` (int8, primary key)
- `name` (text) - Shop name
- `address` (text) - Street address
- `city` (text) - City and country (format: "City, Country")
- `latitude` (float8, nullable) - GPS latitude
- `longitude` (float8, nullable) - GPS longitude
- `phone` (text, nullable) - Contact phone
- `website` (text, nullable) - Shop website
- `rating` (float8, nullable) - Average rating
- `reviews_count` (int8, nullable) - Number of reviews
- `hours` (text, nullable) - Business hours

## Key Features Explained

### Dynamic Country-City Filtering

When a country is selected, the city dropdown automatically updates to show only cities from that country. This is achieved through React's `useMemo` hook for efficient filtering.

### Responsive Design

The application uses Tailwind's responsive utilities:
- Mobile: Single column layout
- Tablet (md): 2-column grid
- Desktop (lg): 3-column grid

### Animations

Custom animations defined in `tailwind.config.ts`:
- `fade-in`: Smooth entrance animation for cards
- `slide-up`: Slide animation for filter section
- `pulse-slow`: Loading indicator animation

### SEO Optimization

The application includes proper metadata in `layout.tsx` for better search engine optimization.

## Styling Approach

All styling has been converted from vanilla CSS to Tailwind CSS utility classes with the following benefits:

- **Consistency**: Design system tokens ensure consistent spacing, colors, and typography
- **Performance**: Purged CSS in production means smaller bundle sizes
- **Maintainability**: Co-located styles with components
- **Responsive**: Built-in responsive utilities
- **Dark Mode Ready**: Easy to implement dark mode if needed

### Custom Colors Used

- Primary gradient: `from-[#667eea] to-[#764ba2]`
- Accent: `#ffd700` (gold)
- Error: `from-[#ff6b6b] to-[#ee5a6f]`

## Deployment

### Vercel (Recommended)

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## Environment Variables for Production

When deploying, make sure to set these environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimizations

- Server-side rendering with Next.js App Router
- Optimized images with Next.js Image component ready
- Memoized filter computations with `useMemo`
- CSS purging in production
- Automatic code splitting
- Font optimization with Next.js

## Troubleshooting

### Supabase Connection Issues

If you see "Failed to load data":
1. Check your `.env.local` file has correct credentials
2. Verify your Supabase project is active
3. Check that the `motorcycle_repairs` table exists
4. Ensure Row Level Security (RLS) policies allow public read access

### Build Errors

If you encounter TypeScript errors during build:
```bash
npm run lint
```

### Styling Issues

If Tailwind classes aren't being applied:
1. Ensure `globals.css` imports are correct
2. Check `tailwind.config.ts` content paths
3. Clear `.next` folder and rebuild

## Development Tips

### Adding New Filters

To add a new filter:
1. Update `ShopFilters` interface in `src/types/shop.ts`
2. Add filter control in `src/components/Filters.tsx`
3. Update filter logic in `src/app/page.tsx`

### Customizing Styles

The main colors and styles can be customized in:
- `tailwind.config.ts`: Theme extensions
- Component files: Inline Tailwind classes
- `globals.css`: Global styles

### Adding New Shop Fields

1. Update `MotorcycleShop` interface in `src/types/shop.ts`
2. Update `ShopCard.tsx` to display new field
3. Update Supabase table schema if needed

## License

This project is private and proprietary.

## Support

For issues or questions, please contact the development team.
