# UncleSam Tours - Travel Booking Website

A modern, fully-featured travel booking website built with React, TypeScript, and TailwindCSS. Features AI-powered chatbots, dynamic itinerary generation, and comprehensive booking management.

## 🌟 Features

### Core Pages

- **Landing Page** - Hero carousel with Nagoya, Tokyo, Kyoto backgrounds
- **Offers Page** - Browse and filter travel packages
- **Custom Tour Builder** - Create personalized tours with AI assistance
- **Booking Confirmation** - Complete booking details with driver information
- **Customer Profile** - Manage bookings and personal information
- **Owner Dashboard** - Admin panel for managing bookings and analytics
- **About Us** - Company information and services
- **Contact Us** - Multiple contact methods with interactive form
- **FAQ Page** - Searchable help center

### AI-Powered Features

#### 1. FAQ Chatbot (Persistent)

- **Location**: Fixed at lower right corner on all pages
- **Purpose**: Answer common questions about bookings, payments, cancellations
- **Features**:
  - Intelligent keyword-based responses
  - Persistent across all pages
  - Minimizable interface
  - 24/7 availability simulation

#### 2. Itinerary AI Chatbot

- **Trigger**: Appears when customers select 2+ destinations in custom tour builder
- **Features**:
  - Real-time weather checking for destinations
  - Weather warnings and alternative suggestions
  - Detailed day-by-day itinerary generation
  - PDF export functionality
  - Personalized recommendations based on selections

### Booking System

- **Pricing Model**: Per pax (per passenger) pricing
- **Package Inclusions**:
  - 12-hour tour duration
  - Private tour with dedicated tour assistant
  - Private van transportation
  - Gas and toll fees included
  - Hotel pick-up and drop-off service
  - Driver fluent in English, Japanese, and Tagalog

### Post-Booking Features

- **Automatic Driver Assignment**: Complete driver details including:
  - Driver name and contact information
  - Vehicle type and license number
  - Languages spoken (English, Japanese, Tagalog)
  - Pre-travel contact schedule

## 🚀 Technology Stack

- **Frontend**: React 18 + TypeScript
- **Routing**: React Router 6
- **Styling**: TailwindCSS 3 with custom theme
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Build Tool**: Vite
- **Development**: Hot Module Replacement (HMR)

## 📱 Responsive Design

- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly interface elements
- Optimized performance on all devices

## 🎨 Design System

### Color Scheme

- Primary: Red (#DC2626) - UncleSam Tours brand color
- Secondary: White and gray tones
- Consistent with provided logo and branding

### Typography

- Clear hierarchy with proper headings
- Readable fonts optimized for Japanese and English text
- Accessible contrast ratios

## 🔧 Installation & Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run typecheck

# Format code
npm run format.fix
```

## 📞 Contact Information

**For Reservations/Inquiries:**

- 📩 Email: unclesamtourservices1988@gmail.com
- 📞 Phone: +81 80-5331-1738
- 💬 WhatsApp: +81 80-5331-1738

## 🗺️ Navigation Structure

```
/                    - Landing page with hero carousel
/offers             - Browse travel packages
/custom             - Custom tour builder with AI assistance
/about              - Company information
/contact            - Contact form and information
/signin             - Authentication page
/dashboard          - Owner/admin dashboard
/booking-confirmation - Post-booking details
/profile            - Customer account management
/faq                - Help center
```

## 🤖 AI Chatbot Features

### FAQ Chatbot Commands

The chatbot responds to keywords like:

- "booking" - Information about making reservations
- "payment" - Payment methods and processing
- "cancellation" - Cancellation policies
- "pricing" - Pricing structure and inclusions
- "driver" - Driver information and services
- "weather" - Weather-related policies
- "contact" - Contact information
- "languages" - Language support
- "pickup" - Pickup and drop-off services

### Itinerary AI Features

- **Weather Integration**: Mock real-time weather data
- **Smart Suggestions**: Alternative destinations for bad weather
- **Detailed Planning**: Hour-by-hour itinerary generation
- **Export Options**: PDF download with branded template
- **Personalization**: Based on selected destinations and preferences

## 🛡️ Features for Different User Types

### Customers

- Browse and book tour packages
- Create custom tours with AI assistance
- View booking history and receipts
- Access driver information post-booking
- Get 24/7 support via chatbot

### Tour Owners/Admins

- Dashboard with booking analytics
- Customer management tools
- Booking status management
- Revenue tracking
- Popular destination insights

## 📊 Mock Data

The application includes comprehensive mock data for:

- Tour packages with realistic pricing
- Customer bookings and history
- Driver profiles and details
- Weather information for destinations
- Dashboard analytics and statistics

## 🔮 Future Enhancements

- Real weather API integration
- Payment gateway integration
- SMS notifications
- Real-time chat with human agents
- Advanced analytics dashboard
- Multi-language support
- Mobile app version

## 📄 License

This project is created for UncleSam Tours. All rights reserved.

---

_Built with ❤️ for creating unforgettable travel experiences in Japan since 1988._
