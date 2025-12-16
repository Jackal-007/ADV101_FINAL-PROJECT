'use client';
import { useState, useEffect } from 'react'; 
import { useAuth } from '../context/AuthContext';


export default function RecipeForm({ 
    onSuccess, 
    editing = false, 
    recipeId = '',  
    initialData      
}) {
    const { user, token } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        cookingTime: '',
        difficulty: 'easy',
        servings: '',
        ingredients: [{ name: '', quantity: '', unit: '' }],
        instructions: [''],
        recipeImage: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');


    const method = editing ? 'PUT' : 'POST';

    useEffect(() => {
        if (editing && recipeId) {
            fetchRecipeData();
        }
    }, [editing, recipeId]);

    const fetchRecipeData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/recipes/${recipeId}`);
            if (res.ok) {
                const recipe = await res.json();
                setFormData({
                    title: recipe.title || '',
                    description: recipe.description || '',
                    cookingTime: recipe.cooking_time?.toString() || '',
                    difficulty: recipe.difficulty?.toLowerCase() || 'easy',
                    servings: recipe.servings?.toString() || '',
                    ingredients: recipe.ingredients || [{ name: '', quantity: '', unit: '' }],
                    instructions: recipe.instructions || [''],
                    recipeImage: recipe.recipe_image || null
                });
            }
        } catch (error) {
            console.error('Error fetching recipe:', error);
            setError('Failed to load recipe data');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };


    const handleIngredientChange = (index, field, value) => {
        const updatedIngredients = [...formData.ingredients];
        updatedIngredients[index][field] = value;
        setFormData({
            ...formData,
            ingredients: updatedIngredients
        });
    };


    const handleInstructionChange = (index, value) => {
        const updatedInstructions = [...formData.instructions];
        updatedInstructions[index] = value;
        setFormData({
            ...formData,
            instructions: updatedInstructions
        });
    };


    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError('Image must be smaller than 5MB');
                return;
            }
            setFormData({
                ...formData,
                recipeImage: file
            });
            setError('');
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        console.log('🔍 Current user in RecipeForm:', user);
        console.log('🔍 User ID:', user?.id);


        const filteredIngredients = formData.ingredients.filter(ing => 
            ing.name.trim() !== '' || ing.quantity.trim() !== ''
        );
        const filteredInstructions = formData.instructions.filter(instruction => 
            instruction.trim() !== ''
        );

        try {
            let imageUrl = formData.recipeImage;
            

            if (formData.recipeImage && typeof formData.recipeImage !== 'string') {
                const imageFormData = new FormData();
                imageFormData.append('file', formData.recipeImage);
                
                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: imageFormData,
                });
                
                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload image');
                }
                
                const uploadResult = await uploadResponse.json();
                imageUrl = uploadResult.url;
            }

            const submitData = {
                ...formData,
                ingredients: filteredIngredients,
                instructions: filteredInstructions,
                cooking_time: parseInt(formData.cookingTime),
                servings: parseInt(formData.servings),
                recipe_image: imageUrl
            };

            console.log('🔍 Submitting recipe with user_id:', user.id);

            const endpoint = editing ? `/api/recipes/${recipeId}` : '/api/recipes/create';

            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(submitData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to ${editing ? 'update' : 'create'} recipe: ${errorText}`);
            }

            const result = await response.json();
            onSuccess(editing ? recipeId : result.recipeId || result.id);
            
        if (!editing) { 
            setFormData({
                title: '',
                description: '',
                cookingTime: '',
                difficulty: 'easy',
                servings: '',
                ingredients: [{ name: '', quantity: '', unit: '' }],
                instructions: [''],
                recipeImage: null
            });
        }
            
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    const addIngredient = () => {
        setFormData({
            ...formData,
            ingredients: [...formData.ingredients, { name: '', quantity: '', unit: '' }]
        });
    };


    const removeIngredient = (index) => {
        if (formData.ingredients.length > 1) {
            const updatedIngredients = formData.ingredients.filter((_, i) => i !== index);
            setFormData({
                ...formData,
                ingredients: updatedIngredients
            });
        }
    };


    const addInstruction = () => {
        setFormData({
            ...formData,
            instructions: [...formData.instructions, '']
        });
    };


    const removeInstruction = (index) => {
        if (formData.instructions.length > 1) {
            const updatedInstructions = formData.instructions.filter((_, i) => i !== index);
            setFormData({
                ...formData,
                instructions: updatedInstructions
            });
        }
    };

    return (
        <div className="max-w-4xl mx-auto enhanced-form animate-slide-up">
            <h2 className="text-3xl font-display font-bold text-gray-800 mb-2 text-center">
                {editing ? 'Edit Recipe' : 'Create New Recipe'}
            </h2>
            <p className="text-gray-600 text-center mb-8">
                {editing ? 'Update your recipe details' : 'Share your culinary masterpiece with the community'}
            </p>
            
            {error && (
                <div className="alert-error mb-6 animate-slide-up">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Recipe Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="form-input"
                            placeholder="Enter recipe title"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Recipe Image
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="form-input"
                        />
                        {formData.recipeImage && (
                            <p className="text-green-600 text-sm mt-2">
                                ✓ Image selected: {formData.recipeImage.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Short Description *
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={3}
                            className="form-input"
                            placeholder="Brief description of your recipe"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cooking Time (minutes) *
                            </label>
                            <input
                                type="number"
                                name="cookingTime"
                                value={formData.cookingTime}
                                onChange={handleChange}
                                required
                                min="1"
                                className="form-input"
                                placeholder="15"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Difficulty *
                            </label>
                            <select
                                name="difficulty"
                                value={formData.difficulty}
                                onChange={handleChange}
                                className="form-input"
                            >
                                <option value="easy" className="text-gray-900">Easy</option>
                                <option value="medium" className="text-gray-900">Medium</option>
                                <option value="hard" className="text-gray-900">Hard</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Serves *
                            </label>
                            <input
                                type="number"
                                name="servings"
                                value={formData.servings}
                                onChange={handleChange}
                                required
                                min="1"
                                className="form-input"
                                placeholder="4"
                            />
                        </div>
                    </div>
                </div>


                <div className="border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <label className="block text-lg font-semibold text-gray-800">
                            Ingredients *
                        </label>
                        <button
                            type="button"
                            onClick={addIngredient}
                            className="btn-green px-4 py-2 text-sm"
                        >
                            + Add Ingredient
                        </button>
                    </div>
                    
                    <div className="space-y-3">
                        {formData.ingredients.map((ingredient, index) => (
                            <div key={index} className="flex gap-3 items-start">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Ingredient name"
                                        value={ingredient.name}
                                        onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                                        className="form-input"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Quantity"
                                        value={ingredient.quantity}
                                        onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-900"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Unit"
                                        value={ingredient.unit}
                                        onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-900"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeIngredient(index)}
                                    disabled={formData.ingredients.length === 1}
                                    className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>


                <div className="border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <label className="block text-lg font-semibold text-gray-800">
                            Instructions *
                        </label>
                        <button
                            type="button"
                            onClick={addInstruction}
                            className="btn-green px-4 py-2 text-sm"
                        >
                            + Add Step
                        </button>
                    </div>
                    
                    <div className="space-y-3">
                        {formData.instructions.map((instruction, index) => (
                            <div key={index} className="flex gap-3 items-start">
                                <div className="flex-1">
                                    <div className="flex items-start gap-3">
                                        <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mt-2 flex-shrink-0">
                                            {index + 1}
                                        </span>
                                        <textarea
                                            placeholder={`Step ${index + 1}`}
                                            value={instruction}
                                            onChange={(e) => handleInstructionChange(index, e.target.value)}
                                            rows={2}
                                            className="form-input flex-1"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeInstruction(index)}
                                    disabled={formData.instructions.length === 1}
                                    className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mt-2"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>


                <div className="border-t pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-4 px-6 text-lg font-semibold"
                    >
                        {loading ? (editing ? 'Updating Recipe...' : 'Creating Recipe...') : (editing ? 'Update Recipe' : 'Create Recipe')}
                    </button>
                </div>
            </form>
        </div>
    );
}