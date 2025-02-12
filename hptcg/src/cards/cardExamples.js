import { SpellCard, LessonCard, CreatureCard } from './Card.js';

// Example cards
export const exampleCards = {
    // Lesson card example
    lumos: new LessonCard({
        id: 'lesson_001',
        name: 'Charms Lesson',
        imageUrl: 'assets/cards/charms_lesson.jpg',
        rarity: 'common',
        lessonType: 'charms'
    }),

    // Spell card example
    expelliarmus: new SpellCard({
        id: 'spell_001',
        name: 'Expelliarmus',
        imageUrl: 'assets/cards/expelliarmus.jpg',
        rarity: 'uncommon',
        lessonCost: { charms: 2 },
        effect: 'Disarm target character or creature',
        damage: 20
    }),

    // Creature card example
    hippogriff: new CreatureCard({
        id: 'creature_001',
        name: 'Hippogriff',
        imageUrl: 'assets/cards/hippogriff.jpg',
        rarity: 'rare',
        lessonCost: { creatures: 3 },
        power: 30,
        health: 40,
        abilities: ['Flying']
    })
}; 