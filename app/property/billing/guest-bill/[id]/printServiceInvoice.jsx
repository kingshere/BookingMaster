'use client'
import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Divider, Grid } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import axios from 'axios';
import { getCookie } from "cookies-next"; // Import getCookie from cookies-next
import { jwtVerify } from "jose"; // Import jwtVerify for decoding JWT


// Add print-specific styles
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    #printable-service-invoice, #printable-service-invoice * {
      visibility: visible;
    }
    #printable-service-invoice {
      position: absolute;
      left: 0;
      top: 0;
      background: white !important;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    body {
      background: white !important;
    }
  }
`;

const PrintableServiceInvoice = ({ billId }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [invoiceData, setInvoiceData] = useState(null);
    const [profile, setProfile] = useState(null);
    const [services, setServices] = useState([]);
    const [isPaid, setIsPaid] = useState(false);
    const [isCancelled, setIsCancelled] = useState(false);
    const [foodItems, setFoodItems] = useState([]);
    const [serviceItems, setServiceItems] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

    // Fetch menu items
    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                const token = document.cookie
                    .split("; ")
                    .find((row) => row.startsWith("authToken=") || row.startsWith("userAuthToken="))
                    .split("=")[1];
                const headers = { Authorization: `Bearer ${token}` };
                const menuResponse = await axios.get("/api/menuItem", { headers });
                setMenuItems(menuResponse.data.data);
            } catch (err) {
                console.error("Error fetching menu items:", err);
            }
        };
        fetchMenuItems();
    }, []);

    useEffect(() => {
        const fetchInvoiceData = async () => {
            try {
                const token = document.cookie
                    .split("; ")
                    .find((row) => row.startsWith("authToken=") || row.startsWith("userAuthToken="))
                    .split("=")[1];
                const headers = { Authorization: `Bearer ${token}` };
                console.log('billId', billId);
                const authtoken = getCookie('authToken');
                const usertoken = getCookie("userAuthToken");
                if (!authtoken && !usertoken) {
                    router.push("/"); // Redirect to login if no token is found
                    return;
                }

                let decoded, userId;
                if (authtoken) {
                    // Verify the authToken (legacy check)
                    decoded = await jwtVerify(authtoken, new TextEncoder().encode(SECRET_KEY));
                    userId = decoded.payload.id;
                }
                if (usertoken) {
                    // Verify the userAuthToken
                    decoded = await jwtVerify(usertoken, new TextEncoder().encode(SECRET_KEY));
                    userId = decoded.payload.profileId; // Use userId from the new token structure
                }

                // Fetch menu items for comparison
                const menuResponse = await axios.get("/api/menuItem", { headers });
                const menuItemsList = menuResponse.data.data;
                // 1. First fetch billing details
                const [billingResponse, profileResponse] = await Promise.all([
                    fetch(`/api/Billing/${billId}`),
                    fetch(`/api/Profile/${userId}`)
                ]);
                if (!billingResponse.ok || !profileResponse.ok) {
                    throw new Error('Failed to fetch data');
                }
                const [billing, profileData] = await Promise.all([
                    billingResponse.json(),
                    profileResponse.json()
                ]);
                console.log('Profile Data', profileData);
                const billingData = billing.data;
                // Set payment status
                setIsPaid(billingData.Bill_Paid?.toLowerCase() === 'yes');
                // Set cancellation status
                setIsCancelled(billingData.Cancelled?.toLowerCase() === 'yes');

                // 2. Fetch booking details using room number from billing
                const bookingsResponse = await fetch('/api/NewBooking');
                const bookingsData = await bookingsResponse.json();
                const roomsResponse = await fetch('/api/rooms');
                const roomsData = await roomsResponse.json();
                console.log('roomsData', roomsData.data);
                console.log('billingData', billingData);
                const matchedRooms = roomsData.data.filter((room) =>
                    billingData.roomNo.includes(String(room.number))
                );
                console.log('matchedRooms', matchedRooms);

                if (!matchedRooms) {
                    throw new Error("No matching room found");
                }
                // Fetch bookings
                const newBookingsResponse = await axios.get("/api/NewBooking", {
                    headers,
                });
                // Find bookings for all rooms
                const matchedBookings = await Promise.all(matchedRooms.map(async (room) => {
                    if (billingData.Bill_Paid === "yes" || billingData.Cancelled === "yes") {
                        const currentBillIndex = room.billWaitlist.findIndex(
                            (billId) => billId._id.toString() === billingData._id.toString()
                        );

                        if (currentBillIndex === -1) {
                            return null;
                        }

                        const correspondingGuestId = room.guestWaitlist[currentBillIndex];
                        return newBookingsResponse.data.data.find(
                            (booking) => booking._id === correspondingGuestId._id.toString()
                        );
                    } else {
                        return newBookingsResponse.data.data.find(
                            (booking) => booking._id === room.currentGuestId
                        );
                    }
                }));

                console.log('matchedBookings', matchedBookings);

                if (!matchedBookings) {
                    throw new Error("No matching booking found");
                }


                // Process existing items
                const existingServices = billingData.itemList || [];
                const existingPrices = billingData.priceList || [];
                const existingTaxes = billingData.taxList || [];
                const existingQuantities = billingData.quantityList || [];

                // Separate food and service items
                const foodItemsArray = [];
                const serviceItemsArray = [];

                existingServices.forEach((roomServices, roomIndex) => {
                    const roomPrices = existingPrices[roomIndex] || [];
                    const roomTaxes = existingTaxes[roomIndex] || [];
                    const roomQuantities = existingQuantities[roomIndex] || [];

                    roomServices.forEach((item, itemIndex) => {
                        const menuItem = menuItemsList.find(
                            (menuItem) => menuItem.itemName === item
                        );

                        const itemDetails = {
                            name: item,
                            price: roomPrices[itemIndex] || 0,
                            quantity: roomQuantities[itemIndex] || 1,
                            tax: roomTaxes[itemIndex] || 0,
                            roomIndex: roomIndex,
                        };

                        if (menuItem) {
                            foodItemsArray.push(itemDetails);
                        } else if (item !== "Room Charge") {
                            serviceItemsArray.push(itemDetails);
                        }
                    });
                });

                setFoodItems(foodItemsArray);
                setServiceItems(serviceItemsArray);
                setServices([...serviceItemsArray, ...foodItemsArray]);

                setServices(serviceItems);
                setInvoiceData({ billing: billingData, booking: matchedBookings[0] });
                setProfile(profileData.data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchInvoiceData();
    }, [billId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
                <svg aria-hidden="true" className="inline w-16 h-16 text-gray-200 animate-spin dark:text-gray-600 fill-green-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                </svg>
                <span className="mt-4 text-gray-700">Loading Invoice...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography color="error">Error: {error}</Typography>
            </Box>
        );
    }

    const { booking, billing } = invoiceData;
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-GB');
    const formattedTime = currentDate.toLocaleTimeString();

    // Calculate total services amount
    const totalServicesAmount = serviceItems.reduce((total, service) => total + service.price, 0);
    const serviceTax = serviceItems.reduce((tax, service) => tax + service.tax, 0);

    return (
        <>
            <style>{printStyles}</style>
            <Box id="printable-invoice" sx={{ p: 4, maxWidth: '800px', margin: 'auto', bgcolor: '#f5f5f5', borderRadius: 2, maxHeight: '90vh', overflowY: 'auto', overflowX: 'hidden' }}>
                <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <RestaurantIcon sx={{ fontSize: 40, mr: 2, color: '#00bcd4' }} />
                                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#00bcd4' }}>
                                    {profile.hotelName}
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                {profile.addressLine1}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                {profile.addressLine2}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                {profile.district}, {profile.country} - {profile.pincode}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                Phone: {profile.mobileNo}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                Email: {profile.email}
                            </Typography>
                            {profile.website && (
                                <Typography variant="body2" color="textSecondary">
                                    Website: {profile.website}
                                </Typography>
                            )}
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                GST No: {profile.gstNo}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sx={{ textAlign: 'right' }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#00bcd4' }}>
                                Service Invoice
                            </Typography>
                            <Typography variant="body1" color="textSecondary">
                                #{booking.bookingId}
                            </Typography>
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    {/* Guest Details */}
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        <Grid item xs={6}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Guest Details:</Typography>
                            <Typography variant="body1">{booking.guestName}</Typography>
                            <Typography variant="body2" color="textSecondary">
                                Phone: +91 {booking.mobileNo}
                            </Typography>
                            <Typography variant="body1">Customer GST No.: {booking.gstin}</Typography>
                        </Grid>
                        <Grid item xs={6} sx={{ textAlign: 'right' }}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Invoice Date:</Typography>
                            <Typography variant="body1">{formattedDate}</Typography>
                            <Typography variant="body1" color="textSecondary">
                                Time: {formattedTime}
                            </Typography>
                        </Grid>
                    </Grid>

                    {/* Services Table */}
                    <TableContainer component={Paper} elevation={0} sx={{ mb: 4 }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#00bcd4' }}>
                                    <TableCell sx={{ color: 'white' }}>Room No.</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Service</TableCell>
                                    <TableCell align="center" sx={{ color: 'white' }}>Quantity</TableCell>
                                    <TableCell align="center" sx={{ color: 'white' }}>Tax</TableCell>
                                    <TableCell align="right" sx={{ color: 'white' }}>Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {serviceItems.map((service, index) => (
                                    <TableRow key={index}>
                                        <TableCell>Room #{billing.roomNo[service.roomIndex]}</TableCell>
                                        <TableCell>{service.name}</TableCell>
                                        <TableCell align="center">{service.quantity}</TableCell>
                                        <TableCell align="center">{service.tax}%</TableCell>
                                        <TableCell align="right">₹{(parseFloat(service.price) || 0).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Total Calculation */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Box sx={{ width: '250px' }}>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="body1">IGST:</Typography>
                                    <Typography variant="body1">CGST:</Typography>
                                    <Typography variant="body1">SGST:</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>Total:</Typography>
                                </Grid>
                                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                    <Typography variant="body1">{serviceTax.toFixed(2)}%</Typography>
                                    <Typography variant="body1">{(serviceTax / 2).toFixed(2)}%</Typography>
                                    <Typography variant="body1">{(serviceTax / 2).toFixed(2)}%</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                                        ₹{totalServicesAmount.toFixed(2)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                    {/* Paid Image */}
                    {isPaid && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                            <img
                                src="/paid.png"
                                alt="Paid"
                                style={{
                                    width: '250px',
                                    height: 'auto',
                                    opacity: 0.8
                                }}
                            />
                        </Box>
                    )}

                    {/* Cancelled Image */}
                    {isCancelled && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                            <img
                                src="/cancelled.png"
                                alt="Cancelled"
                                style={{
                                    width: '250px',
                                    height: 'auto',
                                    opacity: 0.8
                                }}
                            />
                        </Box>
                    )}

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2, textAlign: 'center' }}>
                        Thank you for using our services.
                    </Typography>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<PrintIcon />}
                            onClick={handlePrint}
                            sx={{ bgcolor: '#00bcd4', '&:hover': { bgcolor: '#00acc1' } }}
                        >
                            Print Service Invoice
                        </Button>
                    </Box>

                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Typography variant="caption" color="textSecondary">
                            Invoice generated on {formattedDate} at {formattedTime}
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </>
    );
};

export default PrintableServiceInvoice;