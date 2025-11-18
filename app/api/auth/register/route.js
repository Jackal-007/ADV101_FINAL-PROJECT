import { hashPassword } from '../../../../lib/auth';
import { query } from '../../../../lib/db';

export async function POST(request) {
    try {
        const { username, email, password } = await request.json();

        // Validation
        if (!username || !email || !password) {
            return Response.json({ message: 'All fields are required' }, { status: 400 });
        }

        if (password.length < 6) {
            return Response.json({ message: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUser.length > 0) {
            return Response.json({ message: 'User already exists' }, { status: 409 });
        }

        // Create user
        const hashedPassword = await hashPassword(password);
        const result = await query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        return Response.json({ 
            message: 'User created successfully',
            userId: result.insertId 
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return Response.json({ message: 'Internal server error' }, { status: 500 });
    }
}