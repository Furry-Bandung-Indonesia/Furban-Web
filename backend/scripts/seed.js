const fs = require('fs');
const { execSync } = require('child_process');
const bcrypt = require('bcryptjs');

const TEMP_SQL_FILE = 'seed_temp.sql';

async function generateSeedData() {
    console.log('🌱 Generating seed data...');

    // 1. Password Hash
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);
    console.log(`🔐 Default password '${password}' hashed.`);

    // 2. Generate SQL Content
    let sql = `
-- ⚠️ GENERATED SEED FILE - DO NOT EDIT MANUALLY --
DELETE FROM approvals;
DELETE FROM blogs;
DELETE FROM photos;
DELETE FROM users;

-- Users
INSERT INTO users (id, username, password_hash, email, role) VALUES 
('user_admin_001', 'admin', '${hash}', 'admin@furban.com', 'admin'),
('user_furban_001', 'furbandungers', '${hash}', 'furbandungers@furban.com', 'admin'),
('user_blog_001', 'blog', '${hash}', 'blog@furban.com', 'publisher'),
('user_blog_002', 'blog2', '${hash}', 'blog2@furban.com', 'publisher'),
('user_pub_001', 'publisher', '${hash}', 'publisher@furban.com', 'publisher'),
('user_photo_001', 'photographer', '${hash}', 'photo@furban.com', 'photographer'),
('user_photo_002', 'lens_master', '${hash}', 'lens@furban.com', 'photographer'),
('user_photo_003', 'shutter_bug', '${hash}', 'shutter@furban.com', 'photographer'),
('user_photo_004', 'pixel_peeper', '${hash}', 'pixel@furban.com', 'photographer'),
('user_photo_005', 'iso_king', '${hash}', 'iso@furban.com', 'photographer');

-- Photos
INSERT INTO photos (id, user_id, filename, camera, mini_desc, tags, status, created_at) VALUES 
('photo_001', 'user_photo_001', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b', 'Sony A7III', 'Majestic Mountains', 'Nature,Landscape', 'approved', '2025-01-01 10:00:00'),
('photo_002', 'user_photo_001', 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df', 'Canon R5', 'City Lights at Night', 'City,Night', 'approved', '2025-01-02 11:00:00'),
('photo_003', 'user_photo_002', 'https://images.unsplash.com/photo-1531804055935-76f44d7c3621', 'Nikon Z6', 'Portrait of a Stranger', 'Portrait,Street', 'approved', '2025-01-03 12:00:00'),
('photo_004', 'user_photo_002', 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e', 'Fujifilm X-T4', 'Alpine Lake', 'Nature,Water', 'approved', '2025-01-04 13:00:00'),
('photo_005', 'user_photo_003', 'https://images.unsplash.com/photo-1519501025264-65ba15a82390', 'Sony A7RIV', 'Urban Jungle', 'City,Architecture', 'approved', '2025-01-05 14:00:00'),
('photo_006', 'user_photo_003', 'https://images.unsplash.com/photo-1552168324-d612d77725e3', 'Leica M10', 'Street Life', 'Street,Candid', 'approved', '2025-01-06 15:00:00'),
('photo_007', 'user_photo_004', 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853', 'Canon 5D Mark IV', 'Abstract Geometry', 'Abstract,Lines', 'approved', '2025-01-07 16:00:00'),
('photo_008', 'user_photo_004', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b', 'Nikon D850', 'Fashion Shoot', 'Portrait,Fashion', 'approved', '2025-01-08 17:00:00'),
('photo_009', 'user_photo_005', 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000', 'Sony A1', 'City Traffic', 'City,Motion', 'approved', '2025-01-09 18:00:00'),
('photo_010', 'user_photo_005', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05', 'Fujifilm GFX 100', 'Morning Fog', 'Nature,Mood', 'approved', '2025-01-10 19:00:00');

-- Blogs
INSERT INTO blogs (id, user_id, title, slug, content, mini_desc, tags, status, photo_filename, created_at) VALUES 
('blog_001', 'user_pub_001', 'The Art of Street Photography', 'art-of-street-photography', 'Street photography is about capturing life as it happens...', 'Tips for street photos', 'Photography,Tips', 'approved', 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d', '2025-01-01 09:00:00'),
('blog_002', 'user_pub_001', 'Best Cameras for 2025', 'best-cameras-2025', 'Here are the top cameras you should consider buying in 2025...', 'Camera reviews', 'Tech,Gear', 'approved', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32', '2025-01-02 10:00:00'),
('blog_003', 'user_pub_001', 'Editing Workflow 101', 'editing-workflow-101', 'Learn how to edit your photos like a pro using Lightroom...', 'Editing tutorial', 'Tutorial,Editing', 'approved', 'https://images.unsplash.com/photo-1555212697-194d092e3b8f', '2025-01-03 11:00:00'),
('blog_004', 'user_pub_001', 'Travel Photography Guide', 'travel-photography-guide', 'Essential tips for capturing your travel memories...', 'Travel tips', 'Travel,Guide', 'approved', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1', '2025-01-04 12:00:00'),
('blog_005', 'user_pub_001', 'Understanding ISO', 'understanding-iso', 'What is ISO and how does it affect your images?', 'Photography basics', 'Education,Basics', 'approved', 'https://images.unsplash.com/photo-1616423664045-60dd55b87d36', '2025-01-05 13:00:00'),
('blog_006', 'user_pub_001', 'Portrait Lighting Techniques', 'portrait-lighting', 'Mastering natural and studio lighting for portraits...', 'Lighting guide', 'Portrait,Lighting', 'approved', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb', '2025-01-06 14:00:00'),
('blog_007', 'user_pub_001', 'Drone Photography Rules', 'drone-rules', 'Stay legal and safe while flying your drone...', 'Drone regulations', 'Drone,Legal', 'approved', 'https://images.unsplash.com/photo-1508614589041-895b8cba3e51', '2025-01-07 15:00:00'),
('blog_008', 'user_pub_001', 'Film vs Digital', 'film-vs-digital', 'Comparing the look and feel of film versus digital sensors...', 'Medium comparison', 'Opinion,Gear', 'approved', 'https://images.unsplash.com/photo-1516724562728-afc824a36e84', '2025-01-08 16:00:00'),
('blog_009', 'user_pub_001', 'Composition Rules to Break', 'composition-rules', 'When to follow the rule of thirds and when to ignore it...', 'Composition tips', 'Art,Composition', 'approved', 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d', '2025-01-09 17:00:00'),
('blog_010', 'user_pub_001', 'Night Photography Tips', 'night-photography', 'How to capture stunning images in low light...', 'Low light guide', 'Night,Tips', 'approved', 'https://images.unsplash.com/photo-1516912481808-3406841bd33c', '2025-01-10 18:00:00');
    `;

    // 3. Write Temp File
    fs.writeFileSync(TEMP_SQL_FILE, sql);
    console.log(`📄 SQL file '${TEMP_SQL_FILE}' created.`);

    // 4. Execute Wrangler Command
    try {
        console.log('🚀 Executing via Wrangler...');
        execSync(`npx wrangler d1 execute furban-db --file=${TEMP_SQL_FILE}`, { stdio: 'inherit' });
        console.log('✅ Database seeded successfully!');
    } catch (error) {
        console.error('❌ Error executing seed:', error.message);
    } finally {
        // 5. Cleanup
        if (fs.existsSync(TEMP_SQL_FILE)) {
            fs.unlinkSync(TEMP_SQL_FILE);
            console.log(`🧹 Cleaned up temporary file.`);
        }
    }
}

generateSeedData();
