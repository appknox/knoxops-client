import { useEffect, useState } from 'react';
import { ShoppingCart, X, Tag, Cpu, Wrench, FileText } from 'lucide-react';

interface ForSaleDevice {
  id: string;
  name: string;
  model: string | null;
  platform: string | null;
  condition: string | null;
  conditionNotes: string | null;
  askingPrice: number | null;
}

function DeviceDetailModal({ device, onClose }: { device: ForSaleDevice; onClose: () => void }) {
  const rows: { icon: React.ReactNode; label: string; value: string }[] = [
    device.model ? { icon: <Cpu className="h-4 w-4" />, label: 'Model', value: device.model } : null,
    device.platform ? { icon: <Cpu className="h-4 w-4" />, label: 'Platform', value: device.platform } : null,
    device.condition ? { icon: <Wrench className="h-4 w-4" />, label: 'Condition', value: device.condition } : null,
    device.conditionNotes ? { icon: <FileText className="h-4 w-4" />, label: 'Condition Notes', value: device.conditionNotes } : null,
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{device.name}</h2>
            {device.model && <p className="text-sm text-gray-500 mt-0.5">{device.model}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4 mt-0.5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Price */}
        <div className="px-6 py-4 bg-primary-50 border-b border-primary-100 flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary-600" />
          {device.askingPrice ? (
            <span className="text-2xl font-bold text-primary-600">
              ₹{device.askingPrice.toLocaleString('en-IN')}
            </span>
          ) : (
            <span className="text-gray-500 text-sm font-medium">Price on request</span>
          )}
        </div>

        {/* Details */}
        {rows.length > 0 && (
          <div className="p-6 space-y-4">
            {rows.map(({ icon, label, value }) => (
              <div key={label} className="flex gap-3">
                <div className="text-gray-400 mt-0.5 shrink-0">{icon}</div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="text-sm text-gray-800">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-6 pb-6">
          <p className="text-xs text-gray-400 text-center">
            Interested? Reach out to the Appknox team.
          </p>
        </div>
      </div>
    </div>
  );
}

export const SalePage = () => {
  const [devices, setDevices] = useState<ForSaleDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ForSaleDevice | null>(null);

  useEffect(() => {
    const fetchForSaleDevices = async () => {
      try {
        const response = await fetch('/api/public/devices/for-sale');
        if (!response.ok) throw new Error('Failed to fetch devices');
        const data = await response.json();
        setEnabled(data.enabled !== false);
        setDevices(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load devices');
      } finally {
        setLoading(false);
      }
    };
    fetchForSaleDevices();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading devices...</p>
        </div>
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Sale Not Active</h1>
          <p className="text-gray-500">The device sale program is not currently active. Please check back later.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex items-center gap-3 mb-4">
              <ShoppingCart className="h-8 w-8 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">Device Sale</h1>
            </div>
            <p className="text-gray-600">
              {devices.length === 0
                ? 'No devices currently available for sale.'
                : `Explore ${devices.length} device${devices.length === 1 ? '' : 's'} available for sale.`}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-8">
              {error}
            </div>
          )}

          {devices.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No devices currently available for sale.</p>
              <p className="text-gray-500 text-sm mt-2">Check back soon for new listings!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelected(device)}
                >
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{device.name}</h3>

                    {device.model && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Model:</span> {device.model}
                      </p>
                    )}

                    {device.platform && (
                      <p className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Platform:</span> {device.platform}
                      </p>
                    )}

                    <div className="border-t border-gray-100 pt-4 mt-3">
                      {device.askingPrice ? (
                        <p className="text-2xl font-bold text-primary-600">
                          ₹{device.askingPrice.toLocaleString('en-IN')}
                        </p>
                      ) : (
                        <p className="text-gray-500 text-sm">Price: Contact us</p>
                      )}
                    </div>

                    <p className="text-xs text-primary-500 mt-3 font-medium">View details →</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <DeviceDetailModal device={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
};
