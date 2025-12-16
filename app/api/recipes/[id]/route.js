import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth'; 

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


export async function PUT(request, { params }) {
    let connection;
    try {
        const { id } = await params;
        const recipeId = parseInt(id);
        
        if (isNaN(recipeId)) {
            return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
        }

        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }
        
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        console.log('🔄 Updating recipe ID:', recipeId, 'for user:', decoded.userId || decoded.id);
        
        const data = await request.json();
        console.log('📦 Update data received:', data);

        const recipes = await query(
            'SELECT * FROM recipes WHERE id = ?',
            [recipeId]
        );

        if (recipes.length === 0) {
            return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
        }

        const recipe = recipes[0];
        
        if (recipe.user_id !== decoded.userId && recipe.user_id !== decoded.id) {
            console.log('❌ User not authorized to edit this recipe');
            return NextResponse.json({ error: 'Not authorized to edit this recipe' }, { status: 403 });
        }

        const updates = [];
        const values = [];

        if (data.title !== undefined) {
            updates.push('title = ?');
            values.push(data.title);
        }
        if (data.description !== undefined) {
            updates.push('description = ?');
            values.push(data.description);
        }
        if (data.cooking_time !== undefined) {
            updates.push('cooking_time = ?');
            values.push(parseInt(data.cooking_time));
        }
        if (data.difficulty !== undefined) {
            updates.push('difficulty = ?');
            values.push(data.difficulty);
        }
        if (data.servings !== undefined) {
            updates.push('servings = ?');
            values.push(parseInt(data.servings));
        }
        if (data.recipe_image !== undefined) {
            updates.push('recipe_image = ?');
            values.push(data.recipe_image);
        }

        if (updates.length > 0) {

            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(recipeId);

            console.log('📝 Updating recipe with:', `UPDATE recipes SET ${updates.join(', ')} WHERE id = ?`);
            
            await query(
                `UPDATE recipes SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }

        if (data.ingredients !== undefined && Array.isArray(data.ingredients)) {
            console.log('🥬 Updating ingredients:', data.ingredients.length);
            
            await query('DELETE FROM ingredients WHERE recipe_id = ?', [recipeId]);

            if (data.ingredients.length > 0) {
                const ingredientValues = data.ingredients
                    .filter(ing => ing.name && ing.name.trim() !== '')
                    .map((ing, index) => [
                        recipeId,
                        ing.name,
                        ing.quantity || '',
                        ing.unit || '',
                        index + 1
                    ]);
                
                if (ingredientValues.length > 0) {
                    const placeholders = ingredientValues.map(() => '(?, ?, ?, ?, ?)').join(', ');
                    const flatValues = ingredientValues.flat();
                    
                    await query(
                        `INSERT INTO ingredients (recipe_id, name, quantity, unit, sort_order) VALUES ${placeholders}`,
                        flatValues
                    );
                }
            }
        }


        if (data.instructions !== undefined && Array.isArray(data.instructions)) {
            console.log('📝 Updating instructions:', data.instructions.length);
            

            await query('DELETE FROM instructions WHERE recipe_id = ?', [recipeId]);
            

            if (data.instructions.length > 0) {
                const instructionValues = data.instructions
                    .filter(inst => inst && inst.trim() !== '')
                    .map((inst, index) => [
                        recipeId,
                        index + 1,
                        inst
                    ]);
                
                if (instructionValues.length > 0) {

                    const placeholders = instructionValues.map(() => '(?, ?, ?)').join(', ');
                    const flatValues = instructionValues.flat();
                    
                    await query(
                        `INSERT INTO instructions (recipe_id, step_number, description) VALUES ${placeholders}`,
                        flatValues
                    );
                }
            }
        }

        console.log('✅ All updates completed successfully');


        const updatedRecipes = await query(`
            SELECT r.*, u.username, u.profile_picture 
            FROM recipes r 
            LEFT JOIN users u ON r.user_id = u.id 
            WHERE r.id = ?
        `, [recipeId]);

        if (updatedRecipes.length === 0) {
            return NextResponse.json({ error: 'Recipe not found after update' }, { status: 404 });
        }

        const result = updatedRecipes[0];


        const ingredients = await query(
            'SELECT name, quantity, unit FROM ingredients WHERE recipe_id = ? ORDER BY sort_order, id',
            [recipeId]
        );

        const instructions = await query(
            'SELECT description FROM instructions WHERE recipe_id = ? ORDER BY step_number',
            [recipeId]
        );

        result.ingredients = ingredients;
        result.instructions = instructions.map(inst => inst.description);

        console.log('✅ Recipe updated successfully');

        return NextResponse.json({ 
            message: 'Recipe updated successfully',
            recipe: result,
            recipeId: recipeId.toString()
        });

    } catch (error) {
        console.error('❌ Recipe update error:', error);
        return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 });
    }
}