
const BASE_URL = 'http://localhost:8788/api';
// Using Publisher 'blog'
const USER = { username: 'blog', password: 'password123' };

async function login() {
    console.log(`[Login]...`);
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(USER)
    });
    const data = await res.json();
    return data.token;
}

async function run() {
    console.log('--- Starting Blog Edit Verification ---');
    try {
        const token = await login();

        // 1. Create a Blog
        console.log('[Step 1] Creating Blog...');
        const fd = new FormData();
        fd.append('title', 'Original Title');
        fd.append('content', 'Original Content');
        const dummyContent = new Blob(['img'], { type: 'image/jpeg' });
        fd.append('image', dummyContent, 'orig.jpg');

        const createRes = await fetch(`${BASE_URL}/blogs`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: fd
        });
        const blog = await createRes.json();
        console.log(`Created Blog ID: ${blog.id}, Title: ${blog.title}`);

        // 2. Update Blog (Edit)
        console.log('[Step 2] Updating Blog (Edit UI Simulation)...');
        const editFd = new FormData();
        editFd.append('title', 'Updated Title');
        editFd.append('content', 'Updated Content with **Markdown**');
        // Simulate NOT changing image (so no 'image' field)
        // Frontend logic says: if(blogForm.value.image) append it.

        const updateRes = await fetch(`${BASE_URL}/blogs/${blog.id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: editFd
        });

        if (!updateRes.ok) {
            console.error(`Update Failed: ${updateRes.status}`, await updateRes.text());
        } else {
            const updatedBlog = await updateRes.json();
            console.log(`Updated Blog Title: ${updatedBlog.title}`);
            console.log(`Updated Blog Content: ${updatedBlog.content}`);

            if (updatedBlog.title === 'Updated Title') {
                console.log("✅ Edit successful!");
            } else {
                console.log("❌ Edit failed to persist title.");
            }
        }

    } catch (e) {
        console.error('Test Failed:', e);
    }
}

run();
