import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.destination.createMany({
    data: [
      {
        name: 'Lalibela',
        region: 'Amhara',
        blurb: 'Rock-hewn churches carved into volcanic stone, still an active pilgrimage site.',
        image: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800',
      },
      {
        name: 'Addis Ababa',
        region: 'Addis Ababa',
        blurb: "Ethiopia's capital — diplomatic hub, coffee culture, and a fast-growing skyline.",
        image: 'https://images.unsplash.com/photo-1580746738099-72cbf9a7e315?w=800',
      },
      {
        name: 'Simien Mountains',
        region: 'Amhara',
        blurb: 'Jagged highland peaks and endemic wildlife, a UNESCO World Heritage site.',
        image: 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=800',
      },
    ],
  });

  await prisma.service.createMany({
    data: [
      {
        name: 'Addis Relocation Partners',
        category: 'Relocation',
        location: 'Addis Ababa',
        verified: true,
        blurb: 'End-to-end support for returning diaspora — housing, paperwork, orientation.',
        image: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800',
      },
      {
        name: 'Habesha Legal Group',
        category: 'Legal services',
        location: 'Addis Ababa',
        verified: true,
        blurb: 'Property, inheritance, and business registration support for foreign residents.',
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      },
      {
        name: 'Yene Guide Tours',
        category: 'Tour operators',
        location: 'Lalibela',
        verified: false,
        blurb: 'Small-group historical and cultural tours across the northern circuit.',
        image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=800',
      },
    ],
  });

  await prisma.eventItem.createMany({
    data: [
      {
        title: 'Irreecha Cultural Festival',
        date: new Date('2026-10-04'),
        city: 'Bishoftu',
        category: 'Cultural',
        image: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=800',
      },
      {
        title: 'Ethiopia Diaspora Investment Forum',
        date: new Date('2026-11-12'),
        city: 'Addis Ababa',
        category: 'Business',
        image: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800',
      },
    ],
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
