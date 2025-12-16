import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function POST(request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const token = authHeader.split(' ')[1];
        
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        
        const user_id = decoded.userId || decoded.id;
        console.log('🔑 Creating recipe for authenticated user:', user_id);
        
        const body = await request.json();
        console.log('📦 Received recipe data:', body);

        if (!body.title || !body.description || !body.cooking_time || !body.servings) {
            return NextResponse.json(
                { error: 'Missing required fields: title, description, cooking_time, servings' },
                { status: 400 }
            );
        }

        const difficulty = body.difficulty ? 
            body.difficulty.charAt(0).toUpperCase() + body.difficulty.slice(1) : 
            'Medium';

        console.log('📝 Creating recipe for user:', user_id);

        const recipeResult = await query(
            `INSERT INTO recipes (user_id, title, description, cooking_time, difficulty, servings, recipe_image) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                user_id,  
                body.title,
                body.description,
                parseInt(body.cooking_time),
                difficulty,
                parseInt(body.servings),
                body.recipe_image || null 
            ]
        );

        const recipeId = recipeResult.insertId;
        console.log('✅ Recipe created with ID:', recipeId);


        if (body.ingredients && Array.isArray(body.ingredients) && body.ingredients.length > 0) {
            console.log('🥬 Adding', body.ingredients.length, 'ingredients...');
            
            for (let i = 0; i < body.ingredients.length; i++) {
                const ingredient = body.ingredients[i];
                if (ingredient.name && ingredient.name.trim()) {
                    await query(
                        `INSERT INTO ingredients (recipe_id, name, quantity, unit, sort_order) 
                         VALUES (?, ?, ?, ?, ?)`,
                        [
                            recipeId,
                            ingredient.name,
                            ingredient.quantity || '',
                            ingredient.unit || '',
                            i + 1  
                        ]
                    );
                }
            }
            console.log('✅ Ingredients added to ingredients table');
        } else {
            console.log('⚠️ No ingredients provided or ingredients is not an array');
        }

        if (body.instructions && Array.isArray(body.instructions) && body.instructions.length > 0) {
            console.log('📝 Adding', body.instructions.length, 'instructions...');
            
            for (let i = 0; i < body.instructions.length; i++) {
                const instruction = body.instructions[i];
                if (instruction && instruction.trim()) {
                    await query(
                        `INSERT INTO instructions (recipe_id, step_number, description) 
                         VALUES (?, ?, ?)`,
                        [
                            recipeId,
                            i + 1,  
                            instruction
                        ]
                    );
                }
            }
            console.log('✅ Instructions added to instructions table');
        } else {
            console.log('⚠️ No instructions provided or instructions is not an array');
        }

        console.log('🎉 Recipe creation completed successfully');
        return NextResponse.json({ 
            success: true,
            message: 'Recipe created successfully',
            recipeId: recipeId
        }, { status: 201 });
        
    } catch (error) {
        console.error('❌ Error creating recipe:', error);
        return NextResponse.json(
            { 
                success: false,
                error: 'Failed to create recipe: ' + error.message 
            },
            { status: 500 }
        );
    }
}