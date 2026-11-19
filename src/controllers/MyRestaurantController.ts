
import { Request, Response } from "express";
import Restaurant from "../models/restaurant";
import mongoose from "mongoose";
import Order from "../models/order";
import cloudinary from "cloudinary";

const getMyRestaurant = async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ user: req.userId });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    return res.status(200).json(restaurant);
  } catch (error) {
    console.error("GET RESTAURANT ERROR:", error);
    return res.status(500).json({ message: "Error fetching restaurant" });
  }
};

// CREATE RESTAURANT
const createMyRestaurant = async (req: Request, res: Response) => {
  try {
    console.log("Create restaurant request received");
    console.log("User ID:", req.userId);
    console.log("Image received:", !!req.file);

    const existingRestaurant = await Restaurant.findOne({
      user: req.userId,
    });

    if (existingRestaurant) {
      return res.status(409).json({
        message: "You already have a restaurant",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a restaurant image",
      });
    }

    // TEMPORARY: Use a placeholder image instead of Cloudinary.
    // This avoids the current Cloudinary 403 upload error.
    const restaurant = new Restaurant(req.body);

    restaurant.imageUrl =
      "https://placehold.co/600x400?text=Restaurant";

    restaurant.user = new mongoose.Types.ObjectId(req.userId);
    restaurant.lastUpdated = new Date();

    await restaurant.save();

    return res.status(201).json(restaurant);
  } catch (error) {
    console.error("CREATE RESTAURANT ERROR:", error);

    return res.status(500).json({
      message: "Failed to create restaurant",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// UPDATE RESTAURANT
const updateMyRestaurant = async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({
      user: req.userId,
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    restaurant.restaurantName = req.body.restaurantName;
    restaurant.city = req.body.city;
    restaurant.country = req.body.country;
    restaurant.deliveryPrice = req.body.deliveryPrice;
    restaurant.estimatedDeliveryTime = req.body.estimatedDeliveryTime;
    restaurant.cuisines = req.body.cuisines;
    restaurant.menuItems = req.body.menuItems;
    restaurant.lastUpdated = new Date();

    // Upload to Cloudinary only if an image is provided.
    if (req.file) {
      const imageUrl = await uploadImage(req.file);
      restaurant.imageUrl = imageUrl;
    }

    await restaurant.save();

    return res.status(200).json(restaurant);
  } catch (error) {
    console.error("UPDATE RESTAURANT ERROR:", error);

    return res.status(500).json({
      message: "Failed to update restaurant",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// GET RESTAURANT ORDERS
const getMyRestaurantOrders = async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({
      user: req.userId,
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const orders = await Order.find({
      restaurant: restaurant._id,
    })
      .populate("restaurant")
      .populate("user");

    return res.status(200).json(orders);
  } catch (error) {
    console.error("GET RESTAURANT ORDERS ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch restaurant orders",
    });
  }
};

// UPDATE ORDER STATUS
const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const restaurant = await Restaurant.findById(order.restaurant);

   if (!restaurant || !restaurant.user || restaurant.user.toString() !== req.userId) {
  return res.status(401).json({ message: "Unauthorized" });
}

    order.status = status;
    await order.save();

    return res.status(200).json(order);
  } catch (error) {
    console.error("UPDATE ORDER STATUS ERROR:", error);

    return res.status(500).json({
      message: "Unable to update order status",
    });
  }
};

// CLOUDINARY IMAGE UPLOAD (used for restaurant updates)
const uploadImage = async (file: Express.Multer.File) => {
  const base64Image = Buffer.from(file.buffer).toString("base64");

  const dataURI = `data:${file.mimetype};base64,${base64Image}`;

  const uploadResponse = await cloudinary.v2.uploader.upload(dataURI, {
    folder: "food-ordering",
  });

  return uploadResponse.secure_url;
};

export default {
  updateOrderStatus,
  getMyRestaurantOrders,
  getMyRestaurant,
  createMyRestaurant,
  updateMyRestaurant,
};
