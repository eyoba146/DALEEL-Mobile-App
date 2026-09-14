# Diaspora App Development Prompt

Build a modern, professional, production-ready cross-platform mobile application designed primarily for Ethiopians living abroad and foreign residents who have an interest in Ethiopia.

The application should act as a digital bridge between people living outside Ethiopia and Ethiopia, making it easier for users to access useful Ethiopian services, information, opportunities, products, experiences, and connections from one place.

## 1. CORE CONCEPT

The app should provide a personalized digital experience for diaspora users and foreign residents.

When a user downloads and opens the application for the first time, show a beautiful onboarding experience explaining the main benefits of the platform.

The user should be able to select:

- Ethiopian Diaspora
- Foreign Resident / International User

Then allow the user to select their country of residence and preferred language.

The application should feel trustworthy, premium, welcoming, modern, and strongly connected to Ethiopia without looking outdated or overly traditional.

## 2. MAIN HOME SCREEN

Create a visually attractive dashboard with:

- Personalized greeting
- User profile/avatar
- Search bar
- Notifications
- Featured services
- Featured Ethiopian experiences
- Important announcements
- Popular destinations
- Recommended services
- Quick-access categories
- Recently viewed items
- Personalized recommendations

Use beautiful Ethiopian photography throughout the application.

The visual identity should combine:

- Modern technology
- Ethiopian culture
- Ethiopian landscapes
- Addis Ababa
- Ethiopian architecture
- Coffee culture
- Tourism
- Family/community
- Business and investment

Avoid excessive use of flags or stereotypical cultural graphics.

## 3. MAIN SERVICE CATEGORIES

Create a category-based navigation system.

### Suggested categories

### Explore Ethiopia

- Tourist destinations
- Hotels
- Restaurants
- Cultural attractions
- Historical locations
- Events
- Ethiopian experiences
- Travel guides

### Services

- Transportation
- Accommodation
- Restaurants
- Tour operators
- Professional services
- Legal services
- Relocation assistance
- Translation services
- Document-related assistance

### Diaspora Services

- Remittance information
- Property services
- Housing
- Investment opportunities
- Business opportunities
- Family support
- Education
- Healthcare information
- Relocation assistance

### Ethiopian Marketplace

Allow users to discover Ethiopian products and services.

Include:

- Products
- Categories
- Search
- Product details
- Seller information
- Favorites
- Cart
- Order/request functionality

### Invest in Ethiopia

Create an investment-focused section showing:

- Investment opportunities
- Business opportunities
- Real-estate opportunities
- Agriculture opportunities
- Technology opportunities
- Investment guides
- Useful resources

### Events

Show:

- Upcoming events
- Cultural events
- Business events
- Conferences
- Community events
- Ethiopian festivals

Users should be able to view event details and save events.

## 4. USER ACCOUNT

Create a complete user profile system.

Users should be able to:

- Register
- Login
- Logout
- Edit profile
- Upload profile picture
- Change password
- Change country
- Change language
- Manage notifications
- Manage favorites
- View activity
- View saved items

Profile information should include:

- Name
- Country of residence
- Preferred language
- Optional interests
- Profile picture

## 5. SEARCH

Implement a powerful global search.

Users should be able to search for:

- Services
- Businesses
- Places
- Products
- Events
- Investment opportunities
- Articles
- Destinations

Provide:

- Search suggestions
- Filters
- Categories
- Location filtering
- Recently searched items

## 6. NOTIFICATIONS

Create a notification center.

Notifications may include:

- New services
- New events
- Recommended opportunities
- Order/request updates
- Important announcements
- Promotional information
- Account notifications

Allow users to control notification preferences.

## 7. PERSONALIZATION

The application should become more useful over time.

Use the user's:

- Country
- Selected interests
- Search history
- Saved items
- Viewed content

to provide personalized recommendations.

For example:

A user living in the United States who selects "Travel" and "Investment" could see:

"Recommended for you"

- Ethiopian travel experiences
- Addis Ababa properties
- Investment opportunities
- Ethiopian events in the USA
- Ethiopian restaurants nearby

## 8. MULTILINGUAL SUPPORT

The application should be prepared for multilingual support.

Initially support:

- English
- Amharic

Structure the application so additional languages can be added later.

Language selection should be available during onboarding and inside Settings.

## 9. LOCATION FEATURES

Where appropriate, use location services.

Users should be able to discover relevant services based on their location.

Examples:

- Ethiopian restaurants near me
- Ethiopian events near me
- Ethiopian businesses near me
- Services available in my country

Do not expose a user's precise location unnecessarily.

## 10. CONTENT / INFORMATION SECTION

Create a section for useful Ethiopian information.

Possible content:

- Ethiopia travel guides
- Culture
- History
- Investment information
- Business information
- Diaspora resources
- Government/service information
- News and announcements

Content should be organized using cards with attractive images.

## 11. FAVORITES

Allow users to save:

- Places
- Businesses
- Products
- Events
- Articles
- Investment opportunities

