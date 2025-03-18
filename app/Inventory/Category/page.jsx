"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../_components/Navbar";
import { Footer } from "../../_components/Footer";
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import { IconButton } from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import { getCookie } from 'cookies-next'; // Import getCookie from cookies-next
import { jwtVerify } from 'jose'; // Import jwtVerify for decoding JWT
import { useRouter } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle, Typography
} from "@mui/material";



export default function InventoryCategory() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  //const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const token = getCookie('authToken');
        const usertoken = getCookie("userAuthToken");
        if (!token && !usertoken) {
          router.push("/"); // Redirect to login if no token is found
          return;
        }

        let decoded, userId;
        if (token) {
          // Verify the authToken (legacy check)
          decoded = await jwtVerify(token, new TextEncoder().encode(SECRET_KEY));
          userId = decoded.payload.id;
        }
        if (usertoken) {
          // Verify the userAuthToken
          decoded = await jwtVerify(usertoken, new TextEncoder().encode(SECRET_KEY));
          userId = decoded.payload.profileId; // Use userId from the new token structure
        }
        // Fetch the profile by userId to get the username
        const profileResponse = await fetch(`/api/Profile/${userId}`);
        const profileData = await profileResponse.json();
        if (!profileData.success || !profileData.data) {
          router.push('/'); // Redirect to login if profile not found
          return;
        }
        const username = profileData.data.username;
        // Fetch products with username filter
        const response = await fetch(`/api/InventoryCategory?username=${username}`);
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error("Failed to fetch products", error);
        toast.error("Failed to fetch products");
        router.push('/'); // Redirect to login if any error occurs
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [router]);

  const handleAddProduct = async (productName) => {
    try {
      const method = currentProduct ? "PUT" : "POST";
      const url = currentProduct ? `/api/InventoryCategory/${currentProduct._id}` : "/api/InventoryCategory";
      const token = getCookie('authToken');
      const usertoken = getCookie("userAuthToken");
      if (!token && !usertoken) {
        router.push("/"); // Redirect to login if no token is found
        return;
      }

      let decoded, userId;
      if (token) {
        // Verify the authToken (legacy check)
        decoded = await jwtVerify(token, new TextEncoder().encode(SECRET_KEY));
        userId = decoded.payload.id;
      }
      if (usertoken) {
        // Verify the userAuthToken
        decoded = await jwtVerify(usertoken, new TextEncoder().encode(SECRET_KEY));
        userId = decoded.payload.profileId; // Use userId from the new token structure
      }
      // Fetch the profile by userId to get the username
      const profileResponse = await fetch(`/api/Profile/${userId}`);
      const profileData = await profileResponse.json();
      if (!profileData.success || !profileData.data) {
        router.push('/'); // Redirect to login if profile not found
        return;
      }
      const username = profileData.data.username;
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: productName,
          isActive: currentProduct ? currentProduct.isActive : true,
          username: username, // Include username in the request body
        }),
      });
      const data = await response.json();
      if (method === "POST") setProducts((prev) => [...prev, data.product]);
      else
        setProducts((prev) =>
          prev.map((product) =>
            product._id === data.product._id ? data.product : product
          )
        );
      setShowModal(false);
      setCurrentProduct(null);
      toast.success("Product saved successfully");
    } catch (error) {
      console.error("Error saving product", error);
      toast.error("Error saving product")
    }
  };

  const toggleActiveStatus = async (id) => {
    try {
      const product = products.find((p) => p._id === id);
      if (!product) return;
      const token = getCookie('authToken');
      const usertoken = getCookie("userAuthToken");
      if (!token && !usertoken) {
        router.push("/"); // Redirect to login if no token is found
        return;
      }

      let decoded, userId;
      if (token) {
        // Verify the authToken (legacy check)
        decoded = await jwtVerify(token, new TextEncoder().encode(SECRET_KEY));
        userId = decoded.payload.id;
      }
      if (usertoken) {
        // Verify the userAuthToken
        decoded = await jwtVerify(usertoken, new TextEncoder().encode(SECRET_KEY));
        userId = decoded.payload.profileId; // Use userId from the new token structure
      }
      // Fetch the profile by userId to get the username
      const profileResponse = await fetch(`/api/Profile/${userId}`);
      const profileData = await profileResponse.json();
      if (!profileData.success || !profileData.data) {
        router.push('/'); // Redirect to login if profile not found
        return;
      }
      const username = profileData.data.username;
      const response = await fetch(`/api/InventoryCategory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive, username: username }), // Include username in the request body
      });
      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.product || !data.product.itemName) {
        throw new Error("Invalid product data returned from the API");
      }
      setProducts((prev) =>
        prev.map((p) => (p._id === id ? data.product : p))
      );
      toast.success("");
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Error toggling status:");
    }
  };
  //confirm delete dialog box
  // const handleDeleteClick = (category) => {
  //   setSelectedCategory(category);
  //   setIsDialogOpen(true);
  // };

  //calling the delete function:
  // const confirmDelete = async () => {
  //   if (selectedCategory) {
  //     await deleteCategory(selectedCategory.id); // Call your delete function
  //     setIsDialogOpen(false);
  //     setSelectedCategory(null);
  //   }
  // };

  const handleDeleteProduct = async (id) => {
    try {
      const token = getCookie('authToken');
      const usertoken = getCookie("userAuthToken");
      if (!token && !usertoken) {
        router.push("/"); // Redirect to login if no token is found
        return;
      }

      let decoded, userId;
      if (token) {
        // Verify the authToken (legacy check)
        decoded = await jwtVerify(token, new TextEncoder().encode(SECRET_KEY));
        userId = decoded.payload.id;
      }
      if (usertoken) {
        // Verify the userAuthToken
        decoded = await jwtVerify(usertoken, new TextEncoder().encode(SECRET_KEY));
        userId = decoded.payload.profileId; // Use userId from the new token structure
      }
      // Fetch the profile by userId to get the username
      const profileResponse = await fetch(`/api/Profile/${userId}`);
      const profileData = await profileResponse.json();
      if (!profileData.success || !profileData.data) {
        router.push('/'); // Redirect to login if profile not found
        return;
      }
      const username = profileData.data.username;
      const response = await fetch(`/api/InventoryCategory/${id}?username=${username}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Failed to delete: ${response.statusText}`);
      }
      const data = await response.json();
      console.log(data.message);
      // Remove the deleted product from the state
      setProducts((prev) => prev.filter((product) => product._id !== id));
      toast.success("Product deleted successfully");

    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error deleting product:");
    }
  };
  //calling the delete function:
  const handleDeleteConfirm = async () => {
    if (selectedCategory) {
      await handleDeleteProduct(selectedCategory); // Delete the product
      setOpenDeleteDialog(false); // Close the dialog
      setSelectedCategory(null); // Reset the selected product ID
    }
  };


  return (
    <div>
      <Navbar />
      <div className="bg-amber-50 min-h-screen">
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
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
              <svg aria-hidden="true" className="inline w-16 h-16 text-gray-200 animate-spin dark:text-gray-600 fill-green-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
              </svg>
              <span className="mt-4 text-gray-700">Loading Inventory Categories...</span>
            </div>
          </div>
        )}
        <div className="container mx-auto p-4">
          <h1 className="text-3xl font-bold mb-4 text-cyan-900" style={{ maxWidth: '80%', margin: '0 auto' }}>Inventory Category</h1>
          <div className="flex justify-end" style={{ maxWidth: '80%', margin: '0 auto' }}>
            <button onClick={() => { setShowModal(true); setCurrentProduct(null); }} className="bg-green-500 text-white px-4 py-2 rounded mb-4">
              Add New +
            </button>
          </div>
          <TableContainer component={Paper} style={{ maxWidth: '80%', margin: '0 auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: "bold", color: "#28bfdb", textAlign: "center" }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "#28bfdb", textAlign: "center" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "#28bfdb", textAlign: "center" }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product._id} sx={{ backgroundColor: "white" }}>
                    <TableCell sx={{ textAlign: "center" }}>{product.itemName}</TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <Button variant="contained" color={product.isActive ? "success" : "error"} size="small">
                        {product.isActive ? "Active" : "Inactive"}
                      </Button>
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <IconButton color="primary" onClick={() => { setShowModal(true); setCurrentProduct(product); }} disabled={product.isActive} sx={{ opacity: product.isActive ? 0.5 : 1 }}>
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        onClick={() => {
                          setSelectedCategory(product._id); // Store the product ID
                          setOpenDeleteDialog(true); // Open the confirmation dialog
                        }}
                        disabled={product.isActive}
                        sx={{ opacity: product.isActive ? 0.5 : 1 }}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Delete Confirmation Dialog */}
          {/* <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogContent>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
              <Button onClick={() => openDeleteDialogForProduct(product._id)} color="error">
                Delete
              </Button>

            </DialogActions>
          </Dialog> */}

          {/* <button onClick={() => setOpenDeleteDialog(true)}>Delete</button> */}

        </div>
        {/* Delete Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
          <DialogTitle>Delete Item</DialogTitle>
          <DialogContent>
            Are you sure you want to delete this item? This action cannot be undone.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button color="error" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogActions>
        </Dialog>


        {showModal && (
          <AddProductModal onClose={() => setShowModal(false)} onSubmit={handleAddProduct} initialValue={currentProduct?.itemName || ""} />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {/* <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Item</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this item? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={() => openDeleteDialogForProduct(product._id)} color="error">
            Delete
          </Button>

        </DialogActions>
      </Dialog> */}
      <Footer />
    </div>
  );
}

const AddProductModal = ({ onClose, onSubmit, initialValue }) => {
  const [productName, setProductName] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit(productName);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Add/Edit Product</h2>
        <div className="mb-8">
          <TextField id="Product name" label="Product Name" variant="outlined" type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full" fullWidth />
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          <button onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!productName || isSubmitting} className={`bg-blue-500 text-white px-4 py-2 rounded ${(!productName || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {initialValue ? 'Update' : 'Add'} Product
          </button>
        </div>
      </div>
    </div>
  );
};