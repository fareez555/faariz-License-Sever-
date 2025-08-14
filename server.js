const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Simple license check API
app.get("/check", (req, res) => {
  const key = req.query.key;
  if (key === "FAARIZ-12345") {
    res.json({ status: "valid", message: "License is valid ✅" });
  } else {
    res.json({ status: "invalid", message: "License is invalid ❌" });
  }
});

app.listen(PORT, () => {
  console.log(`FAARIZ BOT License Server running on port ${PORT}`);
});
