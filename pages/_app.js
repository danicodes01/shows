import Head from 'next/head'
import Layout from '@/components/layout/layout'
import '@/styles/globals.css'

export default function App ({ Component, pageProps }) {
  return (
    <Layout>
      <Head>
        <title>theCorkBoⒶrd</title>
        <meta name="description" content="Shows in NYC and it's boroughs"/>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <Component {...pageProps} />
    </Layout>
  )
}
