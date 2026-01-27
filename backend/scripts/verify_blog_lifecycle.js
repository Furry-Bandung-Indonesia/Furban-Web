
const fs = require('fs');

const BASE_URL = 'http://localhost:8788/api';

// Users
const ADMIN = { username: 'furbandungers', password: 'password123' };
const PUBLISHER = { username: 'blog', password: 'password123' };

async function login(user) {
    console.log(`[Login] Authenticating as ${user.username}...`);
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, password: user.password })
    });
    if (!res.ok) throw new Error(`Login failed for ${user.username}: ${res.status} ${await res.text()}`);
    const data = await res.json();
    console.log(`[Login] Success. Token received.`);
    return data.token;
}

async function run() {
    console.log('--- Starting Blog Lifecycle Verification ---');

    try {
        // 1. Login
        const pubToken = await login(PUBLISHER);
        const adminToken = await login(ADMIN);

        // 2. Create Blog (Publisher)
        console.log('\n[Create] Publisher creating blog post...');
        const formData = new FormData();
        const timestamp = Date.now();
        formData.append('title', `Lifecycle Test Blog ${timestamp}`);
        formData.append('content', 'Testing image preview lifecycle.');
        formData.append('mini_desc', 'Test desc');
        const dummyContent = new Blob(['dummy image content'], { type: 'image/jpeg' });
        formData.append('image', dummyContent, `test-${timestamp}.jpg`);

        const createRes = await fetch(`${BASE_URL}/blogs`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${pubToken}` },
            body: formData
        });
        if (!createRes.ok) throw new Error(`Create failed: ${createRes.status} ${await createRes.text()}`);
        const blog = await createRes.json();
        console.log(`[Create] Blog created: ${blog.id}, Status: ${blog.status}`);
        const blogId = blog.id;
        let imageUrl = blog.image;
        if (imageUrl && !imageUrl.startsWith('http')) imageUrl = `http://localhost:8788${imageUrl}`;

        // 3. Verify Preview (Should be 403 if issue persists, or 200 if fixed?)
        // Wait, issue is "preview of image too... image get 403".
        // Likely referring to the response from `enrichBlog` or the actual fetch.
        console.log(`\n[Preview] Fetching image URL: ${imageUrl}`);
        if (imageUrl) {
            // Try fetching RAW
            const imgRes = await fetch(imageUrl);
            console.log(`[Preview] Raw Fetch Status: ${imgRes.status}`);
            if (imgRes.status === 403) console.error("!!! 403 Forbidden on Raw Image !!!");

            // Try fetching RESIZED (The likely culprit for preview)
            const resizedUrl = `${imageUrl}?w=400`;
            const resizeRes = await fetch(resizedUrl);
            console.log(`[Preview] Resized Fetch Status (${resizedUrl}): ${resizeRes.status}`);
            if (resizeRes.status === 403) console.error("!!! 403 Forbidden on Resized Image !!!");
        }

        // 4. Approve (Admin)
        console.log('\n[Approve] Admin approving blog...');
        const approveRes = await fetch(`${BASE_URL}/blogs/${blogId}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (!approveRes.ok) console.error(`Approve failed: ${approveRes.status} ${await approveRes.text()}`);
        else console.log('[Approve] Success.');

        // 5. Verify Public View (Approved)
        console.log('\n[View] Verifying public availability...');
        const publicRes = await fetch(`${BASE_URL}/blogs/${blog.slug || blogId}`); // or /blogs/all if verifying admin view
        // Using get ALL (admin) to see properties
        const adminViewRes = await fetch(`${BASE_URL}/blogs/all`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const allBlogs = await adminViewRes.json();
        const found = allBlogs.find(b => b.id === blogId);
        console.log(`[View] Blog status in Admin list: ${found ? found.status : 'Not Found'}`);

        // 6. Reject (Admin) -> User asked to test approving THEN rejecting
        console.log('\n[Reject] Admin rejecting blog...');
        const rejectRes = await fetch(`${BASE_URL}/blogs/${blogId}/reject`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` },
            body: JSON.stringify({ reason: "Testing rejection flow" })
        });
        if (!rejectRes.ok) console.error(`Reject failed: ${rejectRes.status} ${await rejectRes.text()}`);
        else console.log('[Reject] Success.');

        // 7. Delete (Publisher or Admin)
        console.log('\n[Delete] Deleting blog...');
        const deleteRes = await fetch(`${BASE_URL}/blogs/${blogId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (!deleteRes.ok) console.error(`Delete failed: ${deleteRes.status} ${await deleteRes.text()}`);
        else console.log('[Delete] Success.');

    } catch (e) {
        console.error('Test Failed:', e);
    }
}

run();
