import { fetchAllShows } from '@/helpers/api-util'

const EXTERNAL_DATA_URL = 'https://www.distortnewyork.com/shows'

function generateSiteMap(posts) {
  if (!posts || !Array.isArray(posts)) {
    return ''; // If posts is undefined or not an array, return an empty string
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <!--We manually set the two URLs we know already-->
     <url>
       <loc>https://www.distortnewyork.com/shows</loc>
       <changefreq>daily</changefreq>
     </url>
     <url>
     <loc>https://www.distortnewyork.com/</loc>
     <changefreq>daily</changefreq>
     </url>
     <url>
       <loc>https://www.distortnewyork.com/contact</loc>
     </url>
     ${posts
       .map(({ id, createdAt }) => {
         const date = new Date(createdAt);
         const modDate = date.toISOString();
         return `
       <url>
           <loc>${`${EXTERNAL_DATA_URL}/${id}`}</loc>
           <lastmod>${modDate}</lastmod>
       </url>
     `
       })
       .join('')}
   </urlset>
  `
}

function SiteMap() {}

export async function getServerSideProps({ res }) {
  try {
    const response = await fetchAllShows();

    // Access the `shows` array from the response
    const posts = response.shows || [];

    if (!posts.length) {
      throw new Error('Posts data is not an array or is undefined');
    }

    const sitemap = generateSiteMap(posts);

    res.setHeader('Content-Type', 'text/xml');
    res.write(sitemap);
    res.end();

    return {
      props: {},
    };
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.statusCode = 500;
    res.end('Error generating sitemap');
    return {
      props: {},
    };
  }
}

export default SiteMap;