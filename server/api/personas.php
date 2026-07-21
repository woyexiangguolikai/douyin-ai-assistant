<?php
function list() {
    $user = auth_middleware();
    $db = getDB();
    $room_id = $_GET["room_id"] ?? 0;
    $stmt = $db->prepare("SELECT * FROM personas WHERE room_id = ? ORDER BY created_at ASC");
    $stmt->execute([$room_id]);
    $rows = $stmt->fetchAll();
    echo json_encode(["success"=>true, "data"=>$rows]);
}

function detail() {
    $user = auth_middleware();
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM personas WHERE id = ?");
    $stmt->execute([$_REQUEST["route_id"]]);
    $persona = $stmt->fetch();
    echo json_encode(["success"=>true, "data"=>$persona]);
}
