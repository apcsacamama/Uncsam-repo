import { useState, useEffect } from "react";
import { Booking } from "../types/travel";
import { mockBookings } from "../data/offers";

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addBooking = async (booking: Omit<Booking, "id">) => {
    setLoading(true);
    try {
      const newBooking: Booking = {
        ...booking,
        id: `book-${Date.now()}`,
      };
      setBookings((prev) => [...prev, newBooking]);
      return newBooking;
    } catch (err) {
      setError("Failed to create booking");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBooking = async (id: string, updates: Partial<Booking>) => {
    setLoading(true);
    try {
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === id ? { ...booking, ...updates } : booking,
        ),
      );
    } catch (err) {
      setError("Failed to update booking");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteBooking = async (id: string) => {
    setLoading(true);
    try {
      setBookings((prev) => prev.filter((booking) => booking.id !== id));
    } catch (err) {
      setError("Failed to delete booking");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getBookingsByUser = (userId: string) => {
    return bookings.filter((booking) => booking.userId === userId);
  };

  const getBookingsByStatus = (status: Booking["status"]) => {
    return bookings.filter((booking) => booking.status === status);
  };

  return {
    bookings,
    loading,
    error,
    addBooking,
    updateBooking,
    deleteBooking,
    getBookingsByUser,
    getBookingsByStatus,
  };
}
