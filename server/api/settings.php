<?php
function get() {
    $user = auth_middleware();
    $db = getDB();
    $room_id = $_GET["room_id"] ?? 0;
    $stmt = $db->prepare("SELECT id, room_id, deepseek_api_key, ai_enabled, persona_id, status FROM rooms WHERE id = ?");
    $stmt->execute([$room_id]);
    echo json_encode(["success"=>true, "data"=>$stmt->fetch()]);
}
