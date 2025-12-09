# コードレビュー自動化システム

このプロジェクトは、HTML/CSS/JavaScriptのコーディング品質を自動検証するシステムです。

## 2つの検証機能

### Nu HTML Checker による W3C準拠チェック

**目的**: HTML仕様への準拠性を機械的に検証  
**判定基準**: W3C標準仕様（HTML Living Standard）  
**実行方法**: コマンドライン（自動化可能）  
**出力**: `nu-report.json`

**検出内容の例**:
- 属性値の構文エラー（空文字、不正な値など）
- 閉じタグ漏れ・不正なネスト
- 許可されていない属性の使用
- HTML構文違反

### コーディングガイドライン準拠チェック

**目的**: プロジェクト固有の社内ルール・コーディング規約への準拠性を検証  
**判定基準**: `docs/coding-guideline.md`で定義されたルール  
**実行方法**: GitHub Copilot に手動で依頼  
**出力**: Copilot Chat での分析結果

**検出内容の例**:
- BEM記法の命名規則違反
- インデント不統一（2スペース統一ルール）
- `img`タグの`decoding="async"`未指定
- 見出し階層のスキップ（h2→h4など）
- クラス命名規則違反
- 画像ファイル命名規則違反

### 統合運用

実際の運用では、両方を**組み合わせて**使用します：

```
1. Nu HTML Checker実行 → nu-report.json生成（W3C準拠チェック）
2. GitHub Copilotに分析依頼
3. Copilotが両方の結果を統合分析
   - nu-report.json の内容（W3C準拠）
   - coding-guideline.md のルール（社内規約）
4. 統合的な修正案を優先度付きで提示
```

**重要**: 2つの検証は**別軸**であり、それぞれ独立して実行・確認できます。

## システム概要

### 機能一覧

#### 【機能A】W3C準拠検証（Nu HTML Checker）

1. **ディレクトリ単位でのHTML バリデーション**
   - Nu HTML Checkerを使用したW3C準拠の検証
   - 複数HTMLファイルの一括検証
   - JSON形式でのレポート出力
   - CI/CDパイプライン対応

2. **エラー分析・優先度付け**
   - valid=falseのファイルのみ抽出
   - エラー件数の自動カウント（type="error"）
   - エラー内容の日本語要約とグルーピング
   - 「致命的」「要修正」「軽微」の3段階優先度付け
   - 具体的な修正方針の提示

#### 【機能B】社内ガイドライン準拠チェック（GitHub Copilot）

3. **コーディングガイドライン準拠チェック**
   - BEM記法の命名規則チェック
   - インデントの一貫性チェック
   - img要素のwidth/height属性チェック
   - 見出し階層（hタグ）の論理性チェック
   - アクセシビリティ準拠チェック
   - 画像ファイル命名規則チェック

4. **GitHub Copilot連携**
   - nu-report.jsonの内容に基づく自動分析
   - coding-guideline.mdに沿った修正案の生成
   - Before/After形式での具体的な修正例の提示
   - 両軸を統合した総合的なレビュー

## 技術スタック

### 【機能A】W3C準拠チェック用
- **html-validator-cli**: v7.0.1（Nu HTML Checkerのラッパー）
- **W3C Nu HTML Checker**: HTML Living Standard準拠の検証エンジン
- **Node.js**: スクリプト実行環境
- **glob**: ファイルパターンマッチング

### 【機能B】社内ガイドライン準拠チェック用
- **GitHub Copilot**: AIによるコードレビュー・エラー分析
- **coding-guideline.md**: 社内コーディング規約定義

## プロジェクト構成

```
/
├── package.json                    # 依存関係とスクリプト定義
├── nu-report.json                  # 【機能A】W3C準拠チェック結果（自動生成）
├── scripts/
│   └── nu-validate-all.js          # 【機能A】ディレクトリ一括検証スクリプト
├── docs/
│   ├── coding-guideline.md         # 【機能B】社内コーディング規約定義
│   └── ai-prompts.md               # 【機能B】Copilot用プロンプト集
└── html/                           # 検証対象のHTMLディレクトリ
```

