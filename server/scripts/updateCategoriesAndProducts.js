const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const categoriesData = [
  { id: 1, name: 'Salt Products', desc: 'Premium rock salt, fine powdered salt, and crystal sea salt for culinary and daily household needs.' },
  { id: 2, name: 'Rangoli Powders', desc: 'Traditional bright white kolam powder, fine rangoli powder, vibrant festival color powders, and red earth powder.' },
  { id: 3, name: 'Cleaning Chemicals', desc: 'Multi-purpose cleaning liquids, metal polish, lime powder, and specialty fabric bluing agents.' },
  { id: 4, name: 'Household Essentials', desc: 'Essential daily household supplies, provisions, and specialty kitchen ingredients.' },
  { id: 5, name: 'Vermicelli and Noodles', desc: 'Traditional roasted vermicelli, healthy millet semiya varieties, masala noodles, and hakka noodles.' },
  { id: 6, name: 'Traditional Food Products', desc: 'Handcrafted rice sevai, crispy sun-dried porridge fryums, spicy vathal, and traditional papad.' },
  { id: 7, name: 'Laundry Products', desc: 'Powerful detergent washing powders, fabric care liquid detergents, and heavy-duty laundry soaps.' },
  { id: 8, name: 'Dishwashing Products', desc: 'Grease-cutting dishwashing soaps, concentrated liquid cleaners, and utensil scouring powders.' },
  { id: 9, name: 'Cleaning Tools and Accessories', desc: 'Steel scrubbers, green scouring pads, wooden brushes, coir scrubbers, bleaching powder, and washing soda.' },
  { id: 10, name: 'Household Cleaning Supplies', desc: 'General cleaning supplies, hygiene maintenance tools, and sanitization essentials.' }
];

