import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";

export default function NotFoundPage() {
  const t = useTranslations("pages.notFound");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-kfz-blue mb-4">404</h1>
        <p className="text-2xl font-semibold text-gray-900 mb-2">
          {t("title")}
        </p>
        <p className="text-gray-600 mb-8">
          {t("description")}
        </p>
        <Link href="/" className="inline-block bg-kfz-blue text-white px-6 py-3 rounded-lg hover:bg-kfz-blue-dark transition">
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
