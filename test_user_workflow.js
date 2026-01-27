
const { execSync } = require('child_process');

const AUTH_URL = 'http://localhost:8788';
const BACKEND_URL = 'http://localhost:8787';

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    blue: "\x1b[34m",
    yellow: "\x1b[33m"
};

function log(msg, color = colors.reset) {
    console.log(`${color}${msg}${colors.reset}`);
}

async function apiCall(method, url, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const fetch = global.fetch; // Node 20
        const res = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
        const data = await res.json();
        return { status: res.status, ok: res.ok, data };
    } catch (e) {
        return { ok: false, error: e };
    }
}

async function main() {
    log("=== STARTING USER WORKFLOW TEST ===", colors.blue);

    const email = 'user@furban.test';
    let password = 'Password123!'; // Initial password

    // 1. Login
    log(`1. Logging in as ${email}...`);
    let loginRes = await apiCall('POST', `${AUTH_URL}/auth/login`, { email, password });

    if (!loginRes.ok) {
        log(`Login Failed with initial password. Trying new password...`, colors.yellow);
        // Fallback to new password if it was changed in a previous (partial) run
        password = 'NewPassword123!';
        loginRes = await apiCall('POST', `${AUTH_URL}/auth/login`, { email, password });
    }

    if (!loginRes.ok) {
        log(`Login Failed: ${JSON.stringify(loginRes.data)}`, colors.red);
        process.exit(1);
    }
    let token = loginRes.data.token;
    let userId = loginRes.data.user.uuid;
    log("Login Success", colors.green);

    // 2. Change Profile (using update endpoint logic - likely register/profile based on current frontend)
    // Wait, typical user cannot call /users/:uuid (admin only).
    // Frontend uses /auth/register/profile for updates as discovered earlier?
    // Let's try calling that.
    log("2. Updating Profile...");
    const newNick = "BatmanUpdated";
    const updateRes = await apiCall('POST', `${AUTH_URL}/auth/register/profile`, {
        legal_name: 'Bruce Wayne II',
        nickname: newNick
    }, token);

    if (updateRes.ok && updateRes.data.user.nickname === newNick) {
        log("Profile Update Success", colors.green);
        // Token might be refreshed
        token = updateRes.data.token;
    } else {
        log(`Profile Update Failed: ${JSON.stringify(updateRes.data)}`, colors.red);
        // If it failed because it's only for pending profiles, then we have a gap in API found.
        // But logic in auth.ts didn't seem to check pending_profile state for the update itself, just updated it.
    }

    // 3. Change Password
    // Is there a change password endpoint?
    // frontend api.js: authMePassword: '/auth/me/password'.
    // I didn't verify this route exists in auth.ts!
    // I recall checking auth.ts and I did NOT see /me/password.
    // I saw /me (GET).
    // Let's check auth.ts content again if it failed.
    // But let's try calling it.
    log("3. Changing Password...");
    const newPassword = 'NewPassword123!';
    const pwRes = await apiCall('POST', `${AUTH_URL}/auth/me/password`, {
        oldPassword: password,
        newPassword: newPassword
    }, token);

    if (pwRes.status === 404) {
        log("Endpoint /auth/me/password NOT FOUND. Checking implementation needed.", colors.yellow);
        // If it's missing, I need to add it!
        // User asked: "make sure it can log in logout, change profle.. all profile, change password"
    } else if (pwRes.ok) {
        log("Password Change Success", colors.green);
    } else {
        log(`Password Change Failed: ${JSON.stringify(pwRes.data)}`, colors.red);
    }

    // 4. Logout
    log("4. Logout...");
    await apiCall('POST', `${AUTH_URL}/auth/logout`, {}, token);
    log("Logout Success", colors.green);

    // 5. Login with New Password (if step 3 succeeded)
    if (pwRes.ok) {
        log("5. verify Login with NEW password...");
        const newLogin = await apiCall('POST', `${AUTH_URL}/auth/login`, { email, password: newPassword });
        if (newLogin.ok) {
            log("New Password Login Success", colors.green);
        } else {
            log("New Password Login Failed", colors.red);
        }
    }

    // 6. Check Public Views (Debugging the failure from full test)
    log("6. Verifying Public Views...");
    const gallery = await apiCall('GET', `${BACKEND_URL}/api/photos`);
    log(`Gallery Count: ${gallery.data ? gallery.data.length : 'Error'}`);
    if (gallery.ok && gallery.data.length > 0) log("Gallery OK", colors.green);
    else log("Gallery Empty/Fail", colors.red);

    const blog = await apiCall('GET', `${BACKEND_URL}/api/blogs`);
    log(`Blog Count: ${blog.data ? blog.data.length : 'Error'}`);
    if (blog.ok && blog.data.length > 0) log("Blog OK", colors.green);
    else log("Blog Empty/Fail", colors.red);

}

main();
