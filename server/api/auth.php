<?php
function login() {
    $input = json_decode(file_get_contents("php://input"), true);
    $db = getDB();
    $stmt = $db->prepare("SELECT id, username, password_hash, nickname, role FROM users WHERE username = ?");
    $stmt->execute([$input["username"] ?? ""]);
    $user = $stmt->fetch();
    if (!$user || !password_verify($input["password"] ?? "", $user["password_hash"])) {
        http_response_code(401);
        echo json_encode(["error"=>"???????"]);
        return;
    }
    $token = jwt_encode([
        "id"=>$user["id"], "username"=>$user["username"],
        "role"=>$user["role"], "nickname"=>$user["nickname"]
    ], JWT_SECRET);
    echo json_encode(["token"=>$token, "user"=>$user]);
}

function me() {
    $user = auth_middleware();
    echo json_encode(["user"=>$user]);
}

function register() {
    $input = json_decode(file_get_contents("php://input"), true);
    $db = getDB();
    $admins = $db->query("SELECT COUNT(*) AS c FROM users WHERE role='admin'")->fetch()["c"];
    if (!empty($input["isAdmin"]) && $admins > 0) {
        http_response_code(400);
        echo json_encode(["error"=>"??????"]);
        return;
    }
    $hash = password_hash($input["password"] ?? "", PASSWORD_BCRYPT);
    $db->prepare("INSERT INTO users (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)")->execute([
        $input["username"], $hash, $input["username"],
        !empty($input["isAdmin"]) ? "admin" : "operator"
    ]);
    echo json_encode(["success"=>true]);
}
