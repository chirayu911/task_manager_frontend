import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Building2, User, MapPin, Hash, Globe, Mail,
    Phone, AtSign, DollarSign, Briefcase, Loader, ArrowLeft,
    Lock, Eye, EyeOff, CircleUser
} from 'lucide-react';
import API from '../api'; 

// Input Components (Outside to prevent re-rendering focus loss)
const InputField = ({ icon: Icon, label, required, className = "", ...props }) => (
    <div className={`space-y-1 ${className}`}>
        <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
        </div>
        <div className="relative group">
            <Icon className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-gray-700"
                required={required}
                {...props}
            />
        </div>
    </div>
);

const PasswordField = ({ icon: Icon, label, required, className = "", ...props }) => {
    const [showPassword, setShowPassword] = useState(false);
    return (
        <div className={`space-y-1 ${className}`}>
            <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            </div>
            <div className="relative group">
                <Icon className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-gray-700"
                    required={required}
                    {...props}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-gray-400 hover:text-blue-600 transition-colors focus:outline-none"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
        </div>
    );
};

const SelectField = ({ icon: Icon, label, required, options, className = "", ...props }) => (
    <div className={`space-y-1 ${className}`}>
        <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
        </div>
        <div className="relative group">
            <Icon className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <select
                className="w-full pl-12 pr-10 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-gray-700 appearance-none"
                required={required}
                {...props}
            >
                <option value="" disabled>*Please Select*</option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <div className="absolute right-4 top-0 bottom-0 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </div>
        </div>
    </div>
);

// MAIN COMPONENT
export default function CompanyRegistrationPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        companyName: '',
        owner: '',
        username: '', // ⭐ Added Username for login
        streetAddress: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        email: '',
        phoneNumber: '',
        nominalCapital: '',
        companyEmail: '',
        password: '',
        industry: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await API.post('/auth/register-company', formData);
            navigate('/login', { state: { message: 'Company registered successfully! Please log in.' } });
        } catch (err) {
            console.error(err);
            // Will display the exact error sent from the backend (e.g. "Username taken")
            setError(err.response?.data?.message || 'Failed to register company. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const countryOptions = [
        { value: 'us', label: 'United States' },
        { value: 'ca', label: 'Canada' },
        { value: 'uk', label: 'United Kingdom' },
        { value: 'in', label: 'India' },
        { value: 'au', label: 'Australia' },
    ];

    const industryOptions = [
        { value: 'technology', label: 'Technology' },
        { value: 'finance', label: 'Finance' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'manufacturing', label: 'Manufacturing' },
        { value: 'retail', label: 'Retail' },
        { value: 'other', label: 'Other' },
    ];

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-gray-100 p-4 md:py-12 transition-colors">
            <div className="bg-white p-8 md:p-10 rounded-[32px] shadow-2xl w-full max-w-4xl border border-gray-100 transition-all">

                <div className="text-center mb-10 relative">
                    <Link
                        to="/login"
                        className="absolute left-0 top-2 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all flex items-center gap-2 text-sm font-bold"
                    >
                        <ArrowLeft size={18} />
                        <span className="hidden md:inline">Back</span>
                    </Link>

                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-4 shadow-inner">
                        <Building2 className="text-blue-600" size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-gray-800 tracking-tight">Company Registration</h1>
                    <p className="text-gray-400 mt-2 text-xs uppercase font-bold tracking-widest">
                        Register your business to get started
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 text-sm border border-red-100 text-center font-medium animate-in fade-in zoom-in duration-300">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Company Information */}
                    <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-6">
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Building2 size={16} className="text-blue-500" />
                            Company information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField icon={Building2} label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Enter company name" required />
                            <InputField icon={AtSign} label="Company Contact Email" type="email" name="companyEmail" value={formData.companyEmail} onChange={handleChange} placeholder="contact@company.com" required />
                        </div>

                        <InputField icon={MapPin} label="Street Address" name="streetAddress" value={formData.streetAddress} onChange={handleChange} placeholder="123 Business Rd, Suite 100" required />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField icon={MapPin} label="City" name="city" value={formData.city} onChange={handleChange} placeholder="City" required />
                            <InputField icon={MapPin} label="State" name="state" value={formData.state} onChange={handleChange} placeholder="State / Province" required />
                            <InputField icon={Hash} label="Zip Code" name="zipCode" value={formData.zipCode} onChange={handleChange} placeholder="Postal Code" required />
                            <SelectField icon={Globe} label="Country" name="country" value={formData.country} onChange={handleChange} options={countryOptions} required />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField icon={DollarSign} label="Nominal Capital" type="text" name="nominalCapital" value={formData.nominalCapital} onChange={handleChange} placeholder="e.g. $100,000" />
                            <SelectField icon={Briefcase} label="Industry" name="industry" value={formData.industry} onChange={handleChange} options={industryOptions} required />
                        </div>
                    </div>

                    {/* Owner Information */}
                    <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-6">
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <User size={16} className="text-blue-500" />
                            Owner Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField icon={User} label="Owner Name" name="owner" value={formData.owner} onChange={handleChange} placeholder="Full name of owner" required />
                            <InputField icon={CircleUser} label="Login Username" name="username" value={formData.username} onChange={handleChange} placeholder="Choose a username" required />
                            <InputField icon={Mail} label="Owner Email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="owner@example.com" required />
                            <InputField icon={Phone} label="Phone Number" type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="(555) 123-4567" required />
                            <PasswordField icon={Lock} label="Password" name="password" value={formData.password} onChange={handleChange} placeholder="Create a secure password" required minLength="6" />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex flex-col-reverse md:flex-row items-center justify-end gap-4">
                        <Link
                            to="/login"
                            className="w-full md:w-auto px-8 py-4 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors text-center"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full md:w-auto px-10 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 font-bold transition-all shadow-xl shadow-blue-200 flex justify-center items-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <Loader className="animate-spin" size={20} />
                                    <span>Creating Account...</span>
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}