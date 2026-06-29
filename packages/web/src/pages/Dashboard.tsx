import { useTranslation } from 'react-i18next';
import { PagePlaceholder } from '../components/PagePlaceholder/PagePlaceholder';

export function Dashboard(): JSX.Element {
  const { t } = useTranslation();
  return (
    <PagePlaceholder
      title={t('pages.dashboard.title')}
      subtitle={t('pages.dashboard.subtitle')}
      body={t('pages.dashboard.placeholder')}
    />
  );
}
