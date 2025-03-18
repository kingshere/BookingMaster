"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from '../../../../_components/Navbar';
import { Footer } from '../../../../_components/Footer';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditRoomCategory = () => {
  const router = useRouter();
  const params = useParams(); // Get the route parameters
  const { id } = params; // Extract the id from parameters

  const [formData, setFormData] = useState({
    image: null,
    category: "",
    description: "",
    bedType: "",
    tariff: 0,
    gst: 0,
    total: 0,
    baseAdult: "",
    baseChild: "",
    maxAdult: "",
    maxChild: "",
    maxCapacity: "",
    extraAdult: "",
    extraChild: "",
    mealPlan: {
      EP: "No",
      AP: "No",
      CP: "No",
      MAP: "No",
    },
    bookingEng: "Yes",
    confRoom: "No",
    active: "Yes",
  });

  const fetchRoomCategory = async () => {
    try {
      const res = await fetch(`/api/roomCategories/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch room category");
      }

      const result = await res.json();
      console.log("Response Data:", result);

      if (result.success && result.data) {
        setFormData(result.data);
      } else {
        console.error("Unexpected response format or no data found.");
      }
    } catch (error) {
      console.error("Error fetching room category:", error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRoomCategory();
    }
  }, [id]);




  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => {
      const updatedData = {
        ...prevData,
        [name]: value,
      };

      const gst = parseInt(updatedData.gst) || 0;

      if (name === "gst" || name === "tariff") {
        // Calculate total when gst or tariff changes
        const tariff = parseInt(updatedData.tariff) || 0;
        updatedData.total = Math.ceil(((100 + gst) / 100) * tariff);
      }

      if (name === "total") {
        // Calculate tariff when total is changed
        const total = parseInt(updatedData.total) || 0;
        updatedData.tariff = Math.ceil(total / ((100 + gst) / 100));
      }

      return updatedData;
    });
  };

  const handleMealPlanChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      mealPlan: {
        ...prevData.mealPlan,
        [name]: value,
      },
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    // Convert the image to a base64 string
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prevData) => ({
        ...prevData,
        image: reader.result, // Set the base64 string of the image
      }));
    };

    if (file) {
      reader.readAsDataURL(file); // Start reading the file and convert to base64
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`/api/roomCategories/${id}`, {
        method: "PUT", // Use PUT method for updates
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // Send the updated form data
      });

      const result = await response.json();
      if (response.ok) {
        console.log("Category updated successfully:", result);
        toast.success("Category updated successfully.");
        // router.push("/property/roomcategories");
      } else {
        console.error("Error updating category:", result);
        toast.error("Error updating category: " + result.error);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error: " + error.message);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-amber-50 py-12 px-4 sm:px-6 lg:px-8">
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
        <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Edit Room Category
            </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="image"
                  className="block text-sm font-medium text-gray-700"
                >
                  Room Image
                </label>
                <input
                  type="file"
                  name="image"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700"
                >
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  id="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                ></textarea>
              </div>
              <div>
                <label
                  htmlFor="bedType"
                  className="block text-sm font-medium text-gray-700"
                >
                  Bed Type
                </label>
                <input
                  type="text"
                  name="bedType"
                  id="bedType"
                  value={formData.bedType}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="tariff"
                  className="block text-sm font-medium text-gray-700"
                >
                  Tariff
                </label>
                <input
                  type="number"
                  name="tariff"
                  id="tariff"
                  value={formData.tariff}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="gst"
                  className="block text-sm font-medium text-gray-700"
                >
                  GST
                </label>
                <input
                  type="number"
                  name="gst"
                  id="gst"
                  value={formData.gst}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="total"
                  className="block text-sm font-medium text-gray-700"
                >
                  Total
                </label>
                <input
                  type="number"
                  name="total"
                  id="total"
                  value={formData.total}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="baseAdult"
                  className="block text-sm font-medium text-gray-700"
                >
                  Base Adult
                </label>
                <input
                  type="number"
                  name="baseAdult"
                  id="baseAdult"
                  value={formData.baseAdult}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="baseChild"
                  className="block text-sm font-medium text-gray-700"
                >
                  Base Child
                </label>
                <input
                  type="number"
                  name="baseChild"
                  id="baseChild"
                  value={formData.baseChild}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="maxAdult"
                  className="block text-sm font-medium text-gray-700"
                >
                  Max Adult
                </label>
                <input
                  type="number"
                  name="maxAdult"
                  id="maxAdult"
                  value={formData.maxAdult}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="maxChild"
                  className="block text-sm font-medium text-gray-700"
                >
                  Max Child
                </label>
                <input
                  type="number"
                  name="maxChild"
                  id="maxChild"
                  value={formData.maxChild}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="maxCapacity"
                  className="block text-sm font-medium text-gray-700"
                >
                  Max Capacity
                </label>
                <input
                  type="number"
                  name="maxCapacity"
                  id="maxCapacity"
                  value={formData.maxCapacity}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="extraAdult"
                  className="block text-sm font-medium text-gray-700"
                >
                  Extra Adult
                </label>
                <input
                  type="number"
                  name="extraAdult"
                  id="extraAdult"
                  value={formData.extraAdult}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="extraChild"
                  className="block text-sm font-medium text-gray-700"
                >
                  Extra Child
                </label>
                <input
                  type="number"
                  name="extraChild"
                  id="extraChild"
                  value={formData.extraChild}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Meal Plan
                </label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label htmlFor="EP" className="block text-sm text-gray-600">
                      EP
                    </label>
                    <select
                      id="EP"
                      name="EP"
                      value={formData.mealPlan.EP}
                      onChange={handleMealPlanChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="AP" className="block text-sm text-gray-600">
                      AP
                    </label>
                    <select
                      id="AP"
                      name="AP"
                      value={formData.mealPlan.AP}
                      onChange={handleMealPlanChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="CP" className="block text-sm text-gray-600">
                      CP
                    </label>
                    <select
                      id="CP"
                      name="CP"
                      value={formData.mealPlan.CP}
                      onChange={handleMealPlanChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="MAP"
                      className="block text-sm text-gray-600"
                    >
                      MAP
                    </label>
                    <select
                      id="MAP"
                      name="MAP"
                      value={formData.mealPlan.MAP}
                      onChange={handleMealPlanChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label
                  htmlFor="bookingEng"
                  className="block text-sm font-medium text-gray-700"
                >
                  Booking Engine
                </label>
                <select
                  id="bookingEng"
                  name="bookingEng"
                  value={formData.bookingEng}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="confRoom"
                  className="block text-sm font-medium text-gray-700"
                >
                  Conference Room
                </label>
                <select
                  id="confRoom"
                  name="confRoom"
                  value={formData.confRoom}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="active"
                  className="block text-sm font-medium text-gray-700"
                >
                  Active
                </label>
                <select
                  id="active"
                  name="active"
                  value={formData.active}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
            <div className="space-x-6">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => router.push('/property/roomcategories')}
              >

                Submit
              </button>
              <button onClick={() => router.back()} className="bg-gray-500 text-white px-4 py-2 rounded mb-4">
                Back
              </button>
            </div>
          </form>
          </div>
        </div>

      </div>
      <Footer />
    </div>

  );
};

export default EditRoomCategory;
