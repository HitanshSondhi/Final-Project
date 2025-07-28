# eClinicPro - Healthcare Management Platform

A modern healthcare management platform with a React frontend and Node.js backend, featuring user authentication, appointment management, and medical records.

## 🚀 Features

- **User Authentication**: Secure login/register with OTP verification
- **Role-based Access**: Support for patients, doctors, and administrators
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Real-time Features**: Appointment booking and management
- **Medical Records**: Digital health records management
- **Secure Billing**: Transparent payment processing

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Redis** for caching and session management
- **JWT** for authentication
- **Nodemailer** for email notifications
- **Multer** for file uploads
- **Cloudinary** for media storage

### Frontend
- **React.js** with functional components and hooks
- **Tailwind CSS** for styling
- **Axios** for API communication
- **Intersection Observer** for scroll animations

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Redis
- npm or yarn

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd eClinicPro
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.sample .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=8000
   MONGODB_URI=your_mongodb_connection_string
   REDIS_URL=your_redis_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   CORS_ORIGIN=http://localhost:3000
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```

4. **Start the development servers**
   ```bash
   npm run dev:full
   ```

This will start both:
- Backend server on `http://localhost:8000`
- Frontend development server on `http://localhost:3000`

## 🏃‍♂️ Available Scripts

### Root Directory
- `npm run dev` - Start backend in development mode
- `npm run start` - Start backend in production mode
- `npm run frontend` - Start React frontend
- `npm run dev:full` - Start both backend and frontend
- `npm run install:all` - Install dependencies for both backend and frontend

### Frontend Directory
- `npm start` - Start React development server
- `npm run build` - Build for production
- `npm test` - Run tests

## 🔧 API Endpoints

### Authentication
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/verifyUser` - Verify OTP for registration
- `POST /api/v1/users/login` - User login
- `POST /api/v1/users/logout` - User logout

### Medical Records
- `GET /api/v1/medical-records` - Get medical records
- `POST /api/v1/medical-records` - Create medical record
- `PUT /api/v1/medical-records/:id` - Update medical record
- `DELETE /api/v1/medical-records/:id` - Delete medical record

### Payments
- `GET /api/v1/payment` - Get payment information
- `POST /api/v1/payment` - Process payment

## 🎨 Frontend Features

### Components
- **Hero Section**: Animated landing page with video background
- **Services Section**: Feature showcase with scroll animations
- **About Section**: Company information and statistics
- **Contact Section**: Contact form
- **Auth Modal**: Login/Register modal with OTP verification

### Animations
- Scroll-triggered animations using Intersection Observer
- Typewriter effect for tagline
- Smooth transitions and hover effects

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for password security
- **OTP Verification**: Email-based OTP for registration
- **CORS Protection**: Cross-origin resource sharing configuration
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Protection against brute force attacks

## 📱 Responsive Design

The frontend is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## 🚀 Deployment

### Backend Deployment
1. Set up your production environment variables
2. Build the application: `npm run build`
3. Start the server: `npm start`

### Frontend Deployment
1. Build the React app: `cd frontend && npm run build`
2. Deploy the `build` folder to your hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For support, email contact@eclinicpro.in or call +91 987 654 3210.

---

**eClinicPro** - Simplifying healthcare for a better tomorrow.