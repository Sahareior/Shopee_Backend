import RecentView from "../model/RecentView.js";

export const postRecentView = async (req, res) => {
  const data = req.body;

  try {
    // Option A: use Model.create (one-line)
    const savedData = await RecentView.create(data);

    // Option B (equivalent): const doc = new RecentView(data); const savedData = await doc.save();

    return res.status(201).json({
      message: "saved recent-view data",
      savedData,
    });
  } catch (err) {
    console.error("postRecentView error:", err);
    return res.status(500).json({ error: "Could not save recent view", details: err.message });
  }
};

export const getRecentView = async (req, res) => {
  try {
    const data = await RecentView.find()
      .populate("product")
      .populate("user",{password:0});

    return res.status(200).json(data);
  } catch (err) {
    console.error("getRecentView error:", err);
    return res.status(500).json({
      error: "Could not fetch recent views",
      details: err.message,
    });
  }
};

