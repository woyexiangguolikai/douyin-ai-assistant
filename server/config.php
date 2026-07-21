<?php
define("DB_HOST", getenv("DB_HOST") ?: "localhost");
define("DB_NAME", getenv("DB_NAME") ?: "douyin_ai");
define("DB_USER", getenv("DB_USER") ?: "root");
define("DB_PASS", getenv("DB_PASS") ?: "");
define("JWT_SECRET", getenv("JWT_SECRET") ?: "your-secret-key-change-in-production");
define("CAPTURE_API_URL", getenv("CAPTURE_API_URL") ?: "http://localhost:3002");
