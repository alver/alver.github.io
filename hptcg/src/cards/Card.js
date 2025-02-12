// Base Card class that all card types will inherit from
export class Card {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type;  // 'lesson', 'spell', 'creature', 'item', 'character'
        this.imageUrl = data.imageUrl;
        this.rarity = data.rarity; // 'common', 'uncommon', 'rare'
        this.lessonCost = data.lessonCost || {}; // { charms: 2, potions: 1 } etc.
    }
}

// Lesson Cards provide resources to play other cards
export class LessonCard extends Card {
    constructor(data) {
        super({ ...data, type: 'lesson' });
        this.lessonType = data.lessonType; // 'charms', 'transfiguration', 'potions', 'quidditch', 'creatures'
        this.providesAmount = data.providesAmount || 1;
    }
}

// Spell Cards represent magical spells
export class SpellCard extends Card {
    constructor(data) {
        super({ ...data, type: 'spell' });
        this.effect = data.effect;
        this.damage = data.damage;
        this.healing = data.healing;
    }
}

// Creature Cards can attack and defend
export class CreatureCard extends Card {
    constructor(data) {
        super({ ...data, type: 'creature' });
        this.power = data.power;         // Attack power
        this.health = data.health;       // Health points
        this.abilities = data.abilities || []; // Special abilities
    }
}

// Character Cards represent wizards and witches
export class CharacterCard extends Card {
    constructor(data) {
        super({ ...data, type: 'character' });
        this.health = data.health;
        this.abilities = data.abilities || [];
        this.house = data.house; // 'Gryffindor', 'Slytherin', 'Ravenclaw', 'Hufflepuff'
    }
}

// Item Cards represent magical items and artifacts
export class ItemCard extends Card {
    constructor(data) {
        super({ ...data, type: 'item' });
        this.effect = data.effect;
        this.durability = data.durability;
        this.equipTarget = data.equipTarget; // 'character', 'creature', or null
    }
} 