import { useEffect } from 'react';
import { useRouter } from 'next/router';

export function useScrollRestorationGen() {
  const router = useRouter();

  useEffect(() => {
    if (!('scrollRestoration' in window.history)) return;

    window.history.scrollRestoration = 'manual';

    const onRouteChangeStart = () => {
      const { scrollX, scrollY } = window;
      const currentPage = window.location.search.split('page=')[1];
      sessionStorage.setItem(router.asPath, JSON.stringify({ x: scrollX, y: scrollY, page: currentPage }));
    };

    const onRouteChangeComplete = (url) => {
      const scrollPos = JSON.parse(sessionStorage.getItem(url));
      if (scrollPos) {
        window.scrollTo(scrollPos.x, scrollPos.y);
        sessionStorage.removeItem(url);
      }
    };

    router.events.on('routeChangeStart', onRouteChangeStart);
    router.events.on('routeChangeComplete', onRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', onRouteChangeStart);
      router.events.off('routeChangeComplete', onRouteChangeComplete);
    };
  }, [router]);
}
