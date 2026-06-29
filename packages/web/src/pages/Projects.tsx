import { useTranslation } from 'react-i18next';
import { PagePlaceholder } from '../components/PagePlaceholder/PagePlaceholder';

export function Projects(): JSX.Element {
  const { t } = useTranslation();
  return (
    <PagePlaceholder
      title={t('pages.projects.title')}
      subtitle={t('pages.projects.subtitle')}
      body={t('pages.projects.placeholder')}
    />
  );
}