const productsData = [
  // 1. Salt Products (Category 1)
  {
    name: 'Rock Salt – First Quality',
    desc: 'Unrefined, pure natural rock crystal salt sourced from traditional coastal pans. Rich in essential natural trace minerals, perfect for cooking, pickling, and daily culinary seasoning.',
    price: 25.00,
    discount_price: 30.00,
    category_id: 1,
    sku: 'SALT-RCK-01',
    stock: 50,
    specs: { 'Type': 'Crystal Rock Salt', 'Grade': 'First Quality Grade A', 'Purity': '100% Natural', 'Weight': '1 kg' },
    image: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Rock Salt – Second Quality',
    desc: 'Natural medium crystal salt ideal for bulk cooking, curing, water softening, and traditional preservation requirements.',
    price: 18.00,
    discount_price: 22.00,
    category_id: 1,
    sku: 'SALT-RCK-02',
    stock: 60,
    specs: { 'Type': 'Natural Rock Salt', 'Grade': 'Standard Quality', 'Usage': 'Cooking & Preserving', 'Weight': '1 kg' },
    image: 'https://images.unsplash.com/photo-1626078299034-7631f031c260?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Rock Salt – 1 kg',
    desc: 'Hygienically cleaned and packed 1 kg bag of crystal sea rock salt. Contains natural sodium chloride with zero chemical additives.',
    price: 22.00,
    discount_price: 25.00,
    category_id: 1,
    sku: 'SALT-RCK-1KG',
    stock: 75,
    specs: { 'Pack Size': '1 kg', 'Form': 'Crystal Crystals', 'Shelf Life': '24 Months' },
    image: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Powdered Salt – 1 kg',
    desc: 'Free-flowing iodized refined table salt with micro-fine crystals for uniform taste distribution in gravies, snacks, and baking.',
    price: 20.00,
    discount_price: 24.00,
    category_id: 1,
    sku: 'SALT-PWD-1KG',
    stock: 90,
    specs: { 'Type': 'Iodized Refined Salt', 'Form': 'Fine Powder', 'Pack Size': '1 kg', 'Iodine Fortified': 'Yes' },
    image: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Powdered Salt – 500 g',
    desc: 'Compact 500g pouch of free-flowing iodized table salt. Convenient moisture-proof packaging for dining table shakers and kitchen racks.',
    price: 12.00,
    discount_price: 15.00,
    category_id: 1,
    sku: 'SALT-PWD-500G',
    stock: 80,
    specs: { 'Type': 'Iodized Refined Salt', 'Form': 'Fine Powder', 'Pack Size': '500 g' },
    image: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=800&auto=format&fit=crop&q=80'
  },

  // 2. Rangoli Powders (Category 2)
  {
    name: 'Rangoli Powder',
    desc: 'Classic bright white marble-dust kolam powder for everyday doorstep drawings, geometric designs, and spiritual ceremonies.',
    price: 30.00,
    discount_price: 35.00,
    category_id: 2,
    sku: 'RANG-STD-01',
    stock: 45,
    specs: { 'Color': 'Bright White', 'Form': 'Powder', 'Usage': 'Doorstep Kolam / Rangoli', 'Weight': '1 kg' },
    image: 'https://images.unsplash.com/photo-1576487248805-cf45f6bcc67f?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Fine Rangoli Powder',
    desc: 'Silky smooth, extra-fine filtered rangoli powder that glides effortlessly through fingers for intricate festival art and freehand patterns.',
    price: 40.00,
    discount_price: 45.00,
    category_id: 2,
    sku: 'RANG-FINE-02',
    stock: 50,
    specs: { 'Texture': 'Ultra Fine Micro-Grit', 'Color': 'Brilliant Snow White', 'Weight': '1 kg' },
    image: 'https://images.unsplash.com/photo-1576487248805-cf45f6bcc67f?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Coloured Rangoli Powder',
    desc: 'Assorted collection of eye-catching, vibrant rangoli colors including deep red, yellow, green, peacock blue, and pink for Diwali, Pongal, and festive decorations.',
    price: 60.00,
    discount_price: 75.00,
    category_id: 2,
    sku: 'RANG-CLR-03',
    stock: 35,
    specs: { 'Colors': 'Assorted Multi-Colors', 'Quantity': '5 Color Pouches', 'Features': 'Non-toxic & Bright' },
    image: 'https://images.unsplash.com/photo-1608248597359-20a28f869584?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Red Earth Powder',
    desc: 'Traditional Semmannu / Kaavi red earth border powder used to outline holy kolams, threshold borders, and temple courtyard patterns.',
    price: 35.00,
    discount_price: 40.00,
    category_id: 2,
    sku: 'RANG-RED-04',
    stock: 40,
    specs: { 'Traditional Name': 'Semmannu / Kaavi Powder', 'Color': 'Terracotta Red', 'Weight': '500 g' },
    image: 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=800&auto=format&fit=crop&q=80'
  },

  // 3. Cleaning Chemicals (Category 3)
  {
    name: 'Yellow Cleaning Liquid',
    desc: 'Heavy-duty pine and citrus infused yellow surface cleaning liquid. Cuts through stubborn grease, grime, and floor stains with long-lasting fragrance.',
    price: 45.00,
    discount_price: 55.00,
    category_id: 3,
    sku: 'CHEM-YEL-01',
    stock: 30,
    specs: { 'Form': 'Liquid Concentrate', 'Fragrance': 'Pine Citrus', 'Volume': '500 ml', 'Usage': 'Floors, Tiles & Counters' },
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Pithapari – 50 g',
    desc: 'Specially formulated brass, copper, and bronze cleaning powder. Restores brilliant temple-like mirror shine in minutes without scratching.',
    price: 25.00,
    discount_price: 30.00,
    category_id: 3,
    sku: 'PITH-PWD-50G',
    stock: 40,
    specs: { 'Suitable For': 'Brass, Copper, Bronze & Silver', 'Form': 'Powder', 'Pack Weight': '50 g' },
    image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Pithapari – 150 g',
    desc: 'Economy size brass and vessel cleaning powder for traditional pooja utensils, lamps, brass vessels, and antique metalware.',
    price: 60.00,
    discount_price: 70.00,
    category_id: 3,
    sku: 'PITH-PWD-150G',
    stock: 35,
    specs: { 'Suitable For': 'Copper & Brass Utensils', 'Pack Weight': '150 g', 'Action': 'Instant Oxidation Removal' },
    image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Pithapari – 250 g',
    desc: 'Family value pack of traditional metal shining powder. Gently cleans tarnished metals with natural cleansing agents.',
    price: 95.00,
    discount_price: 110.00,
    category_id: 3,
    sku: 'PITH-PWD-250G',
    stock: 25,
    specs: { 'Pack Weight': '250 g Value Pack', 'Application': 'Pooja Utensils & Metalware' },
    image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Pithapari Liquid',
    desc: 'Easy-to-use liquid metal polish. No messy scrubbing required; just apply with cloth or sponge and rinse for dazzling metal brilliance.',
    price: 75.00,
    discount_price: 90.00,
    category_id: 3,
    sku: 'PITH-LIQ-250ML',
    stock: 28,
    specs: { 'Volume': '250 ml', 'Form': 'Liquid Emulsion', 'Shine Duration': 'Long-Lasting Tarnish Protection' },
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Lime Powder – 1 kg',
    desc: 'High-purity slaked lime / calcium hydroxide powder suitable for household sanitization, whitewash, water purification, and pest deterrence.',
    price: 30.00,
    discount_price: 38.00,
    category_id: 3,
    sku: 'CHEM-LIME-1KG',
    stock: 35,
    specs: { 'Grade': 'Industrial & Domestic Grade', 'Form': 'Fine White Powder', 'Weight': '1 kg' },
    image: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Laundry Bluing Agent',
    desc: 'Concentrated liquid fabric bluing solution that restores dazzling whiteness to white cotton shirts, linens, dhotis, and uniforms.',
    price: 35.00,
    discount_price: 42.00,
    category_id: 3,
    sku: 'CHEM-BLUE-100ML',
    stock: 45,
    specs: { 'Form': 'Ultra-Concentrated Liquid Blue', 'Volume': '100 ml', 'Suitable For': 'White Cottons & Linens' },
    image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&auto=format&fit=crop&q=80'
  },

  // 4. Household Essentials / Vermicelli and Noodles (Category 5)
  {
    name: 'White Vermicelli – Special',
    desc: 'Thin roasted wheat flour semiya for delicious sweet payasam / kheer and savory breakfast upma. Non-sticky and cooks in under 5 minutes.',
    price: 45.00,
    discount_price: 52.00,
    category_id: 5,
    sku: 'VERM-WHT-SPEC',
    stock: 40,
    specs: { 'Base': 'Premium Roasted Wheat Semolina', 'Weight': '400 g', 'Cook Time': '4-5 Minutes' },
    image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Ragi Vermicelli',
    desc: 'Nutrient-dense finger millet (Ragi) vermicelli packed with dietary fiber, iron, and calcium. Healthy whole-grain breakfast option.',
    price: 55.00,
    discount_price: 65.00,
    category_id: 5,
    sku: 'VERM-RAGI-400G',
    stock: 35,
    specs: { 'Grain': '100% Finger Millet (Ragi)', 'Weight': '400 g', 'Dietary': 'High Fiber & Iron' },
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Pearl Millet Vermicelli',
    desc: 'Wholesome Kambu (Pearl Millet) semiya providing sustained energy and natural cooling properties. Ideal for diabetic-friendly light meals.',
    price: 55.00,
    discount_price: 65.00,
    category_id: 5,
    sku: 'VERM-PEARL-400G',
    stock: 30,
    specs: { 'Grain': 'Pearl Millet (Bajra / Kambu)', 'Weight': '400 g', 'No Preservatives': 'Yes' },
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Tomato Vermicelli',
    desc: 'Flavorful spiced vermicelli pre-blended with sun-ripened tomato powder and traditional south-Indian spices for instant one-pot dinners.',
    price: 60.00,
    discount_price: 70.00,
    category_id: 5,
    sku: 'VERM-TOM-400G',
    stock: 25,
    specs: { 'Flavor': 'Tangy Tomato Masala', 'Weight': '400 g', 'Type': 'Ready to Cook' },
    image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Masala Noodles',
    desc: 'Instant savory noodles paired with an aromatic desi masala seasoning blend. Perfect quick snack satisfying evening hunger pangs.',
    price: 35.00,
    discount_price: 40.00,
    category_id: 5,
    sku: 'NOOD-MAS-01',
    stock: 50,
    specs: { 'Flavor': 'Spicy Desi Masala', 'Cooking Time': '3 Minutes', 'Pack Size': '280 g Pack' },
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Plain Noodles',
    desc: 'Hakka-style plain round noodles made from premium wheat flour. Ready to boil for homemade stir fry noodles, chowmein, or soups.',
    price: 30.00,
    discount_price: 38.00,
    category_id: 5,
    sku: 'NOOD-PLN-02',
    stock: 45,
    specs: { 'Type': 'Hakka Wheat Noodles', 'Form': 'Plain Noodle Cakes', 'Weight': '350 g' },
    image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&auto=format&fit=crop&q=80'
  },

  // 5. Traditional Food Products (Category 6)
  {
    name: 'Rice Sevai',
    desc: 'Traditional instant rice idiyappam sevai strings. Soft, silky, and easy to season with lemon, tamarind, coconut, or vegetable korma.',
    price: 50.00,
    discount_price: 60.00,
    category_id: 6,
    sku: 'TRAD-SEVAI-01',
    stock: 35,
    specs: { 'Ingredient': '100% Fine Rice Flour', 'Weight': '400 g', 'Preparation': 'Steam or Soak' },
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Rice Porridge Fryums',
    desc: 'Crisp sun-dried Koozh Vadam crafted from fermented rice porridge and cumin seeds. Puffs up light and airy when deep-fried.',
    price: 40.00,
    discount_price: 48.00,
    category_id: 6,
    sku: 'TRAD-KOOZH-FRY',
    stock: 30,
    specs: { 'Style': 'Traditional South Indian Koozh Vadam', 'Weight': '200 g', 'Frying': 'Quick Fry in Oil' },
    image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Spicy Fryums',
    desc: 'Crunchy sun-dried spiced rice fryums seasoned with crushed red chilies, hing, and carom seeds. An irresistible side for sambar rice.',
    price: 45.00,
    discount_price: 55.00,
    category_id: 6,
    sku: 'TRAD-SPCY-FRY',
    stock: 35,
    specs: { 'Taste Profile': 'Spicy & Crispy', 'Weight': '200 g', 'Preservatives': 'Sun Dried Natural' },
    image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Papad',
    desc: 'Authentic urad dal appalam papads rolled with cracked black pepper and hing. Crisps up evenly into gold wafers within seconds.',
    price: 35.00,
    discount_price: 42.00,
    category_id: 6,
    sku: 'TRAD-PAPAD-100G',
    stock: 60,
    specs: { 'Base': 'Urad Dal & Hing', 'Quantity': 'Pack of 20 Round Papads', 'Weight': '100 g' },
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Onion Fryums',
    desc: 'Handmade sun-dried Vengaya Vadam infused with finely diced shallots and curry leaves. Releases an irresistible roasted aroma when fried.',
    price: 50.00,
    discount_price: 60.00,
    category_id: 6,
    sku: 'TRAD-ONION-FRY',
    stock: 25,
    specs: { 'Key Ingredient': 'Shallots (Small Onion) & Rice', 'Weight': '150 g' },
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80'
  },

  // 6. Laundry Products (Category 7)
  {
    name: 'Washing Powder – 1 kg',
    desc: 'Advanced enzyme-action laundry washing powder. Removes tough collar grease, mud, and tea stains while keeping colors bright.',
    price: 85.00,
    discount_price: 100.00,
    category_id: 7,
    sku: 'LAUN-PWD-1KG',
    stock: 50,
    specs: { 'Form': 'Detergent Powder with Active Enzymes', 'Weight': '1 kg', 'Machine / Hand': 'Suitable for Both' },
    image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Washing Powder – 500 g',
    desc: 'Handy 500g pouch of active washing powder with refreshing floral fragrance. Works smoothly in hard water and cold water washes.',
    price: 45.00,
    discount_price: 55.00,
    category_id: 7,
    sku: 'LAUN-PWD-500G',
    stock: 45,
    specs: { 'Weight': '500 g', 'Fragrance': 'Fresh Breeze' },
    image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Washing Powder – 100 g',
    desc: 'Compact budget sachet washing powder. Ideal for single-bucket washes, hostels, and quick stain touch-ups.',
    price: 10.00,
    discount_price: 12.00,
    category_id: 7,
    sku: 'LAUN-PWD-100G',
    stock: 100,
    specs: { 'Weight': '100 g Sachet', 'Price': '₹10 Economy Pack' },
    image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Washing Liquid – 1 L',
    desc: 'Gentle on fabrics, tough on dirt. Liquid detergent formulated for front load, top load, and delicate bucket washing without leaving chalky residues.',
    price: 180.00,
    discount_price: 220.00,
    category_id: 7,
    sku: 'LAUN-LIQ-1L',
    stock: 30,
    specs: { 'Volume': '1 Litre', 'Fabric Care': 'Color Safe & Anti-fade', 'Solubility': '100% Instant Dissolve' },
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Washing Liquid – 500 ml',
    desc: 'Convenient 500ml liquid detergent bottle with easy pour cap. Perfect for fine cottons, silks, and baby clothing.',
    price: 95.00,
    discount_price: 115.00,
    category_id: 7,
    sku: 'LAUN-LIQ-500ML',
    stock: 35,
    specs: { 'Volume': '500 ml', 'Bottle Type': 'Ergonomic Pour Bottle' },
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Washing Liquid – 100 ml',
    desc: 'Trial / travel size bottle of concentrated liquid laundry detergent. Fits easily into weekend luggage and travel bags.',
    price: 25.00,
    discount_price: 30.00,
    category_id: 7,
    sku: 'LAUN-LIQ-100ML',
    stock: 50,
    specs: { 'Volume': '100 ml Pocket Bottle', 'Ideal For': 'Travel & Delicate Hand Wash' },
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Detergent Soap – ₹10',
    desc: 'Classic everyday laundry washing bar with high sudsing power for collars, cuffs, and stubborn dirt removal.',
    price: 10.00,
    discount_price: 12.00,
    category_id: 7,
    sku: 'SOAP-DET-10',
    stock: 80,
    specs: { 'Item': 'Detergent Bar', 'Price Point': '₹10 Economy Bar', 'Weight': '125 g' },
    image: 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Arasan Detergent Soap – ₹25',
    desc: 'Famous long-lasting Arasan washing soap bar. Dense formulation resists melting in soap dishes while producing rich dirt-busting lather.',
    price: 25.00,
    discount_price: 28.00,
    category_id: 7,
    sku: 'SOAP-ARASAN-25',
    stock: 65,
    specs: { 'Brand': 'Arasan Special', 'Weight': '250 g Giant Bar', 'Durability': 'Extra Long Lasting' },
    image: 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=800&auto=format&fit=crop&q=80'
  },

  // 7. Dishwashing Products (Category 8)
  {
    name: 'Dishwashing Soap – ₹5',
    desc: 'Compact lemon-infused utensil washing bar. Easily cuts through cooking oil and curry grease on plates and glasses.',
    price: 5.00,
    discount_price: 6.00,
    category_id: 8,
    sku: 'DISH-BAR-5',
    stock: 120,
    specs: { 'Price Point': '₹5 Mini Bar', 'Fragrance': 'Lemon Fresh', 'Weight': '75 g' },
    image: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Dishwashing Soap – ₹10',
    desc: 'Anti-bacterial lemon and mint dish wash bar. Formulated with degreasing power to eliminate lingering food odors from steel and non-stick utensils.',
    price: 10.00,
    discount_price: 12.00,
    category_id: 8,
    sku: 'DISH-BAR-10',
    stock: 100,
    specs: { 'Price Point': '₹10 Standard Bar', 'Weight': '160 g', 'Action': 'Grease & Odor Defense' },
    image: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Dishwashing Liquid – ₹20',
    desc: 'Concentrated liquid dish cleaner with natural lime extract. Just one spoonful cleans an entire sinkful of greasy pots and pans.',
    price: 20.00,
    discount_price: 25.00,
    category_id: 8,
    sku: 'DISH-LIQ-20',
    stock: 70,
    specs: { 'Volume': '125 ml Squeeze Pouch', 'Price Point': '₹20 Handy Pack', 'Safe for Non-Stick': 'Yes' },
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Dishwashing Powder – 500 g',
    desc: 'Traditional abrasive dish cleaning powder. Ideal for cast iron skillets, burnt kadhais, and daily aluminum and steel cookware.',
    price: 35.00,
    discount_price: 42.00,
    category_id: 8,
    sku: 'DISH-PWD-500G',
    stock: 55,
    specs: { 'Form': 'Abrasive Scouring Powder', 'Weight': '500 g', 'Best For': 'Heavy Cookware & Kadhais' },
    image: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&auto=format&fit=crop&q=80'
  },

  // 8. Cleaning Tools and Accessories (Category 9)
  {
    name: 'Steel Scrubber',
    desc: 'Heavy-duty stainless steel wire mesh scrubber for removing stubborn burnt residue, baked grease, and charred food from pots and grills.',
    price: 15.00,
    discount_price: 18.00,
    category_id: 9,
    sku: 'TOOL-SCRUB-STEEL',
    stock: 90,
    specs: { 'Material': 'Rust-Free Stainless Steel Wire', 'Application': 'Pots, Pans & Grills', 'Quantity': '1 Piece' },
    image: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Green Scrubber – ₹10',
    desc: 'High-density nylon scouring pad with abrasive mineral grain. Safe for everyday dishwashing, countertops, and glass crockery.',
    price: 10.00,
    discount_price: 12.00,
    category_id: 9,
    sku: 'TOOL-SCRUB-GRN-10',
    stock: 120,
    specs: { 'Material': 'Non-Woven Synthetic Fiber', 'Color': 'Forest Green', 'Price': '₹10 Economy Pad' },
    image: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Green Scrubber – ₹20',
    desc: 'Thick, dual-action durable scouring sponge pad. Holds soapy lather longer for effortless dish cleaning with zero hand fatigue.',
    price: 20.00,
    discount_price: 25.00,
    category_id: 9,
    sku: 'TOOL-SCRUB-GRN-20',
    stock: 80,
    specs: { 'Pack Type': 'Thick Heavy-Duty Pad', 'Price': '₹20 Value Pack' },
    image: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Wooden Cleaning Brush',
    desc: 'Ergonomic natural wooden handle brush fitted with firm, scratch-free plant fibers. Great for scrubbing kitchen sinks, vegetables, tile grout, and bathtubs.',
    price: 45.00,
    discount_price: 55.00,
    category_id: 9,
    sku: 'TOOL-BRUSH-WOOD',
    stock: 35,
    specs: { 'Handle': 'Smooth Polished Hardwood', 'Bristles': 'Natural Tough Plant Fiber', 'Length': '20 cm' },
    image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Bleaching Powder',
    desc: 'Chlorinated multi-purpose bleaching powder for powerful bathroom floor disinfection, water tank sanitizing, and drain deodorization.',
    price: 30.00,
    discount_price: 38.00,
    category_id: 9,
    sku: 'TOOL-BLEACH-500G',
    stock: 45,
    specs: { 'Active Ingredient': 'Calcium Hypochlorite (Available Chlorine)', 'Weight': '500 g', 'Usage': 'Disinfection & Sanitizing' },
    image: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Soda Powder',
    desc: 'Premium washing soda (Sodium Carbonate) for laundry booster, degreasing kitchen exhaust fans, unclogging sink drains, and softening hard water.',
    price: 25.00,
    discount_price: 32.00,
    category_id: 9,
    sku: 'TOOL-SODA-500G',
    stock: 50,
    specs: { 'Chemical Form': 'Sodium Carbonate Fine Crystals', 'Weight': '500 g', 'Function': 'Multi-Surface Degreaser' },
    image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Coir Scrubber',
    desc: '100% biodegradable natural coconut coir fiber scrub pad. Eco-friendly, naturally anti-microbial, and gentle on non-stick utensils.',
    price: 15.00,
    discount_price: 18.00,
    category_id: 9,
    sku: 'TOOL-SCRUB-COIR',
    stock: 65,
    specs: { 'Material': '100% Coconut Coir Fiber', 'Eco-Friendly': '100% Plastic-Free & Compostable', 'Safe on Non-Stick': 'Yes' },
    image: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&auto=format&fit=crop&q=80'
  }
];