Create a dedicated "Saved" section.

## 12. ADMIN DASHBOARD

Create a separate secure web-based administration dashboard.

Administrators should be able to:

- Manage users
- Manage categories
- Manage services
- Manage businesses
- Manage destinations
- Manage products
- Manage events
- Manage articles
- Manage investment opportunities
- Manage advertisements/promotions
- Manage notifications
- Manage uploaded images
- View analytics

Dashboard statistics should include:

- Total users
- Active users
- New users
- Popular categories
- Popular destinations
- Most viewed services
- Most searched items
- Marketplace activity
- Event engagement

## 13. BUSINESS / SERVICE PROVIDER PORTAL

Design the system so businesses can eventually have their own accounts.

Businesses should be able to:

- Create a business profile
- Add services
- Upload images
- Add contact information
- Add location
- Manage listings
- Receive inquiries
- View basic analytics

Include a verification system so verified businesses can receive a visible verification badge.

## 14. DESIGN DIRECTION

The UI must be:

- Premium
- Modern
- Clean
- Minimal
- Highly responsive
- Mobile-first
- Easy to navigate
- Accessible
- Professional

Use a sophisticated Ethiopian-inspired visual identity.

Suggested visual direction:

- Warm cream / ivory backgrounds
- Deep green
- Ethiopian-inspired gold accents
- Subtle dark charcoal text
- White cards
- Soft shadows
- Large high-quality photography
- Rounded modern components
- Elegant typography

Do NOT make the entire interface dark.

Do NOT overuse Ethiopian flag colors.

Use cultural elements subtly and professionally.

## 15. IMAGE DIRECTION

Use high-quality photography that communicates the purpose of the application.

Prioritize images showing:

- Addis Ababa
- Ethiopian landscapes
- Lalibela
- Ethiopian coffee
- Ethiopian cultural experiences
- Modern Ethiopian businesses
- Ethiopian entrepreneurs
- Ethiopian families
- Diaspora communities
- International travelers
- Ethiopian hotels
- Ethiopian restaurants
- Modern city life
- Ethiopian architecture

Images should feel authentic, premium, and contemporary.

Avoid generic stock photos whenever possible.

## 16. NAVIGATION

Use a bottom navigation bar with approximately:

1. Home
2. Explore
3. Services
4. Saved
5. Profile

The navigation should remain simple and intuitive.

## 17. TECHNICAL ARCHITECTURE

Build the application using a scalable architecture.

Recommended stack:

### Frontend

- React Native
- Expo
- TypeScript

### Backend

- Node.js
- Express.js
- TypeScript

### Database

- PostgreSQL

### ORM

- Prisma

### Authentication

- JWT
- Secure password hashing

### Storage

- Cloud/object storage for images

### API

- REST API

The architecture must be modular and easy to maintain.

## 18. SECURITY

Implement:

- Secure authentication
- Password hashing
- JWT authentication
- Role-based access control
- Protected admin routes
- Input validation
- API validation
- Secure file uploads
- Rate limiting where appropriate
- Proper error handling
- Environment variables for secrets

Never hard-code passwords, API keys, database credentials, or JWT secrets.

## 19. PERFORMANCE

The application should:

- Load quickly
- Optimize images
- Use pagination
- Cache appropriate data
- Avoid unnecessary API requests
- Handle poor network conditions gracefully
- Provide loading states
- Provide empty states
- Provide error states

## 20. OFFLINE / POOR CONNECTION SUPPORT

Because many users may have unreliable internet connections, design the application to gracefully handle poor connectivity.

Cache appropriate content locally.

Show clear offline indicators.

Allow users to continue browsing previously loaded information when possible.

## 21. UX DETAILS

Every important action should have:

- Loading state
- Success state
- Error state
- Empty state
- Confirmation where necessary

Use smooth but subtle animations.

Avoid excessive animations.

The application should feel fast and polished.

## 22. MVP PRIORITY

For the first version, prioritize:

1. Onboarding
2. Authentication
3. Home dashboard
4. Explore Ethiopia
5. Services directory
6. Search
7. Events
8. Marketplace foundation
9. Investment section
10. Favorites
11. Notifications
12. User profile
13. English/Amharic language support
14. Admin dashboard
15. Business/service-provider foundation

Design the architecture so additional functionality can be added later without rebuilding the application.

## 23. IMPORTANT PRODUCT PRINCIPLE

This should NOT feel like just another Ethiopian tourism application.

The central idea is:

> "A digital bridge connecting the Ethiopian diaspora and international residents with Ethiopia."

The application should bring together:

- People
- Services
- Businesses
- Opportunities
- Experiences
- Information
- Products
- Events

into one trusted platform.

Create the application with a strong emphasis on trust, simplicity, accessibility, personalization, and scalability.

Build the UI first with realistic sample data and high-quality imagery, then structure the backend/API/database so the sample data can easily be replaced with real data.

Make every screen production-quality rather than creating a simple prototype.
