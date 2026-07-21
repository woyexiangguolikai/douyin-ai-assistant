<?php
function list() {
    $user = auth_middleware();
    if ($user["role"] !== "admin") { http_response_code(403); echo json_encode(["error"=>"Forbidden"]); return; }
    $db = getDB();
    $stmt = $db->query("SELECT id, username, nickname, role, created_at, updated_at FROM users ORDER BY created_at");
    echo json_encode($stmt->fetchAll());
}

function create() {
    $user = auth_middleware();
    if ($user["role"] !== "admin") { http_response_code(403); echo json_encode(["error"=>"Forbidden"]); return; }
    $input = json_decode(file_get_contents("php://input"), true);
    $db = getDB();
    $hash = password_hash($input["password"] ?? "123456", PASSWORD_BCRYPT);
    $stmt = $db->prepare("INSERT INTO users (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)");
    $stmt->execute([$input["username"], $hash, $input["nickname"] ?? $input["username"], $input["role"] ?? "operator"]);
    echo json_encode(["success"=>true]);
}

function detail() {
    $user = auth_middleware();
    if ($user["role"] !== "admin") { http_response_code(403); echo json_encode(["error"=>"Forbidden"]); return; }
    $db = getDB();
    $method = $_SERVER["REQUEST_METHOD"];
    $id = $_REQUEST["route_id"];

    if ($method === "GET") {
        $stmt = $db->prepare("SELECT id, username, nickname, role FROM users WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode($stmt->fetch());
    } elseif ($method === "PUT") {
        $input = json_decode(file_get_contents("php://input"), true);
        if (!empty($input["password"])) {
            $hash = password_hash($input["password"], PASSWORD_BCRYPT);
            $stmt = $db->prepare("UPDATE users SET nickname=?, role=?, password_hash=? WHERE id=?");
            $stmt->execute([$input["nickname"] ?? "", $input["role"] ?? "operator", $hash, $id]);
        } else {
            $stmt = $db->prepare("UPDATE users SET nickname=?, role=? WHERE id=?");
            $stmt->execute([$input["nickname"] ?? "", $input["role"] ?? "operator", $id]);
        }
        echo json_encode(["success"=>true]);
    } elseif ($method === "DELETE") {
        $db->prepare("UPDATE rooms SET user_id=NULL WHERE user_id=?")->execute([$id]);
        $db->prepare("DELETE FROM users WHERE id=?")->execute([$id]);
        echo json_encode(["success"=>true]);
    }
}
