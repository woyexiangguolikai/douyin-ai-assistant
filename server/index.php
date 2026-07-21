<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS");
header("Access-Control-Allow-Headers: Content-Type,Authorization");
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(204); exit; }

require_once __DIR__ . "/db.php";
require_once __DIR__ . "/jwt.php";

$uri = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
$uri = rtrim($uri, "/");
$method = $_SERVER["REQUEST_METHOD"];

// Route matching
$routes = [
    "POST /api/auth/login" => "api/auth.php@login",
    "GET /api/auth/me" => "api/auth.php@me",
    "POST /api/auth/register" => "api/auth.php@register",
    "GET /api/rooms" => "api/rooms.php@list",
    "POST /api/rooms" => "api/rooms.php@create",
    "POST /api/rooms/heartbeat" => "api/rooms.php@heartbeat",
    "GET /api/users" => "api/users.php@list",
    "POST /api/users" => "api/users.php@create",
];

// Match routes with IDs
$key = "$method $uri";
if (isset($routes[$key])) {
    [$file, $action] = explode("@", $routes[$key]);
    require_once __DIR__ . "/$file"; $action(); exit;
}

// Pattern match: /api/rooms/{id}, /api/rooms/{id}/persona, /api/rooms/{id}/ai-settings, /api/users/{id}
$patterns = [
    "#^/api/rooms/(\d+)$#" => ["api/rooms.php", "detail"],
    "#^/api/rooms/(\d+)/persona$#" => ["api/rooms.php", "persona"],
    "#^/api/rooms/(\d+)/ai-settings$#" => ["api/rooms.php", "aiSettings"],
    "#^/api/users/(\d+)$#" => ["api/users.php", "detail"],
];

foreach ($patterns as $pattern => [$file, $action]) {
    if (preg_match($pattern, $uri, $m)) {
        $_REQUEST["route_id"] = $m[1];
        require_once __DIR__ . "/$file"; $action(); exit;
    }
}

http_response_code(404);
echo json_encode(["error"=>"Not found"]);
