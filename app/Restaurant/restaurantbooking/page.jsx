"use client";
import Navbar from "../../_components/Navbar";
import { Footer } from "../../_components/Footer";
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Box,
  Button,
  Typography,
  Modal,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddNewBookingForm from "./addnewbooking";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RestaurantBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [EditOpen, setEditOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [availableTables, setAvailableTables] = useState([]);

  useEffect(() => {
    const fetchAvailableTables = async () => {
      try {
        const response = await fetch("/api/tables");
        const data = await response.json();
        if (data.success) {
          setAvailableTables(data.data); // Store available table numbers
        } else {
          console.error("Failed to fetch available tables:", data.error);
        }
      } catch (error) {
        console.error("Error fetching tables:", error);
      }
    };
    fetchAvailableTables();
  }, []);

  // Fetch bookings from the API
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/RestaurantBooking");
        const data = await response.json();
        if (data.success) {
          // Sort bookings by date and time in descending order (newest first)
          const sortedBookings = data.data.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
          });
          setBookings(sortedBookings);
        } else {
          console.error("Failed to fetch bookings:", data.error);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // Open/Close Modal
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleEditOpen = (booking) => {
    setSelectedBooking(booking); // Set the selected booking to edit
    setEditOpen(true); // Open the modal
  };
  const handleEditClose = () => {
    setSelectedBooking(null); // Clear the selected booking
    setEditOpen(false); // Close the modal
  };

  // Add a new booking
  const addBooking = async (newBooking) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/RestaurantBooking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBooking),
        credentials: 'include', // Include cookies
      });
      const data = await response.json();
      if (data.success) {
        // Add the new booking at the beginning of the array
        setBookings((prevBookings) => [data.data, ...prevBookings]);
        handleClose();
        toast.success("Booking added successfully");
      } else {
        console.error("Failed to add booking:", data.error);
        toast.error("Failed to add booking");
      }
    } catch (error) {
      console.error("Error adding booking:", error);
      toast.error("Failed to add booking");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Edit Booking
  const handleEditBooking = async (updatedBooking) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/RestaurantBooking/${updatedBooking._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedBooking),
          credentials: 'include', // Include cookies
        }
      );
      const data = await response.json();
      if (data.success) {
        setBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking._id === updatedBooking._id ? updatedBooking : booking
          )
        );
        toast.success("Booking updated successfully");
        handleEditClose();
      } else {
        console.error("Failed to update booking:", data.error);
        toast.error("Failed to update booking");
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Delete Booking
  const handleDelete = async (id) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/RestaurantBooking/${id}`, {
        method: "DELETE",
        credentials: 'include', // Include cookies
      });
      const data = await response.json();
      if (data.success) {
        setBookings((prevBookings) =>
          prevBookings.filter((booking) => booking._id !== id)
        );
        toast.success("Booking deleted successfully");
      } else {
        console.error("Failed to delete booking:", data.error);
        toast.error("Failed to delete booking");
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Failed to delete booking");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div>
      <Navbar />
      <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
            />

      <div className="bg-amber-50 min-h-screen">
      
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
            <svg
              aria-hidden="true"
              className="inline w-16 h-16 text-gray-200 animate-spin dark:text-gray-600 fill-green-500"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span className="mt-4 text-gray-700">Loading Restaurant Bookings...</span>
          </div>
        </div>
      )}
      <Box sx={{ p: 3 }}>
        <Box sx={{ maxWidth: '80%', margin: '0 auto', mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography
              variant="h4"
              sx={{ color: "#064c61", fontWeight: "bold", flex: 1 }}
            >
              Restaurant Booking
            </Typography>
            <TextField
              placeholder="Search By Guest Name"
              variant="outlined"
              size="small"
              sx={{ minWidth: '300px', mx: 2 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={handleOpen}
              sx={{
                bgcolor: "#3b8242",
                fontWeight: "bold",
                color: "white",
                "&:hover": { bgcolor: "#173b1a" },
                minWidth: '150px'
              }}
            >
              Add New Booking
            </Button>
          </Box>
        </Box>
        <TableContainer component={Paper} sx={{ maxWidth: "80%", margin: "0 auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: "bold", color: "#28bfdb", textAlign: "center" }}>
                  Table No.
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#28bfdb", textAlign: "center" }}>
                  Date
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#28bfdb", textAlign: "center" }}>
                  Time
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#28bfdb", textAlign: "center" }}>
                  Guest Name
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#28bfdb", textAlign: "center" }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings
                .filter((booking) =>
                  booking.guestName.toLowerCase().includes(search.toLowerCase())
                )
                .map((booking) => (
                  <TableRow key={booking._id} hover>
                    <TableCell sx={{ textAlign: "center" }}>{booking.tableNo}</TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      {(() => {
                        const date = new Date(booking.date);
                        const day = String(date.getDate()).padStart(2, "0");
                        const month = String(date.getMonth() + 1).padStart(2, "0");
                        const year = date.getFullYear();
                        return `${day}/${month}/${year}`;
                      })()}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>{booking.time}</TableCell>
                    <TableCell sx={{ textAlign: "center" }}>{booking.guestName}</TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <IconButton
                        onClick={() => handleEditOpen(booking)}
                        sx={{ color: "#388E3C" }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(booking._id)}
                        sx={{ color: "#D32F2F" }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              {bookings.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                    sx={{ fontStyle: "italic", color: "#616161" }}
                  >
                    No bookings available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Modal for Editing Booking */}
        <Modal open={EditOpen} onClose={handleEditClose}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              bgcolor: "white",
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
              minWidth: 400,
              maxWidth: "80%",
            }}
          >
            {selectedBooking && (
              <Box
                component="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEditBooking(selectedBooking);
                }}
              >
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Edit Booking
                </Typography>
                {/* <TextField
                  fullWidth
                  label="Table No."
                  value={selectedBooking.tableNo}
                  onChange={(e) =>
                    setSelectedBooking({
                      ...selectedBooking,
                      tableNo: e.target.value,
                    })
                  }
                  sx={{ mb: 2 }}
                /> */}
                <FormControl required>
                  <InputLabel>Table No.</InputLabel>
                  <Select
                    label="Table No."
                    name="tableNo"
                    value={selectedBooking.tableNo}
                    onChange={(e) =>
                      setSelectedBooking({
                        ...selectedBooking,
                        tableNo: e.target.value,
                      })
                    }
                    sx={{ mb: 2 }}
                    fullWidth
                  >
                    <MenuItem value="">Select a table</MenuItem>
                    {availableTables.map((table) => (
                      <MenuItem key={table._id} value={table.tableNo}>
                        Table {table.tableNo}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={
                    new Date(selectedBooking.date).toISOString().split("T")[0]
                  }
                  onChange={(e) =>
                    setSelectedBooking({
                      ...selectedBooking,
                      date: e.target.value,
                    })
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Time"
        name="time"
        type="time"
                  value={selectedBooking.time}
                  onChange={(e) =>
                    setSelectedBooking({
                      ...selectedBooking,
                      time: e.target.value,
                    })
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Guest Name"
                  value={selectedBooking.guestName}
                  onChange={(e) =>
                    setSelectedBooking({
                      ...selectedBooking,
                      guestName: e.target.value,
                    })
                  }
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      bgcolor: "#3b8242",
                      fontWeight: "bold",
                      color: "white",
                    }}
                  >
                    Save Changes
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Modal>

        <Modal open={open} onClose={handleClose}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              bgcolor: "white",
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
              minWidth: 400,
              maxWidth: "80%",
            }}
          >
            <AddNewBookingForm onSubmit={addBooking} />
          </Box>
        </Modal>
      </Box>
      
    </div>
    <Footer />
    </div>
  );
};

export default RestaurantBooking;