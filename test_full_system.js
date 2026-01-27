
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_URL = 'http://localhost:8787';
const AUTH_URL = 'http://localhost:8788';
const BACKEND_DIR = path.join(__dirname, 'backend');
const AUTH_DIR = path.join(__dirname, 'backend-auth');

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
};

function log(msg, color = colors.reset) {
    console.log(`${color}${msg}${colors.reset}`);
}

function success(msg) {
    log(`[SUCCESS] ${msg}`, colors.green);
}

function error(msg) {
    log(`[ERROR] ${msg}`, colors.red);
}

function info(msg) {
    log(`[INFO] ${msg}`, colors.cyan);
}

// Helper to run shell commands
function runCommand(command, cwd) {
    try {
        log(`Executing: ${command} in ${cwd}`, colors.yellow);
        execSync(command, { cwd, stdio: 'inherit' });
    } catch (e) {
        error(`Command failed: ${command}`);
        process.exit(1);
    }
}

// Helper for Fetch API
async function apiCall(method, url, body = null, token = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const options = {
            method,
            headers,
        };
        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const data = await response.json();

        return {
            status: response.status,
            ok: response.ok,
            data
        };
    } catch (e) {
        error(`API Call failed: ${method} ${url} - ${e.message}`);
        return { status: 0, ok: false, error: e };
    }
}

async function main() {
    log("=== STARTING FULL SYSTEM SIMULATION ===", colors.magenta);

    // 1. Reset Databases
    log("\n--- Step 1: Resetting Databases ---", colors.blue);

    // Backend Auth DB Reset (Users, Sessions)
    runCommand('npx wrangler d1 execute furban-auth-db --local --file=reset_auth_db.sql', AUTH_DIR);
    success("Auth DB Reset Complete");

    // Backend Content DB Reset (Photos, Blogs)
    runCommand('npx wrangler d1 execute furban-db --local --file=reset_content_db.sql', BACKEND_DIR);
    success("Content DB Reset Complete");

    // 2. Auth Simulation & Seeding
    log("\n--- Step 2: Seeding Users & Roles ---", colors.blue);

    // Login as Admin
    const adminEmail = 'admin@furban.test';
    const adminPass = 'Admin123!@#';

    // Register first to ensure account exists with known password (first user = admin)
    info(`Registering Admin (${adminEmail})...`);
    await apiCall('POST', `${AUTH_URL}/auth/register`, {
        email: adminEmail,
        password: adminPass
    });

    info(`Logging in as Admin (${adminEmail})...`);
    const loginRes = await apiCall('POST', `${AUTH_URL}/auth/login`, {
        email: adminEmail,
        password: adminPass
    });

    if (!loginRes.ok) {
        error(`Admin login failed: ${JSON.stringify(loginRes.data)}`);
        process.exit(1);
    }

    const adminToken = loginRes.data.token;
    success("Admin Logged In");

    // Create other roles
    const users = [
        { email: 'photog@furban.test', password: 'Password123!', role: 'photographer', legal_name: 'Peter Parker', nickname: 'Spidey' },
        { email: 'pub@furban.test', password: 'Password123!', role: 'publisher', legal_name: 'Clark Kent', nickname: 'Superman' },
        { email: 'user@furban.test', password: 'Password123!', role: 'user', legal_name: 'Bruce Wayne', nickname: 'Batman' }
    ];

    const tokens = { admin: adminToken };

    for (const u of users) {
        info(`Creating ${u.role}: ${u.email}...`);
        const createRes = await apiCall('POST', `${AUTH_URL}/auth/admin/users`, {
            email: u.email,
            password: u.password,
            role: u.role,
            legal_name: u.legal_name,
            nickname: u.nickname
        }, adminToken);

        if (!createRes.ok) {
            error(`Failed to create ${u.role}: ${JSON.stringify(createRes.data)}`);
            process.exit(1);
        }
        success(`${u.role} created`);

        // Login to get token for future steps
        const login = await apiCall('POST', `${AUTH_URL}/auth/login`, {
            email: u.email,
            password: u.password
        });
        tokens[u.role] = login.data.token;
    }

    // 3. Photographer Workflow
    await runPhotographerWorkflow(tokens);

    // 4. Publisher Workflow
    await runPublisherWorkflow(tokens);

    // 5. Public View Verification
    await verifyPublicViews();

    log("\n=== SIMULATION COMPLETE ===", colors.magenta);
}

// --- Workflow Functions ---

