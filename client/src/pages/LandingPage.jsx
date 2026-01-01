import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    CheckCircle, Shield, Zap, Users, Menu, X,
    FileText, Clock, Car, BarChart, Smartphone
} from 'lucide-react';

const LandingPage = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const features = [
        { icon: FileText, title: 'Easy Request Submission', description: 'Submit transport requests in seconds with our intuitive interface' },
        { icon: CheckCircle, title: 'Multi-Level Approval', description: 'Automated routing to appropriate authorities with transparent workflow' },
        { icon: Car, title: 'Smart Vehicle Assignment', description: 'Efficient vehicle allocation with real-time availability tracking' },
        { icon: Clock, title: 'Real-Time Tracking', description: 'Monitor request status instantly and get notifications at every step' },
        { icon: Shield, title: 'Secure & Reliable', description: 'Role-based access control with data encryption and security' },
        { icon: Smartphone, title: 'Responsive Design', description: 'Works seamlessly on desktop, tablet, and mobile devices' },
        { icon: BarChart, title: 'Analytics & Reports', description: 'Comprehensive usage statistics and exportable data for analysis' },
        { icon: Zap, title: 'Fast & Efficient', description: 'Quick processing times with streamlined workflows' },
    ];

    const steps = [
        { number: '01', title: 'Submit Request', description: 'Fill out a simple form with your travel details' },
        { number: '02', title: 'Approval Process', description: 'Automatic routing through Head → Admin → Authority' },
        { number: '03', title: 'Vehicle Assigned', description: 'Admin assigns the appropriate vehicle' },
        { number: '04', title: 'Travel Complete', description: 'Complete your journey successfully' },
    ];

    const roles = [
        { title: 'Faculty', description: 'Request transport for official duties and academic purposes', icon: Users },
        { title: 'Staff', description: 'Manage the entire transport system and vehicle fleet', icon: Users },
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center">
                            <img src="/images/ttms-logo.png" alt="TTMS Logo" style={{ height: '45px' }} />
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                                Features
                            </a>
                            <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                                How It Works
                            </a>
                            <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                                Contact
                            </a>
                            <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all"
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
                            <a href="#features" className="block text-gray-700 hover:text-blue-600 font-medium py-2">
                                Features
                            </a>
                            <a href="#how-it-works" className="block text-gray-700 hover:text-blue-600 font-medium py-2">
                                How It Works
                            </a>
                            <a href="#contact" className="block text-gray-700 hover:text-blue-600 font-medium py-2">
                                Contact
                            </a>
                            <Link to="/login" className="block text-gray-700 hover:text-blue-600 font-medium py-2">
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold text-center hover:bg-blue-700"
                            >
                                Register
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                        Streamline Your
                        <span className="block text-blue-600 mt-2">Transport Management</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                        Efficient, secure, and easy-to-use transport request management system for Thapar Institute.
                        Manage requests, track vehicles, and streamline approvals all in one place.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg"
                        >
                            Get Started
                        </Link>
                        <a
                            href="#features"
                            className="inline-flex items-center justify-center bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-all"
                        >
                            Learn More
                        </a>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Our System?</h2>
                        <p className="text-xl text-gray-600">Powerful features designed to make transport management effortless</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-blue-600 hover:shadow-lg transition-all duration-300"
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
            <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
                        <p className="text-xl text-gray-600">Simple, streamlined process from request to completion</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <div key={index} className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full text-white text-2xl font-bold mb-4">
                                    {step.number}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                                <p className="text-gray-600">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* User Roles Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Who Can Use This System?</h2>
                        <p className="text-xl text-gray-600">Designed for everyone in the Thapar community</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {roles.map((role, index) => (
                            <div key={index} className="bg-white p-8 rounded-xl border-2 border-gray-200 hover:border-blue-600 hover:shadow-lg transition-all text-center">
                                <role.icon className="w-16 h-16 text-blue-600 mx-auto mb-4" strokeWidth={1.5} />
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{role.title}</h3>
                                <p className="text-gray-600">{role.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-white mb-4">Trusted by Thapar Community</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-5xl font-bold text-white mb-2">500+</div>
                            <div className="text-blue-100 text-lg">Active Users</div>
                        </div>
                        <div>
                            <div className="text-5xl font-bold text-white mb-2">1,000+</div>
                            <div className="text-blue-100 text-lg">Requests Processed</div>
                        </div>
                        <div>
                            <div className="text-5xl font-bold text-white mb-2">50+</div>
                            <div className="text-blue-100 text-lg">Vehicles Managed</div>
                        </div>
                        <div>
                            <div className="text-5xl font-bold text-white mb-2">99%</div>
                            <div className="text-blue-100 text-lg">System Uptime</div>
                        </div>
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
                            className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg"
                        >
                            Login to Your Account
                        </Link>
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-all"
                        >
                            Create New Account
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
                            <img src="/images/ttms-logo.png" alt="TTMS Logo" style={{ height: '45px' }} className="mb-4 brightness-0 invert" />
                            <p className="text-gray-400 mb-4">
                                Efficient transport management solution for Thapar Institute of Engineering & Technology.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
                            <ul className="space-y-2">
                                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                                <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">How It Works</a></li>
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
        </div>
    );
};

export default LandingPage;
