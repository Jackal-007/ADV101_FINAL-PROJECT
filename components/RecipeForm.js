'use client';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function RecipeForm({ onSuccess }) {
    const { user } = useAuth();
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

    // Fix: Add parameter type comment
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Fix: Add parameter type comments
    const handleIngredientChange = (index, field, value) => {
        const updatedIngredients = [...formData.ingredients];
        updatedIngredients[index][field] = value;
        setFormData({
            ...formData,
            ingredients: updatedIngredients
        });
    };

    // Fix: Add parameter type comments
    const handleInstructionChange = (index, value) => {
        const updatedInstructions = [...formData.instructions];
        updatedInstructions[index] = value;
        setFormData({
            ...formData,
            instructions: updatedInstructions
        });
    };

    // Fix: Add parameter type comment
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

    // Fix: Add try-catch block and parameter type
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        console.log('🔍 Current user in RecipeForm:', user);
        console.log('🔍 User ID:', user?.id);

        // Filter out empty ingredients and instructions
        const filteredIngredients = formData.ingredients.filter(ing => 
            ing.name.trim() !== '' || ing.quantity.trim() !== ''
        );
        const filteredInstructions = formData.instructions.filter(instruction => 
            instruction.trim() !== ''
        );

        try {
            let imageUrl = null;
            
            // Upload image first if exists
            if (formData.recipeImage) {
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
                cookingTime: parseInt(formData.cookingTime),
                servings: parseInt(formData.servings),
                user_id: user.id,
                recipeImage: imageUrl
            };

            console.log('🔍 Submitting recipe with user_id:', user.id);

            const response = await fetch('/api/recipes/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(submitData)
            });

            if (!response.ok) {
                throw new Error('Failed to create recipe');
            }

            const result = await response.json();
            onSuccess(result.recipeId);
            
            // Reset form
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
            
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Add new ingredient field
    const addIngredient = () => {
        setFormData({
            ...formData,
            ingredients: [...formData.ingredients, { name: '', quantity: '', unit: '' }]
        });
    };

    // Remove ingredient field
    const removeIngredient = (index) => {
        if (formData.ingredients.length > 1) {
            const updatedIngredients = formData.ingredients.filter((_, i) => i !== index);
            setFormData({
                ...formData,
                ingredients: updatedIngredients
            });
        }
    };

    // Add new instruction field
    const addInstruction = () => {
        setFormData({
            ...formData,
            instructions: [...formData.instructions, '']
        });
    };

    // Remove instruction field
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
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Create New Recipe</h2>
            
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                                placeholder="4"
                            />
                        </div>
                    </div>
                </div>

                {/* Ingredients Section */}
                <div className="border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <label className="block text-lg font-semibold text-gray-800">
                            Ingredients *
                        </label>
                        <button
                            type="button"
                            onClick={addIngredient}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
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
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-900"
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

                {/* Instructions Section */}
                <div className="border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <label className="block text-lg font-semibold text-gray-800">
                            Instructions *
                        </label>
                        <button
                            type="button"
                            onClick={addInstruction}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
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
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-900"
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

                {/* Submit Button */}
                <div className="border-t pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 text-white py-4 px-6 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold transition-colors"
                    >
                        {loading ? 'Creating Recipe...' : 'Create Recipe'}
                    </button>
                </div>
            </form>
        </div>
    );
}