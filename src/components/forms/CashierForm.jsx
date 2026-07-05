import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { isEmail, isRequired } from '../../utils/validators';

export default function CashierForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(
    initial || { name: '', email: '', password: '', role: 'cashier' }
  );
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    const nameErr = isRequired(form.name, 'Name');
    if (nameErr) errs.name = nameErr;
    const emailErr = isEmail(form.email);
    if (emailErr) errs.email = emailErr;
    if (!initial && isRequired(form.password, 'Password')) errs.password = 'Password is required';
    if (Object.keys(errs).length) return setErrors(errs);
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Full Name" name="name" value={form.name} onChange={handleChange} error={errors.name} />
      <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} disabled={!!initial} />
      <Input label={initial ? 'New Password (leave blank to keep)' : 'Password'} name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save User'}</Button>
      </div>
    </form>
  );
}
