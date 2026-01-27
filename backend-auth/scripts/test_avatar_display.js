/**
 * Test script for Avatar Image Display
 * Uploads an avatar and then tries to retrieve it
 * Run: node scripts/test_avatar_display.js
 */

const AUTH_URL = 'http://localhost:8788'
const TEST_EMAIL = 'admin@test.com'
const TEST_PASSWORD = 'Admin123!'

let authToken = null

async function request(endpoint, options = {}) {
  const url = `${AUTH_URL}${endpoint}`
  const headers = { ...options.headers }
  
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }
  
  const response = await fetch(url, { ...options, headers })
  return response
}

async function login() {
  console.log('=== LOGIN ===')
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
  })
  
  const data = await res.json()
  if (res.ok && data.token) {
    authToken = data.token
    console.log('✅ Login successful')
    return data.user
  } else {
    console.log('❌ Login failed:', data)
    return null
  }
}

async function uploadAvatar() {
  console.log('\n=== UPLOAD AVATAR ===')
  
  // Create a simple test image (1x1 PNG)
  const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  const binaryString = atob(base64Png)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: 'image/png' })
  const file = new File([blob], 'test-avatar.png', { type: 'image/png' })
  
  const formData = new FormData()
  formData.append('file', file)
  
  const res = await request('/auth/me/avatar', {
    method: 'POST',
    body: formData
  })
  
  const data = await res.json()
  console.log('Upload Response:', data)
  
  if (res.ok && data.profile_image_url) {
    console.log('✅ Avatar uploaded:', data.profile_image_url)
    return data.profile_image_url
  } else {
    console.log('❌ Upload failed')
    return null
  }
}

async function testImageRetrieval(imagePath) {
  console.log('\n=== TEST IMAGE RETRIEVAL ===')
  console.log('Image Path:', imagePath)
  
  const fullUrl = `${AUTH_URL}${imagePath}`
  console.log('Full URL:', fullUrl)
  
  const res = await fetch(fullUrl)
  console.log('Status:', res.status)
  console.log('Content-Type:', res.headers.get('content-type'))
  
  if (res.ok) {
    const blob = await res.blob()
    console.log('Size:', blob.size, 'bytes')
    console.log('✅ Image retrieval successful!')
    return true
  } else {
    const text = await res.text()
    console.log('❌ Image retrieval failed:', text)
    return false
  }
}

async function runTests() {
  console.log('========================================')
  console.log('   Avatar Image Display Test')
  console.log('========================================\n')
  
  const user = await login()
  if (!user) return
  
  const imagePath = await uploadAvatar()
  if (!imagePath) return
  
  await testImageRetrieval(imagePath)
  
  console.log('\n========================================')
  console.log('   Test Complete')
  console.log('========================================')
}

runTests().catch(console.error)