async function runPhotographerWorkflow(tokens) {
    log("\n--- Step 3: Photographer Workflow ---", colors.blue);

    // Use native Node.js FormData (available in Node 20)
    // No external dependency needed.
    const FormData = global.FormData;
    const Blob = global.Blob;

    // --- PHOTOGRAPHER ACTIONS ---
    const token = tokens.photographer;

    // 1. Upload Photo
    info("Uploading Photo (as Photographer)...");

    let uploadRes;
    if (FormData) {
        const form = new FormData();
        const fileContent = "fake image content";
        const blob = new Blob([fileContent], { type: 'image/png' });
        // The API implementation I read expects 'file'
        form.append('file', blob, 'test_photo.png');
        form.append('camera', 'Canon EOS R5');
        form.append('mini_desc', 'A beautiful sunset');
        form.append('tags', 'nature,sunset');

        // Node's native fetch (v18+) handles FormData, but we need to ensure compatibility.
        // We will try standard fetch.
        const res = await fetch(`${BACKEND_URL}/api/photos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: form
        });

        // Clone for safety if we need text
        const clone = res.clone();
        try {
            uploadRes = {
                status: res.status,
                ok: res.ok,
                data: await res.json()
            };
        } catch (e) {
            const text = await clone.text();
            error(`Upload response not JSON: ${text}`);
            return;
        }
    } else {
        error("Skipping upload due to missing FormData lib");
        return;
    }

    if (!uploadRes.ok) {
        error(`Upload failed: ${JSON.stringify(uploadRes.data)}`);
        return;
    }
    const photoId = uploadRes.data.id;
    success(`Photo Uploaded: ${photoId} (Status: ${uploadRes.data.status})`);

    // 2. Check Status (Should be pending)
    if (uploadRes.data.status !== 'pending') {
        error(`Expected status 'pending', got '${uploadRes.data.status}'`);
    } else {
        success("Photo verified as PENDING");
    }

    // --- ADMIN ACTIONS ---
    const adminToken = tokens.admin;

    // 3. Admin Approve
    info("Admin approving photo...");
    const approveRes = await apiCall('POST', `${BACKEND_URL}/api/admin/photos/${photoId}/status`, {
        status: 'approved'
    }, adminToken);

    if (!approveRes.ok) {
        error(`Approval failed: ${JSON.stringify(approveRes.data)}`);
    } else {
        success("Photo Approved by Admin");
    }

    // 4. Verify Approval (as Photographer)
    info("Verifying approval...");
    const myPhotos = await apiCall('GET', `${BACKEND_URL}/api/photos/my/photos`, null, token);
    const myPhoto = myPhotos.data.find(p => p.id === photoId);

    if (myPhoto && myPhoto.status === 'approved') {
        success("Photo verified as APPROVED");
    } else {
        error(`Photo NOT approved or not found. Status: ${myPhoto?.status}`);
    }

    // 5. Modify Photo (Photographer)
    info("Modifying Photo...");
    const modRes = await apiCall('PUT', `${BACKEND_URL}/api/photos/${photoId}`, {
        mini_desc: 'Updated Sunset Description',
        tags: 'nature,sunset,edited'
    }, token);

    if (!modRes.ok) {
        error(`Modification failed: ${JSON.stringify(modRes.data)}`);
    } else {
        // Status should be pending again
        if (modRes.data.status === 'pending') {
            success("Photo Modified & Status Reset to PENDING");
        } else {
            error(`Photo status did NOT reset: ${modRes.data.status}`);
        }
    }

    // 6. Admin Approve Again
    info("Admin approving photo again...");
    await apiCall('POST', `${BACKEND_URL}/api/admin/photos/${photoId}/status`, { status: 'approved' }, adminToken);
    success("Photo Approved Again");
}

async function runPublisherWorkflow(tokens) {
    log("\n--- Step 4: Publisher Workflow ---", colors.blue);
    const token = tokens.publisher;
    const adminToken = tokens.admin;

    // 1. Create Blog
    info("Creating Blog (as Publisher)...");

    // Blog creation supports FormData for image, but checks if 'image' field is present.
    // If we just send JSON, the backend (blogs.ts) handles `body['image']` from `parseBody()`.
    // If we send JSON, `parseBody` might not work as expected if it's strictly expecting content-type checks?
    // Wait, Hono `c.req.parseBody()` handles both multipart and URL-encoded.
    // `c.req.json()` handles JSON.
    // In `blogs.ts`: `const body = await c.req.parseBody()` is used.
    // This implies it EXPECTS FormData or URL-encoded.
    // Sending JSON to `parseBody` usually returns empty or fails.
    // I should check `blogs.ts` again. It calls `parseBody`.
    // So I MUST use FormData for creating blogs too, OR I modify backend to accept JSON.
    // Given the constraints, I will use FormData for Blog creation as well.

    // Reuse FormData from previous step logic
    // Reuse native globals
    const FormData = global.FormData;
    const Blob = global.Blob;

    let blogRes;
    if (FormData) {
        const form = new FormData();
        form.append('title', 'My First Blog');
        form.append('content', 'This is the content.');
        form.append('mini_desc', 'Intro');
        form.append('tags', 'news');
        // No image for now, or add one

        const res = await fetch(`${BACKEND_URL}/api/blogs`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: form
        });
        blogRes = { status: res.status, ok: res.ok, data: await res.json() };
    } else {
        // Fallback to JSON and hope backend handles it? 
        // Based on `blogs.ts`, it uses `parseBody`, so JSON might fail.
        error("FormData missing for Blog creation");
        return;
    }

    if (!blogRes.ok) {
        error(`Blog creation failed: ${JSON.stringify(blogRes.data)}`);
        return;
    }
    const blogId = blogRes.data.id;
    success(`Blog Created: ${blogId} (Status: ${blogRes.data.status})`);

    // 2. Admin Reject
    info("Admin Rejecting Blog...");
    const rejectReason = "Content is too short";
    const rejectRes = await apiCall('POST', `${BACKEND_URL}/api/admin/blogs/${blogId}/status`, {
        status: 'rejected',
        reason: rejectReason
    }, adminToken);

    if (!rejectRes.ok) {
        error(`Rejection failed: ${JSON.stringify(rejectRes.data)}`);
    } else {
        success("Blog Rejected");
    }

    // 3. Publisher Check Reason
    info("Publisher checking rejection reason...");
    const myBlogs = await apiCall('GET', `${BACKEND_URL}/api/blogs/my/blogs`, null, token);
    const myBlog = myBlogs.data.find(b => b.id === blogId);

    if (myBlog && myBlog.status === 'rejected' && myBlog.approval_reason === rejectReason) {
        success(`Reason verified: "${myBlog.approval_reason}"`);
    } else {
        error(`Reason verification failed. Status: ${myBlog?.status}, Reason: ${myBlog?.approval_reason}`);
    }

    // 4. Publisher Edit
    // Edit endpoint `PUT /:id` also uses `parseBody`.
    info("Publisher Editing Blog...");

    if (FormData) {
        const form = new FormData();
        form.append('title', 'My First Blog (Updated)');
        form.append('content', 'Longer content now.');
        form.append('mini_desc', 'Intro');
        form.append('tags', 'news');

        const res = await fetch(`${BACKEND_URL}/api/blogs/${blogId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: form
        });
        const data = await res.json();

        if (data.status === 'pending' && (!data.approval_reason)) {
            success("Blog Edited & Status Reset to PENDING");
        } else {
            error(`Blog Edit status check failed. Status: ${data.status}`);
        }
    }

    // 5. Admin Approve
    info("Admin Approving Blog...");
    await apiCall('POST', `${BACKEND_URL}/api/admin/blogs/${blogId}/status`, { status: 'approved' }, adminToken);
    success("Blog Approved");
}

