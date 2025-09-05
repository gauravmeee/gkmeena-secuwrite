/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://secuwrite.vercel.app/',
    generateRobotsTxt: true,   // automatically generates robots.txt
    sitemapSize: 5000,         // splits sitemap if more than 5000 URLs
    robotsTxtOptions: {
      policies: [
        { userAgent: '*', allow: '/' }, // allow all pages to be crawled
      ],
    },
  };