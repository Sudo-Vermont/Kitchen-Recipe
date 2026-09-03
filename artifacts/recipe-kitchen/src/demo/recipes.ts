import type { Recipe } from '@workspace/api-client-react';

/**
 * Sample data for the static GitHub Pages build. The real app reads recipes
 * from Postgres through the API server; Pages can only serve static files, so
 * these stand in to show the interface populated.
 */

const asset = (name: string) => `${import.meta.env.BASE_URL}${name}`;
const walmart = (name: string) => `https://www.walmart.com/search?q=${encodeURIComponent(name)}`;

type SeedIngredient = [name: string, quantity: string, aisle: string, price: number];

function ingredients(items: SeedIngredient[]) {
  return items.map(([name, quantity, aisle, price]) => ({
    name,
    quantity,
    aisle,
    price,
    shoppingUrl: walmart(name),
  }));
}

function wholeItemCost(items: ReturnType<typeof ingredients>): number {
  return Math.round(items.reduce((total, item) => total + item.price, 0) * 100) / 100;
}

type Seed = Omit<Recipe, 'wholeItemCost' | 'mealPrice' | 'createdAt' | 'instructions'> & {
  daysAgo: number;
};

const seeds: Seed[] = [
  {
    id: 1,
    title: 'Garlic mushroom pasta',
    description:
      'Deep, savoury, and on the table in half an hour. Brown the mushrooms harder than feels right — that is where the whole dish comes from.',
    imageUrl: asset('garlic-mushroom-pasta.jpg'),
    category: 'Dinner',
    dietary: ['Vegetarian'],
    prepMinutes: 10,
    cookMinutes: 25,
    servings: 4,
    calories: 620,
    protein: 19,
    carbs: 82,
    fat: 21,
    author: 'Recipe Kitchen',
    daysAgo: 2,
    ingredients: ingredients([
      ['Cremini mushrooms', '500 g, sliced', 'Produce', 4.28],
      ['Spaghetti', '400 g', 'Pantry', 1.64],
      ['Garlic', '6 cloves, sliced', 'Produce', 0.78],
      ['Heavy cream', '120 ml', 'Dairy', 3.12],
      ['Parmesan', '60 g, grated', 'Dairy', 5.94],
      ['Flat-leaf parsley', 'small bunch', 'Produce', 1.18],
      ['Olive oil', '3 tbsp', 'Pantry', 6.42],
    ]),
  },
  {
    id: 2,
    title: 'Lemon herb roast chicken',
    description:
      'Bright, herby, and forgiving. Roast it once on a Sunday and you will be eating well off it until Wednesday.',
    imageUrl: asset('lemon-herb-chicken.jpg'),
    category: 'Dinner',
    dietary: ['Gluten-free', 'Dairy-free'],
    prepMinutes: 15,
    cookMinutes: 55,
    servings: 6,
    calories: 480,
    protein: 44,
    carbs: 9,
    fat: 29,
    author: 'Recipe Kitchen',
    daysAgo: 5,
    ingredients: ingredients([
      ['Whole chicken', '1.8 kg', 'Meat', 12.84],
      ['Lemons', '2, halved', 'Produce', 1.96],
      ['Thyme', 'small bunch', 'Produce', 2.48],
      ['Rosemary', '3 sprigs', 'Produce', 2.48],
      ['Garlic', '1 head, halved', 'Produce', 0.78],
      ['Olive oil', '2 tbsp', 'Pantry', 6.42],
      ['Kosher salt', '1 tbsp', 'Pantry', 1.24],
    ]),
  },
  {
    id: 3,
    title: 'Maple glazed salmon',
    description:
      'A weeknight fish dish that eats like a Saturday. One pan, twenty minutes, and a glaze worth scraping off the foil.',
    imageUrl: asset('glazed-salmon.jpg'),
    category: 'Dinner',
    dietary: ['Gluten-free', 'Dairy-free'],
    prepMinutes: 8,
    cookMinutes: 14,
    servings: 4,
    calories: 540,
    protein: 38,
    carbs: 22,
    fat: 32,
    author: 'Recipe Kitchen',
    daysAgo: 8,
    ingredients: ingredients([
      ['Salmon fillets', '4 × 170 g', 'Seafood', 21.96],
      ['Maple syrup', '4 tbsp', 'Pantry', 7.48],
      ['Soy sauce', '2 tbsp', 'Pantry', 2.86],
      ['Dijon mustard', '1 tbsp', 'Pantry', 3.24],
      ['Broccolini', '2 bunches', 'Produce', 4.96],
      ['Sesame seeds', '1 tbsp', 'Pantry', 2.68],
    ]),
  },
  {
    id: 4,
    title: 'Blueberry breakfast bake',
    description:
      'Assemble it Sunday night and breakfast handles itself until Wednesday. Good cold, better warm, excellent with too much yoghurt.',
    imageUrl: '',
    category: 'Breakfast',
    dietary: ['Vegetarian'],
    prepMinutes: 15,
    cookMinutes: 40,
    servings: 8,
    calories: 310,
    protein: 9,
    carbs: 48,
    fat: 9,
    author: 'Recipe Kitchen',
    daysAgo: 11,
    ingredients: ingredients([
      ['Rolled oats', '300 g', 'Pantry', 4.18],
      ['Blueberries', '300 g', 'Produce', 4.62],
      ['Milk', '600 ml', 'Dairy', 3.48],
      ['Eggs', '2', 'Dairy', 3.96],
      ['Maple syrup', '80 ml', 'Pantry', 7.48],
      ['Cinnamon', '1 tsp', 'Pantry', 2.12],
    ]),
  },
  {
    id: 5,
    title: 'Charred tomato and bread salad',
    description:
      'Three ingredients doing considerably more work than they should be able to. Make it in August or do not make it at all.',
    imageUrl: '',
    category: 'Salad',
    dietary: ['Vegetarian', 'Dairy-free'],
    prepMinutes: 12,
    cookMinutes: 8,
    servings: 4,
    calories: 260,
    protein: 6,
    carbs: 31,
    fat: 13,
    author: 'Recipe Kitchen',
    daysAgo: 14,
    ingredients: ingredients([
      ['Ripe tomatoes', '800 g', 'Produce', 5.32],
      ['Sourdough loaf', 'half, torn', 'Bakery', 4.48],
      ['Red onion', '1, thinly sliced', 'Produce', 0.94],
      ['Basil', 'large handful', 'Produce', 2.68],
      ['Red wine vinegar', '2 tbsp', 'Pantry', 3.14],
      ['Olive oil', '4 tbsp', 'Pantry', 6.42],
    ]),
  },
  {
    id: 6,
    title: 'Slow braised beef ragu',
    description:
      'Four hours of doing almost nothing, then the best thing you have eaten all month. Make double and freeze half.',
    imageUrl: '',
    category: 'Dinner',
    dietary: ['Dairy-free'],
    prepMinutes: 25,
    cookMinutes: 215,
    servings: 6,
    calories: 710,
    protein: 46,
    carbs: 54,
    fat: 34,
    author: 'Recipe Kitchen',
    daysAgo: 18,
    ingredients: ingredients([
      ['Beef chuck', '1.4 kg', 'Meat', 18.62],
      ['Tinned tomatoes', '2 × 400 g', 'Pantry', 3.16],
      ['Carrots', '3', 'Produce', 1.88],
      ['Celery', '3 stalks', 'Produce', 2.44],
      ['Onions', '2', 'Produce', 1.68],
      ['Red wine', '250 ml', 'Pantry', 9.98],
      ['Pappardelle', '500 g', 'Pantry', 3.44],
    ]),
  },
  {
    id: 7,
    title: 'Crispy chickpea bowls',
    description:
      'The lunch you will actually look forward to. Roast the chickpeas until they rattle in the pan and everything else falls into place.',
    imageUrl: '',
    category: 'Lunch',
    dietary: ['Vegan', 'Vegetarian', 'Dairy-free'],
    prepMinutes: 10,
    cookMinutes: 30,
    servings: 4,
    calories: 430,
    protein: 17,
    carbs: 58,
    fat: 15,
    author: 'Recipe Kitchen',
    daysAgo: 21,
    ingredients: ingredients([
      ['Chickpeas', '2 × 400 g tins', 'Pantry', 2.36],
      ['Sweet potatoes', '2 large', 'Produce', 3.24],
      ['Baby spinach', '150 g', 'Produce', 3.68],
      ['Tahini', '3 tbsp', 'Pantry', 6.94],
      ['Lemon', '1', 'Produce', 0.98],
      ['Smoked paprika', '2 tsp', 'Pantry', 2.44],
    ]),
  },
  {
    id: 8,
    title: 'Brown butter banana bread',
    description:
      'Brown the butter. It is four extra minutes and it is the entire difference between fine banana bread and the one people ask about.',
    imageUrl: '',
    category: 'Sweet',
    dietary: ['Vegetarian'],
    prepMinutes: 20,
    cookMinutes: 55,
    servings: 10,
    calories: 355,
    protein: 5,
    carbs: 47,
    fat: 17,
    author: 'Recipe Kitchen',
    daysAgo: 26,
    ingredients: ingredients([
      ['Overripe bananas', '4', 'Produce', 1.72],
      ['Butter', '170 g', 'Dairy', 4.98],
      ['Plain flour', '250 g', 'Pantry', 3.28],
      ['Brown sugar', '180 g', 'Pantry', 2.86],
      ['Eggs', '2', 'Dairy', 3.96],
      ['Vanilla extract', '2 tsp', 'Pantry', 5.44],
    ]),
  },
  {
    id: 9,
    title: 'Ten minute sesame noodles',
    description:
      'For the nights when cooking is not happening. Boil noodles, stir a sauce, eat standing up. No apologies.',
    imageUrl: '',
    category: 'Snack',
    dietary: ['Vegan', 'Vegetarian', 'Dairy-free'],
    prepMinutes: 5,
    cookMinutes: 5,
    servings: 2,
    calories: 480,
    protein: 14,
    carbs: 66,
    fat: 18,
    author: 'Recipe Kitchen',
    daysAgo: 30,
    ingredients: ingredients([
      ['Egg noodles', '200 g', 'Pantry', 2.78],
      ['Tahini', '2 tbsp', 'Pantry', 6.94],
      ['Soy sauce', '2 tbsp', 'Pantry', 2.86],
      ['Rice vinegar', '1 tbsp', 'Pantry', 2.64],
      ['Spring onions', '3', 'Produce', 1.32],
      ['Chilli oil', '1 tbsp', 'Pantry', 4.86],
    ]),
  },
];

