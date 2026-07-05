import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSalesWithItems } from '../../services/indexeddb/salesStore';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import SalesTable from '../../components/tables/SalesTable';
import Input from '../../components/ui/Input';

export default function SalesHistoryPage() {
  const [sales, setSales] = useState([]);
  const { currency } = useBusinessSettings();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getSalesWithItems().then(setSales);
  }, []);

  const filtered = sales.filter((s) => {
    if (dateFrom && new Date(s.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(s.created_at) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  return (
    <div>
      <h2 className="mb-6">Sales History</h2>
      <div className="mb-4 flex gap-4">
        <Input label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>
      <SalesTable sales={filtered} currency={currency} onView={(s) => navigate(`/admin/sales/${s.id}`)} />
    </div>
  );
}
