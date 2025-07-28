# eClinicPro - Healthcare Management System

A modern healthcare management platform built with React frontend and Node.js backend, featuring user authentication, role-based access, and a beautiful responsive UI.

## 🚀 Features

- **Beautiful Landing Page** with scroll animations and modern design
- **User Authentication** with email verification via OTP
- **Role-based Access Control** (Patient, Doctor, Admin)
- **Responsive Design** with Tailwind CSS
- **Secure API** with JWT tokens and refresh token mechanism
- **Modern Tech Stack** with TypeScript support

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- Modern animations and scroll effects

### Backend
- Node.js with Express
- MongoDB with Mongoose
- Redis for caching and sessions
- JWT for authentication
- Email verification with OTP
- Agenda for job scheduling

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v16 or higher)
- MongoDB
- Redis
- Git

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd user-signup-and-signin-model
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
npm run frontend:install
```

### 3. Environment Configuration

#### Backend (.env in root directory)
```env
PORT=8000
CORS_ORIGIN=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/eclinicpro
ACCESS_TOKEN_SECRET=your_secret_key_here
REFRESH_TOKEN_SECRET=your_refresh_secret_here
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=10d

# Email configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Redis configuration
REDIS_URL=redis://localhost:6379
```

#### Frontend (.env in frontend directory)
```env
REACT_APP_API_URL=http://localhost:8000/api/v1
BROWSER=none
```

### 4. Start Services

#### Start MongoDB
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu
sudo systemctl start mongod

# Or run directly
mongod
```

#### Start Redis
```bash
# On macOS with Homebrew
brew services start redis

# On Ubuntu
sudo systemctl start redis

# Or run directly
redis-server
```

### 5. Run the Application

#### Development Mode (Both servers)
```bash
npm run dev:full
```

#### Or run separately
```bash
# Backend (runs on port 8000)
npm run dev

# Frontend (runs on port 3000) - in another terminal
npm run frontend
```

## 🌐 Usage

1. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

2. **Landing Page**
   - Beautiful homepage with animations
   - Features overview
   - Call-to-action buttons

3. **Authentication Flow**
   - Click "Login / Sign Up" to access authentication
   - Register with name, email, password, and role selection
   - Verify email with OTP sent to your email
   - Login with verified credentials
   - Access role-specific dashboard

4. **API Endpoints**
   - `POST /api/v1/users/register` - User registration
   - `POST /api/v1/users/verifyUser` - Email verification
   - `POST /api/v1/users/login` - User login
   - `POST /api/v1/users/logout` - User logout

## 🎨 UI Features

- **Modern Design** with dark theme and violet accents
- **Responsive Layout** that works on all devices
- **Smooth Animations** with scroll-triggered effects
- **Professional Typography** and spacing
- **Interactive Elements** with hover effects
- **Loading States** and error handling

## 🔐 Security Features

- **JWT Authentication** with access and refresh tokens
- **Password Hashing** with bcrypt
- **Email Verification** with OTP
- **CORS Protection** and secure headers
- **Rate Limiting** and input validation
- **Secure Cookie** handling

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Build and deploy to your preferred platform (Heroku, AWS, etc.)
3. Ensure MongoDB and Redis are accessible

### Frontend Deployment
```bash
cd frontend
npm run build
```
Deploy the `build` folder to your static hosting service.

## 📱 Screenshots

### Landing Page
- Hero section with video background
- Feature cards with icons
- Statistics section
- Contact form

### Authentication
- Login/Signup forms
- OTP verification
- Error and success messages
- Role selection

### Dashboard
- User information display
- Quick action cards
- Logout functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 📧 Support

For support, email contact@eclinicpro.in or create an issue on GitHub.

## 🔗 Links

- [Demo](http://localhost:3000) (when running locally)
- [API Documentation](http://localhost:8000/api/v1)
- [Frontend Source](./frontend)
- [Backend Source](./src)