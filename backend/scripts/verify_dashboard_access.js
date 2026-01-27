
const BASE_URL = 'http://localhost:8788/api';

// Users
const PUBLISHER = { username: 'blog', password: 'password123' };

async function login(user) {
    console.log(`[Login] Authenticating as ${user.username}...`);
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, password: user.password })
    });
    if (!res.ok) throw new Error(`Login failed: ${res.status}`);
    const data = await res.json();
    return data.token;
}

async function run() {
    console.log('--- Starting Dashboard Access verification ---');
    try {
        const token = await login(PUBLISHER);

        // Simulating Dashboard Load
        // 1. Get My Blogs (Should Succeed)
        console.log('[Test] Fetching My Blogs (Publisher)...');
        const blogsRes = await fetch(`${BASE_URL}/blogs/my/blogs`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`Blogs Status: ${blogsRes.status}`); // Expect 200

        // 2. Get My Photos (Should Fail 403 for Publisher, confirming backend restriction)
        console.log('[Test] Fetching My Photos (Publisher)...');
        const photosRes = await fetch(`${BASE_URL}/photos/my/photos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`Photos Status: ${photosRes.status}`);

        if (photosRes.status === 403) {
            console.log("✅ Backend correctly returns 403 for Publisher accessing Photos.");
            console.log("   The Frontend fix ensures we do NOT call this endpoint for Publishers.");
        } else {
            console.log("⚠️ Backend returned " + photosRes.status + " (Expected 403). Backend access might be open.");
        }

    } catch (e) {
        console.error('Test Failed:', e);
    }
}

run();
