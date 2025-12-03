import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Truck, Shield, Zap } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', confirmPassword: '', department: '', designation: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.full_name) newErrors.full_name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const { data, error } = await signUp(formData.email, formData.password, {
      full_name: formData.full_name,
      department: formData.department,
      designation: formData.designation,
      phone: formData.phone,
    });
    setLoading(false);

    if (!error && data) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen relative z-10">
        <div className="hidden lg:flex flex-col items-center justify-center p-12 text-white">
          <div className="max-w-lg" style={{ animation: 'slideRight 0.8s ease-out' }}>
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl mb-6 shadow-2xl">
                <Truck className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <h1 className="text-6xl font-bold mb-4">Join Thapar Transport</h1>
              <p className="text-2xl opacity-90 mb-8">Create your account and start managing transport requests</p>
            </div>
            <div className="space-y-4">
              {[{ icon: Shield, text: 'Secure & Reliable' }, { icon: Zap, text: 'Fast & Efficient' }, { icon: Truck, text: 'Complete Fleet Management' }].map((feature, i) => (
                <div key={i} className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4" style={{ animation: 'slideRight 0.8s ease-out', animationDelay: `${(i + 1) * 200}ms`, opacity: 0, animationFillMode: 'forwards' }}>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                  </div>
                  <p className="text-lg font-medium">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-md" style={{ animation: 'slideUp 0.8s ease-out' }}>
            <div className="lg:hidden text-center mb-8 text-white">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl mb-4">
                <Truck className="w-8 h-8 text-white" strokeWidth={1.5} />
              </div>
              <h1 className="text-3xl font-bold">Thapar Transport</h1>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
              <p className="text-white/80 mb-8">Register to access the system</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Full Name</label>
                  <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Your full name" className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200" required />
                  {errors.full_name && <p className="mt-2 text-sm text-red-200">{errors.full_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="your.email@thapar.edu" className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200" required />
                  {errors.email && <p className="mt-2 text-sm text-red-200">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Department</label>
                    <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="Your department" className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Phone</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone number" className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200" required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create password" className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200" required />
                  {errors.password && <p className="mt-2 text-sm text-red-200">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Confirm Password</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm password" className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200" required />
                  {errors.confirmPassword && <p className="mt-2 text-sm text-red-200">{errors.confirmPassword}</p>}
                </div>

                <button type="submit" disabled={loading} className="w-full bg-white text-purple-600 py-3 px-6 rounded-xl font-semibold hover:bg-white/90 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div> : <><UserPlus className="w-5 h-5" strokeWidth={2} /><span>Create Account</span></>}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-white/80">
                Already have an account?{' '}
                <Link to="/login" className="text-white font-semibold hover:underline">Login here</Link>
              </p>
            </div>

            <p className="mt-6 text-center text-sm text-white/60">© 2025 Thapar Institute. All rights reserved.</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
};

export default Register;