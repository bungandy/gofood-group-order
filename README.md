# GoFood Group Order

A modern web application for creating and managing group food orders from GoFood restaurants. Built with React, TypeScript, and Supabase.

## Overview

GoFood Group Order simplifies the process of ordering food for groups by allowing users to:
- Create group ordering sessions with multiple restaurants
- Share session links with friends to collect orders
- View consolidated order summaries
- Manage real-time chat during ordering

## Features

### Core Functionality
- **Multi-Restaurant Support**: Add multiple GoFood restaurant links in a single session
- **Real-time Collaboration**: Live chat with mention system for group coordination
- **Order Management**: Add, edit, and delete orders with item quantity tracking
- **Order Summary**: Consolidated view of all orders grouped by restaurant
- **Session Sharing**: Easy link sharing for group participation

### Technical Features
- **Real-time Updates**: Live synchronization using Supabase realtime subscriptions
- **GoFood API Integration**: Automatic restaurant data and menu fetching
- **Responsive Design**: Mobile-first UI with shadcn/ui components
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Form Validation**: Client-side validation with Zod schemas

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **shadcn/ui** - UI component library
- **React Router** - Client-side routing
- **React Hook Form** - Form management
- **TanStack Query** - Server state management

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication ready
- **GoFood API** - Restaurant and menu data

### Key Dependencies
- **Axios** - HTTP client for API calls
- **Zod** - Schema validation
- **Lucide React** - Icon library
- **date-fns** - Date utilities
- **Sonner** - Toast notifications

## Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── common/          # Shared components (ErrorBoundary, Loading)
│   ├── menu/            # Menu-related components
│   └── order/           # Order-related components
├── pages/               # Page components
├── hooks/               # Custom React hooks
├── integrations/        # External service integrations
│   └── supabase/        # Supabase client and types
├── services/            # API services
├── utils/               # Utility functions
├── types.ts             # TypeScript type definitions
├── constants/           # Application constants
└── schemas/             # Validation schemas
```

## Database Schema

### Tables
- **sessions**: Group ordering sessions
- **merchants**: Restaurant data per session
- **orders**: Individual customer orders
- **order_items**: Menu items within orders
- **chat_messages**: Real-time chat messages

### Key Relationships
- Sessions have many merchants and orders
- Orders have many order items
- Chat messages belong to sessions

## API Integration

### GoFood API
The application integrates with GoFood's API to fetch:
- Restaurant details (name, address, cuisine)
- Menu items with prices and descriptions
- Restaurant availability status

**Key Service**: `GofoodApiService` (`src/utils/gofoodApi.ts`)
- Converts GoFood URLs to API endpoints
- Fetches and caches restaurant data
- Handles API authentication and headers

## Key Features Implementation

### Real-time Chat System
- **Location**: `src/components/GroupChat.tsx`
- **Hooks**: `src/hooks/useSupabaseChat.ts`
- Features mention system with `@` suggestions
- Real-time message synchronization
- Persistent chat history

### Order Management
- **Components**: `src/components/order/OrderForm.tsx`
- **Hooks**: `src/hooks/useSupabaseOrders.ts`
- **Validation**: `src/schemas/validation.ts`
- Real-time order updates across all users
- Quantity-based pricing calculations

### Session Management
- **Hook**: `src/hooks/useSupabaseSession.ts`
- **Types**: Database types in `src/integrations/supabase/types.ts`
- Creates sessions with multiple restaurant links
- Validates GoFood URLs before processing

## Environment Setup

### Required Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build in development mode
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gofood-group-order
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the migrations from `supabase/migrations/`
   - Enable realtime for required tables

5. **Start development server**
   ```bash
   npm run dev
   ```

## Usage Flow

1. **Create Session**: User adds GoFood restaurant links
2. **Share Link**: Session link is shared with group members
3. **Order Collection**: Group members add their food orders
4. **Real-time Chat**: Coordination through built-in chat
5. **Order Summary**: View consolidated orders by restaurant
6. **Place Orders**: Use summary to place actual orders on GoFood

## Error Handling

### API Errors
- GoFood API failures fall back to basic restaurant info
- Network errors show user-friendly messages
- Token expiration detected and reported

### Validation
- Form validation using Zod schemas
- Real-time validation feedback
- Server-side validation backup

### Error Boundaries
- React Error Boundary catches component errors
- Graceful degradation with retry options
- Error logging for debugging

## Performance Optimizations

- **Component Optimization**: React.memo for expensive components
- **Query Optimization**: TanStack Query caching and background updates
- **Real-time Efficiency**: Selective Supabase subscriptions
- **Bundle Optimization**: Vite code splitting and tree shaking

## Contributing

### Code Style
- TypeScript strict mode enabled
- ESLint configuration with React rules
- Consistent component patterns
- Comprehensive error handling

### Key Patterns
- Custom hooks for data management
- Service layer for API calls
- Centralized constants and types
- Modular component architecture

## Security Notes

- Environment variables for sensitive data
- Supabase RLS (Row Level Security) ready
- API token protection
- Input validation and sanitization

## Future Enhancements

- User authentication system
- Order history and favorites
- Payment integration
- Push notifications
- Mobile app version
- Advanced restaurant filtering
- Delivery coordination features

---

This README serves as both documentation and reference for understanding the codebase architecture, key features, and implementation details. Use it to quickly orient yourself with the project structure and make informed decisions about enhancements and modifications.
