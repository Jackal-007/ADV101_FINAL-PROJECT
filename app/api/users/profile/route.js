import { query } from '../../../../lib/db';
import { verifyToken } from '../../../../lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request) {
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
            `SELECT 
                u.id, u.username, u.email, u.profile_picture, u.bio, u.created_at,
                COUNT(r.id) as total_recipes,
                COALESCE(AVG(rev.rating), 0) as avg_rating,
                SUM(CASE WHEN rev.rating = 5 THEN 1 ELSE 0 END) as five_star_reviews
            FROM users u
            LEFT JOIN recipes r ON u.id = r.user_id
            LEFT JOIN reviews rev ON r.id = rev.recipe_id
            WHERE u.id = ?
            GROUP BY u.id`,
            [decoded.userId]
        );

        if (!user[0]) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        return Response.json({ user: user[0] });
    } catch (error) {
        console.error('Profile fetch error:', error);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
            return Response.json({ error: 'No token provided' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return Response.json({ error: 'Invalid token' }, { status: 401 });
        }

        const data = await request.json();
        const { username, email, bio, currentPassword, newPassword } = data; // ← ADD username

        let updates = [];
        let params = [];

        if (username && username.trim() !== '') {
            if (username.length < 3 || username.length > 50) {
                return Response.json({ 
                    error: 'Username must be between 3 and 50 characters' 
                }, { status: 400 });
            }

            const existingUsername = await query(
                'SELECT id FROM users WHERE username = ? AND id != ?',
                [username, decoded.userId]
            );
            if (existingUsername.length > 0) {
                return Response.json({ error: 'Username already in use' }, { status: 400 });
            }
            updates.push('username = ?');
            params.push(username);
        }

        if (email) {
            const existingEmail = await query(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, decoded.userId]
            );
            if (existingEmail.length > 0) {
                return Response.json({ error: 'Email already in use' }, { status: 400 });
            }
            updates.push('email = ?');
            params.push(email);
        }

        if (bio !== undefined) {
            updates.push('bio = ?');
            params.push(bio);
        }

        if (currentPassword && newPassword) {
            const user = await query(
                'SELECT password_hash FROM users WHERE id = ?',
                [decoded.userId]
            );
            
            if (!user[0]) {
                return Response.json({ error: 'User not found' }, { status: 404 });
            }

            const isValid = await bcrypt.compare(currentPassword, user[0].password_hash);
            if (!isValid) {
                return Response.json({ error: 'Current password is incorrect' }, { status: 400 });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updates.push('password_hash = ?');
            params.push(hashedPassword);
        }

        if (updates.length === 0) {
            return Response.json({ message: 'Nothing to update' });
        }

        params.push(decoded.userId);

        await query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        const updatedUser = await query(
            'SELECT id, username, email, profile_picture, bio, created_at FROM users WHERE id = ?',
            [decoded.userId]
        );

        return Response.json({ 
            message: 'Profile updated successfully',
            user: updatedUser[0]
        });

    } catch (error) {
        console.error('Profile update error:', error);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}