import { db } from '../src/database/connection.js';
import { products } from '../src/database/schemas/products.js';
import dotenv from 'dotenv';

dotenv.config();

// Firecracker name parts
const prefixes = [
  "Sky", "Thunder", "Sparkler", "Rocket", "Mega", "Atomic", "Dragon", "Golden",
  "Crystal", "Star", "Flash", "Fire", "Blaze", "Power", "Electric", "Bomb", "Color",
  "Boom", "Glow", "Inferno", "Crackling", "Flare", "Sonic", "Wild", "Phantom"
];

const suffixes = [
  "Blaster", "Storm", "Rain", "Burst", "Boom", "Rocket", "Strike", "Popper", "Fury",
  "Flame", "Whirl", "Charge", "Snap", "Nova", "Rush", "Fire", "Twister", "Bolt",
  "Thunder", "Flash", "Scream", "Wheel", "Dance", "Surge", "Star"
];

// Utility to generate random price between min and max
const randomPrice = (min, max) => (Math.random() * (max - min) + min).toFixed(2);

// Generate product code like FC-1, FC-2
const generateProductCode = (index) => `FC-${index + 1}`;

// Generate unique firecracker names
const generateUniqueFirecrackerNames = (count) => {
  const names = new Set();

  while (names.size < count) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    names.add(`${prefix} ${suffix}`);
  }

  return Array.from(names);
};

// Main function
async function generateProducts() {
  console.log('Starting to generate 300 firecracker products...');
  
  try {
    const productValues = [];
    const uniqueNames = generateUniqueFirecrackerNames(300);

    for (let i = 0; i < 300; i++) {
      const proCode = generateProductCode(i);
      const productName = uniqueNames[i];
      const price = randomPrice(1.99, 199.99);

      productValues.push({
        proCode,
        productName,
        price,
        description: `Exciting firework called ${productName}!`,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      if ((i + 1) % 50 === 0) {
        console.log(`Generated ${i + 1} products...`);
      }
    }

    // Batch insert
    for (let i = 0; i < productValues.length; i += 50) {
      const batch = productValues.slice(i, i + 50);
      await db.insert(products).values(batch);
      console.log(`Inserted products ${i + 1} to ${Math.min(i + 50, productValues.length)}`);
    }

    console.log('Successfully generated and inserted 300 unique firecracker products!');
  } catch (error) {
    console.error('Error generating products:', error);
  } finally {
    process.exit(0);
  }
}

// Run
generateProducts();
