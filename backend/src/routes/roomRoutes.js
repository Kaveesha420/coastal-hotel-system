
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// Validate and parse dates in YYYY-MM-DD format.
function parseDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
}

// GET /api/rooms/availability
// Example: /api/rooms/availability?checkIn=2026-10-20&checkOut=2026-10-22&guests=2
router.get("/availability", async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;
    const guests = Number(req.query.guests ?? 1);

    const startDate = parseDateOnly(checkIn);
    const endDate = parseDateOnly(checkOut);

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Use valid dates in YYYY-MM-DD format.",
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: "Check-out date must be after check-in date.",
      });
    }

    if (!Number.isInteger(guests) || guests < 1 || guests > 100) {
      return res.status(400).json({
        success: false,
        message: "Guests must be a whole number between 1 and 100.",
      });
    }

    // Find bookings that overlap with the requested dates.
    // Cancelled bookings do not block room availability.
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        status: {
          not: "CANCELLED",
        },
        checkIn: {
          lt: endDate,
        },
        checkOut: {
          gt: startDate,
        },
      },
      select: {
        roomId: true,
        type: true,
      },
    });

    // A full-hotel event blocks every normal room booking.
    const fullHotelEventExists = overlappingBookings.some(
      (booking) => booking.type === "FULL_HOTEL_EVENT"
    );

    let rooms = [];

    if (!fullHotelEventExists) {
      const unavailableRoomIds = [
        ...new Set(
          overlappingBookings
            .filter((booking) => booking.roomId !== null)
            .map((booking) => booking.roomId)
        ),
      ];

      rooms = await prisma.room.findMany({
        where: {
          isActive: true,
          capacity: {
            gte: guests,
          },
          id: {
            notIn: unavailableRoomIds,
          },
        },
        orderBy: {
          roomNumber: "asc",
        },
      });
    }

    return res.status(200).json({
      success: true,
      checkIn,
      checkOut,
      guests,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    console.error("Room availability error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to check room availability.",
    });
  }
});

// GET /api/rooms
router.get("/", async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        roomNumber: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    console.error("Failed to fetch rooms:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve rooms.",
    });
  }
});

export default router;
