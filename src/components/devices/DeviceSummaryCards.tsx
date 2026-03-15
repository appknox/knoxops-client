import { Monitor, Wrench, Tag } from 'lucide-react';
import type { DeviceStats } from '@/types';

interface DeviceSummaryCardsProps {
  stats: DeviceStats | null;
}

const DeviceSummaryCards = ({ stats }: DeviceSummaryCardsProps) => {
  const cards = [
    {
      label: 'IN INVENTORY',
      value: stats?.inInventory ?? 0,
      icon: Monitor,
      color: 'text-green-600 bg-green-100',
    },
    {
      label: 'OUT FOR REPAIR',
      value: stats?.outForRepair ?? 0,
      icon: Wrench,
      color: 'text-orange-600 bg-orange-100',
    },
    {
      label: 'TO BE SOLD',
      value: stats?.toBeSold ?? 0,
      icon: Tag,
      color: 'text-red-600 bg-red-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4"
        >
          <div className={`p-3 rounded-lg ${card.color}`}>
            <card.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
            <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export { DeviceSummaryCards };
