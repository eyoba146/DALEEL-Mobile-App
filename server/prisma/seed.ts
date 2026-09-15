import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding rich Ethiopian destinations, services, and events...');

  // Upsert or clear and re-create destinations
  await prisma.serviceInquiry.deleteMany({});
  await prisma.favorite.deleteMany({});
  await prisma.destination.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.eventItem.deleteMany({});

  await prisma.destination.createMany({
    data: [
      {
        id: 'd1',
        name: 'Lalibela',
        region: 'Amhara',
        blurb: 'Rock-hewn monolithic churches carved from volcanic tuff, an active holy pilgrimage site and 12th-century engineering miracle.',
        image: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800',
        description: 'King Lalibela commissioned 11 monolithic rock-hewn churches in the 12th century to recreate a New Jerusalem in the rugged Lasta mountains of Ethiopia. Carved directly downward from red volcanic scoria into solid bedrock, these interconnected sanctuaries remain vibrant places of daily worship, incense-scented liturgical chant, and world-renowned UNESCO heritage.',
        bestTimeToVisit: 'October to March (Dry, sunny highlands; optimal for Genna Ethiopian Christmas on Jan 7 and Timkat Epiphany on Jan 19)',
        elevation: '2,500m (8,200 ft)',
        unescoStatus: true,
        rating: 4.95,
        highlights: 'Bet Giyorgis (Church of St. George carved in the shape of a cross),Bet Medhane Alem (largest monolithic rock church on Earth),Sacred ceremonial tunnels & underground passages,Meskel flower festival night vigils,Panoramic sunset hike to Asheten Maryam monastery',
        gettingThere: 'Daily scheduled Ethiopian Airlines flights from Addis Ababa Bole (ADD) to Lalibela Airport (LLI) (1 hour flight). Paved scenic airport shuttle takes 25 minutes to town center.',
      },
      {
        id: 'd2',
        name: 'Addis Ababa',
        region: 'Addis Ababa',
        blurb: "Ethiopia's vibrant capital — diplomatic heart of Africa, coffee birthplace culture, Entoto panoramic heights, and a fast-growing skyline.",
        image: 'https://images.unsplash.com/photo-1580746738099-72cbf9a7e315?w=800',
        description: 'Situated at the foot of Mount Entoto, Addis Ababa (meaning "New Flower") is the diplomatic capital of Africa, home to the African Union headquarters and UNECA. It bridges centuries-old coffee ceremonies with contemporary jazz clubs, bustling open-air markets like Mercato, and world-class museums housing humanity’s earliest ancestors.',
        bestTimeToVisit: 'Year-round (Highland climate with crisp evenings; dry season runs October through May with pleasant 23°C days)',
        elevation: '2,355m (7,726 ft)',
        unescoStatus: false,
        rating: 4.85,
        highlights: 'National Museum of Ethiopia (Lucy / Dinkinesh 3.2M-year-old fossil),Entoto Park with pine forest zip lines and city panoramas,Historic Tomoca Coffee and live Ethio-Jazz at Fendika,Addis Mercato (Africa’s largest open-air market),Unity Park & Grand Palace historic gardens',
        gettingThere: 'Global hub of Star Alliance carrier Ethiopian Airlines connecting 130+ international cities. Modern Light Rail and ride-hailing (Feres, Ride) operate across the city.',
      },
      {
        id: 'd3',
        name: 'Simien Mountains',
        region: 'Amhara',
        blurb: 'Dramatic precipices, jagged highland peaks, deep gorges, and endemic wildlife found nowhere else on earth.',
        image: 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=800',
        description: 'The Simien Mountains National Park is often described as "The Chess Pieces of the Gods" — a dramatic plateau carved by millions of years of volcanic activity and erosion into dizzying vertical escarpments plunging 1,500 meters into valleys below. It is the sanctuary of the charismatic vegetarian Gelada monkeys, Walia Ibex, and the elusive Ethiopian Wolf.',
        bestTimeToVisit: 'Late September to November (Lush wildflower blooms & crisp clear skies) and December to March (Great trekking conditions)',
        elevation: '4,533m (Ras Dashen peak)',
        unescoStatus: true,
        rating: 4.92,
        highlights: 'Encounter wild troops of 200+ Gelada baboons up close,Trek to the summit of Ras Dashen (Ethiopia’s highest point at 4,533m),Gaze across the 500m sheer drop of Jinbar Waterfall,Spectacular sunsets over the Imet Gogo viewpoint,Sighting the rare Walia Ibex leaping along cliff edges',
        gettingThere: 'Fly from Addis to Gondar Airport (GDQ), followed by a scenic 2-hour 4WD drive via Debark Park headquarters.',
      },
      {
        id: 'd4',
        name: 'Harar Jugol',
        region: 'Harari',
        blurb: 'Ancient 16th-century walled Islamic city with 82 mosques, vibrant maze alleys, and century-old hyena feeding rituals.',
        image: 'https://images.unsplash.com/photo-1590402494587-44b71d7772f6?w=800',
        description: 'Considered the fourth holiest city in Islam, Harar Jugol is encircled by 4-meter-high stone walls built between the 13th and 16th centuries. Within its 368 narrow cobbled alleyways lie distinct traditional Harari homes, fragrant spice markets, and a unique historic coexistence between humans and wild spotted hyenas.',
        bestTimeToVisit: 'October to March (Warm, sunny days and cool pleasant evenings)',
        elevation: '1,885m (6,184 ft)',
        unescoStatus: true,
        rating: 4.89,
        highlights: 'Nightly wild hyena feeding ceremony outside the city gates,Arthur Rimbaud Cultural Center & Museum,Explore 82 mosques and 102 historic shrines inside the walls,Traditional Harari House architecture and woven basketry markets,Sampling world-famous Harar longberry specialty coffee',
        gettingThere: 'Fly from Addis Ababa to Dire Dawa (DIR) (50 min), followed by a 45-minute paved road drive to Harar.',
      },
    ],
  });

  await prisma.service.createMany({
    data: [
      {
        id: 's1',
        name: 'Addis Relocation Partners',
        category: 'Relocation',
        location: 'Addis Ababa',
        verified: true,
        blurb: 'End-to-end bespoke transition support for returning diaspora & foreign expats — luxury housing leases, Modjo port container customs, and paperwork.',
        image: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800',
        description: 'Addis Relocation Partners is Ethiopia’s premier expat and diaspora settlement agency. Founded by diaspora returnees with over 15 years of corporate relocation experience, we assist families and professionals with house hunting in secure Addis Ababa neighborhoods (Old Airport, Bole, CMC), vehicle customs clearance under diaspora duty-free schemes, school admissions, and utility setup.',
        phone: '+251 911 234 567',
        whatsapp: '+251911234567',
        email: 'contact@addisrelocation.com',
        address: 'Bole Medhanialem, Morning Star Mall 4th Floor, Addis Ababa',
        rating: 4.9,
        reviewCount: 142,
        operatingHours: 'Monday – Friday: 8:30 AM – 6:00 PM | Saturday: 9:00 AM – 1:00 PM',
        features: 'Expat neighborhood housing search,Modjo Dry Port container customs clearance,Yellow Card & Resident ID paperwork expediting,International school placement (ICS / Bingham / Sandford),Home furnishing and telecom eSIM provisioning',
      },
      {
        id: 's2',
        name: 'Habesha Legal Group',
        category: 'Legal services',
        location: 'Addis Ababa',
        verified: true,
        blurb: 'Licensed Ethiopian advocate firm specializing in diaspora property title validation, inheritance disputes, power of attorney, and commercial EIC licenses.',
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
        description: 'Habesha Legal Group is an elite full-service Ethiopian law office serving diaspora communities in the US, UK, Canada, and Europe. Our attorneys are admitted to practice before the Federal Supreme Court of Ethiopia. We ensure diaspora properties and real estate contracts are bulletproof, resolve land registry conflicts, draft certified Powers of Attorney (Wekilna), and navigate Ethiopian Investment Commission (EIC) commercial registrations.',
        phone: '+251 922 789 012',
        whatsapp: '+251922789012',
        email: 'info@habeshalegal.com',
        address: 'Kazanchis, Guinea Conakry St, Beside Radisson Blu, Addis Ababa',
        rating: 4.9,
        reviewCount: 98,
        operatingHours: 'Monday – Friday: 8:00 AM – 5:30 PM (EAT)',
        features: 'Real Estate contract & title deed (Sened) verification,Embassy certified Power of Attorney (Wekilna) handling,Ethiopian Investment Commission (EIC) business licensing,Inheritance law & family property dispute resolution,Forex banking & repatriation compliance counsel',
      },
      {
        id: 's3',
        name: 'Yene Guide Tours',
        category: 'Tour operators',
        location: 'Lalibela & Addis Ababa',
        verified: true,
        blurb: 'Boutique certified tour operator providing private 4WD Land Cruiser expeditions, historian guides, and luxury eco-lodge reservations across Ethiopia.',
        image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=800',
        description: 'Yene Guide Tours specializes in authentic, high-comfort journeys tailored for visiting diaspora families and international travelers. We provide modern Toyota Land Cruisers, certified English-speaking regional guides, private security logistics, and curated itineraries covering the Historic North Circuit, Danakil Depression, and Omo Valley cultural encounters.',
        phone: '+251 933 456 789',
        whatsapp: '+251933456789',
        email: 'adventures@yeneguide.com',
        address: 'Lalibela Main Road / Addis Ababa Bole Sub-city',
        rating: 4.8,
        reviewCount: 87,
        operatingHours: 'Daily: 7:00 AM – 8:00 PM (EAT)',
        features: 'Private V8/Land Cruiser vehicle rentals with vetted drivers,Licensed archaeological and historical guides,Domestic flight booking assistance with Ethiopian Airlines,Boutique eco-lodge & luxury hotel reservations,Custom family homecoming itineraries',
      },
      {
        id: 's4',
        name: 'Abyssinia Diaspora Wealth Advisors',
        category: 'Banking',
        location: 'Addis Ababa',
        verified: true,
        blurb: 'Advisory concierge for non-resident foreign currency (NRFC) diaspora accounts, treasury bonds, and commercial real estate financing in Ethiopia.',
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
        description: 'Specialized diaspora financial desk guiding Ethiopians living abroad through opening and operating Non-Resident Foreign Currency Accounts (USD, EUR, GBP) in Ethiopian commercial banks, buying government Diaspora Bonds, and securing mortgage loans for property developments in Addis Ababa.',
        phone: '+251 944 567 890',
        whatsapp: '+251944567890',
        email: 'diaspora@abyssiniawealth.et',
        address: 'Churchill Avenue, Financial District, Addis Ababa',
        rating: 4.9,
        reviewCount: 64,
        operatingHours: 'Monday – Friday: 8:30 AM – 5:00 PM',
        features: 'Diaspora USD/EUR/GBP foreign currency account opening,Diaspora mortgage & housing financing guidance,Official remittance channel rate guidance,National Bank of Ethiopia foreign exchange compliance,Treasury bills and government infrastructure bonds',
      },
    ],
  });

  await prisma.eventItem.createMany({
    data: [
      {
        id: 'e1',
        title: 'Irreecha Cultural Festival',
        date: new Date('2026-10-04'),
        city: 'Bishoftu',
        category: 'Cultural',
        image: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=800',
      },
      {
        id: 'e2',
        title: 'Ethiopia Diaspora Investment Forum',
        date: new Date('2026-11-12'),
        city: 'Addis Ababa',
        category: 'Business',
        image: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800',
      },
    ],
  });

  console.log('✅ Seed completed successfully with rich Ethiopian data.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