## 使用方法

### 【機能A】W3C準拠チェック（Nu HTML Checker）

#### 1-A. HTMLバリデーション実行

```bash
# 特定ディレクトリ配下を検証
npm run nu:dir -- html/xxx

# 単一HTMLファイルを検証
npm run nu:html -- html/xxx/index.html
```

**実行内容**:
- 指定ディレクトリ配下の全HTMLファイルのW3C準拠性チェック
- 結果を`nu-report.json`に出力
- HTML構文エラー・仕様違反を検出
- エラーがあっても処理を継続

#### 1-B. エラー分析と優先度付け（GitHub Copilot）

以下のプロンプトを使用してCopilot Chatで分析を依頼：

```
これから特定ディレクトリ配下の HTML について、Nu Html Checker の結果を整理したいです。

対象ディレクトリは：html/xxx です。

次の手順を順番に実行してください。

1. @terminal で npm run nu:dir -- html/xxx を実行してください。
2. コマンドの実行が完了したら、プロジェクトルートに出力された nu-report.json を開いて内容を読み込んでください。
3. nu-report.json の results 配列のうち、valid が false のファイルだけを対象に、次の項目をまとめてください。
   - ファイルパス
   - エラー件数（type が "error" の message の数）
   - 主なエラー内容の日本語要約（似た内容はグルーピングしてOK）
   - 修正方針（何をどう直すべきか）
4. そのうえで、エラーを「致命的」「要修正」「軽微」の3段階で優先度付けし、優先度の高い順に一覧化してください。
5. 最後に、「致命的」と判定したエラーから順に、具体的な修正例を HTML コードの before / after 形式で提示してください。

前提条件：
- **W3C準拠の判断**: 必ず nu-report.json の内容に基づいてください。
- **社内ガイドライン**: coding-guideline.md に書かれているガイドライン（特に img の width/height、alt、見出し階層、class 命名など）も考慮し、可能な範囲で社内ルールに沿う修正案にしてください。
```

---

### 【機能B】社内ガイドライン準拠チェック（GitHub Copilot）

#### 2-A. コーディングガイドライン準拠レビュー

**対象**: プロジェクト固有の社内ルール・コーディング規約  
**基準**: [`docs/coding-guideline.md`](docs/coding-guideline.md)

以下のプロンプトを使用してCopilot Chatでレビューを依頼：

```
このプロジェクトの coding-guideline.md に基づいて、html/xxx/index.html をレビューしてください。
ガイドライン違反箇所と修正案を、箇条書きで優先度付き（High／Medium／Low）で出してください。
特に、マークアップの閉じタグ漏れ・インデント不統一・BEM命名ルール違反・imgタグの width/height非指定・コンソールエラーの可能性があるスクリプト読み込み位置などを重点的にチェックしてください。
```

**チェック項目**:
- BEM記法の命名規則
- インデント統一（2スペース）
- `img`タグの`decoding="async"`指定
- 見出し階層の論理性
- クラス命名規則
- 画像ファイル命名規則
- コメント記述ルール

---


## 関連ファイル

### 【機能A】W3C準拠チェック関連
- [`package.json`](package.json) - 依存関係とスクリプト定義
- [`scripts/nu-validate-all.js`](scripts/nu-validate-all.js) - ディレクトリ一括検証スクリプト
- [`nu-report.json`](nu-report.json) - 最新のW3C準拠チェック結果（自動生成）

### 【機能B】社内ガイドライン準拠チェック関連
- [`docs/coding-guideline.md`](docs/coding-guideline.md) - 社内コーディング規約
- [`docs/ai-prompts.md`](docs/ai-prompts.md) - Copilot用プロンプト集

---


