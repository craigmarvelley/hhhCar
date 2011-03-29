<?php

$db = mysqli_connect('localhost', 'username', 'password') or die('No db connection');
mysqli_select_db($db, 'hhh') or die('cannot select db');