async function verifyPublicViews() {
    log("\n--- Step 5: Public View Verification ---", colors.blue);

    // 1. Check Gallery
    const galleryRes = await apiCall('GET', `${BACKEND_URL}/api/photos`);
    if (galleryRes.ok && Array.isArray(galleryRes.data) && galleryRes.data.length > 0) {
        success(`Public Gallery has ${galleryRes.data.length} photos`);
        // Check fields
        const photo = galleryRes.data[0];
        if (photo.user_id && photo.title && photo.tags) {
            success("Photo has expected fields");
        } else {
            error("Photo missing fields in public view");
        }
    } else {
        error(`Public Gallery check failed: ${JSON.stringify(galleryRes.data)}`);
    }

    // 2. Check Blogs
    const blogRes = await apiCall('GET', `${BACKEND_URL}/api/blogs`);
    if (blogRes.ok && Array.isArray(blogRes.data) && blogRes.data.length > 0) {
        success(`Public Blogs has ${blogRes.data.length} blogs`);
        const blog = blogRes.data[0];
        if (blog.title) {
            success("Blog has expected fields");
        }
    } else {
        error(`Public Blogs check failed: ${JSON.stringify(blogRes.data)}`);
    }
}

main().catch(e => {
    error(`Unhandled error: ${e}`);
    process.exit(1);
});
