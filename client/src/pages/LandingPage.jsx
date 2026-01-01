import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Truck, ArrowRight, CheckCircle, Shield, Zap, BarChart,
    Users, Clock, Car, FileText, TrendingUp, Smartphone,
    Menu, X, ChevronDown
} from 'lucide-react';

const LandingPage = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setMobileMenuOpen(false);
        }
    };

    const features = [
        {
            icon: FileText,
            title: 'Easy Request Submission',
            description: 'Submit transport requests in seconds with our intuitive interface'
        },
        {
            icon: CheckCircle,
            title: 'Multi-Level Approval',
            description: 'Automated routing to appropriate authorities with transparent workflow'
        },
        {
            icon: Car,
            title: 'Smart Vehicle Assignment',
            description: 'Efficient vehicle allocation with real-time availability tracking'
        },
        {
            icon: Clock,
            title: 'Real-Time Tracking',
            description: 'Monitor request status instantly and get notifications at every step'
        },
        {
            icon: Shield,
            title: 'Secure & Reliable',
            description: 'Role-based access control with data encryption and security'
        },
        {
            icon: Smartphone,
            title: 'Responsive Design',
            description: 'Works seamlessly on desktop, tablet, and mobile devices'
        },
        {
            icon: BarChart,
            title: 'Analytics & Reports',
            description: 'Comprehensive usage statistics and exportable data for analysis'
        },
        {
            icon: Zap,
            title: 'Fast & Efficient',
            description: 'Quick processing times with streamlined workflows'
        }
    ];

    const steps = [
        {
            number: '01',
            title: 'Submit Request',
            description: 'Fill out a simple form with your travel details and requirements',
            icon: FileText
        },
        {
            number: '02',
            title: 'Approval Process',
            description: 'Automatic routing through Head → Admin → Authority → Registrar',
            icon: CheckCircle
        },
        {
            number: '03',
            title: 'Vehicle Assigned',
            description: 'Admin assigns the most appropriate vehicle for your request',
            icon: Car
        },
        {
            number: '04',
            title: 'Travel Complete',
            description: 'Complete your journey and admin closes the request',
            icon: TrendingUp
        }
    ];

    const roles = [
        {
            title: 'Students',
            description: 'Submit transport requests for events, trips, and activities',
            icon: Users
        },
        {
            title: 'Faculty',
            description: 'Request transport for official duties and academic purposes',
            icon: Users
        },
        {
            title: 'Staff',
            description: 'Manage the entire transport system and vehicle fleet',
            icon: Users
        }
    ];

    const stats = [
        { number: '500+', label: 'Active Users' },
        { number: '1,000+', label: 'Requests Processed' },
        { number: '50+', label: 'Vehicles Managed' },
        { number: '99%', label: 'System Uptime' }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-lg' : 'bg-white/95 backdrop-blur-sm'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Truck className="w-6 h-6 text-white" strokeWidth={2} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Thapar Transport</h1>
                                <p className="text-xs text-gray-500">Management System</p>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-8">
                            <button onClick={() => scrollToSection('features')} className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                                Features
                            </button>
                            <button onClick={() => scrollToSection('how-it-works')} className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                                How It Works
                            </button>
                            <button onClick={() => scrollToSection('contact')} className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                                Contact
                            </button>
                            <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105"
                            >
                                Register
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-t">
                        <div className="px-4 py-4 space-y-3">
                            <button onClick={() => scrollToSection('features')} className="block w-full text-left text-gray-700 hover:text-blue-600 font-medium py-2">
                                Features
                            </button>
                            <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left text-gray-700 hover:text-blue-600 font-medium py-2">
                                How It Works
                            </button>
                            <button onClick={() => scrollToSection('contact')} className="block w-full text-left text-gray-700 hover:text-blue-600 font-medium py-2">
                                Contact
                            </button>
                            <Link to="/login" className="block w-full text-left text-gray-700 hover:text-blue-600 font-medium py-2">
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="block w-full bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors"
                            >
                                Register
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <div className="text-center lg:text-left">
                            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                                Streamline Your
                                <span className="block text-blue-600">
                                    Transport Management
                                </span>
                            </h1>
                            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                                Efficient, secure, and easy-to-use transport request management system for Thapar Institute.
                                Manage requests, track vehicles, and streamline approvals all in one place.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Link
                                    to="/register"
                                    className="inline-flex items-center justify-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
                                >
                                    <span>Get Started</span>
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                                <button
                                    onClick={() => scrollToSection('features')}
                                    className="inline-flex items-center justify-center space-x-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-all"
                                >
                                    <span>Learn More</span>
                                    <ChevronDown className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Right Image */}
                        <div className="relative">
                            <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                                <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                                    <Truck className="w-32 h-32 text-blue-600" strokeWidth={1.5} />
                                </div>
                            </div>
                            <div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                            <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Our System?</h2>
                        <p className="text-xl text-gray-600">Powerful features designed to make transport management effortless</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                            >
                                <feature.icon className="w-12 h-12 text-blue-600 mb-4" strokeWidth={1.5} />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
                        <p className="text-xl text-gray-600">Simple, streamlined process from request to completion</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <div key={index} className="relative">
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full text-white text-2xl font-bold mb-4">
                                        {step.number}
                                    </div>
                                    <div className="mb-4">
                                        <step.icon className="w-12 h-12 text-blue-600 mx-auto" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                                    <p className="text-gray-600">{step.description}</p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-blue-600 transform -translate-x-1/2"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* User Roles Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Who Can Use This System?</h2>
                        <p className="text-xl text-gray-600">Designed for everyone in the Thapar community</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {roles.map((role, index) => (
                            <div key={index} className="bg-white p-8 rounded-xl shadow-lg text-center border border-gray-100">
                                <role.icon className="w-16 h-16 text-blue-600 mx-auto mb-4" strokeWidth={1.5} />
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{role.title}</h3>
                                <p className="text-gray-600">{role.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-white mb-4">Trusted by Thapar Community</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-5xl font-bold text-white mb-2">{stat.number}</div>
                                <div className="text-blue-100 text-lg">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
                    <p className="text-xl text-gray-600 mb-8">
                        Access the system and streamline your transport management today
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
                        >
                            <span>Login to Your Account</span>
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center space-x-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-all"
                        >
                            <span>Create New Account</span>
                        </Link>
                    </div>
                    <p className="text-gray-500 mt-6">
                        Don't have an account? Register now to get started
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer id="contact" className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        {/* Company Info */}
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Truck className="w-6 h-6 text-white" strokeWidth={2} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Thapar Transport System</h3>
                                </div>
                            </div>
                            <p className="text-gray-400 mb-4">
                                Efficient transport management solution for Thapar Institute of Engineering & Technology.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
                            <ul className="space-y-2">
                                <li><button onClick={() => scrollToSection('features')} className="text-gray-400 hover:text-white transition-colors">Features</button></li>
                                <li><button onClick={() => scrollToSection('how-it-works')} className="text-gray-400 hover:text-white transition-colors">How It Works</button></li>
                                <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">Login</Link></li>
                                <li><Link to="/register" className="text-gray-400 hover:text-white transition-colors">Register</Link></li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className="text-lg font-bold mb-4">Contact</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li>📧 support@thapar.edu</li>
                                <li>📞 +91-XXXX-XXXXXX</li>
                                <li>📍 Thapar Institute, Patiala</li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
                        <p>© 2025 Thapar Institute of Engineering & Technology. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
        </div>
    );
};

export default LandingPage;
