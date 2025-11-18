import { verifyPassword, generateToken } from '../../../../lib/auth';
import { query } from '../../../../lib/db';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return Response.json({ message: 'Email and password are required' }, { status: 400 });
        }

        const users = await query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return Response.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        const user = users[0];
        const isValidPassword = await verifyPassword(password, user.password_hash);

        if (!isValidPassword) {
            return Response.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        const token = generateToken(user.id);

        return Response.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                profile_picture: user.profile_picture
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return Response.json({ message: 'Internal server error' }, { status: 500 });
    }
}