async function seedCategoriesAndProducts() {
  console.log('🔄 Connecting to MySQL to update categories and products...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'whatsapp_ecommerce',
    port: parseInt(process.env.DB_PORT || '3306', 10)
  });

  try {
    // 1. Temporarily disable foreign key checks to safely clear existing catalog tables
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('Clearing old product catalog data...');
    await connection.query('DELETE FROM enquiry_items');
    await connection.query('DELETE FROM stock_history');
    await connection.query('DELETE FROM product_images');
    await connection.query('DELETE FROM products');
    await connection.query('DELETE FROM categories');
    await connection.query('ALTER TABLE products AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE categories AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE product_images AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE stock_history AUTO_INCREMENT = 1');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // 2. Insert the 10 Categories
    console.log('Inserting 10 new categories...');
    for (const cat of categoriesData) {
      await connection.query(
        'INSERT INTO categories (id, category_name, description) VALUES (?, ?, ?)',
        [cat.id, cat.name, cat.desc]
      );
    }
    console.log(`✅ ${categoriesData.length} categories inserted.`);

    // 3. Insert all Products and Images
    console.log('Inserting new products with images & stock history...');
    for (let i = 0; i < productsData.length; i++) {
      const p = productsData[i];
      const [res] = await connection.query(
        `INSERT INTO products (product_name, description, price, discount_price, category_id, sku, stock_quantity, status, specifications)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
        [p.name, p.desc, p.price, p.discount_price, p.category_id, p.sku, p.stock, JSON.stringify(p.specs)]
      );
      const productId = res.insertId;

      // Primary image
      await connection.query(
        'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, TRUE)',
        [productId, p.image]
      );

      // Initial Stock History
      await connection.query(
        `INSERT INTO stock_history (product_id, previous_stock, updated_stock, change_type, notes, updated_by)
         VALUES (?, 0, ?, 'initial', 'Initial catalog intake', 'admin')`,
        [productId, p.stock]
      );
    }
    console.log(`✅ Successfully inserted ${productsData.length} products with stock and images!`);

    // 4. Update website_settings to match store branding
    await connection.query(
      `UPDATE website_settings SET
         website_name = 'Roja Provisions & Showcase',
         description = 'Direct WhatsApp ordering for premium salt products, rangoli powders, cleaning chemicals, vermicelli, noodles, traditional fryums, and household cleaning supplies.',
         address = 'Chennai, Tamil Nadu, India'
       WHERE id = 1`
    );

    console.log('🎉 All 10 categories and 39 products updated successfully!');
  } catch (err) {
    console.error('❌ Error updating categories and products:', err);
  } finally {
    await connection.end();
  }
}

seedCategoriesAndProducts();
