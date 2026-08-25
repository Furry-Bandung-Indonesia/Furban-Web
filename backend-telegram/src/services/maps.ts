/**
 * Google Maps Link & Coordinate Extractor
 * Supports:
 * - Short links: https://maps.app.goo.gl/XXXXXX, https://goo.gl/maps/XXXXXX
 * - Standard place URLs: https://www.google.com/maps/place/Place+Name/@-6.917464,107.619123,17z/...
 * - Query URLs: https://www.google.com/maps?q=-6.917464,107.619123
 * - Protobuf coordinates: !3d-6.917464!4d107.619123
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

  // Extract URL if surrounded by other text
  const urlMatch = inputUrl.match(/https?:\/\/[^\s"'<>]+/i)
  const targetUrl = urlMatch ? urlMatch[0] : inputUrl.trim()

  try {
    let resolvedUrl = targetUrl
    let responseText = ''

    // Follow redirects for short links (e.g. maps.app.goo.gl or goo.gl/maps)
    if (targetUrl.includes('goo.gl') || targetUrl.includes('maps.app.goo.gl') || !targetUrl.includes('@')) {
      const res = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      })
      resolvedUrl = res.url || targetUrl
      responseText = await res.text()
    }

    let lat: number | null = null
    let long: number | null = null
    let placeName: string | null = null

    // 1. Try matching @lat,long in the resolved URL: /@(-?\d+\.\d+),(-?\d+\.\d+)
    const atMatch = resolvedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (atMatch) {
      lat = parseFloat(atMatch[1])
      long = parseFloat(atMatch[2])
    }

    // 2. Try matching !3d(lat)!4d(long) in the resolved URL or response body
    if (lat === null || long === null) {
      const protoMatch = (resolvedUrl + ' ' + responseText).match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
      if (protoMatch) {
        lat = parseFloat(protoMatch[1])
        long = parseFloat(protoMatch[2])
      }
    }

    // 3. Try matching query parameter q=lat,long or ll=lat,long
    if (lat === null || long === null) {
      const qMatch = resolvedUrl.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/)
      if (qMatch) {
        lat = parseFloat(qMatch[1])
        long = parseFloat(qMatch[2])
      }
    }

    // 4. Try matching staticmap or meta tags in HTML
    if ((lat === null || long === null) && responseText) {
      const staticMatch = responseText.match(/center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/i) ||
                          responseText.match(/center=(-?\d+\.\d+),(-?\d+\.\d+)/i)
      if (staticMatch) {
        lat = parseFloat(staticMatch[1])
        long = parseFloat(staticMatch[2])
      }
    }

    // Extract Place Name if present in /place/Place+Name/
    const placeMatch = resolvedUrl.match(/\/place\/([^/@?]+)/)
    if (placeMatch) {
      try {
        placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
      } catch {
        placeName = placeMatch[1].replace(/\+/g, ' ')
      }
    } else if (responseText) {
      const titleMatch = responseText.match(/<title>([^<]+)<\/title>/i)
      if (titleMatch) {
        placeName = titleMatch[1].replace(/\s*-\s*Google Maps\s*$/i, '').trim()
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
  } catch (err: any) {
    return {
      latitude: null,
      longitude: null,
      place_name: null,
      resolved_url: targetUrl,
      success: false,
      message: `Failed to resolve Google Maps link: ${err.message}`,
    }
  }
}
