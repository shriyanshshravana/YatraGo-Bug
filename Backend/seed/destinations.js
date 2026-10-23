const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables from Backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const Destination = require('../models/Destination');

const starterDestinations = [
  {
    slug: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    region: 'North India',
    type: 'Heritage',
    days: 3,
    budget: 8500,
    tag: 'Royal stories',
    emoji: '🏰',
    image: '/images/jaipur.jpg',
    description: 'Rose-coloured lanes, grand forts, lively bazaars and rooftop sunsets make Jaipur a beautiful first chapter in your India journey.',
    highlights: ['Amber Fort', 'Hawa Mahal', 'City Palace', 'Johari Bazaar'],
    bestTime: 'October–March',
    food: 'Dal baati churma, ghewar and pyaaz kachori',
  },
  {
    slug: 'udaipur',
    name: 'Udaipur',
    state: 'Rajasthan',
    region: 'West India',
    type: 'Heritage',
    days: 2,
    budget: 9000,
    tag: 'Lakeside romance',
    emoji: '🛶',
    image: '/images/udaipur.jpg',
    description: 'Marble palaces, lake reflections and narrow old-town streets give Udaipur its graceful mood.',
    highlights: ['City Palace', 'Lake Pichola', 'Bagore Ki Haveli', 'Saheliyon Ki Bari'],
    bestTime: 'September–March',
    food: 'Dal baati and local thalis',
  },
  {
    slug: 'goa',
    name: 'Goa',
    state: 'Goa',
    region: 'West India',
    type: 'Beach',
    days: 4,
    budget: 14000,
    tag: 'Slow coastal days',
    emoji: '🌊',
    image: '/images/goa.jpg',
    description: 'Golden beaches, Portuguese-era streets and laid-back sunsets invite you to slow down.',
    highlights: ['Fontainhas', 'Palolem Beach', 'Fort Aguada', 'Anjuna'],
    bestTime: 'November–February',
    food: 'Goan fish curry, bebinca and poi',
  },
  {
    slug: 'manali',
    name: 'Manali',
    state: 'Himachal Pradesh',
    region: 'North India',
    type: 'Mountains',
    days: 4,
    budget: 12000,
    tag: 'Mountain escape',
    emoji: '🏔️',
    image: '/images/manali.jpg',
    description: 'Pine forests, mountain air and winding roads create the perfect base for a relaxed Himalayan getaway.',
    highlights: ['Solang Valley', 'Old Manali', 'Hadimba Temple', 'Atal Tunnel'],
    bestTime: 'March–June',
    food: 'Siddu and warm mountain cafés',
  },
  {
    slug: 'varanasi',
    name: 'Varanasi',
    state: 'Uttar Pradesh',
    region: 'North India',
    type: 'Culture',
    days: 2,
    budget: 6500,
    tag: 'A city of stories',
    emoji: '🪔',
    image: '/images/varanasi.jpg',
    description: 'Watch the river wake at dawn and experience one of India’s most storied cultural cities.',
    highlights: ['Dashashwamedh Ghat', 'Assi Ghat', 'Sarnath', 'Old City lanes'],
    bestTime: 'October–March',
    food: 'Tamatar chaat and kachori',
  },
  {
    slug: 'kerala',
    name: 'Alappuzha (Kerala)',
    state: 'Kerala',
    region: 'South India',
    type: 'Nature',
    days: 3,
    budget: 11000,
    tag: 'Backwater calm',
    emoji: '🌴',
    image: '/images/kerala.jpg',
    description: 'Drift past palms and village life on quiet backwaters, with lush green scenery at every turn.',
    highlights: ['Backwater cruise', 'Marari Beach', 'Pathiramanal', 'Village walk'],
    bestTime: 'September–March',
    food: 'Appam with stew and Kerala sadya',
  },
  {
    slug: 'srinagar',
    name: 'Srinagar',
    state: 'Jammu & Kashmir',
    region: 'North India',
    type: 'Nature',
    days: 4,
    budget: 16000,
    tag: 'Valley views',
    emoji: '🌄',
    image: '/images/srinagar.jpg',
    description: 'Houseboats, gardens, mountain views and shikara rides make Srinagar a memorable valley escape.',
    highlights: ['Dal Lake', 'Mughal Gardens', 'Old Srinagar', 'Pari Mahal'],
    bestTime: 'April–October',
    food: 'Kahwa and Kashmiri dishes',
  },
  {
    slug: 'rishikesh',
    name: 'Rishikesh',
    state: 'Uttarakhand',
    region: 'North India',
    type: 'Adventure',
    days: 3,
    budget: 7500,
    tag: 'Find your flow',
    emoji: '🧘',
    image: '/images/rishikesh.jpg',
    description: 'A blend of river adventure, peaceful cafés, yoga spaces and foothill trails beside the Ganga.',
    highlights: ['Ganga Aarti', 'River rafting', 'Neer Garh Waterfall', 'Café stops'],
    bestTime: 'February–May, September–November',
    food: 'North Indian meals and café favourites',
  },
  {
    slug: 'darjeeling',
    name: 'Darjeeling',
    state: 'West Bengal',
    region: 'East India',
    type: 'Mountains',
    days: 3,
    budget: 10000,
    tag: 'Tea and mist',
    emoji: '🍃',
    image: '/images/darjeeling.jpg',
    description: 'Tea gardens, toy-train nostalgia and Himalayan views bring a slower rhythm to the hills.',
    highlights: ['Tiger Hill', 'Tea gardens', 'Batasia Loop', 'Chowrasta'],
    bestTime: 'March–May, October–November',
    food: 'Momos, thukpa and tea',
  },
  {
    slug: 'hampi',
    name: 'Hampi',
    state: 'Karnataka',
    region: 'South India',
    type: 'Heritage',
    days: 2,
    budget: 7000,
    tag: 'Ancient wonders',
    emoji: '🪨',
    image: '/images/hampi.jpg',
    description: 'Boulder landscapes and remarkable temple ruins turn every walk into a discovery through history.',
    highlights: ['Virupaksha Temple', 'Vittala Temple', 'Hemakuta Hill', 'Hampi Bazaar'],
    bestTime: 'October–February',
    food: 'South Indian thalis',
  },
  {
    slug: 'shimla',
    name: 'Shimla',
    state: 'Himachal Pradesh',
    region: 'North India',
    type: 'Mountains',
    days: 3,
    budget: 9500,
    tag: 'Hill-town days',
    emoji: '🚞',
    image: '/images/shimla.jpg',
    description: 'Pine-scented walks, hillside views and the heritage railway make Shimla a classic hill-station break.',
    highlights: ['The Ridge', 'Mall Road', 'Jakhoo Temple', 'Heritage railway'],
    bestTime: 'March–June',
    food: 'Siddu and café treats',
  },
  {
    slug: 'pondicherry',
    name: 'Puducherry',
    state: 'Puducherry',
    region: 'South India',
    type: 'Coastal',
    days: 2,
    budget: 8000,
    tag: 'Colourful corners',
    emoji: '🚲',
    image: '/images/pondicherry.jpg',
    description: 'Pastel streets, seaside promenades and relaxed cafés make this coastal town ideal for a weekend.',
    highlights: ['White Town', 'Promenade Beach', 'Auroville', 'French Quarter'],
    bestTime: 'October–March',
    food: 'South Indian breakfasts and cafés',
  },
  {
    slug: 'amritsar',
    name: 'Amritsar',
    state: 'Punjab',
    region: 'North India',
    type: 'Heritage',
    days: 2,
    budget: 7500,
    tag: 'Golden spiritual light',
    emoji: '🪔',
    image: '/images/heritage-india.jpg',
    description: 'The Golden Temple at night, historic streets, rich culinary heritage, and heartfelt warmth make Amritsar an unforgettable cultural destination.',
    highlights: ['Golden Temple', 'Jallianwala Bagh', 'Wagah Border', 'Heritage Street'],
    bestTime: 'October–March',
    food: 'Amritsari kulcha, lassi and makki di roti',
  },
];

