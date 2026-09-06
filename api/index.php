<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database Connection
$db_host = '127.0.0.1';
$db_name = 'quanlyquy';
$db_user = 'root';
$db_passwords = ['vanh2005', '', 'root', '123456'];

$pdo = null;
$conn_error = '';

foreach ($db_passwords as $pwd) {
    try {
        $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $pwd, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        if ($pdo) break;
    } catch (PDOException $e) {
        $conn_error = $e->getMessage();
    }
}

if (!$pdo) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Lỗi kết nối CSDL Laragon MySQL: ' . $conn_error
    ]);
    exit();
}

// Routing
$request_uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents('php://input'), true) ?? [];

// Helper function to get clean action/endpoint
$action = $_GET['action'] ?? '';
if (empty($action)) {
    $path = parse_url($request_uri, PHP_URL_PATH);
    $parts = explode('/api/', $path);
    if (count($parts) > 1) {
        $action = trim($parts[1], '/');
    }
}

// Clean action query strings
$action = explode('?', $action)[0];

switch ($action) {
    case 'verify-access':
        $password = trim($body['password'] ?? '');
        $stmt = $pdo->query("SELECT `key`, `value` FROM settings WHERE `key` IN ('admin_pin', 'group_password')");
        $rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        $real_pin = $rows['admin_pin'] ?? '888888';
        $group_pwd = $rows['group_password'] ?? '123456';

        if ($password === $real_pin) {
            echo json_encode([
                'status' => 'success', 
                'verified' => true, 
                'role' => 'admin',
                'token' => md5($real_pin . time())
            ]);
        } elseif ($password === $group_pwd) {
            echo json_encode([
                'status' => 'success', 
                'verified' => true, 
                'role' => 'member',
                'token' => md5($group_pwd . time())
            ]);
        } else {
            http_response_code(401);
            echo json_encode([
                'status' => 'error', 
                'verified' => false, 
                'message' => 'Mật khẩu truy cập không đúng. Vui lòng liên hệ Thủ Quỹ!'
            ]);
        }
        break;

    case 'verify-pin':
        $pin = $body['pin'] ?? '';
        $stmt = $pdo->prepare("SELECT `value` FROM settings WHERE `key` = 'admin_pin'");
        $stmt->execute();
        $real_pin = $stmt->fetchColumn() ?: '888888';

        if ($pin === $real_pin) {
            echo json_encode(['status' => 'success', 'verified' => true, 'token' => md5($real_pin . time())]);
        } else {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'verified' => false, 'message' => 'Mã PIN không chính xác']);
        }
        break;

    case 'settings':
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT `key`, `value` FROM settings");
            $rows = $stmt->fetchAll();
            $settings = [];
            foreach ($rows as $row) {
                if ($row['key'] !== 'admin_pin') { // Hide PIN from public view
                    $settings[$row['key']] = $row['value'];
                }
            }
            echo json_encode(['status' => 'success', 'data' => $settings]);
        } elseif ($method === 'POST') {
            $stmt = $pdo->prepare("INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)");
            foreach ($body as $k => $v) {
                $stmt->execute([$k, $v]);
            }
            echo json_encode(['status' => 'success', 'message' => 'Đã lưu cài đặt thành công']);
        }
        break;

    case 'dashboard':
        // Total balance
        $stmt = $pdo->query("SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
            FROM transactions");
        $all_time = $stmt->fetch();
        $total_balance = (float)$all_time['total_income'] - (float)$all_time['total_expense'];

        // Current month summary
        $month = (int)($_GET['month'] ?? date('n'));
        $year = (int)($_GET['year'] ?? date('Y'));

        $stmt = $pdo->prepare("SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS month_income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS month_expense
            FROM transactions 
            WHERE MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?");
        $stmt->execute([$month, $year]);
        $month_stats = $stmt->fetch();

        // Previous month stats for % comparison
        $prev_month = $month == 1 ? 12 : $month - 1;
        $prev_year = $month == 1 ? $year - 1 : $year;
        $stmt = $pdo->prepare("SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS prev_income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS prev_expense
            FROM transactions 
            WHERE MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?");
        $stmt->execute([$prev_month, $prev_year]);
        $prev_stats = $stmt->fetch();

        // 6 months comparison chart data
        $chart_data = [];
        for ($i = 5; $i >= 0; $i--) {
            $calc_time = strtotime("-$i months", strtotime("$year-$month-01"));
            $m = (int)date('n', $calc_time);
            $y = (int)date('Y', $calc_time);
            $stmt = $pdo->prepare("SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
                FROM transactions 
                WHERE MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?");
            $stmt->execute([$m, $y]);
            $res = $stmt->fetch();
            $chart_data[] = [
                'name' => "Tháng $m",
                'month' => $m,
                'year' => $y,
                'income' => (float)$res['income'],
                'expense' => (float)$res['expense']
            ];
        }

        echo json_encode([
            'status' => 'success',
            'data' => [
                'total_balance' => $total_balance,
                'month_income' => (float)$month_stats['month_income'],
                'month_expense' => (float)$month_stats['month_expense'],
                'prev_month_income' => (float)$prev_stats['prev_income'],
                'prev_month_expense' => (float)$prev_stats['prev_expense'],
                'chart_data' => $chart_data
            ]
        ]);
        break;

    case 'members':
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM members WHERE active = 1 ORDER BY id ASC");
            echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
        } elseif ($method === 'POST') {
            $stmt = $pdo->prepare("INSERT INTO members (name, phone, bank_id, bank_account_no, bank_account_name) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $body['name'],
                $body['phone'] ?? '',
                $body['bank_id'] ?? 'MBBank',
                $body['bank_account_no'] ?? '',
                $body['bank_account_name'] ?? ''
            ]);
            echo json_encode(['status' => 'success', 'id' => $pdo->lastInsertId()]);
        } elseif ($method === 'PUT') {
            $id = (int)($_GET['id'] ?? $body['id'] ?? 0);
            $stmt = $pdo->prepare("UPDATE members SET name = ?, phone = ?, bank_id = ?, bank_account_no = ?, bank_account_name = ? WHERE id = ?");
            $stmt->execute([
                $body['name'],
                $body['phone'] ?? '',
                $body['bank_id'] ?? 'MBBank',
                $body['bank_account_no'] ?? '',
                $body['bank_account_name'] ?? '',
                $id
            ]);
            echo json_encode(['status' => 'success', 'message' => 'Đã cập nhật thông tin thành viên']);
        }
        break;

    case 'contributions':
        $month = (int)($_GET['month'] ?? date('n'));
        $year = (int)($_GET['year'] ?? date('Y'));

        $members = $pdo->query("SELECT * FROM members WHERE active = 1 ORDER BY id ASC")->fetchAll();
        $settings_stmt = $pdo->query("SELECT `value` FROM settings WHERE `key` = 'weekly_amount'");
        $weekly_amount = (float)($settings_stmt->fetchColumn() ?: 10000);

        // Ensure 4 weeks exist for each member in this month
        $insert_stmt = $pdo->prepare("INSERT IGNORE INTO fund_contributions (member_id, year, month, week, amount, is_paid) VALUES (?, ?, ?, ?, ?, 0)");
        foreach ($members as $m) {
            for ($w = 1; $w <= 4; $w++) {
                $insert_stmt->execute([$m['id'], $year, $month, $w, $weekly_amount]);
            }
        }

        // Fetch all weeks grouped by member
        $stmt = $pdo->prepare("SELECT * FROM fund_contributions WHERE year = ? AND month = ? ORDER BY member_id ASC, week ASC");
        $stmt->execute([$year, $month]);
        $all_contributions = $stmt->fetchAll();

        $grouped_by_member = [];
        foreach ($all_contributions as $c) {
            $mid = $c['member_id'];
            if (!isset($grouped_by_member[$mid])) {
                $grouped_by_member[$mid] = [];
            }
            $grouped_by_member[$mid][] = $c;
        }

        $result = [];
        foreach ($members as $m) {
            $mid = $m['id'];
            $weeks = $grouped_by_member[$mid] ?? [];
            $paid_count = 0;
            $total_paid = 0;
            $notes = [];

            foreach ($weeks as $w) {
                if ($w['is_paid'] == 1) {
                    $paid_count++;
                    $total_paid += (float)$w['amount'];
                }
                if (!empty($w['note'])) {
                    $notes[] = $w['note'];
                }
            }

            $result[] = [
                'member_id' => $mid,
                'member_name' => $m['name'],
                'member_phone' => $m['phone'],
                'member_bank_id' => $m['bank_id'],
                'member_bank_account_no' => $m['bank_account_no'],
                'member_bank_account_name' => $m['bank_account_name'],
                'month' => $month,
                'year' => $year,
                'weeks' => $weeks,
                'paid_weeks_count' => $paid_count,
                'total_paid' => $total_paid,
                'is_month_fully_paid' => ($paid_count >= 4),
                'note' => count($notes) > 0 ? implode(', ', array_unique($notes)) : ''
            ];
        }

        echo json_encode(['status' => 'success', 'data' => $result]);
        break;

    case 'contributions/toggle-week':
        if ($method === 'POST') {
            $id = (int)$body['id'];
            $is_paid = (int)$body['is_paid'];
            $paid_at = $is_paid ? date('Y-m-d H:i:s') : null;
            $note = $body['note'] ?? null;

            $stmt = $pdo->prepare("UPDATE fund_contributions SET is_paid = ?, paid_at = ?, note = COALESCE(?, note) WHERE id = ?");
            $stmt->execute([$is_paid, $paid_at, $note, $id]);

            echo json_encode(['status' => 'success', 'message' => 'Đã cập nhật trạng thái tuần']);
        }
        break;

    case 'contributions/toggle-month':
        if ($method === 'POST') {
            $member_id = (int)$body['member_id'];
            $month = (int)$body['month'];
            $year = (int)$body['year'];
            $is_paid = (int)$body['is_paid'];
            $paid_at = $is_paid ? date('Y-m-d H:i:s') : null;
            $note = $is_paid ? ($body['note'] ?? "Đóng cả tháng $month/$year (40.000đ)") : null;

            $stmt = $pdo->prepare("UPDATE fund_contributions SET is_paid = ?, paid_at = ?, note = ? WHERE member_id = ? AND month = ? AND year = ?");
            $stmt->execute([$is_paid, $paid_at, $note, $member_id, $month, $year]);

            echo json_encode(['status' => 'success', 'message' => 'Đã cập nhật trạng thái cả tháng']);
        }
        break;

    case 'contributions/submit-payment':
        if ($method === 'POST') {
            $member_id = (int)$body['member_id'];
            $month = (int)$body['month'];
            $year = (int)$body['year'];
            $amount = (float)$body['amount'];
            $note = trim($body['note'] ?? '');
            
            // Tính số tuần tương ứng với số tiền (10.000đ = 1 tuần)
            $weeks_to_pay = max(1, min(4, (int)floor($amount / 10000)));
            if ($amount >= 40000) $weeks_to_pay = 4;

            $full_note = $note ? $note : "Nộp $weeks_to_pay tuần T$month/$year (" . number_format($amount, 0, ',', '.') . "đ)";

            // 1. Tích các tuần tương ứng
            if ($weeks_to_pay >= 4) {
                // Tích trọn 4 tuần
                $stmt = $pdo->prepare("UPDATE fund_contributions SET is_paid = 1, paid_at = NOW(), note = ? WHERE member_id = ? AND month = ? AND year = ?");
                $stmt->execute([$full_note, $member_id, $month, $year]);
            } else {
                // Tích các tuần chưa nộp tiếp theo
                $stmt = $pdo->prepare("SELECT id FROM fund_contributions WHERE member_id = ? AND month = ? AND year = ? AND is_paid = 0 ORDER BY week ASC LIMIT ?");
                $stmt->bindValue(1, $member_id, PDO::PARAM_INT);
                $stmt->bindValue(2, $month, PDO::PARAM_INT);
                $stmt->bindValue(3, $year, PDO::PARAM_INT);
                $stmt->bindValue(4, $weeks_to_pay, PDO::PARAM_INT);
                $stmt->execute();
                $unpaid_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);

                if (count($unpaid_ids) > 0) {
                    $in = str_repeat('?,', count($unpaid_ids) - 1) . '?';
                    $up_stmt = $pdo->prepare("UPDATE fund_contributions SET is_paid = 1, paid_at = NOW(), note = ? WHERE id IN ($in)");
                    $up_stmt->execute(array_merge([$full_note], $unpaid_ids));
                }
            }

            // 2. Lấy tên thành viên
            $mem_stmt = $pdo->prepare("SELECT name FROM members WHERE id = ?");
            $mem_stmt->execute([$member_id]);
            $member_name = $mem_stmt->fetchColumn() ?: 'Thành viên';

            // 3. Tự động ghi vào lịch sử giao dịch transactions
            $tx_stmt = $pdo->prepare("INSERT INTO transactions (type, amount, category, member_id, member_name, description, transaction_date) 
                VALUES ('income', ?, 'Thu quỹ định kỳ', ?, ?, ?, CURDATE())");
            $tx_stmt->execute([$amount, $member_id, $member_name, $full_note]);

            echo json_encode(['status' => 'success', 'message' => "Đã ghi nhận đóng $weeks_to_pay tuần và lưu vào lịch sử giao dịch!"]);
        }
        break;

    case 'transactions':
        if ($method === 'GET') {
            $query = "SELECT * FROM transactions WHERE 1=1";
            $params = [];

            if (!empty($_GET['month'])) {
                $query .= " AND MONTH(transaction_date) = ?";
                $params[] = (int)$_GET['month'];
            }
            if (!empty($_GET['year'])) {
                $query .= " AND YEAR(transaction_date) = ?";
                $params[] = (int)$_GET['year'];
            }
            if (!empty($_GET['type']) && in_array($_GET['type'], ['income', 'expense'])) {
                $query .= " AND type = ?";
                $params[] = $_GET['type'];
            }
            if (!empty($_GET['category'])) {
                $query .= " AND category = ?";
                $params[] = $_GET['category'];
            }
            if (!empty($_GET['search'])) {
                $query .= " AND (description LIKE ? OR member_name LIKE ? OR category LIKE ?)";
                $search = '%' . $_GET['search'] . '%';
                $params[] = $search;
                $params[] = $search;
                $params[] = $search;
            }

            $query .= " ORDER BY transaction_date DESC, id DESC";

            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
        } elseif ($method === 'POST') {
            $stmt = $pdo->prepare("INSERT INTO transactions 
                (type, amount, category, member_name, description, receipt_url, transaction_date) 
                VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $body['type'],
                (float)$body['amount'],
                $body['category'],
                $body['member_name'] ?? 'Thủ quỹ',
                $body['description'] ?? '',
                $body['receipt_url'] ?? '',
                $body['transaction_date'] ?? date('Y-m-d')
            ]);
            echo json_encode(['status' => 'success', 'id' => $pdo->lastInsertId()]);
        } elseif ($method === 'PUT') {
            $id = (int)($_GET['id'] ?? $body['id'] ?? 0);
            $stmt = $pdo->prepare("UPDATE transactions SET 
                type = ?, amount = ?, category = ?, member_name = ?, description = ?, receipt_url = ?, transaction_date = ? 
                WHERE id = ?");
            $stmt->execute([
                $body['type'],
                (float)$body['amount'],
                $body['category'],
                $body['member_name'] ?? 'Thủ quỹ',
                $body['description'] ?? '',
                $body['receipt_url'] ?? '',
                $body['transaction_date'] ?? date('Y-m-d'),
                $id
            ]);
            echo json_encode(['status' => 'success', 'message' => 'Đã cập nhật giao dịch']);
        } elseif ($method === 'DELETE') {
            $id = (int)($_GET['id'] ?? $body['id'] ?? 0);
            $stmt = $pdo->prepare("DELETE FROM transactions WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['status' => 'success', 'message' => 'Đã xóa giao dịch']);
        }
        break;

    default:
        echo json_encode([
            'status' => 'online',
            'service' => 'QuanLyQuy Backend REST API',
            'version' => '1.0.0',
            'endpoints' => [
                '/api/dashboard',
                '/api/members',
                '/api/contributions',
                '/api/contributions/toggle',
                '/api/transactions',
                '/api/settings',
                '/api/verify-pin'
            ]
        ]);
        break;
}
?>
