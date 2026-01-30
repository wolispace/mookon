<?php
// Simple logging server

// Enable CORS for fetch requests
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

date_default_timezone_set('Australia/Adelaide');

// Configuration
$logPrefix = 'logs/_mookon';
$logFile = "{$logPrefix}_log.txt";
$summaryFile = "{$logPrefix}_summary.json";

$LINES_BEFORE_SUMMARY = 200;

// Collect data
$ip = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN';
$timestamp = date('Y-m-d H:i:s');
$puzzleID = $_GET['p'] ?? '_';
$success = $_GET['s'] ?? '0';

// Create log entry: [timestamp] IP | Puzzle: ID | Success: Status
$logEntry = "{$timestamp} {$ip} {$puzzleID} {$success}" . PHP_EOL;

// Save to file
file_put_contents($logFile, $logEntry, FILE_APPEND);

// summarise log file if we have some data and this last puzzle was solved
if (count(file($logFile)) >= $LINES_BEFORE_SUMMARY && $success == '1') {
    processLogFile($logPrefix, $logFile, $summaryFile);
}

// Success response
echo json_encode([
    "status" => $logFile,
]);


// summarises the log file into a summary JSON file and archives the log file
function processLogFile($logPrefix, $logFile, $summaryFile) {

    
    if (!file_exists($logFile)) {
        return; // nothing to do
    }
    // Load existing summary or create a new one
    $summary = file_exists($summaryFile)
        ? json_decode(file_get_contents($summaryFile), true)
        : [];

    $lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    // Track start times per IP per puzzle
    $activePuzzles = [];

    foreach ($lines as $line) {
        // Example line:
        // 2026-01-27 05:19:13 127.0.0.1 0 0
        [$date, $time, $ip, $puzzleId, $status] = explode(' ', $line);

        $timestamp = strtotime("$date $time");

        // Ensure IP entry exists
        if (!isset($summary[$ip])) {
            $summary[$ip] = [
                'numberPuzzles'     => 0,
                'completedPuzzles'  => 0,
                'minPuzzleSeconds'  => null,
                'maxPuzzleSeconds'  => null
            ];
        }

        // Count every puzzle event
        $summary[$ip]['numberPuzzles']++;

        if ($status == "0") {
            // Puzzle started
            $activePuzzles[$ip][$puzzleId] = $timestamp;

        } elseif ($status == "1") {
            // Puzzle completed
            if (isset($activePuzzles[$ip][$puzzleId])) {
                $duration = $timestamp - $activePuzzles[$ip][$puzzleId];

                $summary[$ip]['completedPuzzles']++;

                // Update min/max durations
                if ($summary[$ip]['minPuzzleSeconds'] === null || $duration < $summary[$ip]['minPuzzleSeconds']) {
                    $summary[$ip]['minPuzzleSeconds'] = $duration;
                }
                if ($summary[$ip]['maxPuzzleSeconds'] === null || $duration > $summary[$ip]['maxPuzzleSeconds']) {
                    $summary[$ip]['maxPuzzleSeconds'] = $duration;
                }

                unset($activePuzzles[$ip][$puzzleId]);
            }
        }
    }

    // Save updated summary
    file_put_contents($summaryFile, json_encode($summary, JSON_PRETTY_PRINT));

    // Rotate processed log file
    $i = 1;
    do {
        $newName = sprintf("{$logPrefix}_log_%04d.txt", $i);
        $i++;
    } while (file_exists($newName));

    rename($logFile, $newName);
}

?>