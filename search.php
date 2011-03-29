<?php

include('db.php');

$sector = $_GET['region'];
$divisionId = $_GET['divisionId'];

$data = array();
$query = "SELECT * FROM companies WHERE divisionId = $divisionId AND sector LIKE '$sector%'";

$result = mysqli_query($db, $query);
if(! $result) {
    exit;
}

while($row = mysqli_fetch_row($result)) {
    $obj = json_decode($row[6]);
    $data[] = $obj;
}

header('Content-type: application/json');
echo json_encode($data);