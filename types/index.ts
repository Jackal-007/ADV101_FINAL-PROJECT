export interface User {
  id: number;
  username: string;
  email: string;
  token?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  cooking_time: number;
  difficulty: string;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  username: string;
  user_id: string;
  recipe_image?: string;
}

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface Review {
  id: number;
  user_id: number;
  recipe_id: number;
  rating: number;
  comment: string;
  created_at: string;
  username: string;
}