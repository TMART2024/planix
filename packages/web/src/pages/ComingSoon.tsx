import { useTranslation } from 'react-i18next';
import { PagePlaceholder } from '../components/PagePlaceholder/PagePlaceholder';

/* Placeholder for nav targets whose features arrive in later phases. */
export function ComingSoon({ titleKey }: { titleKey: string }): JSX.Element {
  const { t } = useTranslation();
  return <PagePlaceholder title={t(titleKey)} body={t('common.comingSoon')} />;
}
