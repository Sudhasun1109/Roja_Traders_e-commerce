const pool = require('../config/db');

async function createBannersTable() {
  const connection = await pool.getConnection();
  try {
    console.log('🚀 Creating offer_banners table...');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS offer_banners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255) NULL,
        badge_text VARCHAR(100) NULL DEFAULT 'SPECIAL OFFER',
        discount_tag VARCHAR(100) NULL,
        image_url TEXT NOT NULL,
        link_url VARCHAR(255) DEFAULT '/products',
        button_text VARCHAR(100) DEFAULT 'Order on WhatsApp',
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ offer_banners table verified/created.');

    // Check if banners exist, if not seed default high quality banners
    const [existing] = await connection.execute('SELECT COUNT(*) as count FROM offer_banners');
    if (existing[0].count === 0) {
      console.log('Seeding initial promotional offer banners for Roja Traders...');

      const defaultBanners = [
        {
          title: 'Wholesale Salt & Kitchen Provisions Combo',
          subtitle: 'Pure first-grade rock salt, powdered salt & cooking staples at honest wholesale prices.',
          badge_text: '🔥 BULK SAVINGS',
          discount_tag: 'Flat 20% Off for Wholesale',
          image_url: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=1000&auto=format&fit=crop&q=80',
          link_url: '/products?category_id=1',
          button_text: 'Explore Salt & Provisions',
          display_order: 1,
          is_active: 1
        },
        {
          title: 'Vibrant Rangoli Powders & Kolam Kits',
          subtitle: 'Special fine white kolapodi & bright festival colours for homes, temples and celebrations.',
          badge_text: '✨ FESTIVAL SPECIAL',
          discount_tag: 'Combo Packs Available',
          image_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1000&auto=format&fit=crop&q=80',
          link_url: '/products?category_id=2',
          button_text: 'View Rangoli Powders',
          display_order: 2,
          is_active: 1
        },
        {
          title: 'Traditional Rice Sevai & Crunchy Vadagam',
          subtitle: 'Pure authentic rice sevai, sun-dried kanji vadagam & crispy papad ready for dispatch.',
          badge_text: '🌾 AUTHENTIC TASTE',
          discount_tag: 'Direct Mill Pack',
          image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1000&auto=format&fit=crop&q=80',
          link_url: '/products?category_id=5',
          button_text: 'Order Traditional Food',
          display_order: 3,
          is_active: 1
        },
        {
          title: 'Heavy-Duty Cleaning & Washing Chemicals',
          subtitle: 'Complete home & commercial range: washing liquids, dishwash soaps, pithapari & scrubber brushes.',
          badge_text: '⭐ HYGIENE ESSENTIALS',
          discount_tag: 'Best Quality Guaranteed',
          image_url: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=1000&auto=format&fit=crop&q=80',
          link_url: '/products?category_id=4',
          button_text: 'Shop Cleaners & Tools',
          display_order: 4,
          is_active: 1
        }
      ];

      for (const b of defaultBanners) {
        await connection.execute(`
          INSERT INTO offer_banners 
            (title, subtitle, badge_text, discount_tag, image_url, link_url, button_text, display_order, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          b.title,
          b.subtitle,
          b.badge_text,
          b.discount_tag,
          b.image_url,
          b.link_url,
          b.button_text,
          b.display_order,
          b.is_active
        ]);
      }
      console.log(`✅ Seeded ${defaultBanners.length} default offer banners.`);
    } else {
      console.log(`ℹ️ ${existing[0].count} offer banners already exist.`);
    }

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    connection.release();
    pool.end();
  }
}

createBannersTable();
