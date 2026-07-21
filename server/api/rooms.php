<?php
function list() {
    $user = auth_middleware();
    $db = getDB();
    if ($user["role"] === "admin") {
        $stmt = $db->query("SELECT r.*, u.nickname AS operator_name FROM rooms r LEFT JOIN users u ON r.user_id = u.id ORDER BY r.updated_at DESC");
    } else {
        $stmt = $db->prepare("SELECT r.*, u.nickname AS operator_name FROM rooms r LEFT JOIN users u ON r.user_id = u.id WHERE r.user_id = ? ORDER BY r.updated_at DESC");
        $stmt->execute([$user["id"]]);
    }
    echo json_encode($stmt->fetchAll());
}

function create() {
    $user = auth_middleware();
    if ($user["role"] !== "admin") { http_response_code(403); return; }
    $input = json_decode(file_get_contents("php://input"), true);
    $db = getDB();
    $db->prepare("INSERT INTO rooms (room_id, name, user_id) VALUES (?, ?, ?)")->execute([
        $input["room_id"], $input["name"] ?? "", $input["user_id"] ?? null
    ]);
    $roomDbId = $db->lastInsertId();
    $db->prepare("INSERT INTO personas (room_id) VALUES (?)")->execute([$roomDbId]);
    $db->prepare("INSERT INTO ai_settings (room_id) VALUES (?)")->execute([$roomDbId]);
    echo json_encode(["success"=>true, "id"=>$roomDbId]);
}

function detail() {
    $user = auth_middleware();
    $db = getDB();
    $id = $_REQUEST["route_id"];
    $method = $_SERVER["REQUEST_METHOD"];

    if ($method === "GET") {
        $stmt = $db->prepare("SELECT * FROM rooms WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode($stmt->fetch());
    } elseif ($method === "PUT") {
        $input = json_decode(file_get_contents("php://input"), true);
        $stmt = $db->prepare("UPDATE rooms SET name=?, user_id=?, room_id=? WHERE id=?");
        $stmt->execute([$input["name"] ?? "", $input["user_id"] ?? null, $input["room_id"] ?? "", $id]);
        echo json_encode(["success"=>true]);
    } elseif ($method === "DELETE") {
        $db->prepare("DELETE FROM ai_settings WHERE room_id=?")->execute([$id]);
        $db->prepare("DELETE FROM personas WHERE room_id=?")->execute([$id]);
        $db->prepare("DELETE FROM rooms WHERE id=?")->execute([$id]);
        echo json_encode(["success"=>true]);
    }
}

function persona() {
    $user = auth_middleware();
    $db = getDB();
    $id = $_REQUEST["route_id"];
    $method = $_SERVER["REQUEST_METHOD"];

    if ($method === "GET") {
        $stmt = $db->prepare("SELECT * FROM personas WHERE room_id = ?");
        $stmt->execute([$id]);
        echo json_encode($stmt->fetch());
    } elseif ($method === "PUT") {
        $p = json_decode(file_get_contents("php://input"), true);
        $stmt = $db->prepare("UPDATE personas SET name=?, personality=?, style=?, tone=?, catchphrases=?, forbidden_topics=?, fan_title=?, background=?, strengths=?, greeting_phrase=?, sign_off=?, custom_prompt=? WHERE room_id=?");
        $stmt->execute([
            $p["name"] ?? "????",
            json_encode($p["personality"] ?? []),
            $p["style"] ?? "",
            $p["tone"] ?? "",
            json_encode($p["catchphrases"] ?? []),
            json_encode($p["forbidden_topics"] ?? []),
            $p["fan_title"] ?? "",
            $p["background"] ?? "",
            json_encode($p["strengths"] ?? []),
            $p["greeting_phrase"] ?? "",
            $p["sign_off"] ?? "",
            $p["custom_prompt"] ?? "",
            $id
        ]);
        echo json_encode(["success"=>true]);
    }
}

function aiSettings() {
    $user = auth_middleware();
    $db = getDB();
    $id = $_REQUEST["route_id"];
    $method = $_SERVER["REQUEST_METHOD"];

    if ($method === "GET") {
        $stmt = $db->prepare("SELECT * FROM ai_settings WHERE room_id = ?");
        $stmt->execute([$id]);
        echo json_encode($stmt->fetch());
    } elseif ($method === "PUT") {
        $s = json_decode(file_get_contents("php://input"), true);
        $stmt = $db->prepare("UPDATE ai_settings SET deepseek_api_key=?, model=?, enabled=?, reply_length=?, tone_style=?, topic_depth=?, custom_prompt=? WHERE room_id=?");
        $stmt->execute([
            $s["deepseek_api_key"] ?? "",
            $s["model"] ?? "deepseek-chat",
            $s["enabled"] ? 1 : 0,
            $s["reply_length"] ?? "medium",
            $s["tone_style"] ?? "natural",
            $s["topic_depth"] ?? "normal",
            $s["custom_prompt"] ?? "",
            $id
        ]);
        echo json_encode(["success"=>true]);
    }
}

function heartbeat() {
    $input = json_decode(file_get_contents("php://input"), true);
    $roomId = $input["room_id"] ?? "";
    $db = getDB();
    $db->prepare("UPDATE rooms SET status=?, status_message=?, last_seen=NOW() WHERE room_id=?")->execute([
        $input["status"] ?? "online", $input["status_message"] ?? "", $roomId
    ]);
    $stmt = $db->prepare("SELECT id FROM rooms WHERE room_id = ?");
    $stmt->execute([$roomId]);
    $room = $stmt->fetch();
    if (!$room) { echo json_encode(["configured"=>false]); return; }
    $rid = $room["id"];
    $ps = $db->prepare("SELECT * FROM personas WHERE room_id = ?");
    $ps->execute([$rid]);
    $as = $db->prepare("SELECT * FROM ai_settings WHERE room_id = ?");
    $as->execute([$rid]);
    echo json_encode(["configured"=>true, "persona"=>$ps->fetch(), "ai_settings"=>$as->fetch()]);
}
