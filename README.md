# KFZ RBM – Premium Cars

Website of KFZ RBM, a used-car dealership: a public vehicle showroom, a customer area for selling a car to RBM, and an admin area for the dealership team. Available in German, English and Macedonian.

## Tech stack

- **Framework:** Next.js 14 (App Router, server components, server actions, ISR)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with shadcn/ui-style components, Lucide icons
- **Backend:** Supabase – PostgreSQL with Row Level Security, Auth (email/password) and Storage for vehicle photos
- **Validation:** zod on every server action
- **Internationalization:** next-intl (de, en, mk)
- **Hosting:** Vercel

## Features

### Public site
- Home page with search, the latest and featured vehicles
- Vehicle listing (`/fahrzeuge`) and a separate export listing, with filters for brand, model, price, year, mileage, fuel, transmission, body type and colour, plus sorting; filters are kept in the URL
- Vehicle detail page with photo gallery, technical data and vehicle history (previous owners, HU/AU, accident history, service book)
- Vehicle inquiries and test-drive requests (with preferred date) straight from the vehicle page
- Contact form, services page, about us, imprint and privacy policy
- Language switcher for German, English and Macedonian

### Customer area
- Registration, login and password reset
- "Sell your car" wizard: vehicle data, condition, sale type (direct sale, trade-in or consignment) and photos
- "My vehicles": status of each submission, offers from RBM that can be accepted or declined, agreed price and rejection reasons
- Trade-in requests for a vehicle from the inventory
- Overview of the customer's own inquiries and test-drive requests
- Favorites (saved vehicles) with a counter in the navigation
- Profile management

### Admin area
- Dashboard and statistics (inventory, submissions by status, inquiries, trade-ins)
- Vehicle management: create, edit, publish or keep as draft, photo upload, featured and export flags
- Review of customer submissions: send or change offers, reject with a reason, publish an accepted vehicle into the inventory (photos and details are copied over)
- Inquiry management with status and type filters (vehicle inquiries, test drives, contact messages)
- Trade-in request management
- Customer list and customer details with their vehicles, inquiries and trade-ins

### Security
- Role-based access (admin / customer), enforced in the middleware and in every server action
- Row Level Security on all tables and storage buckets; customer photos are stored privately and shown through signed URLs
