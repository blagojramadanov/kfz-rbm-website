export function ListingTypeBadge({ type = "verkauf" }: { type?: "verkauf" | "export" }) {
  if (type === "export") {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
        🌍 Export
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
      🏪 Verkauf
    </span>
  );
}
