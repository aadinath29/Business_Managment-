import React, { useState, useEffect } from 'react';
import { Button } from '../UI/Button';
import { X, Check } from 'lucide-react';

const EMPTY_FORM = {
  branchName: '',
  branchCode: '',
  companyName: 'Kosqu Software',
  companyLocation: '',
  country: 'India',
  state: '',
  city: '',
  address: '',
  manager: '',
  email: '',
  phone: '',
  pincode: '',
  assignedTarget: '',
  achievedTarget: '',
  workingDays: '',
  timezone: 'IST (UTC+05:30)',
  gstNumber: '',
  panNumber: ''
};

export function BranchFormDrawer({ branch, isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [errors, setErrors] = useState({});
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (branch) {
      setFormData({
        branchName: branch.branchName || '',
        branchCode: branch.branchCode || '',
        companyName: branch.companyName || 'Kosqu Software',
        companyLocation: branch.companyLocation || '',
        country: branch.country || 'India',
        state: branch.state || '',
        city: branch.city || '',
        address: branch.address || '',
        manager: branch.manager && branch.manager !== 'Not Assigned' ? branch.manager : '',
        email: branch.email || '',
        phone: branch.phone || '',
        pincode: branch.pincode || '',
        assignedTarget: branch.assignedTarget || '',
        achievedTarget: branch.achievedTarget || '',
        workingDays: branch.workingDays || '',
        timezone: branch.timezone || 'IST (UTC+05:30)',
        gstNumber: branch.gstNumber || '',
        panNumber: branch.panNumber || ''
      });
    } else {
      setFormData({
        ...EMPTY_FORM,
        branchCode: `BR-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
      });
    }
    setManagerEmail('');
    setManagerPassword('');
    setConfirmPassword('');
    setErrors({});
  }, [branch, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'email' && !branch) {
      setManagerEmail(value);
      if (errors.managerEmail) {
        setErrors(prev => ({ ...prev, managerEmail: null }));
      }
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.branchName.trim()) tempErrors.branchName = 'Branch Name is required';
    if (!formData.branchCode.trim()) tempErrors.branchCode = 'Branch Code is required';
    if (!formData.companyLocation.trim()) tempErrors.companyLocation = 'Company Location is required';
    if (!formData.city.trim()) tempErrors.city = 'City is required';
    if (!formData.manager.trim()) tempErrors.manager = 'Manager Name is required';

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Invalid email address';
    }

    if (formData.phone && !/^\+?[0-9\s-]{10,15}$/.test(formData.phone)) {
      tempErrors.phone = 'Invalid phone number';
    }

    // Branch Manager Authentication Validation
    if (!branch) {
      if (!managerEmail.trim()) {
        tempErrors.managerEmail = 'Manager Email is required';
      } else if (!/\S+@\S+\.\S+/.test(managerEmail)) {
        tempErrors.managerEmail = 'Invalid email address';
      }

      if (!managerPassword) {
        tempErrors.managerPassword = 'Password is required';
      } else if (managerPassword.length < 8) {
        tempErrors.managerPassword = 'Password must be at least 8 characters';
      }

      if (managerPassword !== confirmPassword) {
        tempErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const finalData = {
      ...formData,
      assignedTarget: Number(formData.assignedTarget) || 0,
      achievedTarget: Number(formData.achievedTarget) || 0,
      ...(!branch ? {
        managerEmail,
        managerPassword
      } : {})
    };

    onSubmit(finalData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50 transition-all select-none">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-slide-in">

        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-gray-900">{branch ? 'Update Branch Settings' : 'Create Multi-Branch Profile'}</h2>
            <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">Fill in parameters & save</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Section 1: Core parameters */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b pb-1">Branch Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Branch Name *</label>
                <input
                  type="text"
                  name="branchName"
                  value={formData.branchName}
                  onChange={handleChange}
                  className={`block w-full px-3 py-1.5 border ${errors.branchName ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 transition-all`}
                  placeholder="e.g. Kosqu Software"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Branch Code *</label>
                <input
                  type="text"
                  name="branchCode"
                  value={formData.branchCode}
                  onChange={handleChange}
                  className={`block w-full px-3 py-1.5 border ${errors.branchCode ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 transition-all font-mono uppercase`}
                  placeholder="e.g. KQ001"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Company Location *</label>
                <input
                  type="text"
                  name="companyLocation"
                  value={formData.companyLocation}
                  onChange={handleChange}
                  className={`block w-full px-3 py-1.5 border ${errors.companyLocation ? 'border-red-400' : 'border-gray-300'} rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all`}
                  placeholder="e.g. Pune"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="block w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Address */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b pb-1">Location Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="block w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="block w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="block w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Office Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                className="block w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1"
              />
            </div>
          </div>

          {/* Section 3: Manager */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b pb-1">Leadership</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Manager Name *</label>
                <input
                  type="text"
                  name="manager"
                  value={formData.manager}
                  onChange={handleChange}
                  className="block w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="block w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Business targets */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b pb-1">Business Targets (INR)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Target (₹)</label>
                <input
                  type="number"
                  name="assignedTarget"
                  min="0"
                  value={formData.assignedTarget}
                  onChange={handleChange}
                  className="block w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  placeholder="e.g. 5000000"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Achieved Target (₹)</label>
                <input
                  type="number"
                  name="achievedTarget"
                  min="0"
                  value={formData.achievedTarget}
                  onChange={handleChange}
                  className="block w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  placeholder="e.g. 3500000"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Corporate details (optional) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b pb-1">Corporate Details (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Working Days</label>
                <select
                  name="workingDays"
                  value={formData.workingDays}
                  onChange={handleChange}
                  className="block w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="Mon-Fri">Mon–Fri</option>
                  <option value="Mon-Sat">Mon–Sat</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Timezone</label>
                <input
                  type="text"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="block w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="IST (UTC+05:30)"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">GST Number</label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className="block w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono uppercase"
                  placeholder="e.g. 27AAAPL1234C1ZV"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">PAN Number</label>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  className="block w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono uppercase"
                  placeholder="e.g. AAAPL1234C"
                />
              </div>
            </div>
          </div>

          {/* Section 3b: Branch Manager Authentication (Create only) */}
          {!branch && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b pb-1">Branch Manager Authentication</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Manager Email *</label>
                  <input
                    type="email"
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    className={`block w-full px-3 py-1.5 border ${errors.managerEmail ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 transition-all`}
                    placeholder="manager@antigravity.com"
                  />
                  {errors.managerEmail && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.managerEmail}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    value={managerPassword}
                    onChange={(e) => setManagerPassword(e.target.value)}
                    className={`block w-full px-3 py-1.5 border ${errors.managerPassword ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 transition-all`}
                    placeholder="Min 8 characters"
                  />
                  {errors.managerPassword && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.managerPassword}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`block w-full px-3 py-1.5 border ${errors.confirmPassword ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 transition-all`}
                    placeholder="Confirm password"
                  />
                  {errors.confirmPassword && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>
          )}

        </form>

        {/* Drawer Actions Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end space-x-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
          >
            <Check className="w-4 h-4 mr-1.5" /> Save Changes
          </Button>
        </div>

      </div>
    </div>
  );
}
