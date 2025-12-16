import { query } from '../../../../../lib/db';
import { verifyToken } from '../../../../../lib/auth';
import path from 'path';
import fs from 'fs/promises';

export async function POST(request) {
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
            return Response.json({ error: 'No token provided' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return Response.json({ error: 'Invalid token' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('profile_picture');

        if (!file || typeof file === 'string') {
            return Response.json({ error: 'No file uploaded' }, { status: 400 });
        }

        if (!file.type.startsWith('image/')) {
            return Response.json({ error: 'File must be an image' }, { status: 400 });
        }

        if (file.size > 5 * 1024 * 1024) { 
            return Response.json({ error: 'File size must be less than 5MB' }, { status: 400 });
        }

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
        await fs.mkdir(uploadDir, { recursive: true });

        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const filename = `profile_${decoded.userId}_${timestamp}.${extension}`;
        const filepath = path.join(uploadDir, filename);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await fs.writeFile(filepath, buffer);

        const relativePath = `/uploads/profiles/${filename}`;
        
        await query(
            'UPDATE users SET profile_picture = ? WHERE id = ?',
            [relativePath, decoded.userId]
        );

        const updatedUser = await query(
            'SELECT id, username, email, profile_picture, bio FROM users WHERE id = ?',
            [decoded.userId]
        );

        return Response.json({ 
            message: 'Profile picture updated successfully',
            profile_picture: relativePath,
            user: updatedUser[0]
        });

    } catch (error) {
        console.error('Profile picture upload error:', error);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
            return Response.json({ error: 'No token provided' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return Response.json({ error: 'Invalid token' }, { status: 401 });
        }

        const user = await query(
            'SELECT profile_picture FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (!user[0]) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        const currentPicture = user[0].profile_picture;

        if (currentPicture && !currentPicture.startsWith('http')) {
            try {
                const filepath = path.join(process.cwd(), 'public', currentPicture);
                await fs.unlink(filepath);
                console.log('Removed old profile picture:', currentPicture);
            } catch (error) {
                console.log('Could not remove file (might not exist):', error.message);
            }
        }

        await query(
            'UPDATE users SET profile_picture = NULL WHERE id = ?',
            [decoded.userId]
        );

        const updatedUser = await query(
            'SELECT id, username, email, profile_picture, bio FROM users WHERE id = ?',
            [decoded.userId]
        );

        return Response.json({ 
            message: 'Profile picture removed successfully',
            user: updatedUser[0]
        });

    } catch (error) {
        console.error('Profile picture removal error:', error);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}