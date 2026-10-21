
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const rooms = [
  {
    roomNumber: "101",
    type: "SINGLE",
    capacity: 1,
    pricePerNight: 15000,
    description: "Comfortable single room",
  },
  {
    roomNumber: "102",
    type: "SINGLE",
    capacity: 1,
    pricePerNight: 15000,
    description: "Comfortable single room",
  },
  {
    roomNumber: "103",
    type: "SINGLE",
    capacity: 1,
    pricePerNight: 16000,
    description: "Sea-view single room",
  },
  {
    roomNumber: "201",
    type: "DOUBLE",
    capacity: 2,
    pricePerNight: 22000,
    description: "Comfortable double room",
  },
  {
    roomNumber: "202",
    type: "DOUBLE",
    capacity: 2,
    pricePerNight: 22000,
    description: "Comfortable double room",
  },
  {
    roomNumber: "203",
    type: "DOUBLE",
    capacity: 2,
    pricePerNight: 25000,
    description: "Sea-view double room",
  },
  {
    roomNumber: "301",
    type: "TRIPLE",
    capacity: 3,
    pricePerNight: 30000,
    description: "Spacious triple room",
  },
  {
    roomNumber: "302",
    type: "TRIPLE",
    capacity: 3,
    pricePerNight: 32000,
    description: "Sea-view triple room",
  },
  {
    roomNumber: "401",
    type: "VIP",
    capacity: 4,
    pricePerNight: 50000,
    description: "Premium VIP suite with sea view",
  },
  {
    roomNumber: "402",
    type: "VIP",
    capacity: 4,
    pricePerNight: 55000,
    description: "Luxury VIP suite with sea view",
  },
];

async function main() {
  for (const room of rooms) {
    await prisma.room.upsert({
      where: { roomNumber: room.roomNumber },
      update: {
        type: room.type,
        capacity: room.capacity,
        pricePerNight: room.pricePerNight,
        description: room.description,
      },
      create: room,
    });
  }

  console.log(`Successfully seeded ${rooms.length} rooms.`);
}

main()
  .catch((error) => {
    console.error("Room seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
