require("dotenv").config();
const test = require("node:test");
const db = require("../src/db.js");
const assert = require("node:assert/strict");

const BASE_URL = "http://localhost:3001";
const SERVECE_KEY = prorcess.env.SERVECE_KEY;
