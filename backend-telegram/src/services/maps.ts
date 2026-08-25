/**
 * Google Maps Link & Coordinate Extractor
 * Multi-layer coordinate resolution:
 * 1. Direct URL regex: !3d/!4d, /@lat,long, ?q=lat,long
 * 2. Short link redirection (maps.app.goo.gl -> google.com/maps/place/...)
 * 3. Feature ID (ftid / 0x...:0x...) resolution -> maps.google.com/maps?ftid=...
 * 4. Place name cleaning & Geocoding fallback
 */

export interface GoogleMapsLocationResult {
  latitude: number | null
  longitude: number | null
  place_name: string | null
  resolved_url: string
  success: boolean
  message?: string
}

export async function resolveGoogleMapsLocation(inputUrl: string): Promise<GoogleMapsLocationResult> {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { latitude: null, longitude: null, place_name: null, resolved_url: '', success: false, message: 'Invalid URL provided' }
  }

  // 1. Extract URL
  const urlMatch = inputUrl.match(/https?:\/\/[^\s"'<>]+/i)
  let currentUrl = urlMatch ? urlMatch[0] : inputUrl.trim()
  currentUrl = currentUrl.replace(/[.,;!?)]+$/, '')

  let lat: number | null = null
  let long: number | null = null
  let placeName: string | null = null
  let ftid: string | null = null
  let resolvedUrl = currentUrl

  const checkCoordinatesInText = (str: string) => {
    if (!str) return

    let decoded = str
    try {
      decoded = decodeURIComponent(str)
    } catch {}

    // Priority 1: Exact Place Pin Protobuf !3d(lat)!4d(long) or !8m2!3d(lat)!4d(long)
    if (lat === null) {
      const protoMatch = decoded.match(/!(?:8m2!)?3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
      if (protoMatch) {
        lat = parseFloat(protoMatch[1])
        long = parseFloat(protoMatch[2])
      }
    }

    // Priority 2: Camera Viewport /@(lat),(long)
    if (lat === null) {
      const atMatch = decoded.match(/@(-?\d+\.\d{3,}),(-?\d+\.\d{3,})/)
      if (atMatch) {
        lat = parseFloat(atMatch[1])
        long = parseFloat(atMatch[2])
      }
    }

    // Priority 3: Query params ?q=(lat),(long) or &ll=(lat),(long)
    if (lat === null) {
      const qMatch = decoded.match(/[?&](?:q|ll|query|daddr|saddr)=(-?\d+\.\d{3,})[,\s]+(-?\d+\.\d{3,})/i)
      if (qMatch) {
        lat = parseFloat(qMatch[1])
        long = parseFloat(qMatch[2])
      }
    }

    // Extract Feature ID if present (e.g. 0x2e68e727f9c63d7d:0xfcdaa626835e74fa)
    if (!ftid) {
      const ftidMatch = decoded.match(/1s(0x[0-9a-f]+:0x[0-9a-f]+)/i) || decoded.match(/ftid=(0x[0-9a-f]+:0x[0-9a-f]+)/i)
      if (ftidMatch) {
        ftid = ftidMatch[1]
      }
    }

    // Extract place name if present: /place/Place+Name/
    if (!placeName) {
      const placeMatch = decoded.match(/\/place\/([^/@?]+)/)
      if (placeMatch) {
        let rawName = placeMatch[1].replace(/\+/g, ' ').trim()
        rawName = cleanPlaceName(rawName)
        if (rawName) placeName = rawName
      }
    }
  }

  // Check initial URL
  checkCoordinatesInText(currentUrl)

  // Follow redirects step-by-step
  let hops = 0
  while (hops < 6) {
    hops++
    try {
      const res = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      })

      const location = res.headers.get('location')
      if (location) {
        const nextUrl = new URL(location, currentUrl).toString()
        resolvedUrl = nextUrl
        checkCoordinatesInText(nextUrl)
        currentUrl = nextUrl
        if (lat !== null && long !== null) break
        continue
      }

      if (res.ok) {
        resolvedUrl = res.url || currentUrl
        checkCoordinatesInText(resolvedUrl)

        const body = await res.text()
        checkCoordinatesInText(body)

        // Try extracting place name from <title>
        if (!placeName) {
          const titleMatch = body.match(/<title>([^<]+)<\/title>/i)
          if (titleMatch) {
            const rawTitle = titleMatch[1].replace(/\s*-\s*Google Maps\s*$/i, '').trim()
            if (rawTitle && !rawTitle.toLowerCase().includes('google maps')) {
              placeName = cleanPlaceName(rawTitle)
            }
          }
        }
      }
      break
    } catch (e: any) {
      console.warn(`Error resolving maps URL hop ${hops}:`, e)
      break
    }
  }

  // 3. Feature ID resolution (ftid)
  if ((lat === null || long === null) && ftid) {
    try {
      const ftidUrl = `https://maps.google.com/maps?ftid=${ftid}&hl=en`
      const ftidRes = await fetch(ftidUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      })
      if (ftidRes.ok) {
        const ftidBody = await ftidRes.text()
        checkCoordinatesInText(ftidRes.url || '')
        checkCoordinatesInText(ftidBody)
      }
    } catch (e) {
      console.warn('FTID lookup failed:', e)
    }
  }

  // 4. Geocoding Fallback
  if ((lat === null || long === null) && placeName) {
    try {
      const cleaned = cleanPlaceName(placeName)
      // Try with full cleaned name, or primary name before first comma
      const queries = [cleaned, cleaned.split(',')[0].trim()]
      for (const q of queries) {
        if (!q || q.length < 3) continue
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`, {
          headers: {
            'User-Agent': 'FurbanTelegramBot/1.0 (admin@furban.my.id)',
            'Accept': 'application/json',
          },
        })

        if (geoRes.ok) {
          const geoData = await geoRes.json() as any[]
          if (Array.isArray(geoData) && geoData.length > 0 && geoData[0].lat && geoData[0].lon) {
            lat = parseFloat(geoData[0].lat)
            long = parseFloat(geoData[0].lon)
            break
          }
        }
      }
    } catch (e) {
      console.warn('Geocoding fallback failed:', e)
    }
  }

  if (lat !== null && long !== null) {
    return {
      latitude: lat,
      longitude: long,
      place_name: placeName,
      resolved_url: resolvedUrl,
      success: true,
    }
  }

  return {
    latitude: null,
    longitude: null,
    place_name: placeName,
    resolved_url: resolvedUrl,
    success: false,
    message: 'Could not extract exact latitude and longitude coordinates from the Google Maps link.',
  }
}

/**
 * Clean Plus Code, postal codes, and noisy tokens from place names
 */
function cleanPlaceName(name: string): string {
  if (!name) return ''
  return name
    .replace(/^[0-9A-Z]{4}\s*\+?\s*[0-9A-Z]{2,4}\s*,?\s*/i, '') // strip plus code prefix "3JP2+F7G "
    .replace(/^[0-9A-Z]{4}\s+[0-9A-Z]{2,4}\s*,?\s*/i, '')     // strip space-separated plus code "3JP2 F7G "
    .trim()
}
