import { query } from '@/lib/db';
import { NextResponse } from 'next/server';


export async function POST(request) {
    try {

        const url = new URL(request.url);
        console.log('🔍 Full URL:', url.pathname);
        

        const pathParts = url.pathname.split('/');
        console.log('🔍 Path parts:', pathParts);
        

        const recipeId = pathParts[3];
        
        console.log('=== URL PARSING REVIEW API ===');
        console.log('1. Recipe ID from URL parsing:', recipeId);
        console.log('2. Full request URL:', request.url);

        if (!recipeId) {
            console.log('❌ Recipe ID not found in URL');
            return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
        }

        const body = await request.json();
        console.log('3. Request body:', body);

        const numericRecipeId = parseInt(recipeId);
        if (isNaN(numericRecipeId)) {
            console.log('❌ Recipe ID is not a valid number');
            return NextResponse.json({ error: 'Invalid Recipe ID' }, { status: 400 });
        }


        if (body.user_id === undefined) {
            console.log('❌ user_id is missing');
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }
        if (body.rating === undefined) {
            console.log('❌ rating is missing');
            return NextResponse.json({ error: 'Rating is required' }, { status: 400 });
        }


        const user_id = parseInt(body.user_id);
        const rating = parseInt(body.rating);
        const comment = body.comment || '';

        console.log('4. Validated parameters:');
        console.log('   - user_id:', user_id);
        console.log('   - recipeId:', numericRecipeId);
        console.log('   - rating:', rating);
        console.log('   - comment:', comment);


        if (isNaN(user_id) || isNaN(rating) || rating < 1 || rating > 5) {
            console.log('❌ Parameter validation failed');
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
        }

        console.log('5. All parameters validated. Inserting into database...');


        const result = await query(
            `INSERT INTO reviews (user_id, recipe_id, rating, comment, created_at) 
             VALUES (?, ?, ?, ?, NOW())`,
            [user_id, numericRecipeId, rating, comment]
        );

        console.log('✅ REVIEW ADDED SUCCESSFULLY with ID:', result.insertId);
        
        return NextResponse.json({ 
            message: 'Review added successfully!',
            reviewId: result.insertId
        });
        
    } catch (error) {
        console.error('❌ Error adding review:', error);
        return NextResponse.json(
            { error: 'Failed to add review: ' + error.message },
            { status: 500 }
        );
    }
}


export async function GET(request) {
    try {

        const url = new URL(request.url);
        const pathParts = url.pathname.split('/');
        const recipeId = pathParts[3];
        
        console.log('📝 Fetching reviews for recipe:', recipeId);

        if (!recipeId) {
            return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
        }

        const numericRecipeId = parseInt(recipeId);
        if (isNaN(numericRecipeId)) {
            return NextResponse.json({ error: 'Invalid Recipe ID' }, { status: 400 });
        }
        
        const reviews = await query(`
            SELECT r.*, u.username, u.id as user_id 
            FROM reviews r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.recipe_id = ? 
            ORDER BY r.created_at DESC
        `, [numericRecipeId]);
        
        console.log('✅ Reviews fetched:', reviews.length);
        return NextResponse.json(reviews);
    } catch (error) {
        console.error('❌ Error fetching reviews:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reviews' },
            { status: 500 }
        );
    }
}