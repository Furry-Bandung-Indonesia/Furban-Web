-- Dummy data for main backend (photos and blogs only)
-- Users are managed by backend-auth service
-- Use UUIDs that will match users created in auth service

-- Clear existing data
DELETE FROM approvals;
DELETE FROM blogs;
DELETE FROM photos;

-- Dummy user UUIDs (these should match users in the auth service)
-- These are placeholder UUIDs - actual UUIDs come from registration
-- For testing, we'll use fixed UUIDs that can be created in auth service

-- Dummy Photos
INSERT INTO photos (id, user_id, filename, camera, mini_desc, tags, status, approval_reason, created_at, updated_at) VALUES 
('photo_001', 'photographer-uuid-001', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b', 'Sony A7III', 'Majestic Mountains', 'Nature,Landscape', 'approved', NULL, '2025-12-04 11:41:16', '2025-12-04 11:41:16'),
('photo_002', 'photographer-uuid-001', 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df', 'Canon R5', 'City Lights at Night', 'City,Night', 'approved', NULL, '2025-12-04 11:41:16', '2025-12-04 11:41:16'),
('photo_003', 'photographer-uuid-002', 'https://images.unsplash.com/photo-1531804055935-76f44d7c3621', 'Nikon Z6', 'Portrait of a Stranger', 'Portrait,Street', 'approved', NULL, '2025-12-04 11:41:16', '2025-12-04 11:41:16'),
('photo_004', 'photographer-uuid-002', 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e', 'Fujifilm X-T4', 'Alpine Lake', 'Nature,Water', 'approved', NULL, '2025-12-04 11:41:16', '2025-12-04 11:41:16'),
('photo_005', 'photographer-uuid-001', 'https://images.unsplash.com/photo-1519501025264-65ba15a82390', 'Sony A7RIV', 'Urban Jungle', 'City,Architecture', 'approved', NULL, '2025-12-04 11:41:16', '2025-12-04 11:41:16'),
('photo_006', 'photographer-uuid-002', 'https://images.unsplash.com/photo-1552168324-d612d77725e3', 'Leica M10', 'Street Life', 'Street,Candid', 'approved', NULL, '2025-12-04 11:41:16', '2025-12-04 11:41:16'),
('photo_007', 'photographer-uuid-001', 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853', 'Canon 5D Mark IV', 'Abstract Geometry', 'Abstract,Lines', 'approved', NULL, '2025-12-04 11:41:16', '2025-12-04 11:41:16'),
('photo_008', 'photographer-uuid-002', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b', 'Nikon D850', 'Fashion Shoot', 'Portrait,Fashion', 'approved', NULL, '2025-12-04 11:41:16', '2025-12-04 11:41:16'),
('photo_009', 'photographer-uuid-001', 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000', 'Sony A1', 'City Traffic', 'City,Motion', 'approved', NULL, '2025-12-04 11:41:16', '2025-12-04 11:41:16'),
('photo_010', 'photographer-uuid-002', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05', 'Fujifilm GFX 100', 'Morning Fog', 'Nature,Mood', 'approved', NULL, '2025-12-04 11:41:16', '2025-12-04 11:41:16');

-- Dummy Blogs
INSERT INTO blogs (id, user_id, title, slug, content, mini_desc, tags, status, approval_reason, photo_filename) VALUES 
('blog_001', 'publisher-uuid-001', 'The Art of Street Photography', 'art-of-street-photography', 'Street photography is about capturing life as it happens. It requires patience, quick reflexes, and an understanding of light and composition. This guide will help you master the art of capturing candid moments in urban environments.', 'Tips for street photos', 'Photography,Tips', 'approved', NULL, 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d'),
('blog_002', 'publisher-uuid-001', 'Best Cameras for 2025', 'best-cameras-2025', 'Here are the top cameras you should consider buying in 2025. From mirrorless to medium format, we cover all the best options for every budget and shooting style.', 'Camera reviews', 'Tech,Gear', 'approved', NULL, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32'),
('blog_003', 'publisher-uuid-001', 'Editing Workflow 101', 'editing-workflow-101', 'Learn how to edit your photos like a pro using Lightroom and Photoshop. This comprehensive guide covers everything from basic adjustments to advanced retouching techniques.', 'Editing tutorial', 'Tutorial,Editing', 'approved', NULL, 'https://images.unsplash.com/photo-1555212697-194d092e3b8f'),
('blog_004', 'publisher-uuid-001', 'Travel Photography Guide', 'travel-photography-guide', 'Essential tips for capturing your travel memories. Learn how to pack light, find the best locations, and tell compelling stories through your images.', 'Travel tips', 'Travel,Guide', 'approved', NULL, 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1'),
('blog_005', 'publisher-uuid-001', 'Understanding ISO', 'understanding-iso', 'What is ISO and how does it affect your images? This guide explains the exposure triangle and helps you understand when to use high or low ISO settings.', 'Photography basics', 'Education,Basics', 'approved', NULL, 'https://images.unsplash.com/photo-1616423664045-60dd55b87d36'),
('blog_006', 'publisher-uuid-001', 'Portrait Lighting Techniques', 'portrait-lighting', 'Mastering natural and studio lighting for portraits. Learn about Rembrandt, butterfly, and split lighting patterns to create stunning portraits.', 'Lighting guide', 'Portrait,Lighting', 'approved', NULL, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'),
('blog_007', 'publisher-uuid-001', 'Drone Photography Rules', 'drone-rules', 'Stay legal and safe while flying your drone. This guide covers regulations, best practices, and tips for capturing stunning aerial imagery.', 'Drone regulations', 'Drone,Legal', 'approved', NULL, 'https://images.unsplash.com/photo-1508614589041-895b8cba3e51'),
('blog_008', 'publisher-uuid-001', 'Film vs Digital', 'film-vs-digital', 'Comparing the look and feel of film versus digital sensors. Discover the unique characteristics of each medium and when to use them.', 'Medium comparison', 'Opinion,Gear', 'approved', NULL, 'https://images.unsplash.com/photo-1516724562728-afc824a36e84'),
('blog_009', 'publisher-uuid-001', 'Composition Rules to Break', 'composition-rules', 'When to follow the rule of thirds and when to ignore it. Learn about advanced composition techniques that can elevate your photography.', 'Composition tips', 'Art,Composition', 'approved', NULL, 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d'),
('blog_010', 'publisher-uuid-001', 'Night Photography Tips', 'night-photography', 'How to capture stunning images in low light. From astrophotography to cityscapes, learn the techniques for shooting after dark.', 'Low light guide', 'Night,Tips', 'approved', NULL, 'https://images.unsplash.com/photo-1516912481808-3406841bd33c');
