# Quick Start Guide

Get your motorcycle repair directory running in 3 simple steps!

## 1. Install Dependencies

```bash
cd /Users/andrewkalumba/Desktop/claude/motorcycle-directory
npm install
```

## 2. Verify Environment Variables

Check that `.env.local` exists with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://mcfyffbyiohcsimzwhoh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

## 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## What You'll See

- A beautiful gradient background with motorcycle image
- Filter controls for country, city, rating, and search
- Grid of motorcycle repair shop cards
- Interactive animations and hover effects
- Fully responsive design

## Key Features to Test

1. **Search**: Type "bike" or any shop name in the search box
2. **Country Filter**: Select a country to see shops from that region
3. **Dynamic Cities**: Notice how the city dropdown updates based on country
4. **Rating Filter**: Filter shops by minimum rating
5. **Google Maps**: Click "View on Map" to see location
6. **Back to Top**: Scroll down and click the arrow button

## Common Commands

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm start           # Start production server

# Utilities
npm run lint        # Check code quality
```

## Need Help?

Check the main [README.md](./README.md) for detailed documentation.

## File Structure Overview

```
src/
├── app/
│   ├── page.tsx          # Main page (start here!)
│   ├── layout.tsx        # App layout
│   └── globals.css       # Global styles
├── components/
│   ├── ShopCard.tsx      # Individual shop display
│   ├── Filters.tsx       # Filter controls
│   └── BackToTop.tsx     # Scroll to top button
├── lib/
│   └── supabase.ts       # Database connection
└── types/
    └── shop.ts           # TypeScript types
```

## Next Steps

- Customize colors in `tailwind.config.ts`
- Add more filter options in `Filters.tsx`
- Modify shop card design in `ShopCard.tsx`
- Deploy to Vercel for free hosting

Enjoy building with Next.js!
