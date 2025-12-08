import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        console.log('Received recipe data:', body);


        if (!body.title || !body.description || !body.cookingTime || !body.servings) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }


        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }


        const user_id = body.user_id || 1; 
        
        console.log('📝 Creating recipe for user:', user_id);


        const difficulty = body.difficulty.charAt(0).toUpperCase() + body.difficulty.slice(1);

        console.log('📝 Creating recipe without transaction...');


        const recipeResult = await query(
            `INSERT INTO recipes (user_id, title, description, cooking_time, difficulty, servings, recipe_image) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                user_id,
                body.title,
                body.description,
                body.cookingTime,
                difficulty,
                body.servings,
                body.recipeImage || null
            ]
        );

        const recipeId = recipeResult.insertId;
        console.log('✅ Recipe created with ID:', recipeId);


        if (body.ingredients && body.ingredients.length > 0) {
            let sortOrder = 0;
            for (const ingredient of body.ingredients) {
                if (ingredient.name.trim()) {
                    await query(
                        `INSERT INTO ingredients (recipe_id, name, quantity, unit, sort_order) 
                         VALUES (?, ?, ?, ?, ?)`,
                        [
                            recipeId,
                            ingredient.name,
                            ingredient.quantity || '',
                            ingredient.unit || '',
                            sortOrder++
                        ]
                    );
                }
            }
            console.log('✅ Ingredients added:', body.ingredients.length);
        }


        if (body.instructions && body.instructions.length > 0) {
            let stepNumber = 1;
            for (const instruction of body.instructions) {
                if (instruction.trim()) {
                    await query(
                        `INSERT INTO instructions (recipe_id, step_number, description) 
                         VALUES (?, ?, ?)`,
                        [
                            recipeId,
                            stepNumber,
                            instruction
                        ]
                    );
                    stepNumber++;
                }
            }
            console.log('✅ Instructions added:', body.instructions.length);
        }

        console.log('🎉 Recipe creation completed successfully');
        return NextResponse.json({ 
            message: 'Recipe created successfully',
            recipeId: recipeId
        }, { status: 201 });
        
    } catch (error) {
        console.error('❌ Error creating recipe:', error);
        return NextResponse.json(
            { error: 'Failed to create recipe: ' + error.message },
            { status: 500 }
        );
    }
}