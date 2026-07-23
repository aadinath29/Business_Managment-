import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { branchService, teamsService } from '../../services/mockData';
import { useBranch } from '../../context/BranchContext';
import { formatCurrency } from '../../utils/currency';

const EMPTY_FORM = {
  name: '',
  contactPerson: '',
  email: '',
  mobile: '',
  leadSource: '',
  campaign: '',
  branchId: '',
  assignedTo: '',
  stage: 'New',
  value: ''
};

export function NewLeadModal({ isOpen, onClose, onSave, leadToEdit }) {
  const { currentBranchId } = useBranch();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [displayValue, setDisplayValue] = useState('');
  const [branches, setBranches] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      // Fetch fresh data every time the modal opens to ensure dropdown is populated
      branchService.getAll()
        .then(setBranches)
        .catch(err => console.error('NewLeadModal: Failed to fetch branches', err));
      teamsService.getAll()
        .then(setTeamLeaders)
        .catch(err => console.error('NewLeadModal: Failed to fetch team leaders', err));

      if (leadToEdit) {
        // Find the Team Leader whose user ID or team ID matches leadToEdit.assignedTo
        const tl = teamLeaders.find(t => t.id === leadToEdit.assignedTo || t.teamId === leadToEdit.assignedTo);
        const resolvedAssignedTo = tl ? tl.id : leadToEdit.assignedTo;

        setFormData({
          ...EMPTY_FORM,
          ...leadToEdit,
          assignedTo: resolvedAssignedTo,
          value: leadToEdit.value ? leadToEdit.value.toString() : ''
        });
        if (leadToEdit.value) {
          setDisplayValue(formatCurrency(Number(leadToEdit.value)));
        } else {
          setDisplayValue('');
        }
      } else {
        setFormData({
          ...EMPTY_FORM,
          branchId: currentBranchId !== 'all' ? currentBranchId : ''
        });
        setDisplayValue('');
      }
    }
  }, [isOpen, currentBranchId, leadToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleValueChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, value: rawVal }));
    setDisplayValue(rawVal);
  };

  const handleFocus = () => {
    setDisplayValue(formData.value);
  };

  const handleBlur = () => {
    if (formData.value) {
      setDisplayValue(formatCurrency(Number(formData.value)));
    } else {
      setDisplayValue('');
    }
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Company Name is required';
    if (!formData.contactPerson) newErrors.contactPerson = 'Contact Person is required';
    if (!formData.branchId) newErrors.branchId = 'Assign Branch is required';
    if (!formData.assignedTo) newErrors.assignedTo = 'Assign Team Leader is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    // Find the selected team leader and get their teamId (the actual team UUID)
    const selectedLeader = teamLeaders.find(tl => tl.id === formData.assignedTo);
    const teamId = selectedLeader ? selectedLeader.teamId : null;

    try {
      await onSave({
        ...formData,
        teamId, // Send the correct team UUID to leadsApi.create
        // map modal field names to what leadsApi.create expects
        expectedRevenue: Number(formData.value) || 0,
        status: formData.stage || 'New'
      });
      // Only reset + close after a successful save
      setFormData(EMPTY_FORM);
      setDisplayValue('');
      onClose();
    } catch (err) {
      console.error('NewLeadModal: Save failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={leadToEdit ? "Edit Lead" : "Add New Lead"} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-1 border-gray-100">Lead Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Company Name" name="name" value={formData.name} onChange={handleChange} error={errors.name} placeholder="e.g. Acme Corp" required />
            <Input label="Contact Person" name="contactPerson" value={formData.contactPerson} onChange={handleChange} error={errors.contactPerson} placeholder="e.g. Priya Singh" required />
            <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="e.g. priya@acme.com" />
            <Input label="Mobile" name="mobile" type="text" value={formData.mobile} onChange={handleChange} placeholder="e.g. +91 9876543210" />
            <Select
              label="Lead Source"
              name="leadSource"
              value={formData.leadSource}
              onChange={handleChange}
              options={[
                { label: 'Select Source...', value: '' },
                { label: 'Website Inquiry', value: 'Website Inquiry' },
                { label: 'Referral', value: 'Referral' },
                { label: 'Campaign', value: 'Campaign' },
                { label: 'Social Media', value: 'Social Media' },
                { label: 'Advertisement', value: 'Advertisement' },
                { label: 'Cold Call', value: 'Cold Call' },
                { label: 'Event / Trade Show', value: 'Event / Trade Show' },
                { label: 'Other', value: 'Other' }
              ]}
            />
            <Input label="Campaign" name="campaign" value={formData.campaign} onChange={handleChange} placeholder="e.g. Q3 Digital Outreach" />
            <Select
              label="Stage"
              name="stage"
              value={formData.stage}
              onChange={handleChange}
              options={[
                { label: 'New', value: 'New' },
                { label: 'Contacted', value: 'Contacted' },
                { label: 'Negotiation', value: 'Negotiation' },
                { label: 'Closed Won', value: 'Closed Won' },
                { label: 'Closed Lost', value: 'Closed Lost' },
              ]}
            />
            <Input
              label="Estimated Value (₹)"
              name="value"
              type="text"
              value={displayValue}
              onChange={handleValueChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="₹ 0"
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-1 border-gray-100">Assignment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Assign Branch"
              name="branchId"
              value={formData.branchId}
              onChange={handleChange}
              options={branches.map(b => ({ label: b.name, value: b.id }))}
              error={errors.branchId}
              required
            />
             <Select
              label="Assign Team Leader"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              options={teamLeaders.filter(tl => !formData.branchId || tl.branchId === formData.branchId).map(tl => ({ label: tl.name, value: tl.id }))}
              error={errors.assignedTo}
              required
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Lead'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