const normalizeMongoUri = (rawUri) => {
  if (!rawUri) return rawUri;
  const match = rawUri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.*)@([^@\/]+)(\/.*)?$/);
  if (match) {
    const [, proto, user, pwd, host, rest] = match;
    try {
      const decoded = decodeURIComponent(pwd);
      const encoded = encodeURIComponent(decoded);
      return `${proto}${user}:${encoded}@${host}${rest || ''}`;
    } catch {
      return rawUri;
    }
  }
  return rawUri;
};

const seedDestinations = async () => {
  const rawUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!rawUri || rawUri.trim() === '' || rawUri.includes('YOUR_NEW_URL_ENCODED_PASSWORD') || rawUri.includes('<password>')) {
    console.error('❌ Cannot run seed script: MONGODB_URI is not properly configured in Backend/.env');
    console.error('👉 Please configure your real MongoDB Atlas connection string in Backend/.env and rerun npm run seed.');
    process.exit(1);
  }

  const uri = normalizeMongoUri(rawUri.trim());

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas successfully.');

    let insertedCount = 0;
    let updatedCount = 0;

    for (const item of starterDestinations) {
      const res = await Destination.updateOne(
        { slug: item.slug },
        { $set: item },
        { upsert: true }
      );

      if (res.upsertedCount > 0) {
        insertedCount++;
      } else {
        updatedCount++;
      }
    }

    console.log('==============================================');
    console.log(`✅ Seed complete for Indian Destinations:`);
    console.log(`   - Total Processed : ${starterDestinations.length}`);
    console.log(`   - Newly Inserted  : ${insertedCount}`);
    console.log(`   - Existing Updated: ${updatedCount}`);
    console.log('==============================================');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    const safeError = error.message.replace(/mongodb(\+srv)?:\/\/[^@\s]+@/gi, 'mongodb$1://<credentials-hidden>@');
    console.error(`❌ Seeding failed: ${safeError}`);
    process.exit(1);
  }
};

// Execute if run directly from CLI
if (require.main === module) {
  seedDestinations();
}

module.exports = {
  starterDestinations,
  seedDestinations,
};
