"use client"

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { POSTHOG_HOST, POSTHOG_KEY, track } from '@/lib/analytics'

export function PostHogProvider() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const query = searchParams.toString()
    track('$pageview', {
      path: pathname,
      url: query ? `${pathname}?${query}` : pathname,
      source: searchParams.get('source') ?? undefined,
    })
  }, [pathname, searchParams])

  if (!POSTHOG_KEY) return null

  return (
    <Script id="posthog-init" strategy="afterInteractive">
      {`
        !function(t,e){var o,n,p,r;e.__SV||(window.posthog&&window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify reset set_config opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_distinct_id get_session_id get_session_replay_url startSessionRecording stopSessionRecording sessionRecordingStarted debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
        posthog.init('${POSTHOG_KEY}', {
          api_host: '${POSTHOG_HOST}',
          defaults: '2026-01-30',
          person_profiles: 'identified_only',
          capture_pageview: false,
          autocapture: false,
        });
      `}
    </Script>
  )
}
