# 物語の種 ver2：GitHub Pages版

5,000語から選ばれる9つのことばと、104の有名な物語を組み合わせて、新しい物語のアイデアを考える創作支援アプリです。

## ver2の内容

- 9分類・5,000語から9語を抽選
- 104作品から「もうひとつの種」を抽選
- 初回は、ことばと物語を同時に抽選
- 2回目以降は「ことばだけ回す」「物語だけ回す」を選択可能
- ことばをマウスで指すかタップすると意味を表示
- スマートフォンとChromebookに対応

## GitHubへ公開する手順

1. ZIPファイルを解凍します。
2. GitHubで `monogatarino-tane-ver2` という新しいリポジトリを作ります。
3. 「Add file」→「Upload files」を選びます。
4. 解凍したフォルダ内のファイルを、すべてアップロードします。
5. 「Commit changes」を押します。
6. 「Settings」→「Pages」を開きます。
7. Sourceを `Deploy from a branch` にします。
8. Branchを `main`、フォルダを `/(root)` にして「Save」を押します。

公開URLは通常、次の形になります。

`https://ユーザー名.github.io/monogatarino-tane-ver2/`

## ファイル構成

- `index.html`：画面
- `style.css`：デザイン
- `script.js`：抽選と表示の動作
- `words.json`：5,000語のデータ
- `stories.json`：104作品と物語の型
- `og-image-v2.jpg`：リンクカード用画像
- `.nojekyll`：GitHub Pages用設定

## 注意

- ZIPのままでは動きません。必ず解凍して中身をアップロードしてください。
- ファイルはすべて同じ階層に置いてください。
- GitHub上で公開すると、JSONデータも誰でも閲覧できます。
