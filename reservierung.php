<?php
declare(strict_types=1);

/**
 * Rahmi's Café & Lounge – Reservierungsanfrage
 * Empfängt das Formular per POST, prüft die Angaben und versendet eine E-Mail mit mail().
 * Hosting: IONOS (PHP 8). Antwort immer als JSON: {"ok": true} oder {"ok": false, "error": "..."}.
 */

// ── Konfiguration ──────────────────────────────────────────────
// E-Mail-Adresse, an die Reservierungsanfragen gehen. Bei IONOS sollte es eine
// Adresse der eigenen Domain sein, da sie auch als Absender (From) verwendet wird.
$empfaenger = '[BITTE ERGÄNZEN]';
// ───────────────────────────────────────────────────────────────

// Fehlermeldungen nie ausgeben: sie würden die JSON-Antwort zerstören
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function antwort(int $status, array $daten): never
{
    http_response_code($status);
    echo json_encode($daten, JSON_UNESCAPED_UNICODE);
    exit;
}

// Anzeigename im Header immer als Encoded-Word: sicher auch bei Kommas, Anführungszeichen und Umlauten
function anzeigename(string $name): string
{
    return '=?UTF-8?B?' . base64_encode($name) . '?=';
}

function feld(string $name, int $maxLaenge = 200): string
{
    $wert = isset($_POST[$name]) && is_string($_POST[$name]) ? trim($_POST[$name]) : '';
    // Steuerzeichen (inkl. Zeilenumbrüche) entfernen – verhindert Header-Injection
    $wert = preg_replace('/[\x00-\x1F\x7F]/u', ' ', $wert) ?? '';
    return mb_substr($wert, 0, $maxLaenge);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    antwort(405, ['ok' => false, 'error' => 'Nur POST-Anfragen sind erlaubt.']);
}

// Honeypot: Dieses Feld ist für Menschen unsichtbar. Ist es ausgefüllt, war es ein Bot.
// Wir antworten mit Erfolg, senden aber nichts.
if (feld('website') !== '') {
    antwort(200, ['ok' => true]);
}

$vorname   = feld('vorname', 80);
$nachname  = feld('nachname', 80);
$email     = feld('email', 160);
$telefon   = feld('telefon', 40);
$datum     = feld('datum', 10);
$uhrzeit   = feld('uhrzeit', 5);
$personen  = feld('personen', 2);
// Anmerkungen dürfen Zeilenumbrüche enthalten (nur im E-Mail-Text, nie im Header)
$anmerkungen = isset($_POST['anmerkungen']) && is_string($_POST['anmerkungen'])
    ? mb_substr(trim(preg_replace('/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/u', ' ', $_POST['anmerkungen']) ?? ''), 0, 1000)
    : '';

$fehler = [];
if ($vorname === '')  { $fehler[] = 'vorname'; }
if ($nachname === '') { $fehler[] = 'nachname'; }
if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) { $fehler[] = 'email'; }

$tag = DateTimeImmutable::createFromFormat('!Y-m-d', $datum, new DateTimeZone('Europe/Berlin'));
$heute = new DateTimeImmutable('today', new DateTimeZone('Europe/Berlin'));
if ($tag === false || $tag->format('Y-m-d') !== $datum || $tag < $heute) { $fehler[] = 'datum'; }

// Reservierungszeiten: 09:00 bis 19:00 Uhr im 30-Minuten-Takt
$erlaubteZeiten = [];
for ($minuten = 9 * 60; $minuten <= 19 * 60; $minuten += 30) {
    $erlaubteZeiten[] = sprintf('%02d:%02d', intdiv($minuten, 60), $minuten % 60);
}
if (!in_array($uhrzeit, $erlaubteZeiten, true)) { $fehler[] = 'uhrzeit'; }

if (!ctype_digit($personen) || (int)$personen < 1 || (int)$personen > 8) { $fehler[] = 'personen'; }

if ($fehler) {
    antwort(400, ['ok' => false, 'error' => 'Bitte prüfen Sie Ihre Angaben.', 'felder' => $fehler]);
}

if (filter_var($empfaenger, FILTER_VALIDATE_EMAIL) === false) {
    // Empfängeradresse noch nicht eingetragen
    antwort(500, ['ok' => false, 'error' => 'Das Formular ist noch nicht eingerichtet.']);
}

$name = $vorname . ' ' . $nachname;
$datumDeutsch = $tag->format('d.m.Y');
$betreff = 'Reservierungsanfrage: ' . $name . ' – ' . $datumDeutsch . ', ' . $uhrzeit . ' Uhr, ' . $personen . ' Pers.';

$text = "Neue Reservierungsanfrage über die Website\n"
      . "==========================================\n\n"
      . "Name:        $name\n"
      . "E-Mail:      $email\n"
      . "Telefon:     " . ($telefon !== '' ? $telefon : '–') . "\n"
      . "Datum:       $datumDeutsch\n"
      . "Uhrzeit:     $uhrzeit Uhr\n"
      . "Personen:    $personen\n\n"
      . "Anmerkungen:\n" . ($anmerkungen !== '' ? $anmerkungen : '–') . "\n\n"
      . "--\nAntworten Sie direkt auf diese E-Mail, um dem Gast zu schreiben.\n";

$kopfzeilen = [
    'MIME-Version'              => '1.0',
    'Content-Type'              => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => '8bit',
    'From'                      => anzeigename("Website Rahmi's Café") . " <$empfaenger>",
    'Reply-To'                  => anzeigename($name) . " <$email>",
    'X-Mailer'                  => 'PHP/' . PHP_MAJOR_VERSION,
];

$gesendet = mail(
    $empfaenger,
    mb_encode_mimeheader($betreff, 'UTF-8', 'B'),
    $text,
    $kopfzeilen,
    '-f' . $empfaenger
);

if (!$gesendet) {
    antwort(500, ['ok' => false, 'error' => 'Die E-Mail konnte nicht gesendet werden.']);
}

antwort(200, ['ok' => true]);
