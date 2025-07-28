import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// --- SVG Icon Components ---
const StethoscopeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h.5A2.5 2.5 0 0020 5.5V3.935m-16.945 7.07A10.002 10.002 0 0012 21a10.002 10.002 0 008.945-9.995" />
    </svg>
);

const ClipboardListIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

const ShieldCheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.917l9 3 9-3a12.02 12.02 0 00-2.382-9.971z" />
    </svg>
);

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// --- Custom Hook for Scroll Animations ---
const useAnimateOnScroll = (options) => {
    const ref = React.useRef(null);
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.unobserve(entry.target);
            }
        }, options);

        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [ref, options]);

    return [ref, isVisible];
};

// --- Authentication Context ---
const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on app load
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    // You can add a verify token endpoint here
                    setUser(JSON.parse(localStorage.getItem('user')));
                }
            } catch (error) {
                console.error('Auth check failed:', error);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (credentials) => {
        try {
            const response = await axios.post('http://localhost:3001/api/v1/users/login', credentials, {
                withCredentials: true
            });
            
            const { user: userData, accessToken, refreshToken } = response.data.data;
            
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(userData));
            
            setUser(userData);
            return { success: true, data: response.data };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.message || 'Login failed' 
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await axios.post('http://localhost:3001/api/v1/users/register', userData);
            return { success: true, data: response.data };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.message || 'Registration failed' 
            };
        }
    };

    const verifyOTP = async (email, otp) => {
        try {
            const response = await axios.post('http://localhost:3001/api/v1/users/verifyUser', { email, otp });
            return { success: true, data: response.data };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.message || 'OTP verification failed' 
            };
        }
    };

    const logout = async () => {
        try {
            await axios.post('http://localhost:3001/api/v1/users/logout', {}, {
                withCredentials: true
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, verifyOTP, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

const useAuth = () => {
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// --- Login Modal Component ---
const LoginModal = ({ isOpen, onClose, onSwitchToRegister }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [isLogin, setIsLogin] = useState(true);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register, verifyOTP } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (isLogin) {
            const result = await login(formData);
            if (result.success) {
                setMessage('Login successful!');
                onClose();
            } else {
                setMessage(result.error);
            }
        } else {
            const result = await register(formData);
            if (result.success) {
                setMessage('Registration successful! Please check your email for OTP verification.');
            } else {
                setMessage(result.error);
            }
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-8 rounded-xl max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">
                        {isLogin ? 'Login' : 'Register'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <CloseIcon />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                        required
                    />
                    
                    {message && (
                        <div className={`p-3 rounded-lg ${message.includes('successful') ? 'bg-green-600' : 'bg-red-600'}`}>
                            {message}
                        </div>
                    )}
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg hover:shadow-lg hover:shadow-violet-500/20 transition-shadow disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
                    </button>
                </form>
                
                <div className="mt-4 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-violet-400 hover:text-violet-300"
                    >
                        {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---
function App() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const { user, logout } = useAuth();
    const logoUrl = "https://res.cloudinary.com/dfhcviz9w/image/upload/e_background_removal/v1747924300/medical_records_d9uis4.png";

    const navLinks = [
        { title: "Home", href: "#home" },
        { title: "Services", href: "#services" },
        { title: "About", href: "#about" },
        { title: "Contact", href: "#contact" },
    ];

    const scrollToSection = (e, href) => {
        e.preventDefault();
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
        setIsMenuOpen(false);
    };
    
    const [heroRef, heroVisible] = useAnimateOnScroll({ threshold: 0.2 });
    const [servicesTitleRef, servicesTitleVisible] = useAnimateOnScroll({ threshold: 0.8 });
    const [service1Ref, service1Visible] = useAnimateOnScroll({ threshold: 0.5 });
    const [service2Ref, service2Visible] = useAnimateOnScroll({ threshold: 0.5 });
    const [service3Ref, service3Visible] = useAnimateOnScroll({ threshold: 0.5 });
    const [aboutRef, aboutVisible] = useAnimateOnScroll({ threshold: 0.3 });
    const [contactRef, contactVisible] = useAnimateOnScroll({ threshold: 0.4 });

    const tagline = "eClinicPro is a unified platform connecting patients, doctors, and administrators.";

    return (
        <div className="bg-slate-900 text-gray-300 font-sans">
             <style>{`
                .typewriter-text {
                    display: inline-block;
                    overflow: hidden;
                    border-right: .15em solid #a78bfa; /* The typewriter cursor - violet */
                    white-space: nowrap;
                    margin: 0 auto;
                    letter-spacing: .05em;
                    animation: typing 3.5s steps(${tagline.length}, end) forwards, blink-caret .75s step-end infinite;
                    font-weight: 600; /* Bold text */
                    width: 0;
                }

                @keyframes typing {
                    from { width: 0 }
                    to { width: 100% }
                }

                @keyframes blink-caret {
                    from, to { border-color: transparent }
                    50% { border-color: #a78bfa; } /* violet */
                }
            `}</style>
            <div>
                {/* Header */}
                <header className="fixed top-0 left-0 w-full bg-slate-900/80 backdrop-blur-sm z-50">
                    <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                        <img src={logoUrl} alt="eClinicPro Logo" className="h-10" />
                        <nav className="hidden md:flex space-x-8">
                            {navLinks.map(link => (
                                <a key={link.title} href={link.href} onClick={(e) => scrollToSection(e, link.href)} className="hover:text-violet-400 transition-colors">
                                    {link.title}
                                </a>
                            ))}
                        </nav>
                        <div className="flex items-center">
                            {user ? (
                                <div className="flex items-center space-x-4">
                                    <span className="text-white">Welcome, {user.name}</span>
                                    <button 
                                        onClick={logout}
                                        className="bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold px-6 py-2 rounded-lg hover:shadow-lg hover:shadow-red-500/20 transition-shadow"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setIsLoginModalOpen(true)}
                                    className="hidden sm:inline-block bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold px-6 py-2 rounded-lg hover:shadow-lg hover:shadow-violet-500/20 transition-shadow"
                                >
                                    Login / Sign Up
                                </button>
                            )}
                            <button className="md:hidden ml-4 text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
                            </button>
                        </div>
                    </div>
                    {isMenuOpen && (
                        <div className="md:hidden bg-slate-800 py-4">
                            {navLinks.map(link => (
                                <a key={link.title} href={link.href} onClick={(e) => scrollToSection(e, link.href)} className="block text-center py-2 hover:bg-slate-700">
                                    {link.title}
                                </a>
                            ))}
                            {!user && (
                                <button 
                                    onClick={() => {
                                        setIsLoginModalOpen(true);
                                        setIsMenuOpen(false);
                                    }}
                                    className="block text-center py-2 mt-2 mx-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-lg"
                                >
                                    Login / Sign Up
                                </button>
                            )}
                        </div>
                    )}
                </header>

                <main>
                    {/* Hero Section */}
                    <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full">
                            <video 
                                src="https://assets.mixkit.co/videos/preview/mixkit-doctor-looks-at-a-holographic-display-of-the-human-41229-large.mp4"
                                autoPlay
                                loop
                                muted
                                className="w-full h-full object-cover"
                            ></video>
                            <div className="absolute top-0 left-0 w-full h-full bg-slate-900/70"></div>
                        </div>
                        <div ref={heroRef} className={`relative z-10 text-center px-6 transition-opacity duration-1000 ease-out ${heroVisible ? 'opacity-100' : 'opacity-0'}`}>
                            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
                                The Future of Healthcare, <span className="text-violet-400">Simplified.</span>
                            </h1>
                            <div className="mt-6 text-lg max-w-3xl mx-auto flex justify-center text-gray-300">
                                <p className="typewriter-text">
                                    {tagline}
                                </p>
                            </div>
                            {!user && (
                                <button 
                                    onClick={() => setIsLoginModalOpen(true)}
                                    className="mt-8 inline-block bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold px-8 py-3 rounded-lg text-lg hover:shadow-xl hover:shadow-violet-500/30 transition-shadow transform hover:scale-105"
                                >
                                    Get Started
                                </button>
                            )}
                        </div>
                    </section>

                    {/* Services Section */}
                    <section id="services" className="py-24">
                        <div className="container mx-auto px-6 text-center">
                             <div ref={servicesTitleRef} className={`transition-all duration-700 ease-out ${servicesTitleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                                <h2 className="text-4xl font-bold text-white">Our Core Features</h2>
                                <p className="text-gray-400 mt-2">Designed for every role in the healthcare ecosystem.</p>
                            </div>
                            <div className="mt-16 grid gap-8 md:grid-cols-3">
                                <div ref={service1Ref} className={`bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700 hover:border-violet-400 transition-all duration-500 ease-out ${service1Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                                    <StethoscopeIcon />
                                    <h3 className="text-xl font-bold mt-4 text-white">Smart Appointments</h3>
                                    <p className="text-gray-400 mt-2">Patients can easily book and manage appointments. Doctors get a clear view of their schedule.</p>
                                </div>
                                <div ref={service2Ref} className={`bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700 hover:border-violet-400 transition-all duration-500 ease-out ${service2Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: '150ms'}}>
                                    <ClipboardListIcon />
                                    <h3 className="text-xl font-bold mt-4 text-white">Digital Medical Records</h3>
                                    <p className="text-gray-400 mt-2">Access and manage patient history, prescriptions, and lab results securely from anywhere.</p>
                                </div>
                                <div ref={service3Ref} className={`bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700 hover:border-violet-400 transition-all duration-500 ease-out ${service3Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: '300ms'}}>
                                    <ShieldCheckIcon />
                                    <h3 className="text-xl font-bold mt-4 text-white">Secure & Transparent Billing</h3>
                                    <p className="text-gray-400 mt-2">Automated billing, secure online payments, and clear financial records for admins and patients.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    {/* About Section */}
                    <section id="about" ref={aboutRef} className={`py-24 bg-slate-800/50 transition-opacity duration-1000 ease-out ${aboutVisible ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="container mx-auto px-6">
                            <div className="text-center">
                                <h2 className="text-4xl font-bold text-white">Pioneering Digital Health</h2>
                                <p className="text-gray-400 mt-2 max-w-3xl mx-auto">We founded eClinicPro with a simple mission: to leverage technology to make healthcare more accessible, efficient, and user-friendly for everyone involved.</p>
                            </div>
                            <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
                                <div className="bg-slate-900 p-8 rounded-xl">
                                    <p className="text-5xl font-bold text-violet-400">1M+</p>
                                    <p className="text-gray-400 mt-2">Patients Served</p>
                                </div>
                                 <div className="bg-slate-900 p-8 rounded-xl">
                                    <p className="text-5xl font-bold text-violet-400">5,000+</p>
                                    <p className="text-gray-400 mt-2">Verified Doctors & Staff</p>
                                </div>
                                 <div className="bg-slate-900 p-8 rounded-xl">
                                    <p className="text-5xl font-bold text-violet-400">20+</p>
                                    <p className="text-gray-400 mt-2">Healthcare Awards</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Contact Section */}
                    <section id="contact" ref={contactRef} className={`py-24 bg-slate-800/50 transition-opacity duration-1000 ease-out ${contactVisible ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="container mx-auto px-6">
                            <div className="text-center">
                                <h2 className="text-4xl font-bold text-white">Get In Touch</h2>
                                <p className="text-gray-400 mt-2">Have a question or want to get started? Drop us a line.</p>
                            </div>
                            <div className="max-w-xl mx-auto mt-12">
                                <form className="space-y-6">
                                    <input type="text" placeholder="Your Name" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-400 transition" />
                                    <input type="email" placeholder="Your Email" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-400 transition" />
                                    <textarea placeholder="Your Message" rows="5" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-400 transition"></textarea>
                                    <button type="submit" className="w-full py-3 font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg hover:shadow-lg hover:shadow-violet-500/20 transition-shadow">
                                        Send Message
                                    </button>
                                </form>
                            </div>
                        </div>
                    </section>

                </main>

                {/* Footer */}
                <footer className="bg-slate-900 border-t border-slate-800 py-12">
                    <div className="container mx-auto px-6 text-center">
                        <img src={logoUrl} alt="eClinicPro Logo" className="h-10 mx-auto" />
                        <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
                            Simplifying healthcare for a better tomorrow.
                        </p>
                        <div className="mt-6">
                            <p className="text-gray-400">contact@eclinicpro.in | +91 987 654 3210</p>
                        </div>
                        <div className="mt-6 border-t border-slate-800 pt-6">
                            <p className="text-gray-600">&copy; 2025 eClinicPro. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Login Modal */}
            <LoginModal 
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
            />
        </div>
    );
}

// --- App with Auth Provider ---
function AppWithAuth() {
    return (
        <AuthProvider>
            <App />
        </AuthProvider>
    );
}

export default AppWithAuth;
