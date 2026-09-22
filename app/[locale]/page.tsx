import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">{t('navigation.home')}</h1>
      <p className="text-lg text-gray-600">{t('common.welcome')}</p>
    </div>
  );
}
