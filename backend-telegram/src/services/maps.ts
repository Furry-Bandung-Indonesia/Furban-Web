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

  // 1. Extract URL if surrounded by other text
  const urlMatch = inputUrl.match(/https?:\/\/[^\s"'<>]+/i)
  let currentUrl = urlMatch ? urlMatch[0] : inputUrl.trim()

  // Clean trailing punctuation
  currentUrl = currentUrl.replace(/[.,;!?)]+$/, '')

  let lat: number | null = null
  let long: number | null = null
  let placeName: string | null = null
  let resolvedUrl = currentUrl

  // Helper to extract coordinates and place name from any URL or text
  const checkCoordinates = (str: string) => {
    if (!str) return

    let decoded = str
    try {
      decoded = decodeURIComponent(str)
    } catch {}

    // Pattern 1: /@(-?\d+\.\d+),(-?\d+\.\d+)
    if (lat === null) {
      const atMatch = decoded.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
      if (atMatch) {
        lat = parseFloat(atMatch[1])
        long = parseFloat(atMatch[2])
      }
    }

    // Pattern 2: !3d(-?\d+\.\d+)!4d(-?\d+\.\d+)
    if (lat === null) {
      const protoMatch = decoded.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
      if (protoMatch) {
        lat = parseFloat(protoMatch[1])
        long = parseFloat(protoMatch[2])
      }
    }

    // Pattern 3: ?q=lat,long or &ll=lat,long or ?query=lat,long or ?center=lat,long
    if (lat === null) {
      const qMatch = decoded.match(/[?&](?:q|ll|query|center|daddr|saddr)=(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/i)
      if (qMatch) {
        lat = parseFloat(qMatch[1])
        long = parseFloat(qMatch[2])
      }
    }

    // Pattern 4: window.APP_INITIALIZATION_STATE array coordinates [null,null,-6.123,107.123]
    if (lat === null) {
      const arrMatch = decoded.match(/\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/)
      if (arrMatch) {
        lat = parseFloat(arrMatch[1])
        long = parseFloat(arrMatch[2])
      }
    }

    // Extract place name if present: /place/Place+Name/
    if (!placeName) {
      const placeMatch = decoded.match(/\/place\/([^/@?]+)/)
      if (placeMatch) {
        placeName = placeMatch[1].replace(/\+/g, ' ').trim()
      }
    }
  }

  // First check the input URL itself
  checkCoordinates(currentUrl)

  // Step-by-step redirect resolution (up to 6 hops)
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
        checkCoordinates(nextUrl)
        currentUrl = nextUrl
        if (lat !== null && long !== null) {
          break
        }
        continue
      }

      // If we reached the final page (status 200)
      if (res.ok) {
        resolvedUrl = res.url || currentUrl
        checkCoordinates(resolvedUrl)

        const body = await res.text()
        checkCoordinates(body)

        // Check HTML staticmap
        if (lat === null) {
          const staticMatch = body.match(/center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/i) ||
                              body.match(/center=(-?\d+\.\d+),(-?\d+\.\d+)/i)
          if (staticMatch) {
            lat = parseFloat(staticMatch[1])
            long = parseFloat(staticMatch[2])
          }
        }

        // Check <title> for place name
        if (!placeName) {
          const titleMatch = body.match(/<title>([^<]+)<\/title>/i)
          if (titleMatch) {
            const rawTitle = titleMatch[1].replace(/\s*-\s*Google Maps\s*$/i, '').trim()
            if (rawTitle && !rawTitle.toLowerCase().includes('google maps')) {
              placeName = rawTitle
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
