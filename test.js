const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

// ================== MongoDB Connection ==================
mongoose.connect("mongodb://127.0.0.1:27017/crud_demo", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB error:", err));

// ================== Schema & Model ==================
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    age: {
        type: Number,
        required: true,
    },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

// ================== CREATE ==================
app.post("/users", async (req, res) => {
    try {
        const user = new User(req.body);
        const savedUser = await user.save();

        res.status(201).json({
            status: "success",
            message: "User created successfully",
            data: savedUser,
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message,
            data: null,
        });
    }
});

app.post("/api/v2/user", async (req, res) => {
    try {
        const user = new User(req.body);
        const savedUser = await user.save();

        res.status(201).json({
            status: "success",
            message: "User created successfully",
            data: savedUser,
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message,
            data: null,
        });
    }
});

// ================== READ ALL ==================
app.get("/users", async (req, res) => {
    try {
        const users = await User.find();

        res.json({
            status: "success",
            message: "Users fetched successfully",
            data: users,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
            data: null,
        });
    }
});

// ================== READ ONE ==================
app.get("/users/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "User not found",
                data: null,
            });
        }

        res.json({
            status: "success",
            message: "User fetched successfully",
            data: user,
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: "Invalid user ID",
            data: null,
        });
    }
});

// ================== UPDATE ==================
app.put("/users/:id", async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                status: "error",
                message: "User not found",
                data: null,
            });
        }

        res.json({
            status: "success",
            message: "User updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message,
            data: null,
        });
    }
});

// ================== DELETE ==================
app.delete("/users/:id", async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);

        if (!deletedUser) {
            return res.status(404).json({
                status: "error",
                message: "User not found",
                data: null,
            });
        }

        res.json({
            status: "success",
            message: "User deleted successfully",
            data: null,
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: "Invalid user ID",
            data: null,
        });
    }
});

// ================== Server ==================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
