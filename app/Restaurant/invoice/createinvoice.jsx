"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getCookie } from 'cookies-next';
import { jwtVerify } from 'jose';

// List of Indian states and union territories (same as in restaurantinvoice.js)
const indianStatesAndUTs = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const CreateInvoicePage = ({ onInvoiceCreate, existingInvoice, onCancel }) => {
  const [menu, setMenu] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [profileState, setProfileState] = useState(null); // State from Profile API
  const [formData, setFormData] = useState({
    invoiceno: "",
    date: "",
    time: "",
    custname: "",
    custphone: "",
    custgst: "",
    custaddress: "",
    state: "", // New state field
    menuitem: [],
    quantity: [],
    price: [],
    cgstArray: [],
    sgstArray: [],
    amountWithGstArray: [],
    totalamt: 0,
    gst: 0,
    payableamt: 0,
    username: "", // Added to match schema
  });
  const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch menu items
        const menuResponse = await fetch("/api/menuItem");
        const menuData = await menuResponse.json();
        setMenu(menuData.data);
        // Fetch profile data
        const token = getCookie('authToken');
        const usertoken = getCookie("userAuthToken");
        if (token) {
          const decoded = await jwtVerify(token, new TextEncoder().encode(SECRET_KEY));
          const userId = decoded.payload.id;
          const profileResponse = await fetch(`/api/Profile/${userId}`);
          const profileData = await profileResponse.json();
          if (profileData.success) {
            setProfileState(profileData.data.state || null);
            setFormData(prev => ({
              ...prev,
              username: profileData.data.username || "",
            }));
          } else {
            toast.error("Failed to fetch profile data");
          }
        } else if (usertoken) {
          const decoded = await jwtVerify(usertoken, new TextEncoder().encode(SECRET_KEY));
          const userId = decoded.payload.profileId; // Use userId from the new token structure
          const profileResponse = await fetch(`/api/Profile/${userId}`);
          const profileData = await profileResponse.json();
          if (profileData.success) {
            setProfileState(profileData.data.state || null);
            setFormData(prev => ({
              ...prev,
              username: profileData.data.username || "",
            }));
          } else {
            toast.error("Failed to fetch profile data");
          }
        } else {
          toast.error("Authentication token missing");
        }

        // Generate invoice number only if there's no existing invoice
        if (!existingInvoice) {
          setFormData(prev => ({
            ...prev,
            invoiceno: generateInvoiceNumber(),
          }));
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
        toast.error("Error fetching initial data");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (existingInvoice && menu.length > 0) {
      const processedItems = existingInvoice.menuitem?.map((item, index) => {
        const menuItem = menu.find(menuMenuItem => menuMenuItem.itemName === item);
        if (!menuItem) return null;

        const price = existingInvoice.price[index];
        const quantity = existingInvoice.quantity[index] || 1;
        const cgstRate = menuItem.cgst || 0;
        const sgstRate = menuItem.sgst || 0;

        const cgstAmount = price * (cgstRate / 100) * quantity;
        const sgstAmount = price * (sgstRate / 100) * quantity;
        const totalWithGst = (price * quantity) + cgstAmount + sgstAmount;

        return {
          name: item,
          price: price,
          quantity: quantity,
          cgst: cgstAmount / quantity,
          sgst: sgstAmount / quantity,
          totalWithGst: totalWithGst,
        };
      }).filter(item => item !== null);

      const cgstArray = processedItems.map(item => item.cgst * item.quantity);
      const sgstArray = processedItems.map(item => item.sgst * item.quantity);
      const amountWithGstArray = processedItems.map(item => item.totalWithGst);

      const totalAmount = processedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      const payableAmount = amountWithGstArray.reduce((total, amt) => total + amt, 0);

      setFormData({
        invoiceno: existingInvoice.invoiceno || "",
        date: existingInvoice.date ? new Date(existingInvoice.date).toISOString().split("T")[0] : "",
        time: existingInvoice.time || "",
        custname: existingInvoice.custname || "",
        custphone: existingInvoice.custphone || "",
        custaddress: existingInvoice.custaddress || "",
        custgst: existingInvoice.custgst || "",
        state: existingInvoice.state || "",
        menuitem: processedItems.map(item => item.name),
        quantity: processedItems.map(item => item.quantity),
        price: processedItems.map(item => item.price),
        totalamt: totalAmount,
        gst: payableAmount - totalAmount,
        payableamt: payableAmount,
        cgstArray: cgstArray,
        sgstArray: sgstArray,
        amountWithGstArray: amountWithGstArray,
        username: existingInvoice.username || formData.username,
      });

      setSelectedItems(processedItems);
    }
  }, [existingInvoice, menu]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addMenuItem = (e) => {
    const selectedItemName = e.target.value;
    if (!selectedItemName) return;

    const selectedMenuItem = menu.find(item => item.itemName === selectedItemName);
    const cgstRate = selectedMenuItem.cgst || 0;
    const sgstRate = selectedMenuItem.sgst || 0;
    const quantity = 1;

    const cgstAmount = selectedMenuItem.price * (cgstRate / 100) * quantity;
    const sgstAmount = selectedMenuItem.price * (sgstRate / 100) * quantity;
    const totalWithGst = (selectedMenuItem.price * quantity) + cgstAmount + sgstAmount;

    const newItem = {
      name: selectedItemName,
      price: selectedMenuItem.price,
      quantity: quantity,
      cgst: cgstAmount / quantity,
      sgst: sgstAmount / quantity,
      totalWithGst: totalWithGst,
    };

    const updatedSelectedItems = [...selectedItems, newItem];
    setSelectedItems(updatedSelectedItems);

    const updatedSgstArray = [...formData.sgstArray, newItem.sgst * quantity];
    const updatedCgstArray = [...formData.cgstArray, newItem.cgst * quantity];
    const updatedAmountWithGstArray = [...formData.amountWithGstArray, totalWithGst];

    const totalAmount = calculateTotal(updatedSelectedItems);
    const payableAmount = calculatePayableAmount(updatedAmountWithGstArray);

    setFormData((prev) => ({
      ...prev,
      menuitem: updatedSelectedItems.map((item) => item.name),
      price: updatedSelectedItems.map((item) => item.price),
      quantity: updatedSelectedItems.map((item) => item.quantity),
      cgstArray: updatedCgstArray,
      sgstArray: updatedSgstArray,
      amountWithGstArray: updatedAmountWithGstArray,
      totalamt: totalAmount,
      gst: payableAmount - totalAmount,
      payableamt: payableAmount,
    }));
  };

  const updateQuantity = (index, newQuantity) => {
    const updatedItems = [...selectedItems];
    updatedItems[index].quantity = newQuantity || 1;

    const updatedSgstArray = updatedItems.map(item => item.sgst * item.quantity);
    const updatedCgstArray = updatedItems.map(item => item.cgst * item.quantity);
    const updatedAmountWithGstArray = updatedItems.map(item => item.quantity * (item.cgst + item.sgst) + item.quantity * item.price);

    setSelectedItems(updatedItems);

    const totalAmount = calculateTotal(updatedItems);
    const payableAmount = calculatePayableAmount(updatedAmountWithGstArray);

    setFormData((prev) => ({
      ...prev,
      quantity: updatedItems.map((item) => item.quantity),
      sgstArray: updatedSgstArray,
      cgstArray: updatedCgstArray,
      amountWithGstArray: updatedAmountWithGstArray,
      totalamt: totalAmount,
      gst: payableAmount - totalAmount,
      payableamt: payableAmount,
    }));
  };

  const removeMenuItem = (index) => {
    const updatedItems = selectedItems.filter((_, i) => i !== index);
    const updatedSgstArray = formData.sgstArray.filter((_, i) => i !== index);
    const updatedCgstArray = formData.cgstArray.filter((_, i) => i !== index);
    const updatedAmountWithGstArray = formData.amountWithGstArray.filter((_, i) => i !== index);

    setSelectedItems(updatedItems);

    const totalAmount = calculateTotal(updatedItems);
    const payableAmount = calculatePayableAmount(updatedAmountWithGstArray);

    setFormData((prev) => ({
      ...prev,
      menuitem: updatedItems.map((item) => item.name),
      price: updatedItems.map((item) => item.price),
      quantity: updatedItems.map((item) => item.quantity),
      sgstArray: updatedSgstArray,
      cgstArray: updatedCgstArray,
      amountWithGstArray: updatedAmountWithGstArray,
      totalamt: totalAmount,
      gst: payableAmount - totalAmount,
      payableamt: payableAmount,
    }));
  };

  const calculateTotal = (items) =>
    items.reduce((total, item) => total + item.price * item.quantity, 0);

  const calculatePayableAmount = (amountWithGstArray) =>
    amountWithGstArray.reduce((total, amt) => total + amt, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = existingInvoice ? "PUT" : "POST";
      const url = existingInvoice
        ? `/api/restaurantinvoice/${existingInvoice._id}`
        : "/api/restaurantinvoice";

      const submissionData = {
        ...formData,
        gst: formData.payableamt - formData.totalamt,
        payableamt: calculatePayableAmount(formData.amountWithGstArray),
      };

      console.log(submissionData);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Invoice saved successfully:", data);
        if (onInvoiceCreate) onInvoiceCreate(data.data);

        resetForm();

        toast.success('👍 Item Saved Successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      } else {
        console.error("Error saving invoice:", data.error);
        toast.error('👎 Failed to save invoice: ' + data.error, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      }
    } catch (error) {
      console.error("Error during invoice save:", error);
      toast.error('👎 Error during invoice save', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      invoiceno: generateInvoiceNumber(),
      date: "",
      time: "",
      custname: "",
      custphone: "",
      custgst: "",
      custaddress: "",
      state: "",
      menuitem: [],
      quantity: [],
      price: [],
      cgstArray: [],
      sgstArray: [],
      amountWithGstArray: [],
      totalamt: 0,
      gst: 0,
      payableamt: 0,
      username: formData.username, // Preserve username
    });
    setSelectedItems([]);
  };

  const handleCancel = () => {
    resetForm();
    if (onCancel) onCancel();
  };

  const generateRandomString = (length) => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateInvoiceNumber = () => {
    return `INV-${generateRandomString(6)}`;
  };

  const isSameState = formData.state && profileState && formData.state === profileState;

  return (
    <Container maxWidth="md" sx={{ height: '100vh', overflowY: 'auto', paddingY: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mt: 3, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
        <Typography variant="h4" gutterBottom align="center">
          Create Invoice
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2} sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                disabled
                label="Invoice ID."
                name="invoiceno"
                value={formData.invoiceno}
                variant="outlined"
                InputProps={{ readOnly: true }}
                required
              />
            </Grid>
            {[{ label: "Date", name: "date", type: "date" }].map(({ label, name, type }) => (
              <Grid item xs={6} key={name}>
                <TextField
                  fullWidth
                  label={label}
                  name={name}
                  type={type}
                  value={formData[name]}
                  onChange={handleChange}
                  variant="outlined"
                  required
                  InputLabelProps={{ shrink: type === "date" || type === "time" || !!formData[name] }}
                />
              </Grid>
            ))}
            {[
              { label: "Time", name: "time", type: "time" },
              { label: "Customer Name", name: "custname", type: "text" },
            ].map(({ label, name, type }) => (
              <Grid item xs={6} key={name}>
                <TextField
                  fullWidth
                  label={label}
                  name={name}
                  type={type}
                  value={formData[name]}
                  onChange={handleChange}
                  variant="outlined"
                  required
                  InputLabelProps={{ shrink: type === "date" || type === "time" || !!formData[name] }}
                />
              </Grid>
            ))}
            {[{ label: "Customer Phone", name: "custphone", type: "tel" }].map(({ label, name, type }) => (
              <Grid item xs={6} key={name}>
                <TextField
                  fullWidth
                  label={label}
                  name={name}
                  type={type}
                  value={formData[name]}
                  onChange={handleChange}
                  variant="outlined"
                  
                />
              </Grid>
            ))}
            {[{ label: "Customer GST No.", name: "custgst", type: "text" }].map(({ label, name, type }) => (
              <Grid item xs={6} key={name}>
                <TextField
                  fullWidth
                  label={label}
                  name={name}
                  type={type}
                  value={formData[name]}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
            ))}
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
                variant="outlined"
              >
                <MenuItem value="">Select State</MenuItem>
                {indianStatesAndUTs.map((state) => (
                  <MenuItem key={state} value={state}>
                    {state}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {[{ label: "Customer Address", name: "custaddress", type: "text" }].map(({ label, name, type }) => (
              <Grid item xs={12} key={name}>
                <TextField
                  fullWidth
                  label={label}
                  name={name}
                  type={type}
                  value={formData[name]}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
            ))}
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Select Menu Items</InputLabel>
                <Select
                  label="Select Menu Items"
                  onChange={addMenuItem}
                  value=""
                  sx={{ maxHeight: 200, overflowY: 'auto' }}
                >
                  {menu.map((item) => (
                    <MenuItem key={item._id} value={item.itemName}>
                      {item.itemName} - ₹{item.price}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TableContainer
                component={Paper}
                sx={{
                  maxHeight: 300,
                  overflow: 'auto',
                  '&::-webkit-scrollbar': { width: '8px' },
                  '&::-webkit-scrollbar-track': { background: '#f1f1f1' },
                  '&::-webkit-scrollbar-thumb': { background: '#888', borderRadius: '4px' },
                  '&::-webkit-scrollbar-thumb:hover': { background: '#555' },
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      {isSameState ? (
                        <>
                          <TableCell align="right">SGST</TableCell>
                          <TableCell align="right">CGST</TableCell>
                        </>
                      ) : (
                        <TableCell align="right">IGST</TableCell>
                      )}
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isSameState ? 6 : 5} align="center">
                          No items selected
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell align="right">₹{item.price * item.quantity}</TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(index, parseInt(e.target.value))}
                              inputProps={{ min: 1 }}
                              variant="standard"
                              sx={{ width: 60 }}
                            />
                          </TableCell>
                          {isSameState ? (
                            <>
                              <TableCell align="right">
                                <TextField
                                  disabled
                                  readOnly
                                  value={(item.sgst * item.quantity)}
                                  variant="standard"
                                  sx={{ width: 60 }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <TextField
                                  disabled
                                  readOnly
                                  value={(item.cgst * item.quantity)}
                                  variant="standard"
                                  sx={{ width: 60 }}
                                />
                              </TableCell>
                            </>
                          ) : (
                            <TableCell align="right">
                              <TextField
                                disabled
                                readOnly
                                value={((item.cgst + item.sgst) * item.quantity)}
                                variant="standard"
                                sx={{ width: 60 }}
                              />
                            </TableCell>
                          )}
                          <TableCell align="right">
                            <IconButton color="error" onClick={() => removeMenuItem(index)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'left', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h6">Total Amount: ₹{formData.totalamt.toFixed(2)}</Typography>
                  {isSameState ? (
                    <>
                      <Typography variant="h6">SGST: ₹{formData.sgstArray?.reduce((sum, value) => sum + value, 0).toFixed(2)} ({(formData.sgstArray?.reduce((sum, value) => sum + value, 0) * 100 / formData.totalamt || 0).toFixed(2)}%)</Typography>
                      <Typography variant="h6">CGST: ₹{formData.cgstArray?.reduce((sum, value) => sum + value, 0).toFixed(2)} ({(formData.cgstArray?.reduce((sum, value) => sum + value, 0) * 100 / formData.totalamt || 0).toFixed(2)}%)</Typography>
                    </>
                  ) : (
                    <Typography variant="h6">IGST: ₹{formData.gst.toFixed(2)} ({((formData.gst * 100 || 0) / formData.totalamt || 0).toFixed(2)}%)</Typography>
                  )}
                  <Typography variant="h6">Payable Amount: ₹{formData.payableamt.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button variant="contained" color="primary" type="submit" startIcon={<SaveIcon />}>
                    Save
                  </Button>
                  <Button variant="outlined" color="secondary" onClick={resetForm} startIcon={<RestartAltIcon />}>
                    Reset
                  </Button>
                  <Button variant="outlined" color="error" onClick={handleCancel} startIcon={<CancelIcon />}>
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </form>
        <ToastContainer />
      </Paper>
    </Container>
  );
};

export default CreateInvoicePage;