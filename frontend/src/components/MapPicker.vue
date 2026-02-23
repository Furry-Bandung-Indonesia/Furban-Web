<template>
  <div class="map-picker space-y-3" style="position: relative; z-index: 0;">
    <!-- Map Container -->
    <div
      ref="mapContainer"
      class="w-full rounded-lg border border-slate-700 overflow-hidden cursor-crosshair"
      :style="{ height: mapHeight, isolation: 'isolate' }"
    ></div>

    <!-- Coordinates display -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium text-slate-400 mb-1">Latitude</label>
        <input
          :value="lat"
          @input="handleLatInput($event)"
          type="number"
          step="any"
          :placeholder="latPlaceholder"
          class="w-full h-9 px-3 rounded-lg border-0 bg-slate-900 text-white text-xs ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] font-mono"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-400 mb-1">Longitude</label>
        <input
          :value="lng"
          @input="handleLngInput($event)"
          type="number"
          step="any"
          :placeholder="lngPlaceholder"
          class="w-full h-9 px-3 rounded-lg border-0 bg-slate-900 text-white text-xs ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] font-mono"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import L from 'leaflet'

const props = defineProps({
  lat: { type: [Number, String], default: null },
  lng: { type: [Number, String], default: null },
  mapHeight: { type: String, default: '220px' },
  placeholder: { type: String, default: 'Search location...' },
  latPlaceholder: { type: String, default: '-6.2088' },
  lngPlaceholder: { type: String, default: '106.8456' },
  defaultCenter: { type: Array, default: () => [-6.9175, 107.6191] }, // Bandung
  defaultZoom: { type: Number, default: 13 },
})

const emit = defineEmits(['update:lat', 'update:lng', 'update:locationName'])

const mapContainer = ref(null)

let map = null
let marker = null

onMounted(() => {
  nextTick(() => {
    initMap()
  })
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})

function initMap() {
  if (!mapContainer.value) return

  const center = props.lat && props.lng
    ? [parseFloat(props.lat), parseFloat(props.lng)]
    : props.defaultCenter

  const zoom = props.lat && props.lng ? 16 : props.defaultZoom

  map = L.map(mapContainer.value, {
    center,
    zoom,
    zoomControl: true,
    attributionControl: false,
  })

  // Standard light tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map)

  // Attribution (small)
  L.control.attribution({ prefix: false, position: 'bottomright' })
    .addAttribution('© <a href="https://www.openstreetmap.org/copyright" target="_blank">OSM</a>')
    .addTo(map)

  // Click to place pin
  map.on('click', (e) => {
    setPin(e.latlng.lat, e.latlng.lng)
    emit('update:lat', e.latlng.lat)
    emit('update:lng', e.latlng.lng)
  })

  // If initial coords exist, add pin
  if (props.lat && props.lng) {
    setPin(parseFloat(props.lat), parseFloat(props.lng))
  }
}

function setPin(lat, lng) {
  if (!map) return

  if (marker) {
    marker.setLatLng([lat, lng])
  } else {
    const icon = L.divIcon({
      className: 'custom-pin',
      html: `<div style="width:24px;height:24px;background:#e53e3e;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);transform:translate(-50%,-50%);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })
    marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map)
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      emit('update:lat', pos.lat)
      emit('update:lng', pos.lng)
    })
  }
}

function handleLatInput(e) {
  const val = parseFloat(e.target.value)
  if (!isNaN(val)) {
    emit('update:lat', val)
    if (props.lng && map) {
      setPin(val, parseFloat(props.lng))
      map.setView([val, parseFloat(props.lng)], map.getZoom())
    }
  } else if (e.target.value === '') {
    emit('update:lat', null)
  }
}

function handleLngInput(e) {
  const val = parseFloat(e.target.value)
  if (!isNaN(val)) {
    emit('update:lng', val)
    if (props.lat && map) {
      setPin(parseFloat(props.lat), val)
      map.setView([parseFloat(props.lat), val], map.getZoom())
    }
  } else if (e.target.value === '') {
    emit('update:lng', null)
  }
}

// Watch for external prop changes (e.g., loading from API)
watch([() => props.lat, () => props.lng], ([newLat, newLng]) => {
  if (newLat && newLng && map) {
    const lat = parseFloat(newLat)
    const lng = parseFloat(newLng)
    if (!isNaN(lat) && !isNaN(lng)) {
      setPin(lat, lng)
      map.setView([lat, lng], map.getZoom())
    }
  }
})
</script>

<style>
@import 'leaflet/dist/leaflet.css';

.map-picker .leaflet-pane,
.map-picker .leaflet-control,
.map-picker .leaflet-top,
.map-picker .leaflet-bottom {
  z-index: auto !important;
}

.custom-pin {
  background: transparent !important;
  border: none !important;
}
</style>
