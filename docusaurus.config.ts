import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { siteConfig } from './config';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Dropio',
  tagline: 'Build your app. We’ll manage your file hosting',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://dropio.my.id',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'WeebzDev', // Usually your GitHub org/user name.
  projectName: 'dropio', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'id'],
    localeConfigs: {
      en: {
        label: 'English',
        htmlLang: 'en',
      },
      id: {
        label: 'Bahasa Indonesia',
        htmlLang: 'id',
      },
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/WeebzDev/dropio/blob/main',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/WeebzDev/dropio/blob/main',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'Dropio',
      logo: {
        alt: 'My Site Logo',
        src: 'img/dio-logo.webp',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        // { to: '/blog', label: 'Blog', position: 'left' },
        {
          to: 'https://dropio.my.id/dashboard',
          label: 'Dashboard',
          position: 'right',
        },
        {
          href: 'https://github.com/WeebzDev/dropio',
          label: 'GitHub',
          position: 'right',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Introduction',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Need Help?',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/DCX5NZdsXn',
            },
          ],
        },
        {
          title: 'More',
          items: [
            // {
            //   label: 'Blog',
            //   to: '/blog',
            // },
            {
              label: 'GitHub',
              href: 'https://github.com/WeebzDev/dropio',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} WeebzDev, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash'],
    },
    metadata: [
      {
        name: 'keywords',
        content:
          'dropio, docs, dokumentasi, file upload, file sharing, upload file online, secure file upload, uploadthing alternative, request room, file request, file submission, team file manager, collaborative file sharing, upload manager, file status tracking, drag and drop upload, share files with team, online file storage, kirim file online, dropio indonesia',
      },
      { name: 'description', content: siteConfig.longDescription },
      { name: 'author', content: 'WeebzDev' },
      { name: 'creator', content: 'WeebzDev' },

      // Open Graph metadata
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:url', content: siteConfig.url },
      { property: 'og:title', content: siteConfig.name },
      { property: 'og:description', content: siteConfig.longDescription },
      { property: 'og:site_name', content: siteConfig.name },
      { property: 'og:image', content: `img/og.webp` },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: 'Dropio Application Preview' },

      // Twitter metadata
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: siteConfig.name },
      { name: 'twitter:description', content: siteConfig.longDescription },
      { name: 'twitter:image', content: `img/og.webp` },
      { name: 'twitter:creator', content: '@WeebzDev' },
    ],
  } satisfies Preset.ThemeConfig,
};

console.log('Locales:', config.i18n.locales);

export default config;
