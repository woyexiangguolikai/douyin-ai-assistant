<?php
function list() {
    $user = auth_middleware();
    $db = getDB();
    $room_id = $_GET["room_id"] ?? 0;
    $stmt = $db->prepare("SELECT * FROM filter_rules WHERE room_id = ? ORDER BY id ASC");
    $stmt->execute([$room_id]);
    echo json_encode(["success"=>true, "data"=>$stmt->fetchAll()]);
}
