<?php
function jwt_encode(array $payload, string $secret): string {
    $header = rtrim(base64_encode(json_encode(["alg"=>"HS256","typ"=>"JWT"])), "=");
    $payload["iat"] = $payload["iat"] ?? time();
    $payload["exp"] = $payload["exp"] ?? time() + 86400 * 7;
    $body = rtrim(base64_encode(json_encode($payload)), "=");
    $sig = rtrim(base64_encode(hash_hmac("sha256", "$header.$body", $secret, true)), "=");
    return "$header.$body.$sig";
}
function jwt_decode(string $token, string $secret): ?array {
    $parts = explode(".", $token);
    if (count($parts) !== 3) return null;
    $sig = rtrim(base64_encode(hash_hmac("sha256", "$parts[0].$parts[1]", $secret, true)), "=");
    if (!hash_equals($sig, $parts[2])) return null;
    $payload = json_decode(base64_decode($parts[1]), true);
    if (!$payload || ($payload["exp"] ?? 0) < time()) return null;
    return $payload;
}
function auth_middleware(): array {
    $auth = $_SERVER["HTTP_AUTHORIZATION"] ?? "";
    $token = str_replace("Bearer ", "", $auth);
    $user = jwt_decode($token, JWT_SECRET);
    if (!$user) {
        http_response_code(401);
        echo json_encode(["error"=>"Unauthorized"]);
        exit;
    }
    return $user;
}
