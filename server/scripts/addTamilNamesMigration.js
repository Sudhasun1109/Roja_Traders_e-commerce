const db = require('../config/db');

const productsMapping = [
  { id: 1, tamil: 'கல் உப்பு – முதல் தரம்' },
  { id: 2, tamil: 'கல் உப்பு – இரண்டாம் தரம்' },
  { id: 3, tamil: 'கல் உப்பு – 1 கிலோ' },
  { id: 4, tamil: 'தூள் உப்பு – 1 கிலோ' },
  { id: 5, tamil: 'தூள் உப்பு – ½ கிலோ' },
  { id: 6, tamil: 'கோலப்பொடி' },
  { id: 7, tamil: 'நைஸ் கோலப்பொடி' },
  { id: 8, tamil: 'வண்ணக் கோலப்பொடி' },
  { id: 9, tamil: 'செம்மண் கோலப்பொடி' },
  { id: 10, tamil: 'மஞ்சள் Liquid' },
  { id: 11, tamil: 'பித்தபாரி – 50 கிராம்' },
  { id: 12, tamil: 'பித்தபாரி – 150 கிராம்' },
  { id: 13, tamil: 'பித்தபாரி – 250 கிராம்' },
  { id: 14, tamil: 'பித்தபாரி Liquid' },
  { id: 15, tamil: 'சுண்ணாம்பு – 1 கிலோ' },
  { id: 16, tamil: 'துணி நீலம்' },
  { id: 17, tamil: 'வெள்ளை சேமியா – சிறப்பு வகை' },
  { id: 18, tamil: 'ராகி சேமியா' },
  { id: 19, tamil: 'கம்பு சேமியா' },
  { id: 20, tamil: 'தக்காளி சேமியா' },
  { id: 21, tamil: 'மசாலா நூடுல்ஸ்' },
  { id: 22, tamil: 'சாதாரண நூடுல்ஸ்' },
  { id: 23, tamil: 'அரிசி சேவை' },
  { id: 24, tamil: 'கஞ்சி வடகம்' },
  { id: 25, tamil: 'கார வடகம்' },
  { id: 26, tamil: 'அப்பளம்' },
  { id: 27, tamil: 'வெங்காய வடகம்' },
  { id: 28, tamil: 'துணி துவைக்கும் தூள் – 1 கிலோ' },
  { id: 29, tamil: 'துணி துவைக்கும் தூள் – ½ கிலோ' },
  { id: 30, tamil: 'துணி துவைக்கும் தூள் – 100 கிராம்' },
  { id: 31, tamil: 'துணி துவைக்கும் Liquid – 1 லிட்டர்' },
  { id: 32, tamil: 'துணி துவைக்கும் Liquid – ½ லிட்டர்' },
  { id: 33, tamil: 'துணி துவைக்கும் Liquid – 100 மில்லி' },
  { id: 34, tamil: 'டிடர்ஜென்ட் சோப்பு – ₹10' },
  { id: 35, tamil: 'அரசன் டிடர்ஜென்ட் சோப்பு – ₹25' },
  { id: 36, tamil: 'பாத்திரம் கழுவும் சோப்பு – ₹5' },
  { id: 37, tamil: 'பாத்திரம் கழுவும் சோப்பு – ₹10' },
  { id: 38, tamil: 'பாத்திரம் கழுவும் Liquid – ₹20' },
  { id: 39, tamil: 'பாத்திரம் கழுவும் தூள் – ½ கிலோ' },
  { id: 40, tamil: 'எஃகு நார்' },
  { id: 41, tamil: 'பச்சை நார் – ₹10' },
  { id: 42, tamil: 'பச்சை நார் – ₹20' },
  { id: 43, tamil: 'கட்டை பிரஷ்' },
  { id: 44, tamil: 'பிளீச்சிங் பவுடர்' },
  { id: 45, tamil: 'சோடா பவுடர்' },
  { id: 46, tamil: 'நரம்பு நார்' }
];

const categoriesMapping = [
  { id: 1, tamil: 'உப்பு வகைகள்' },
  { id: 2, tamil: 'கோலப்பொடி வகைகள்' },
  { id: 3, tamil: 'பித்தபாரி மற்றும் சுத்தம் செய்யும் பொருட்கள்' },
  { id: 4, tamil: 'வீட்டு உபயோக பொருட்கள்' },
  { id: 5, tamil: 'சேமியா மற்றும் நூடுல்ஸ்' },
  { id: 6, tamil: 'பாரம்பரிய உணவுப் பொருட்கள்' },
  { id: 7, tamil: 'துணி துவைக்கும் பொருட்கள்' },
  { id: 8, tamil: 'பாத்திரம் கழுவும் பொருட்கள்' },
  { id: 9, tamil: 'சுத்தம் செய்யும் கருவிகள் மற்றும் உபகரணங்கள்' },
  { id: 10, tamil: 'சுத்தம் செய்யும் பொருட்கள்' }
];

async function migrate() {
  try {
    console.log('--- Checking & adding tamil_name columns ---');

    // 1. Check products table
    const [pCols] = await db.query('DESCRIBE products');
    const pHasTamil = pCols.some(c => c.Field === 'tamil_name');
    if (!pHasTamil) {
      await db.query('ALTER TABLE products ADD COLUMN tamil_name VARCHAR(255) NULL AFTER product_name');
      console.log('Added tamil_name column to products table.');
    } else {
      console.log('tamil_name column already exists in products.');
    }

    // 2. Check categories table
    const [cCols] = await db.query('DESCRIBE categories');
    const cHasTamil = cCols.some(c => c.Field === 'tamil_name');
    if (!cHasTamil) {
      await db.query('ALTER TABLE categories ADD COLUMN tamil_name VARCHAR(255) NULL AFTER category_name');
      console.log('Added tamil_name column to categories table.');
    } else {
      console.log('tamil_name column already exists in categories.');
    }

    // 3. Update products with Tamil names
    console.log('--- Updating product Tamil names ---');
    for (const item of productsMapping) {
      await db.query('UPDATE products SET tamil_name = ? WHERE id = ?', [item.tamil, item.id]);
    }
    console.log(`Updated ${productsMapping.length} products with Tamil names.`);

    // 4. Update categories with Tamil names
    console.log('--- Updating category Tamil names ---');
    for (const cat of categoriesMapping) {
      await db.query('UPDATE categories SET tamil_name = ? WHERE id = ?', [cat.tamil, cat.id]);
    }
    console.log(`Updated ${categoriesMapping.length} categories with Tamil names.`);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();
