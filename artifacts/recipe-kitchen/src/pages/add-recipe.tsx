import { useState } from 'react';
import { ArrowLeft, Check, ChevronDown, ImagePlus, Minus, Plus, Save, ShoppingBasket, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useLocation } from 'wouter';
import { getGetRecipeSummaryQueryKey, getListRecipesQueryKey, useCreateRecipe, type Ingredient, type RecipeInput } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const blankIngredient = (): Ingredient => ({ name: '', quantity: '', aisle: 'Pantry', shoppingUrl: '', price: 0 });
const defaultValues: RecipeInput = { title: '', description: '', imageUrl: '', category: 'Dinner', dietary: [], prepMinutes: 15, cookMinutes: 25, servings: 4, calories: 450, protein: 20, carbs: 45, fat: 18, ingredients: [], instructions: [], author: '' };
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function AddRecipe() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<RecipeInput>({ defaultValues });
  const createRecipe = useCreateRecipe();
  const [ingredients, setIngredients] = useState<Ingredient[]>([blankIngredient(), blankIngredient()]);
  const [instructions, setInstructions] = useState<string[]>(['', '']);
  const [dietary, setDietary] = useState<string[]>([]);
  const wholeItemCost = ingredients.reduce((total, ingredient) => total + (Number(ingredient.price) || 0), 0);
  const perServingCost = wholeItemCost / Math.max(1, Number(form.watch('servings')) || 1);

  const updateIngredient = (index: number, key: keyof Ingredient, value: string) => setIngredients((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  const updateInstruction = (index: number, value: string) => setInstructions((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  const toggleDiet = (item: string) => setDietary((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
  const onSubmit = (values: RecipeInput) => {
    const cleanIngredients = ingredients.filter((item) => item.name.trim()).map((item) => ({ ...item, name: item.name.trim(), quantity: item.quantity.trim() || 'to taste', price: Number(item.price) || 0 }));
    const cleanInstructions = instructions.map((item) => item.trim()).filter(Boolean);
    if (cleanIngredients.length === 0 || cleanInstructions.length === 0) {
      toast({ title: 'A few details are missing', description: 'Add at least one ingredient and one instruction.', variant: 'destructive' });
      return;
    }
    const payload: RecipeInput = { ...values, title: values.title.trim(), description: values.description.trim(), author: values.author.trim(), dietary, ingredients: cleanIngredients, instructions: cleanInstructions, prepMinutes: Number(values.prepMinutes), cookMinutes: Number(values.cookMinutes), servings: Number(values.servings), calories: Number(values.calories), protein: Number(values.protein), carbs: Number(values.carbs), fat: Number(values.fat) };
    createRecipe.mutate({ data: payload }, {
      onSuccess: (recipe) => {
        queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecipeSummaryQueryKey() });
        toast({ title: 'Recipe added to the kitchen', description: 'That one is going to be a keeper.' });
        setLocation(`/recipes/${recipe.id}`);
      },
      onError: () => toast({ title: 'Could not add recipe', description: 'Check your details and try again.', variant: 'destructive' }),
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-8 lg:px-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary" data-testid="link-add-back"><ArrowLeft className="h-4 w-4" /> Back to library</Link>
      <div className="mt-10 max-w-2xl animate-rise"><p className="ribbon-flat inline-flex items-center gap-2 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]"><Sparkles className="h-3.5 w-3.5" /> Your turn at the counter</p><h1 className="mt-4 text-[clamp(2rem,4.5vw,3rem)] tracking-normal font-light">Bring your best<br /><em className="font-normal text-primary">to the table.</em></h1><p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">Share the dish you make without measuring, the weeknight save, or the one your friends always ask for.</p></div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-12 space-y-8">
          <section className="border border-card-border bg-card p-5 panel-shadow sm:p-8" data-testid="section-recipe-basics">
            <div className="mb-7 flex items-start justify-between"><div><p className="ribbon-flat inline-block px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]">01 · The idea</p><h2 className="mt-3 text-[26px]">Start with the good part</h2></div><div className="hidden h-11 w-11 items-center justify-center bg-secondary sm:flex"><ImagePlus className="h-5 w-5 text-primary" /></div></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold sm:col-span-2">Recipe title <span className="text-primary">*</span><Input {...form.register('title', { required: 'Give your recipe a name' })} placeholder="e.g. Sunday night tomato pasta" className="mt-2 bg-card" data-testid="input-recipe-title" />{form.formState.errors.title && <span className="mt-1 block text-xs text-destructive">{form.formState.errors.title.message}</span>}</label>
              <label className="text-sm font-semibold sm:col-span-2">A short description <Textarea {...form.register('description', { required: 'Add a short description' })} placeholder="What makes this one worth making?" className="mt-2 min-h-24 bg-card" data-testid="textarea-recipe-description" />{form.formState.errors.description && <span className="mt-1 block text-xs text-destructive">{form.formState.errors.description.message}</span>}</label>
              <label className="text-sm font-semibold">Category<div className="relative mt-2"><select {...form.register('category')} className="h-10 w-full appearance-none rounded-md border border-input bg-card px-3 pr-9 text-sm outline-none focus:ring-1 focus:ring-ring" data-testid="select-recipe-category"><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Sweet</option><option>Snack</option><option>Drink</option></select><ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground" /></div></label>
              <label className="text-sm font-semibold">Your name <span className="text-primary">*</span><Input {...form.register('author', { required: 'Add your name' })} placeholder="How should we credit you?" className="mt-2 bg-card" data-testid="input-recipe-author" /></label>
              <label className="text-sm font-semibold sm:col-span-2">Image URL <span className="font-normal text-muted-foreground">(optional)</span><Input {...form.register('imageUrl')} placeholder="https://..." className="mt-2 bg-card" data-testid="input-recipe-image" /></label>
            </div>
          </section>

          <section className="border border-card-border bg-card p-5 panel-shadow sm:p-8" data-testid="section-ingredients">
            <div className="mb-7 flex items-start justify-between"><div><p className="ribbon-flat inline-block px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]">02 · The shop</p><h2 className="mt-3 text-[26px]">What goes in?</h2><p className="mt-2 text-sm text-muted-foreground">Enter the estimated Walmart price for each whole package or item. We’ll calculate the recipe cost per serving.</p></div><ShoppingBasket className="mt-1 h-6 w-6 text-primary" /></div>
            <div className="mb-6 grid grid-cols-2 gap-3 bg-secondary/45 p-4 sm:max-w-md">
              <div><p className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">1 serving</p><p className="mt-1 text-[22px] text-primary">{money.format(perServingCost)}</p></div>
              <div><p className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">Buy whole items</p><p className="mt-1 text-[22px]">{money.format(wholeItemCost)}</p></div>
            </div>
            <div className="space-y-3">{ingredients.map((ingredient, index) => <div key={index} className="grid gap-2 sm:grid-cols-[1.4fr_1fr_0.8fr_0.7fr_auto]"><Input value={ingredient.name} onChange={(event) => updateIngredient(index, 'name', event.target.value)} placeholder="Ingredient" aria-label={`Ingredient ${index + 1} name`} className="bg-card" data-testid={`input-ingredient-name-${index}`} /><Input value={ingredient.quantity} onChange={(event) => updateIngredient(index, 'quantity', event.target.value)} placeholder="Quantity used" aria-label={`Ingredient ${index + 1} quantity used`} className="bg-card" data-testid={`input-ingredient-quantity-${index}`} /><Input value={ingredient.aisle} onChange={(event) => updateIngredient(index, 'aisle', event.target.value)} placeholder="Aisle" aria-label={`Ingredient ${index + 1} aisle`} className="bg-card" data-testid={`input-ingredient-aisle-${index}`} /><Input value={ingredient.price} onChange={(event) => updateIngredient(index, 'price', event.target.value)} type="number" min="0" step="0.01" placeholder="Whole item $" aria-label={`Ingredient ${index + 1} whole item Walmart price`} className="bg-card" data-testid={`input-ingredient-price-${index}`} /><button type="button" onClick={() => setIngredients((current) => current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current)} className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive" aria-label={`Remove ingredient ${index + 1}`} data-testid={`button-remove-ingredient-${index}`}><Minus className="h-4 w-4" /></button></div>)}</div>
            <Button type="button" variant="outline" size="sm" onClick={() => setIngredients((current) => [...current, blankIngredient()])} className="mt-5" data-testid="button-add-ingredient"><Plus className="h-4 w-4" /> Add ingredient</Button>
          </section>

          <section className="border border-card-border bg-card p-5 panel-shadow sm:p-8" data-testid="section-nutrition"><div className="mb-7"><p className="ribbon-flat inline-block px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]">03 · The balance</p><h2 className="mt-3 text-[26px]">A little context</h2><p className="mt-2 text-sm text-muted-foreground">All nutrition numbers are per serving.</p></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{[['prepMinutes', 'Prep minutes'], ['cookMinutes', 'Cook minutes'], ['servings', 'Servings'], ['calories', 'Calories']].map(([name, label]) => <label key={name} className="text-sm font-semibold">{label}<Input {...form.register(name as keyof RecipeInput, { valueAsNumber: true, min: 0 })} type="number" min="0" className="mt-2 bg-card" data-testid={`input-${name}`} /></label>)}</div><div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">{[['protein', 'Protein (g)'], ['carbs', 'Carbs (g)'], ['fat', 'Fat (g)']].map(([name, label]) => <label key={name} className="text-sm font-semibold">{label}<Input {...form.register(name as keyof RecipeInput, { valueAsNumber: true, min: 0 })} type="number" min="0" className="mt-2 bg-card" data-testid={`input-${name}`} /></label>)}</div><div className="mt-7"><p className="mb-3 text-sm font-semibold">Dietary tags</p><div className="flex flex-wrap gap-2">{['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free'].map((item) => <button type="button" key={item} onClick={() => toggleDiet(item)} className={`border px-3 py-1.5 text-xs transition-colors ${dietary.includes(item) ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary hover:text-primary'}`} data-testid={`button-add-diet-${item.toLowerCase().replace('-', '')}`}>{dietary.includes(item) && <Check className="mr-1 inline h-3 w-3" />}{item}</button>)}</div></div></section>

          <section className="border border-card-border bg-card p-5 panel-shadow sm:p-8" data-testid="section-instructions"><div className="mb-7"><p className="ribbon-flat inline-block px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]">04 · The method</p><h2 className="mt-3 text-[26px]">Tell us how it comes together</h2></div><div className="space-y-3">{instructions.map((instruction, index) => <div className="flex gap-3" key={index}><span className="mt-2 flex h-7 w-7 shrink-0 items-center justify-center bg-primary text-[10px] font-semibold text-primary-foreground">{String(index + 1).padStart(2, '0')}</span><Textarea value={instruction} onChange={(event) => updateInstruction(index, event.target.value)} placeholder={index === 0 ? 'Start with the first thing you do...' : 'Then...'} className="min-h-16 bg-card" aria-label={`Instruction ${index + 1}`} data-testid={`textarea-instruction-${index}`} /><button type="button" onClick={() => setInstructions((current) => current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current)} className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-destructive" aria-label={`Remove instruction ${index + 1}`} data-testid={`button-remove-instruction-${index}`}><Minus className="h-4 w-4" /></button></div>)}</div><Button type="button" variant="outline" size="sm" onClick={() => setInstructions((current) => [...current, ''])} className="mt-5" data-testid="button-add-instruction"><Plus className="h-4 w-4" /> Add step</Button></section>
          <div className="flex flex-col-reverse items-stretch justify-end gap-3 sm:flex-row sm:items-center"><Link href="/" className="rounded-md px-4 py-2 text-center text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground" data-testid="link-cancel-add">Cancel</Link><Button type="submit" size="lg" disabled={createRecipe.isPending} className="px-7" data-testid="button-submit-recipe"><Save className="h-4 w-4" /> {createRecipe.isPending ? 'Adding to kitchen...' : 'Add to the kitchen'}</Button></div>
        </form>
      </Form>
    </div>
  );
}