const instructionsById: Record<number, string[]> = {
  1: [
    'Bring a large pot of well-salted water to the boil and cook the spaghetti one minute short of the packet time.',
    'While it cooks, heat the olive oil in a wide pan over high heat and add the mushrooms in a single layer. Leave them alone for four minutes so they brown rather than steam.',
    'Add the garlic and cook for another minute until fragrant but not coloured.',
    'Pour in the cream, let it bubble and thicken slightly, then season well with salt and plenty of black pepper.',
    'Drain the pasta, reserving a mug of the cooking water, and toss it through the sauce with the parmesan. Loosen with pasta water until it coats every strand.',
    'Finish with chopped parsley and more parmesan at the table.',
  ],
  2: [
    'Heat the oven to 200°C. Pat the chicken completely dry — this is what gets you crisp skin.',
    'Rub the bird all over with olive oil and salt, then stuff the cavity with the lemon halves, garlic, thyme, and rosemary.',
    'Roast for 55 minutes, basting once at the halfway mark.',
    'Check that the juices run clear at the thickest part of the thigh. If not, give it another ten minutes.',
    'Rest the chicken for 15 minutes before carving. Do not skip this.',
    'Spoon the pan juices over everything as you serve.',
  ],
  3: [
    'Whisk the maple syrup, soy sauce, and Dijon together in a small bowl.',
    'Heat a heavy pan over medium-high and sear the salmon skin-side down for six minutes without moving it.',
    'Flip the fillets, pour in the glaze, and cook for another four minutes, spooning the sauce over as it thickens.',
    'Steam or blanch the broccolini for three minutes until just tender and still bright.',
    'Serve the salmon over the greens with the pan glaze poured across and sesame seeds scattered on top.',
  ],
  4: [
    'Heat the oven to 180°C and butter a medium baking dish.',
    'Whisk the milk, eggs, maple syrup, and cinnamon together until smooth.',
    'Stir in the oats, then fold through two-thirds of the blueberries.',
    'Pour into the dish, scatter the remaining berries over the top, and bake for 40 minutes until set and golden at the edges.',
    'Cool for ten minutes before cutting. It keeps in the fridge for four days.',
  ],
  5: [
    'Heat a dry griddle or heavy pan until it is properly hot.',
    'Halve the tomatoes and char them cut-side down for three minutes until blistered but still holding together.',
    'Toast the torn bread in the same pan with a little olive oil until crisp at the edges and chewy in the middle.',
    'Toss the tomatoes, bread, and red onion with the vinegar and remaining olive oil. Season generously.',
    'Let it sit for ten minutes so the bread drinks up the juices, then tear the basil over just before serving.',
  ],
  6: [
    'Heat the oven to 150°C. Cut the beef into large chunks, season heavily, and brown in batches in a heavy casserole. Do not crowd the pan.',
    'Set the beef aside and soften the finely chopped onions, carrots, and celery in the same pot for ten minutes.',
    'Pour in the red wine and scrape everything off the bottom of the pot. Let it reduce by half.',
    'Return the beef, add the tomatoes, cover, and put it in the oven for three and a half hours.',
    'Shred the meat directly in the sauce with two forks and check the seasoning.',
    'Cook the pappardelle, then toss it through the ragu with a splash of pasta water.',
  ],
  7: [
    'Heat the oven to 220°C. Drain and thoroughly dry the chickpeas — wet chickpeas will never crisp.',
    'Toss the chickpeas with oil and smoked paprika and spread on one tray. Cube the sweet potatoes and put them on another.',
    'Roast both for 30 minutes, shaking the chickpea tray twice.',
    'Whisk the tahini with lemon juice and enough water to make a pourable dressing. Season it well.',
    'Build the bowls with spinach at the base, then sweet potato and chickpeas, and pour the dressing over.',
  ],
  8: [
    'Melt the butter in a light-coloured pan over medium heat and keep cooking until it smells nutty and the solids turn golden brown. Take it off the heat immediately.',
    'Heat the oven to 175°C and line a loaf tin.',
    'Mash the bananas, then whisk in the brown butter, sugar, eggs, and vanilla.',
    'Fold in the flour with a pinch of salt, stopping the moment it disappears. Overmixing makes it tough.',
    'Bake for 55 minutes until a skewer comes out with a few damp crumbs.',
    'Cool in the tin for 15 minutes before turning out.',
  ],
  9: [
    'Cook the noodles according to the packet, then drain and rinse briefly under cold water.',
    'Whisk the tahini, soy sauce, and rice vinegar together with two tablespoons of hot water until smooth and pourable.',
    'Toss the noodles through the sauce until every strand is coated.',
    'Top with sliced spring onions and as much chilli oil as you can handle.',
  ],
};

export const demoRecipes: Recipe[] = seeds.map(({ daysAgo, ...seed }) => {
  const cost = wholeItemCost(seed.ingredients);
  return {
    ...seed,
    instructions: instructionsById[seed.id] ?? [],
    wholeItemCost: cost,
    mealPrice: Math.round((cost / seed.servings) * 100) / 100,
    createdAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
  };
});
