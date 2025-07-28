# eClinicPro - Healthcare Management Platform

A modern healthcare management platform built with React frontend and Node.js backend, featuring user authentication, appointment management, and digital medical records.

## 🚀 Features

- **User Authentication**: Secure login/register with OTP verification
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Real-time Animations**: Smooth scroll animations and typewriter effects
- **Role-based Access**: Support for patients, doctors, and administrators
- **Medical Records**: Digital management of patient history and prescriptions
- **Appointment System**: Smart booking and scheduling
- **Secure Billing**: Transparent payment processing

## 🛠️ Tech Stack

### Frontend
- React 18
- Tailwind CSS
- Axios for API calls
- React Router for navigation

### Backend
- Node.js with Express
- MongoDB with Mongoose
- Redis for caching and sessions
- JWT for authentication
- Nodemailer for email notifications
- bcrypt for password hashing

## 📁 Project Structure

```
├── src/                    # Backend source code
│   ├── HospitalController/ # User and business logic controllers
│   ├── HospitalRoutes/     # API route definitions
│   ├── HospitalModel/      # Database models
│   ├── HospitalUtils/      # Utility functions
│   ├── db/                 # Database connections
│   ├── middleware/         # Express middleware
│   └── jobs/              # Background job processing
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.js         # Main application component
│   │   └── index.js       # Application entry point
│   └── public/            # Static assets
└── package.json           # Root package configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Redis
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd user-signup-and-signin-model
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   REDIS_URL=your_redis_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   CORS_ORIGIN=http://localhost:3001
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   ```

5. **Start the development servers**
   ```bash
   # Run both frontend and backend concurrently
   npm start
   
   # Or run them separately:
   # Backend only
   npm run server
   
   # Frontend only
   npm run client
   ```

The application will be available at:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000

## 🔧 API Endpoints

### Authentication
- `POST /api/v1/users/register` - User registration
- `POST /api/v1/users/login` - User login
- `POST /api/v1/users/logout` - User logout
- `POST /api/v1/users/verifyUser` - OTP verification

### Medical Records
- `GET /api/v1/medical-records` - Get medical records
- `POST /api/v1/medical-records` - Create medical record

### Payments
- `GET /api/v1/payment` - Get payment information
- `POST /api/v1/payment` - Process payment

## 🎨 UI Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Theme**: Modern dark UI with violet accents
- **Smooth Animations**: Scroll-triggered animations and transitions
- **Interactive Elements**: Hover effects and micro-interactions
- **Loading States**: Proper loading indicators and feedback

## 🔐 Authentication Flow

1. **Registration**: User provides name, email, and password
2. **OTP Verification**: Email OTP is sent for verification
3. **Login**: User can login with email/password
4. **Session Management**: JWT tokens for secure sessions
5. **Logout**: Secure logout with token cleanup

## 🚀 Deployment

### Backend Deployment
```bash
# Build for production
npm run build

# Start production server
npm run start:prod
```

### Frontend Deployment
```bash
cd client
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support, email contact@eclinicpro.in or create an issue in the repository.