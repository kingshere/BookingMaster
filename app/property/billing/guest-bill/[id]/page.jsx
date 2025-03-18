"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Navbar from "../../../../_components/Navbar";
import { Footer } from "../../../../_components/Footer";
import PrintableRoomInvoice from "./printRoomInvoice";
import PrintableServiceInvoice from "./printServiceInvoice";
import PrintableFoodInvoice from "./printFoodInvoice";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
} from "@mui/material";

const BookingDashboard = () => {
  const { id } = useParams();
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remainingDueAmount, setRemainingDueAmount] = useState(0);
  const [printableRoomInvoice, setPrintableRoomInvoice] = useState(null);
  const [printableFoodInvoice, setPrintableFoodInvoice] = useState(null);
  const [printableServiceInvoice, setPrintableServiceInvoice] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  // Modal States
  const [openRoomInvoiceModal, setOpenRoomInvoiceModal] = useState(false);
  const [openServiceInvoiceModal, setOpenServiceInvoiceModal] = useState(false);
  const [openServicesModal, setOpenServicesModal] = useState(false);
  const [openFoodModal, setOpenFoodModal] = useState(false);
  const [openFoodInvoiceModal, setOpenFoodInvoiceModal] = useState(false);
  const [openBillPaymentModal, setOpenBillPaymentModal] = useState(false);
  // Service Form States
  const [serviceName, setServiceName] = useState("");
  const [serviceTax, setServiceTax] = useState("0");
  const [servicePrice, setServicePrice] = useState("0");
  const [serviceTotal, setServiceTotal] = useState("0");
  const [services, setServices] = useState([]);
  // Food Form States
  const [menuItems, setMenuItems] = useState([]);
  const [selectedFoodItem, setSelectedFoodItem] = useState([]);
  const [foodName, setFoodName] = useState("");
  const [foodPrice, setFoodPrice] = useState("");
  const [foodTax, setFoodTax] = useState("");
  const [foodQuantity, setFoodQuantity] = useState(1);
  const [selectedFoodItems, setSelectedFoodItems] = useState([]);
  // Payment Form States
  const [modeOfPayment, setModeOfPayment] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  // Separated Items Lists
  const [foodItems, setFoodItems] = useState([]);
  const [serviceItems, setServiceItems] = useState([]);
  // Add new state variables for remarks
  const [foodRemarks, setFoodRemarks] = useState("");
  const [serviceRemarks, setServiceRemarks] = useState("");
  const [roomRemarks, setRoomRemarks] = useState("");
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);
  // Modal Styles
  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
  };

  // Calculate service total when price or tax changes
  useEffect(() => {
    const today = new Date();
    if (servicePrice && serviceTax) {
      const price = parseFloat(servicePrice);
      const taxRate = parseFloat(serviceTax);
      const total = price + (price * taxRate) / 100;
      setServiceTotal(total.toFixed(2));
    } else {
      setServiceTotal("");
    }
  }, [servicePrice, serviceTax]);

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken=") || row.startsWith("userAuthToken="))
        .split("=")[1];
      const headers = { Authorization: `Bearer ${token}` };
        const menuResponse = await fetch("/api/menuItem");
        const menuData = await menuResponse.json();
        setMenuItems(menuData.data);
      } catch (err) {
        console.error("Error fetching menu items:", err);
      }
    };
    fetchMenuItems();
  }, []);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("authToken=") || row.startsWith("userAuthToken="))
          .split("=")[1];
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch menu items for comparison
        const menuResponse = await axios.get("/api/menuItem", { headers });
        const menuItemsList = menuResponse.data.data;

        // Fetch billing details
        const billingResponse = await axios.get(`/api/Billing/${id}`, {
          headers,
        });
        const billingData = billingResponse.data.data;
        console.log("billingData", billingData.dueAmount);
        setRemainingDueAmount(billingData.dueAmount);

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

        // Fetch room details - Modified to handle multiple rooms
        const roomsResponse = await axios.get("/api/rooms", { headers });
        const matchedRooms = roomsResponse.data.data.filter((room) =>
          billingData.roomNo.includes(String(room.number))
        );

        if (matchedRooms.length === 0) {
          throw new Error("No matching rooms found");
        }
        console.log("matchedRooms", matchedRooms);

        // Fetch room categories
        const roomCategoriesResponse = await axios.get("/api/roomCategories", {
          headers,
        });

        // Get categories for all matched rooms
        const matchedCategories = matchedRooms.map(room =>
          roomCategoriesResponse.data.data.find(
            category => category._id === room.category._id
          )
        );

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

        // Filter out duplicates and null values
        const uniqueBookings = Array.from(
          new Set(matchedBookings.filter(booking => booking).map(JSON.stringify))
        ).map(JSON.parse);
        console.log("uniqueBookings", uniqueBookings);
        setBookingData({
          billing: billingData,
          bookings: uniqueBookings, // Use unique bookings
          rooms: matchedRooms,
          categories: matchedCategories,
        });
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error("Error fetching booking details:", err);
      }
    };
    fetchBookingDetails();
  }, [id]);

  // Handler functions for modals
  const handleOpenServicesModal = () => {
    setOpenServicesModal(true);
    setServiceName("");
    setServicePrice("");
    setServiceTax("");
    setServiceTotal("");
  };
  const handleCloseServicesModal = () => {
    setOpenServicesModal(false);
    setServiceName("");
    setServicePrice("");
    setServiceTax("");
    setServiceTotal("");
  };

  const handleRoomPrintPreview = (billing) => {
    setPrintableRoomInvoice(billing);
    setShowPrintModal(true);
  };

  const handleServicePrintPreview = (billing) => {
    setPrintableServiceInvoice(billing);
    setShowPrintModal(true);
  };

  const handleFoodPrintPreview = (billing) => {
    setPrintableFoodInvoice(billing);
    setShowPrintModal(true);
  };

  const handleOpenRoomInvoiceModal = () => setOpenRoomInvoiceModal(true);
  const handleCloseRoomInvoiceModal = () => setOpenRoomInvoiceModal(false);
  const handleOpenServiceInvoiceModal = () => setOpenServiceInvoiceModal(true);
  const handleCloseServiceInvoiceModal = () =>
    setOpenServiceInvoiceModal(false);
  const handleOpenFoodInvoiceModal = () => setOpenFoodInvoiceModal(true);
  const handleCloseFoodInvoiceModal = () => setOpenFoodInvoiceModal(false);
  const handleOpenFoodModal = () => {
    setOpenFoodModal(true);
    setSelectedFoodItem([]);
    setFoodName("");
    setFoodPrice("");
    setFoodTax("");
  };
  const handleCloseFoodModal = () => setOpenFoodModal(false);
  const handleOpenBillPaymentModal = () => setOpenBillPaymentModal(true);
  const handleCloseBillPaymentModal = () => {
    setOpenBillPaymentModal(false);
    setPaymentAmount("");
  };

  // Handler functions for form submissions
  const handleAddService = async () => {
    if (!serviceName || !servicePrice || !serviceTax) {
      alert("Please enter service name, price, and tax");
      return;
    }
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        .split("=")[1];
      const headers = { Authorization: `Bearer ${token}` };
      const updatedItemList = billing.itemList.map((items, index) =>
        index === selectedRoomIndex ? [...items, serviceName] : items
      );

      const updatedPriceList = billing.priceList.map((prices, index) =>
        index === selectedRoomIndex
          ? [...prices, parseFloat(serviceTotal)]
          : prices
      );

      const updatedTaxList = billing.taxList.map((taxes, index) =>
        index === selectedRoomIndex ? [...taxes, parseFloat(serviceTax)] : taxes
      );

      const updatedQuantityList = billing.quantityList.map(
        (quantities, index) =>
          index === selectedRoomIndex ? [...quantities, 1] : quantities
      );
      console.log("itemlist", updatedItemList);
      const response = await axios.put(
        `/api/Billing/${id}`,
        {
          itemList: updatedItemList,
          priceList: updatedPriceList,
          taxList: updatedTaxList,
          quantityList: updatedQuantityList,
          roomIndex: selectedRoomIndex,
          ServiceRemarks: [...billing.ServiceRemarks, serviceRemarks],
        },
        { headers }
      );
      // Update local state
      const newService = {
        roomIndex: selectedRoomIndex,
        name: serviceName,
        price: serviceTotal,
        tax: serviceTax,
        quantity: 1,
      };
      setServices([...services, newService]);
      handleCloseServicesModal();
      // window.location.reload();
    } catch (error) {
      console.error("Error adding service:", error);
      alert("Failed to add service");
    }
  };

  const handleFoodItemChange = (event) => {
    const selectedItem = menuItems.find(
      (item) => item.itemName === event.target.value
    );
    if (selectedItem) {
      setSelectedFoodItem(selectedItem);
      setFoodName(selectedItem.itemName || "");
      setFoodPrice(selectedItem.price?.toString() || "0");
      setFoodTax(((selectedItem.sgst + selectedItem.cgst) || 0).toString());
      setFoodQuantity(1);
    }
  };

  const calculateTotalWithTax = (price, tax, quantity) => {
    const basePrice = parseFloat(price) * quantity;
    const taxAmount = (basePrice * parseFloat(tax)) / 100;
    return basePrice + taxAmount;
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setFoodQuantity(value);
    }
  };

  const handleAddToList = () => {
    if (!selectedFoodItem) {
      alert("Please select a food item");
      return;
    }

    const totalPriceWithTax = calculateTotalWithTax(
      selectedFoodItem.price,
      selectedFoodItem.sgst + selectedFoodItem.cgst,
      foodQuantity
    );

    const newItem = {
      selectedFoodItem,
      quantity: foodQuantity,
      totalPrice: totalPriceWithTax
    };
    setSelectedFoodItems([...selectedFoodItems, newItem]);
    setSelectedFoodItem([]);
    setFoodName("");
    setFoodPrice("");
    setFoodTax("");
    setFoodQuantity(1);
  };


  const handleRemoveItem = (index) => {
    const updatedItems = selectedFoodItems.filter((_, idx) => idx !== index);
    setSelectedFoodItems(updatedItems);
  };

  const handleUpdateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    const updatedItems = selectedFoodItems.map((item, idx) => {
      if (idx === index) {
        const totalPriceWithTax = calculateTotalWithTax(
          item.selectedFoodItem.price,
          item.selectedFoodItem.sgst + item.selectedFoodItem.cgst,
          newQuantity
        );
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: totalPriceWithTax
        };
      }
      return item;
    });
    setSelectedFoodItems(updatedItems);
  };


  const handleAddFood = async () => {
    if (selectedFoodItems.length === 0) {
      alert("Please add at least one food item");
      return;
    }
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        .split("=")[1];
      const headers = { Authorization: `Bearer ${token}` };

      const foodUpdates = selectedFoodItems.map(item => ({
        name: item.selectedFoodItem.itemName,
        price: item.totalPrice, // This is now the total price including tax
        tax: Number(item.selectedFoodItem.sgst + item.selectedFoodItem.cgst) || 0,
        quantity: Number(item.quantity)
      }));

      // Get current billing state
      const billingResponse = await axios.get(`/api/Billing/${id}`, { headers });
      const currentBilling = billingResponse.data.data;

      // Update arrays immutably
      const updatedItemList = currentBilling.itemList.map(arr => [...arr]);
      const updatedPriceList = currentBilling.priceList.map(arr => [...arr]);
      const updatedQuantityList = currentBilling.quantityList.map(arr => [...arr]);
      const updatedTaxList = currentBilling.taxList.map(arr => [...arr]);

      foodUpdates.forEach(item => {
        updatedItemList[selectedRoomIndex].push(item.name);
        updatedPriceList[selectedRoomIndex].push(item.price);
        updatedQuantityList[selectedRoomIndex].push(item.quantity);
        updatedTaxList[selectedRoomIndex].push(item.tax);
      });

      await axios.put(`/api/Billing/${id}`, {
        itemList: updatedItemList,
        priceList: updatedPriceList,
        quantityList: updatedQuantityList,
        taxList: updatedTaxList,
        roomIndex: selectedRoomIndex,
        FoodRemarks: [...currentBilling.FoodRemarks, foodRemarks]
      }, { headers });

      setServices([...services, ...foodUpdates.map(item => ({
        ...item,
        roomIndex: selectedRoomIndex
      }))]);

      handleCloseFoodModal();
    } catch (error) {
      console.error("Error adding food:", error);
      alert("Failed to add food items");
    }
  };


  const handleAddPayment = async () => {
    const paymentAmountNum = Number(paymentAmount);
    if (!paymentAmount || paymentAmountNum <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }
    if (paymentAmountNum > remainingDueAmount) {
      alert(
        `Payment amount cannot exceed remaining due amount of ${remainingDueAmount}`
      );
      return;
    }
    if (!modeOfPayment) {
      alert("Please select a mode of payment");
      return;
    }
    try {
      const currentDate = new Date().toISOString();
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        .split("=")[1];
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.put(
        `/api/Billing/${id}`,
        {
          amountAdvanced: paymentAmountNum + bookingData.billing.amountAdvanced,
          DateOfPayment: [currentDate],
          ModeOfPayment: [modeOfPayment],
          AmountOfPayment: [paymentAmountNum],
          RoomRemarks: [roomRemarks], // Add room remarks
        },
        { headers }
      );
      const updatedBillingData = response.data.data;
      const updatedBookingData = { ...bookingData };
      updatedBookingData.billing = updatedBillingData;
      setBookingData(updatedBookingData);
      setRemainingDueAmount(updatedBillingData.dueAmount);
      handleCloseBillPaymentModal();
      setPaymentAmount("");
      setModeOfPayment("");
      window.location.reload();
    } catch (error) {
      console.error("Error adding payment:", error);
      alert(error.response?.data?.error || "Failed to add payment");
    }
  };

  const handleCompletePayment = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        .split("=")[1];
      const headers = { Authorization: `Bearer ${token}` };

      // Step 1: Update Billing API
      await axios.put(
        `/api/Billing/${id}`,
        {
          Bill_Paid: "yes",
          dueAmount: 0,
        },
        { headers }
      );

      // Step 2: Update NewBooking API to set CheckOut to true
      await axios.put(
        `/api/NewBooking/${bookingData.bookings[0]._id}`, // Use the first booking's ID
        {
          CheckedOut: true,
        },
        { headers }
      );

      // Step 3: Update multiple rooms
      const roomUpdatePromises = bookingData.rooms.map(async (room) => {
        // Get current room data
        const currentRoomResponse = await axios.get(`/api/rooms/${room._id}`, {
          headers,
        });
        const currentRoomData = currentRoomResponse.data.data;

        // Find position of current bill in the waitlist
        const currentPosition = currentRoomData.billWaitlist.findIndex(
          (billId) => billId._id.toString() === bookingData.billing._id.toString()
        );

        // Prepare update data
        let updateData = {
          billWaitlist: currentRoomData.billWaitlist,
          guestWaitlist: currentRoomData.guestWaitlist,
          checkInDateList: currentRoomData.checkInDateList,
          checkOutDateList: currentRoomData.checkOutDateList,
        };

        // Check if there's a next booking
        const hasNextBooking =
          currentPosition < currentRoomData.billWaitlist.length - 1;

        if (hasNextBooking) {
          updateData = {
            ...updateData,
            currentBillingId: currentRoomData.billWaitlist[currentPosition + 1],
            currentGuestId: currentRoomData.guestWaitlist[currentPosition + 1],
            occupied: "Vacant",
            clean: true,
            billingStarted: "No",
          };
        } else {
          updateData = {
            ...updateData,
            currentBillingId: null,
            currentGuestId: null,
            occupied: "Vacant",
            clean: true,
            billingStarted: "No",
          };
        }

        // Update room with new data
        return axios.put(`/api/rooms/${room._id}`, updateData, { headers });
      });

      // Wait for all room updates to complete
      await Promise.all(roomUpdatePromises);

      // Update state
      setRemainingDueAmount(0);
      alert("Payment completed successfully for all rooms!");
      window.location.reload();
    } catch (error) {
      console.error("Error completing payment:", error);
      alert("Failed to complete payment");
    }
  };

  if (loading) {
    return (
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
          <span className="mt-4 text-gray-700">Loading Bill...</span>
        </div>
      </div>
    );
  }
  if (error) {
    return <div>Error: {error}</div>;
  }
  const { billing, booking, room, category } = bookingData;

  console.log("Booking Data: ", billing);
  return (
    <div className="min-h-screen bg-amber-50">
      <Navbar />
      <div className="p-6">
        <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg p-6">
          {/* Header */}
          <h2 className="text-xl font-semibold text-gray-800">
            Booking Dashboard{" "}
            {console.log("Booking Data: ", bookingData.bookings.bookingId)}
            <span className="text-gray-500">({bookingData.bookings[0].bookingId})</span>
          </h2>

          {/* Booking Information */}
          <div className="mt-4 bg-blue-100 p-4 rounded">
            <p className="text-lg font-semibold">
              {bookingData.bookings[0].guestName}{" "}
              <span className="text-sm text-green-700 bg-green-100 px-2 py-1 rounded">
                Posting On
              </span>
            </p>
            <p className="mt-2 text-sm text-gray-700">
              Check-In:{" "}
              <strong>
                {new Date(bookingData.bookings[0].checkIn).toLocaleDateString("en-GB")}
              </strong>{" "}
              | Expected Check-Out:{" "}
              <strong>
                {new Date(bookingData.bookings[0].checkOut).toLocaleDateString("en-GB")}
              </strong>{" "}
              | Phone No: <strong>+91 {bookingData.bookings[0].mobileNo}</strong>
            </p>
            <p className="mt-1 text-sm text-gray-700">
              Guest ID: <strong>{bookingData.bookings[0].guestid}</strong> | Date of Birth:{" "}
              <strong>
                {new Date(bookingData.bookings[0].dateofbirth).toLocaleDateString("en-GB")}
              </strong>{" "}
              | Booking Type: <strong>{bookingData.bookings[0].bookingType}</strong> | Booking
              Source: <strong>{bookingData.bookings[0].bookingSource}</strong>
            </p>
            <p className="mt-1 text-sm text-gray-700">
              Booked On:{" "}
              <strong>
                {new Date(bookingData.bookings[0].createdAt).toLocaleDateString("en-GB")}
              </strong>{" "}
              | PAX:{" "}
              <strong>
                {bookingData.bookings[0].adults} Adult {bookingData.bookings[0].children} Child
              </strong>{" "}
              | Meal Plan: <strong>{bookingData.bookings[0].mealPlan}</strong> | Notes:{" "}
              <strong>{bookingData.bookings[0].remarks || "-"}</strong>
            </p>
          </div>

          {/* Rooms Booked */}
          <div className="mt-6 bg-blue-50 p-4 rounded">
            <h3 className="font-semibold text-gray-800">Rooms Booked</h3>
            <p className="text-sm text-gray-700">
              {new Date(bookingData.bookings[0].checkIn).toLocaleDateString()} (
              {new Date(bookingData.bookings[0].checkIn).toLocaleString("default", {
                weekday: "short",
              })}
              ) &raquo; Rooms:{" "}
              {Array.isArray(billing.roomNo)
                ? billing.roomNo.join(", ")
                : billing.roomNo}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 grid grid-cols-3 md:grid-cols-3 gap-3">
            {[
              // In your button configuration array:
              {
                label: "Add Services",
                color: "primary",
                variant: "contained",
                onClick: handleOpenServicesModal,
                disabled:
                  billing.Bill_Paid === "yes" ||
                  billing.Cancelled === "yes" ||
                  new Date(bookingData.bookings[0].checkIn).toLocaleDateString("en-GB") > new Date().toLocaleDateString("en-GB"),
              },
              {
                label: "Add Food",
                color: "success",
                variant: "contained",
                onClick: handleOpenFoodModal,
                disabled:
                  billing.Bill_Paid === "yes" ||
                  billing.Cancelled === "yes" ||
                  new Date(bookingData.bookings[0].checkIn).toLocaleDateString("en-GB") > new Date().toLocaleDateString("en-GB"),
              },
              {
                label: "Bill Payment",
                color: remainingDueAmount <= 0 ? "secondary" : "error",
                variant: "contained",
                onClick:
                  remainingDueAmount > 0
                    ? handleOpenBillPaymentModal
                    : undefined,
                disabled:
                  remainingDueAmount <= 0 ||
                  billing.Cancelled === "yes" ||
                  new Date(bookingData.bookings[0].checkIn).toLocaleDateString("en-GB") > new Date().toLocaleDateString("en-GB"),
              },
            ].map((btn, index) => (
              <Button
                key={index}
                variant={btn.variant}
                color={btn.color}
                onClick={btn.onClick}
                disabled={btn.disabled}
                fullWidth
              >
                {btn.label}
              </Button>
            ))}
          </div>
          {/* Bill Payment Modal */}
          <Modal
            open={openBillPaymentModal}
            onClose={handleCloseBillPaymentModal}
            aria-labelledby="bill-payment-modal"
          >
            <Box sx={modalStyle}>
              <Typography id="bill-payment-modal" variant="h6" component="h2">
                Bill Payment
              </Typography>
              <TextField
                fullWidth
                margin="normal"
                label="Payment Amount"
                type="number"
                helperText={`Remaining Due: ₹${remainingDueAmount.toFixed(2)}`}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                inputProps={{
                  max: remainingDueAmount,
                  min: 0,
                }}
              />
              <TextField
                fullWidth
                margin="normal"
                select
                label="Mode of Payment"
                value={modeOfPayment}
                onChange={(e) => setModeOfPayment(e.target.value)}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="" disabled></option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Other">Other</option>
              </TextField>
              <TextField
                fullWidth
                margin="normal"
                label="Room Remarks (Optional)"
                multiline
                rows={3}
                value={roomRemarks}
                onChange={(e) => setRoomRemarks(e.target.value)}
              />
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddPayment}
                  disabled={parseFloat(paymentAmount) > remainingDueAmount}
                >
                  Submit Payment
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleCloseBillPaymentModal}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Modal>

          {/* Billing Summary */}
          <div className="mt-6 bg-green-200 p-4 rounded">
            <h3 className="font-semibold text-gray-800">Billing Summary</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="text-gray-700">
                <p>Total Room Charges (incl. GST):</p>
                <p>Billed Amount:</p>
                <p>Cumulative Paid Amount:</p>
                <p>Due Amount:</p>
              </div>
              <div className="text-gray-800 font-semibold text-right">
                {(() => {
                  // Calculate total room charges
                  const totalRoomCharges = billing.priceList.reduce((sum, priceArray) => {
                    // Check if priceArray is an array and has values
                    const price = Array.isArray(priceArray) ? parseFloat(priceArray[0]) || 0 : 0;
                    return sum + price;
                  }, 0);

                  // Display the total
                  return totalRoomCharges.toFixed(2);
                })()}

                <p>{parseFloat(billing.totalAmount).toFixed(2)}</p>

                <p>{parseFloat(billing.amountAdvanced).toFixed(2)}</p>

                <p>{parseFloat(billing.dueAmount).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Payments and Room Tokens */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-800 text-center ml-16">
              Payments ({billing.DateOfPayment.length})
            </h3>
            <table className="w-full mt-2 bg-gray-100 rounded text-sm mb-4">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-center">Mode of Payment</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* Rows for each payment in the arrays */}
                {billing.DateOfPayment.map((date, index) => (
                  <tr key={index}>
                    <td className="p-2 text-left">
                      {new Date(date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="p-2 text-center">
                      {billing.ModeOfPayment[index]}
                    </td>
                    <td className="p-2 text-right">
                      {parseFloat(billing.AmountOfPayment[index]).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Button
              variant="contained"
              color="warning"
              className="mt-6 mb-4"
              disabled={
                remainingDueAmount > 0 ||
                billing.Bill_Paid === "yes" ||
                billing.Cancelled === "yes" ||
                new Date(bookingData.bookings[0].checkIn).toLocaleDateString("en-GB") > new Date().toLocaleDateString("en-GB")
              }
              onClick={handleCompletePayment}
            >
              Complete Payment
            </Button>

            <h3 className="mt-4 font-semibold text-gray-800 text-center ml-16">
              Room Tokens ({billing.roomNo.length})
            </h3>
            <table className="w-full mt-2 bg-gray-100 rounded text-sm mb-4">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-center">Room Details</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {billing.roomNo.map((roomNumber, index) => (
                  <tr key={index}>
                    <td className="p-2 text-left">
                      {new Date(bookingData.bookings[0].checkIn).toLocaleDateString("en-GB")}
                    </td>
                    <td className="p-2 text-center">
                      Room # {roomNumber} - {bookingData.rooms[index].category.category}
                    </td>
                    <td className="p-2 text-right">
                      {billing.priceList[index][0].toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button
              variant="contained"
              color="info"
              className="mt-4 mb-4"
              onClick={() => handleRoomPrintPreview(billing)}
            >
              Print Room Invoice
            </Button>
            {/* Room Invoice Modal */}
            {showPrintModal && printableRoomInvoice && (
              <div className="modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white p-6 rounded shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-end mb-4">
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded"
                      onClick={() => {
                        setShowPrintModal(false);
                        setPrintableRoomInvoice(null);
                      }}
                    >
                      Close
                    </button>
                  </div>
                  <PrintableRoomInvoice billId={id} />
                </div>
              </div>
            )}
            {/* Services Table */}
            <h3 className="font-semibold text-gray-800 text-center ml-16">
              Services ({serviceItems.length})
            </h3>
            <table className="w-full mt-2 bg-gray-100 rounded text-sm mb-4">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">Room No.</th>
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 text-center">Item Quantity</th>
                  <th className="p-2 text-center">Item Tax</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {serviceItems.map((service, index) => (
                  <tr key={index}>
                    <td className="p-2 text-left">Room #{billing.roomNo[service.roomIndex]}</td>
                    <td className="p-2 text-left">{service.name}</td>
                    <td className="p-2 text-center">{service.quantity}</td>
                    <td className="p-2 text-center">{service.tax}%</td>
                    <td className="p-2 text-right">
                      {(parseFloat(service.price) || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Add Services Modal */}
            <Modal
              open={openServicesModal}
              onClose={handleCloseServicesModal}
              aria-labelledby="add-services-modal"
            >
              <Box sx={modalStyle}>
                <Typography id="add-services-modal" variant="h6" component="h2">
                  Add Service
                </Typography>
                {/* Room Selection Dropdown */}
                <FormControl fullWidth margin="normal">
                  <Typography
                    id="add-services-modal"
                    variant="h9"
                    component="h1"
                    sx={{ color: "text.secondary" }}
                    mb={1}
                  >
                    Select Room
                  </Typography>
                  <Select
                    value={selectedRoomIndex}
                    onChange={(e) =>
                      setSelectedRoomIndex(Number(e.target.value))
                    }
                  >
                    {billing.roomNo.map((room, index) => (
                      <MenuItem key={index} value={index}>
                        Room {room}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Service Details"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Service Price"
                  type="number"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Service Tax (%)"
                  type="number"
                  value={serviceTax}
                  onChange={(e) => setServiceTax(e.target.value)}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  readOnly
                  disabled
                  label="Total Amount"
                  type="number"
                  value={serviceTotal}
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Remarks (Optional)"
                  multiline
                  rows={3}
                  value={serviceRemarks}
                  onChange={(e) => setServiceRemarks(e.target.value)}
                />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 2,
                  }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddService}
                  >
                    Submit
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleCloseServicesModal}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Modal>

            {/* Add Food Modal */}
            <Modal
              open={openFoodModal}
              onClose={handleCloseFoodModal}
              aria-labelledby="add-food-modal"
            >
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 600,
                  bgcolor: "background.paper",
                  border: "2px solid #000",
                  boxShadow: 24,
                  p: 4,
                  maxHeight: "80vh", // Set a maximum height
                  overflowY: "auto", // Enables scrolling
                }}
              >
                <Typography id="add-food-modal" variant="h6" component="h2">
                  Add Food Items
                </Typography>
                {/* Room Selection Dropdown */}
                <FormControl fullWidth margin="normal">
                  <Typography
                    id="add-foods-modal"
                    variant="h9"
                    component="h1"
                    sx={{ color: "text.secondary" }}
                    mb={1}
                  >
                    Select Room
                  </Typography>
                  <Select
                    value={selectedRoomIndex}
                    onChange={(e) =>
                      setSelectedRoomIndex(Number(e.target.value))
                    }
                  >
                    {billing.roomNo.map((room, index) => (
                      <MenuItem key={index} value={index}>
                        Room {room}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Food Selection Form */}
                <div className="mb-4">
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Food Item</InputLabel>
                    <Select
                      value={foodName}
                      label="Food Item"
                      onChange={handleFoodItemChange}
                    >
                      {menuItems.map((item) => (
                        <MenuItem key={item._id} value={item.itemName}>
                          {item.itemName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    margin="normal"
                    readOnly
                    disabled
                    label="Food Price"
                    value={foodPrice}
                    InputProps={{ readOnly: true }}
                  />

                  <TextField
                    fullWidth
                    margin="normal"
                    readOnly
                    disabled
                    label="Food Tax (%)"
                    value={foodTax}
                    InputProps={{ readOnly: true }}
                  />

                  <TextField
                    fullWidth
                    margin="normal"
                    type="number"
                    label="Quantity"
                    value={foodQuantity}
                    onChange={handleQuantityChange}
                    inputProps={{ min: 1 }}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Food Remarks (Optional)"
                    multiline
                    rows={3}
                    value={foodRemarks}
                    onChange={(e) => setFoodRemarks(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleAddToList}
                    disabled={!selectedFoodItem}
                    sx={{ mt: 2 }}
                  >
                    Add to List
                  </Button>
                </div>

                {/* Selected Items Table */}
                {selectedFoodItems.length > 0 && (
                  <div className="mt-4">
                    <Typography className="text-center" variant="h6">
                      Selected Items
                    </Typography>
                    <table className="w-full mt-2">
                      <thead>
                        <tr>
                          <th className="text-left">Item Name</th>
                          <th className="text-center">Price</th>
                          <th className="text-center">Quantity</th>
                          <th className="text-center">Total</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedFoodItems.map((item, index) => (
                          <tr key={index}>
                            <td className="text-left">{item.itemName}</td>
                            <td className="text-center">₹{item.price}</td>
                            <td className="text-center">
                              <div>
                                <Button
                                  size="small"
                                  onClick={() =>
                                    handleUpdateQuantity(
                                      index,
                                      item.quantity - 1
                                    )
                                  }
                                >
                                  -
                                </Button>
                                <span className="text-center mx-2">
                                  {item.quantity}
                                </span>
                                <Button
                                  size="small"
                                  onClick={() =>
                                    handleUpdateQuantity(
                                      index,
                                      item.quantity + 1
                                    )
                                  }
                                >
                                  +
                                </Button>
                              </div>
                            </td>
                            <td className="text-center">₹{item.totalPrice}</td>
                            <td className="text-right">
                              <Button
                                color="error"
                                size="small"
                                onClick={() => handleRemoveItem(index)}
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 4,
                  }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddFood}
                    disabled={selectedFoodItems.length === 0}
                  >
                    Submit All Items
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleCloseFoodModal}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Modal>
            <Button
              variant="contained"
              color="info"
              className="mt-4 mb-4"
              onClick={() => handleServicePrintPreview(billing)}
            >
              Print Service Invoice
            </Button>
            {/* Food Items Table */}
            <h3 className="font-semibold text-gray-800 text-center ml-16">
              Food Items ({foodItems.length})
            </h3>
            <table className="w-full mt-2 bg-gray-100 rounded text-sm mb-4">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">Room No.</th>
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 text-center">Item Quantity</th>
                  <th className="p-2 text-center">Item Tax</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {foodItems.map((food, index) => (
                  <tr key={index}>
                    <td className="p-2 text-left">Room #{billing.roomNo[food.roomIndex]}</td>
                    <td className="p-2 text-left">{food.name}</td>
                    <td className="p-2 text-center">{food.quantity}</td>
                    <td className="p-2 text-center">{food.tax}%</td>
                    <td className="p-2 text-right">{food.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Button
              variant="contained"
              color="info"
              className="mt-4 mb-4"
              onClick={() => handleFoodPrintPreview(billing)}
            >
              Print Food Invoice
            </Button>
            {/* Food Invoice Modal */}
            {showPrintModal && printableFoodInvoice && (
              <div className="modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white p-6 rounded shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-end mb-4">
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded"
                      onClick={() => {
                        setShowPrintModal(false);
                        setPrintableFoodInvoice(null);
                      }}
                    >
                      Close
                    </button>
                  </div>
                  <PrintableFoodInvoice billId={id} />
                </div>
              </div>
            )}

            {/* Similar modification for Service Invoice Modal */}
            {showPrintModal && printableServiceInvoice && (
              <div className="modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white p-6 rounded shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-end mb-4">
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded"
                      onClick={() => {
                        setShowPrintModal(false);
                        setPrintableServiceInvoice(null);
                      }}
                    >
                      Close
                    </button>
                  </div>
                  <PrintableServiceInvoice billId={id} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BookingDashboard;
