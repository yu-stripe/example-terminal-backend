# Terminal Selector機能

この機能により、Stripe Terminal Readersのリストを表示し、選択したTerminalをセッションに保存することができます。

## 機能概要

1. **Terminal Readers一覧表示**: Stripe APIからTerminal Readersのリストを取得して表示
2. **Terminal選択**: ユーザーがTerminalを選択し、セッションに保存
3. **セッション管理**: 選択されたTerminal IDをサーバーサイドのセッションで管理
4. **便利なAPI**: 選択されたTerminalを使用した簡素化されたエンドポイント

## 新しく追加されたエンドポイント

### 1. Terminal Readersリスト取得
```
GET /api/terminal/readers
```

**パラメータ（オプション）:**
- `limit`: 取得件数制限（デフォルト: 100）
- `device_type`: デバイスタイプでフィルタ
- `location`: 場所IDでフィルタ
- `serial_number`: シリアル番号でフィルタ
- `status`: ステータスでフィルタ（online/offline）

### 2. Terminal選択
```
POST /api/terminal/select
Content-Type: application/json

{
  "reader_id": "tmr_xxxxx"
}
```

### 3. 選択されたTerminal取得
```
GET /api/terminal/selected
```

### 4. 便利なエンドポイント（選択されたTerminalを自動使用）

#### Email収集（選択されたTerminalを使用）
```
POST /api/terminal/collect_email
Content-Type: application/json

{
  "customer_id": "cus_xxxxx" // オプション
}
```

#### 収集データ取得（選択されたTerminalから）
```
GET /api/terminal/collected_data
```

#### 収集アクション停止（選択されたTerminalで）
```
POST /api/terminal/cancel_collect_inputs
```

## フロントエンド

### 新しく追加されたページ
- `/terminal` - Terminal選択画面

### 使用方法

1. ブラウザで `/terminal` にアクセス
2. 利用可能なTerminal Readersの一覧が表示される
3. 使用したいTerminalの「Select」ボタンをクリック
4. 選択されたTerminalが緑色のチェックマークで表示される
5. 他の機能で選択されたTerminalが自動的に使用される

## Terminal Reader情報

各Terminal Readerカードには以下の情報が表示されます：

- **ラベル/ID**: Terminalの名前またはID
- **デバイスタイプ**: Terminal Readerの種類
- **ステータス**: オンライン/オフライン状態
- **シリアル番号**: デバイスのシリアル番号
- **IPアドレス**: ネットワークIPアドレス（該当する場合）
- **最終確認時刻**: 最後にオンラインだった時刻

## サポートされるデバイスタイプ

- BBPOS Chipper 2X BT
- BBPOS WisePad 3
- BBPOS WisePOS E
- Tap to Pay
- Simulated Stripe S700
- Simulated BBPOS WisePOS E
- Stripe M2
- Stripe S700

## エラーハンドリング

- オフラインのTerminalは選択できません
- 選択されたTerminalが存在しなくなった場合、セッションから自動的に削除されます
- APIキーが設定されていない場合、適切なエラーメッセージが表示されます
- ネットワークエラーの場合、リトライボタンが表示されます

## セッション管理

- 選択されたTerminal IDは `session[:selected_reader_id]` に保存されます
- セッションはサーバーサイドで管理され、ブラウザを閉じるまで保持されます
- 無効なTerminal IDが選択された場合、自動的にセッションから削除されます

## 使用例

```javascript
// Terminal一覧を取得
const response = await fetch('/api/terminal/readers');
const data = await response.json();
console.log(data.data); // Terminal Readersの配列

// Terminalを選択
await fetch('/api/terminal/select', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ reader_id: 'tmr_xxxxx' })
});

// 選択されたTerminalでEmail収集を開始
await fetch('/api/terminal/collect_email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ customer_id: 'cus_xxxxx' })
});
```

## スタイリング

Terminal選択画面は既存のStripeテーマに合わせてデザインされており、レスポンシブデザインに対応しています。

- デスクトップ: グリッドレイアウトで複数カードを表示
- モバイル: 単一カラムレイアウトに自動調整
- ホバー効果とアニメーション付き
- 選択状態の視覚的フィードバック 