import { useEffect, useState } from 'react';
import { getAllUsers, createUser, updateUser, deactivateUser } from '../../services/indexeddb/settingsStore';
import CashierForm from '../../components/forms/CashierForm';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';

export default function UserSettings() {
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const load = () => getAllUsers().then(setUsers);
  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    setLoading(true);
    try {
      if (modal?.user) {
        await updateUser(modal.user.id, data);
        toast.success('User updated');
      } else {
        await createUser(data);
        toast.success('User created');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (user) => {
    if (user.role === 'admin') return toast.error('Cannot deactivate admin');
    await deactivateUser(user.id);
    toast.success('User deactivated');
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2>User Management</h2>
        <Button onClick={() => setModal({ type: 'create' })}>Add Cashier</Button>
      </div>
      <div className="overflow-hidden rounded-xl border dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-800">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3">
                  <Badge variant={u.active ? 'in-stock' : 'out-of-stock'}>{u.active ? 'Active' : 'Inactive'}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setModal({ user: u })} className="mr-2 text-brand-600 hover:underline">Edit</button>
                  {u.active && u.role !== 'admin' && (
                    <button onClick={() => handleDeactivate(u)} className="text-red-500 hover:underline">Deactivate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.user ? 'Edit User' : 'New Cashier'}>
        <CashierForm initial={modal?.user} onSubmit={handleSave} onCancel={() => setModal(null)} loading={loading} />
      </Modal>
    </div>
  );
}
