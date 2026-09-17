export default function VehiclesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Inventory</h1>
        <p className="text-lg text-gray-600 mb-8">
          Browse our complete selection of premium used vehicles
        </p>

        {/* TODO: Implement vehicle grid with filters */}
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-600">Vehicle listing coming soon...</p>
        </div>
      </div>
    </div>
  );
}
