import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  try {
    console.log('🗑️ DELETE request received');
    

    const { id } = await params;
    const numericId = parseInt(id);
    
    if (isNaN(numericId)) {
      return NextResponse.json({ error: 'Invalid Review ID' }, { status: 400 });
    }


    const authHeader = request.headers.get('authorization');
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      
      if (decoded && decoded.userId) {
        userId = decoded.userId;
        console.log('✅ User authenticated via JWT, user ID:', userId);
      } else {
        console.log('❌ Invalid or expired token');
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      }
    } else {
      console.log('❌ No authorization header');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('Review ID to delete:', numericId);


    const review = await query(
      `SELECT r.*, u.username, r.recipe_id 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.id = ?`,
      [numericId]
    );
    
    if (review.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const reviewData = review[0];
    console.log('Review data:', reviewData);
    console.log('Review user_id:', reviewData.user_id, 'Current user:', userId);


    if (reviewData.user_id !== userId) {

      const recipe = await query(
        'SELECT user_id FROM recipes WHERE id = ?',
        [reviewData.recipe_id]
      );
      
      if (recipe.length === 0 || recipe[0].user_id !== userId) {
        return NextResponse.json({ 
          error: 'Unauthorized: You can only delete your own reviews' 
        }, { status: 403 });
      } else {
        console.log('✅ Allowed: User is recipe owner');
      }
    } else {
      console.log('✅ Allowed: User is review owner');
    }


    const result = await query(
      'DELETE FROM reviews WHERE id = ?',
      [numericId]
    );

    console.log('✅ Review deleted successfully');
    
    return NextResponse.json({ 
      success: true,
      message: 'Review deleted successfully!',
      deletedId: numericId
    });
    
  } catch (error) {
    console.error('❌ Error in DELETE:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}