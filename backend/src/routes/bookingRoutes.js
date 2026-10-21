import { Router } from "express";
import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * GET /api/bookings/my-bookings
 * Returns bookings belonging to the logged-in customer.
 */
router.get("/my-bookings", requireAuth, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        userId: req.user.id,
      },

      orderBy: {
        createdAt: "desc",
      },

      include: {
        room: {
          select: {
            roomNumber: true,
            type: true,
            capacity: true,
            pricePerNight: true,
          },
        },

        services: {
          include: {
            service: {
              select: {
                name: true,
                category: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Fetch customer bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your bookings.",
    });
  }
});

// Validate a date in YYYY-MM-DD format.
function parseDateOnly(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
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

// POST /api/bookings
// Requires a valid customer login token.
router.post("/", requireAuth, async (req, res) => {
  try {
    const { roomId: rawRoomId, checkIn, checkOut, guests: rawGuests } =
      req.body ?? {};

    const roomId = Number(rawRoomId);
    const guests = Number(rawGuests);

    // Validate room ID.
    if (!Number.isInteger(roomId) || roomId < 1) {
      return res.status(400).json({
        success: false,
        message: "A valid room ID is required.",
      });
    }

    // Validate guest count.
    if (!Number.isInteger(guests) || guests < 1 || guests > 100) {
      return res.status(400).json({
        success: false,
        message: "Guests must be a whole number between 1 and 100.",
      });
    }

    // Validate booking dates.
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
        message: "Check-out must be after check-in.",
      });
    }

    const now = new Date();
    const today = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
      ),
    );

    if (startDate < today) {
      return res.status(400).json({
        success: false,
        message: "Check-in cannot be in the past.",
      });
    }

    const nights =
      (endDate.getTime() - startDate.getTime()) /
      (24 * 60 * 60 * 1000);

    // Run booking checks and creation in a serializable transaction.
    // Retry serialization conflicts where possible.
    let booking;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        booking = await prisma.$transaction(
          async (tx) => {
            // 1. Find and validate the requested room.
            const room = await tx.room.findUnique({
              where: {
                id: roomId,
              },
            });

            if (!room || !room.isActive) {
              const error = new Error(
                "This room does not exist or is not available for booking.",
              );
              error.statusCode = 404;
              throw error;
            }

            if (room.capacity < guests) {
              const error = new Error(
                `This room can accommodate up to ${room.capacity} guests.`,
              );
              error.statusCode = 400;
              throw error;
            }

            // 2. Check overlapping room bookings and full-hotel events.
            const conflicts = await tx.booking.findMany({
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
                OR: [
                  {
                    type: "FULL_HOTEL_EVENT",
                  },
                  {
                    type: "ROOM",
                    roomId: room.id,
                  },
                ],
              },
              select: {
                id: true,
              },
            });

            if (conflicts.length > 0) {
              const error = new Error(
                "This room is already booked for the selected dates. Please choose another room or different dates.",
              );
              error.statusCode = 409;
              throw error;
            }

            // 3. Calculate the total using the current database price.
            const totalAmount = new Prisma.Decimal(
              room.pricePerNight.toString(),
            ).mul(nights);

            // 4. Create a pending booking for the authenticated customer.
            return tx.booking.create({
              data: {
                type: "ROOM",
                status: "PENDING",
                userId: req.user.id,
                roomId: room.id,
                checkIn: startDate,
                checkOut: endDate,
                guests,
                totalAmount,
              },
              include: {
                room: {
                  select: {
                    roomNumber: true,
                    type: true,
                    capacity: true,
                    pricePerNight: true,
                  },
                },
              },
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );

        break;
      } catch (error) {
        if (error.code === "P2034" && attempt < 3) {
          // PostgreSQL detected a transaction conflict; retry.
          continue;
        }

        throw error;
      }
    }

    if (!booking) {
      return res.status(409).json({
        success: false,
        message:
          "The booking could not be completed due to a conflict. Please check availability and try again.",
      });
    }

    const confirmedNights =
      (booking.checkOut.getTime() - booking.checkIn.getTime()) /
      (24 * 60 * 60 * 1000);

    return res.status(201).json({
      success: true,
      message: "Booking request created successfully.",
      booking: {
        id: booking.id,
        bookingCode: booking.bookingCode,
        status: booking.status,
        room: booking.room,
        checkIn: checkIn,
        checkOut: checkOut,
        guests: booking.guests,
        nights: confirmedNights,
        pricePerNight: booking.room.pricePerNight,
        totalAmount: booking.totalAmount,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    if (error.code === "P2034") {
      return res.status(409).json({
        success: false,
        message:
          "A booking conflict occurred. Please check availability and try again.",
      });
    }

    console.error("Create booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create the booking.",
    });
  }
});

export default router;