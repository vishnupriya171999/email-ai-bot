const express = require("express");
const { createEmail, generateReply, getThread, listEmails, stats } = require("../controllers/emailController");

const router = express.Router();

router.get("/", listEmails);
router.post("/add", createEmail);
router.get("/thread/:threadId", getThread);
router.get("/stats", stats);
router.post("/ai-reply", generateReply);
router.post("/reply", generateReply);
router.post("/generate-reply", generateReply);

module.exports = router;

