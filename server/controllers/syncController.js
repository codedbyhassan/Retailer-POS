import { applySyncAction } from '../services/syncService.js';

export async function handleSync(req, res) {
  try {
    const item = req.body;
    if (!item?.action) {
      return res.status(400).json({ message: 'Invalid sync payload' });
    }
    await applySyncAction(item);
    res.json({ success: true, id: item.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
