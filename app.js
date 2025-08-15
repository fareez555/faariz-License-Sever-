const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("FAARIZ BOT SERVER IS RUNNING 🚀");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
