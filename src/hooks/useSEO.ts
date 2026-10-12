import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useSEO() {
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('seo_title, seo_description, seo_keywords, seo_og_title, seo_og_description, site_name')
        .maybeSingle();
      if (!data) return;

      if (data.seo_title) document.title = data.seo_title;
      if (data.seo_description) {
        setMeta('description', data.seo_description);
        setOgMeta('og:description', data.seo_description);
      }
      if (data.seo_keywords) setMeta('keywords', data.seo_keywords);
      if (data.seo_og_title) setOgMeta('og:title', data.seo_og_title);
    })();
  }, []);
}

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setOgMeta(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}
