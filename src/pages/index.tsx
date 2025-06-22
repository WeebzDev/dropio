import type { ReactNode } from 'react';
import { Redirect } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function Home(): ReactNode {
  const { i18n } = useDocusaurusContext();
  const { currentLocale, defaultLocale } = i18n;

  const prefix = currentLocale === defaultLocale ? '' : `/${currentLocale}`;

  return <Redirect to={`${prefix}/docs/intro`} />;
}
