import { Users, UserCheck, Mail, UserX } from 'lucide-react';
import type { UserStats } from '@/types';

interface UserSummaryCardsProps {
  stats: UserStats | null;
}

const UserSummaryCards = ({ stats }: UserSummaryCardsProps) => {
  const cards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
    {
      label: 'Active Now',
      value: stats?.activeNow ?? 0,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Pending Invites',
      value: stats?.pendingInvites ?? 0,
      icon: Mail,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      label: 'Non-Admin Users',
      value: stats?.externalGuests ?? 0,
      icon: UserX,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-xl border border-gray-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 ${card.bgColor} rounded-lg flex items-center justify-center`}
            >
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export { UserSummaryCards };
