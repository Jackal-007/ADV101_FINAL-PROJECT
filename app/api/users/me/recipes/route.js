import { query } from '../../../../../lib/db';
import { verifyToken } from '../../../../../lib/auth';

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

        const recipes = await query(
            `SELECT 
                r.*,
                COUNT(rev.id) as review_count,
                COALESCE(AVG(rev.rating), 0) as avg_rating,
                SUM(CASE WHEN rev.rating = 5 THEN 1 ELSE 0 END) as five_star_count
            FROM recipes r
            LEFT JOIN reviews rev ON r.id = rev.recipe_id
            WHERE r.user_id = ?
            GROUP BY r.id
            ORDER BY r.created_at DESC`,
            [decoded.userId]
        );

        const parsedRecipes = recipes.map(recipe => ({
            ...recipe,
            ingredients: recipe.ingredients ? JSON.parse(recipe.ingredients) : [],
            instructions: recipe.instructions ? JSON.parse(recipe.instructions) : []
        }));

        return Response.json({ recipes: parsedRecipes });
    } catch (error) {
        console.error('User recipes fetch error:', error);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}