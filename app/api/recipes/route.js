// app/api/recipes/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const recipes = await query(`
            SELECT r.*, u.username 
            FROM recipes r 
            LEFT JOIN users u ON r.user_id = u.id 
            ORDER BY r.created_at DESC
        `);
        
        // For each recipe, get ingredients and instructions
        for (let recipe of recipes) {
            const ingredients = await query(
                'SELECT name, quantity, unit FROM ingredients WHERE recipe_id = ? ORDER BY sort_order, id',
                [recipe.id]
            );
            const instructions = await query(
                'SELECT description FROM instructions WHERE recipe_id = ? ORDER BY step_number',
                [recipe.id]
            );
            
            recipe.ingredients = ingredients;
            recipe.instructions = instructions.map(inst => inst.description);
        }
        
        return NextResponse.json(recipes);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch recipes' },
            { status: 500 }
        );
    }
}