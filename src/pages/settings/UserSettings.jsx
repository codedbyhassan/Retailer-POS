import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Badge from '../../components/ui/Badge';

export default function UserSettings() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('profiles').select('id,name,email,role,active,created_at').order('name')
      .then(({ data, error: queryError }) => {
        if (queryError) setError(queryError.message);
        else setUsers(data || []);
      });
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h2>User Management</h2>
        <p className="mt-1 text-sm text-gray-500">User identities and roles are managed through Supabase Auth and profiles.</p>
      </div>
      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      <div className="overflow-hidden rounded-xl border dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50"><tr>
            <th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Role</th><th className="px-4 py-3 text-left">Status</th>
          </tr></thead>
          <tbody className="divide-y dark:divide-gray-800">
            {users.map((u) => <tr key={u.id}>
              <td className="px-4 py-3 font-medium">{u.name}</td><td className="px-4 py-3 text-gray-500">{u.email}</td><td className="px-4 py-3 capitalize">{u.role}</td>
              <td className="px-4 py-3"><Badge variant={u.active ? 'in-stock' : 'out-of-stock'}>{u.active ? 'Active' : 'Inactive'}</Badge></td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
