
<?php
$url = $_POST["url"];
$tag = $_POST["tag"];
$output = exec("python3 main.py $url $tag");
echo("<h1>Here is the information form $url with tag $tag: $output</h1>");
?>
