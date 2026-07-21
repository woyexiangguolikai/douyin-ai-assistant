<?php
function receive() {
    $input = json_decode(file_get_contents("php://input"), true);
    $db = getDB();
    $stmt = $db->prepare("INSERT IGNORE INTO danmaku_log (id, room_id, content, username, type, filtered) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$input["id"], $input["room_id"], $input["content"], $input["username"], $input["type"]??"normal", $input["filtered"]??0]);
    echo json_encode(["success"=>true]);
}

function aiReply() {
    $input = json_decode(file_get_contents("php://input"), true);
    $db = getDB();
    $stmt = $db->prepare("INSERT INTO ai_replies (id, room_id, danmaku_id, text, type) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$input["id"], $input["room_id"], $input["danmaku_id"]??"", $input["text"], $input["type"]??"auto"]);
    echo json_encode(["success"=>true]);
}
