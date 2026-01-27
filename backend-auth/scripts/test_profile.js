/**
 * Test script for Profile Update and Avatar Upload
 * Run: node scripts/test_profile.js
 */

const AUTH_URL = 'http://localhost:8788'

// Test credentials - using the test users from test_auth_api.js
const TEST_EMAIL = 'admin@test.com'
const TEST_PASSWORD = 'Admin123!'

let authToken = null

async function request(endpoint, options = {}) {
  const url = `${AUTH_URL}${endpoint}`
  const headers = {
    ...options.headers,
  }
  
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  })
  
  const text = await response.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = { raw: text }
  }
  
  return { status: response.status, data, ok: response.ok }
}

async function login() {
  console.log('\n=== LOGIN ===')
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
  })
  
  console.log('Status:', res.status)
  console.log('Response:', JSON.stringify(res.data, null, 2))
  
  if (res.ok && res.data.token) {
    authToken = res.data.token
    console.log('✅ Login successful')
    return true
  } else {
    console.log('❌ Login failed')
    return false
  }
}

async function getProfile() {
  console.log('\n=== GET PROFILE ===')
  const res = await request('/auth/me', { method: 'GET' })
  
  console.log('Status:', res.status)
  console.log('Response:', JSON.stringify(res.data, null, 2))
  
  if (res.ok) {
    console.log('✅ Get profile successful')
    // Response is nested as { user: {...} }
    return res.data.user || res.data
  } else {
    console.log('❌ Get profile failed')
    return null
  }
}

async function updateProfile(legalName, nickname) {
  console.log('\n=== UPDATE PROFILE ===')
  console.log('Updating to:', { legal_name: legalName, nickname })
  
  const res = await request('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify({ legal_name: legalName, nickname })
  })
  
  console.log('Status:', res.status)
  console.log('Response:', JSON.stringify(res.data, null, 2))
  
  if (res.ok) {
    console.log('✅ Update profile successful')
    return true
  } else {
    console.log('❌ Update profile failed')
    return false
  }
}

async function changePassword(oldPassword, newPassword) {
  console.log('\n=== CHANGE PASSWORD ===')
  
  const res = await request('/auth/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
  })
  
  console.log('Status:', res.status)
  console.log('Response:', JSON.stringify(res.data, null, 2))
  
  if (res.ok) {
    console.log('✅ Change password successful')
    return true
  } else {
    console.log('❌ Change password failed')
    return false
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
  
  console.log('Status:', res.status)
  console.log('Response:', JSON.stringify(res.data, null, 2))
  
  if (res.ok) {
    console.log('✅ Avatar upload successful')
    return true
  } else {
    console.log('❌ Avatar upload failed')
    return false
  }
}

async function removeAvatar() {
  console.log('\n=== REMOVE AVATAR ===')
  
  const res = await request('/auth/me/avatar', { method: 'DELETE' })
  
  console.log('Status:', res.status)
  console.log('Response:', JSON.stringify(res.data, null, 2))
  
  if (res.ok) {
    console.log('✅ Remove avatar successful')
    return true
  } else {
    console.log('❌ Remove avatar failed')
    return false
  }
}

async function runTests() {
  console.log('========================================')
  console.log('   Profile & Avatar API Tests')
  console.log('========================================')
  console.log('Auth URL:', AUTH_URL)
  
  // Login first
  const loggedIn = await login()
  if (!loggedIn) {
    console.log('\n❌ Cannot proceed without login')
    return
  }
  
  // Test 1: Get current profile
  const profile = await getProfile()
  
  // Test 2: Update profile
  const newName = 'Test User ' + Date.now()
  const newNickname = 'Tester'
  await updateProfile(newName, newNickname)
  
  // Test 3: Verify profile was updated
  const updatedProfile = await getProfile()
  if (updatedProfile && updatedProfile.legal_name === newName && updatedProfile.nickname === newNickname) {
    console.log('\n✅ Profile update verification passed')
  } else {
    console.log('\n❌ Profile update verification failed')
    console.log('Expected:', { legal_name: newName, nickname: newNickname })
    console.log('Got:', { legal_name: updatedProfile?.legal_name, nickname: updatedProfile?.nickname })
  }
  
  // Test 4: Upload avatar
  await uploadAvatar()
  
  // Test 5: Verify avatar was uploaded
  const profileWithAvatar = await getProfile()
  if (profileWithAvatar && profileWithAvatar.profile_image_url) {
    console.log('\n✅ Avatar upload verification passed')
    console.log('Avatar URL:', profileWithAvatar.profile_image_url)
  } else {
    console.log('\n❌ Avatar upload verification failed')
  }
  
  // Test 6: Remove avatar
  await removeAvatar()
  
  // Test 7: Verify avatar was removed
  const profileWithoutAvatar = await getProfile()
  if (profileWithoutAvatar && !profileWithoutAvatar.profile_image_url) {
    console.log('\n✅ Avatar removal verification passed')
  } else {
    console.log('\n❌ Avatar removal verification failed')
  }
  
  console.log('\n========================================')
  console.log('   Tests Complete')
  console.log('========================================')
}

runTests().catch(console.error)
