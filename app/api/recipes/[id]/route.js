import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {

        const { id } = await params;
        console.log('🔍 Fetching recipe with ID:', id, 'Type:', typeof id);


        if (!id || id === 'undefined' || id === 'null') {
            console.log('❌ Invalid recipe ID:', id);
            return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
        }

        const recipeId = parseInt(id);
        if (isNaN(recipeId)) {
            console.log('❌ Recipe ID is not a number:', id);
            return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
        }

        console.log('🔍 Using recipe ID:', recipeId);


        const recipes = await query(`
            SELECT r.*, u.username 
            FROM recipes r 
            LEFT JOIN users u ON r.user_id = u.id 
            WHERE r.id = ?
        `, [recipeId]);

        console.log('📊 Recipes found:', recipes.length);

        if (recipes.length === 0) {
            console.log('❌ Recipe not found in database for ID:', recipeId);
            return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
        }

        const recipe = recipes[0];
        console.log('✅ Found recipe:', recipe.title);


        const ingredients = await query(
            'SELECT name, quantity, unit FROM ingredients WHERE recipe_id = ? ORDER BY sort_order, id',
            [recipeId]
        );
        console.log('🥬 Ingredients found:', ingredients.length);


        const instructions = await query(
            'SELECT description FROM instructions WHERE recipe_id = ? ORDER BY step_number',
            [recipeId]
        );
        console.log('📝 Instructions found:', instructions.length);

        recipe.ingredients = ingredients;
        recipe.instructions = instructions.map(inst => inst.description);

        return NextResponse.json(recipe);
        
    } catch (error) {
        console.error('❌ Error fetching recipe:', error);
        return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {

        const { id } = await params;
        console.log('🗑️ Deleting recipe with ID:', id);


        if (!id || id === 'undefined' || id === 'null') {
            console.log('❌ Invalid recipe ID for deletion:', id);
            return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
        }

        const recipeId = parseInt(id);
        if (isNaN(recipeId)) {
            console.log('❌ Recipe ID is not a number for deletion:', id);
            return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
        }


        console.log('🗑️ Deleting ingredients...');
        await query('DELETE FROM ingredients WHERE recipe_id = ?', [recipeId]);
        
        console.log('🗑️ Deleting instructions...');
        await query('DELETE FROM instructions WHERE recipe_id = ?', [recipeId]);
        
        console.log('🗑️ Deleting recipe...');
        const result = await query('DELETE FROM recipes WHERE id = ?', [recipeId]);

        if (result.affectedRows === 0) {
            console.log('❌ Recipe not found for deletion');
            return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
        }

        console.log('✅ Recipe deleted successfully');
        
        return NextResponse.json({ message: 'Recipe deleted successfully' });
        
    } catch (error) {
        console.error('❌ Error deleting recipe:', error);
        return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}