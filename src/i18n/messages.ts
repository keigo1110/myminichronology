import type { Locale } from './types';

/** 日本語が正本。英語は同じキーをすべて持つこと。 */
export const jaMessages = {
  'brand.name': 'ミニクロ',
  'brand.h1': 'ミニクロ - Excelから年表を自動生成',

  'header.yearHeight': '年間高さ調整',
  'header.yearWidth': '年あたりの幅を調整',
  'header.yearHeightAria': '年間高さ',
  'header.yearWidthAria': '年あたりの幅',
  'header.resetDefault24': 'デフォルト値（24px）にリセット',
  'header.swapToHorizontal': '縦横入れ替え（縦：テーマ・横：年代）',
  'header.swapToVertical': '縦横入れ替え（縦：年代・横：テーマ）',
  'header.swapAria': '縦横入れ替え',
  'header.labelsToHorizontal': '出来事ラベルを横書きに切替',
  'header.labelsToVertical': '出来事ラベルを縦書きに切替',
  'header.layoutBusy': '表示を更新中です。完了後にもう一度お試しください。',
  'header.upload': 'Excel ファイルをアップロード',
  'header.uploadAria': 'Excelファイルをアップロード',
  'header.pdf': 'PDF エクスポート',
  'header.pdfBusy': 'PDFを生成中…',
  'header.pdfBusyProgress': 'PDFを生成中… {percent}%',
  'header.pdfAria': 'PDFエクスポート',
  'header.darkMode': 'ダークモードに切替',
  'header.lightMode': 'ライトモードに切替',
  'header.langToEn': 'Switch to English',
  'header.langToJa': '日本語に切替',
  'header.help': '使い方ガイド',
  'header.expandOpen': '表示範囲の設定を開く',
  'header.expandClose': '表示範囲の設定を閉じる',
  'header.filterHint':
    'Excelファイルを読み込むと、検索・年代範囲・レーンの設定が表示されます。',
  'header.searchPlaceholder': '表示中を検索',
  'header.searchAria': '表示中の出来事を検索',
  'header.searchPrev': '前の一致（Shift+Enter）',
  'header.searchPrevAria': '前の検索結果へ',
  'header.searchNext': '次の一致（Enter）',
  'header.searchNextAria': '次の検索結果へ',
  'header.yearRange': '年代範囲:',
  'header.startYear': '開始年',
  'header.resetYearRange': '年代範囲をリセット',
  'header.endYear': '終了年',
  'header.resetDefault': 'デフォルト値にリセット',
  'header.layoutModeAria': '年代範囲の見せ方',
  'header.layoutZoom': '拡大して再配置',
  'header.layoutFilter': '位置はそのまま',
  'header.layoutZoomHelp': '選んだ年代を画面いっぱいに広げて再配置します',
  'header.layoutFilterHelp': '全体の位置関係はそのまま、範囲外の出来事だけ隠します',
  'header.layoutHelpAria': '年代範囲の見せ方の説明',
  'header.lanes': 'レーン:',
  'header.resetLanes': 'すべてのレーンを表示',
  'header.laneSelectAria': 'レーン選択',
  'header.moveLaneLeft': '{lane}を前へ移動',
  'header.moveLaneRight': '{lane}を後へ移動',
  'event.details': '出来事の詳細',
  'timeline.region': '年表（矢印キーやPageDownでスクロール）',
  'parse.timedOut': '解析が30秒を超えたため中止しました。ファイルを分割して再度お試しください。',
  'alert.details': '詳細を表示（{count}件）',

  'empty.title': '年表をつくる',
  'empty.drop': 'ここにドロップ',
  'empty.subtitle': 'Excel（.xlsx）をドロップするか、ヘッダーからアップロード',
  'empty.subtitleDrop': 'ファイルを離して表示します',
  'empty.limits': '最大10MB・最大5シート／見本ファイルから始められます',
  'empty.sample': '見本Excel',
  'empty.help': '使い方',
  'empty.filterNoResults':
    '表示できる出来事がありません。年代範囲やレーンの選択を確認してください。',

  'axis.years': '年代',
  'event.noImage': '画像なし',
  'event.pointLabel': '{year}年：{label}',
  'event.rangeLabel': '{start}年-{end}年：{label}',

  'alert.copied': 'コピーしました',
  'alert.copyPrompt': 'エージェント用プロンプトをコピー（Skill 付きチャットに貼り付け）',
  'alert.copyAria': 'エージェント用プロンプトをコピー',
  'alert.close': '閉じる',

  'error.boundaryTitle': '表示中にエラーが発生しました。ページを再読み込みしてください。',
  'error.boundaryFallback': '表示中にエラーが発生しました',
  'error.reload': '再読み込み',
  'error.unexpected': '予期しないエラーが発生しました。',
  'error.fileProcess': 'ファイルの処理中にエラーが発生しました',
  'error.noFile': 'ファイルが選択されていません',
  'error.loadFailed': 'Excelファイルの読み込みに失敗しました。',
  'error.pdfFailed': 'PDFのエクスポートに失敗しました。',

  'file.notXlsx': 'Excelファイル（.xlsx）を選択してください',
  'file.notXlsxPeriod': 'Excelファイル（.xlsx）を選択してください。',
  'file.tooLarge': 'ファイルサイズが大きすぎます（10MB以下にしてください）',

  'pdf.elementMissing': 'PDFエクスポート対象の年表要素が見つかりません。',
  'pdf.canvasFailed': 'PDF用キャンバスの初期化に失敗しました。',
  'pdf.tooManyPages': 'PDFは最大{limit}ページです。年代範囲やレーンを絞って再度お試しください。',
  'pdf.imagesOmitted': 'PDFを保存しました。取得できなかった画像{count}件は、代わりに説明を表示しています。',
  'pdf.cancel': 'PDF生成を中止',
  'pdf.cancelling': 'PDF生成を中止しています…',
  'pdf.exportFailed': 'PDFのエクスポートに失敗しました: {detail}',
  'pdf.exportFailedGeneric': 'PDFのエクスポートに失敗しました。',

  'parse.tooManyEvents': '出来事は最大{max}件までです。シートや範囲を分けてください。',
  'parse.tooMuchText': '出来事の文字数は全体で{max}文字までです。長い説明を短くするか、ファイルを分けてください。',
  'parse.moreWarnings': '警告は先頭{max}件を表示しています。ほかに{count}件あります。該当列を修正して再度読み込んでください。',
  'parse.tooManyRows': 'シート「{sheet}」の使用範囲が{max}行を超えています。余分な行の書式や補助情報を削除してください。',
  'parse.labelTooLong': 'シート「{sheet}」{row}行目: 出来事は{max}文字以内にしてください。',
  'parse.noValidData':
    '有効なデータが見つかりませんでした。年・出来事の列を確認してください。',
  'parse.yearSpanTooWide':
    '年の範囲が広すぎます（{min}〜{max}年）。{maxSpan}年以内に収まるデータをご用意ください。',
  'parse.failed': 'Excelファイルの解析に失敗しました: {detail}',
  'parse.failedGeneric': 'Excelファイルの解析に失敗しました。',
  'parse.tooManyLanes':
    'シートが{count}件あります。先頭{max}件のみ読み込みました（{skipped}件をスキップ）。',
  'parse.skippedSheet':
    'シート「{sheet}」は読み込めませんでした（チャートシート等）。',
  'parse.emptySheet': 'シート「{sheet}」にデータ行がありません。',
  'parse.emptySheetNoEvents':
    'シート「{sheet}」から有効なイベントを読み取れませんでした。',
  'parse.missingColumns':
    'シート「{sheet}」{row}行目: 列が不足しているためスキップしました。',
  'parse.missingRequired':
    'シート「{sheet}」{row}行目: 開始年または出来事が空のためスキップしました。',
  'parse.invalidStartYear':
    'シート「{sheet}」{row}行目: 開始年「{value}」が無効です（{min}〜{max}）。',
  'parse.invalidEndYear':
    'シート「{sheet}」{row}行目: 終了年「{value}」が無効なため点イベントとして扱います。',
  'parse.yearOrder':
    'シート「{sheet}」{row}行目: 終了年が開始年より前のため点イベントとして扱います。',
  'parse.invalidFontSize':
    'シート「{sheet}」{row}行目: フォントサイズ「{value}」が無効です（{min}〜{max}）。デフォルトを使います。',
  'parse.invalidColor':
    'シート「{sheet}」{row}行目: 色「{value}」が無効です（例: #C45C26）。黒を使います。',
  'parse.invalidStyle':
    'シート「{sheet}」{row}行目: 表示スタイル「{value}」は未対応のため通常表示にします（使える値: 空欄 または label）。',
  'parse.invalidImageUrl':
    'シート「{sheet}」{row}行目: 画像リンク「{value}」が無効です（http/https の URL のみ）。画像なしで表示します。',

  'warning.moreCount': '他{count}件の警告があります。',
} as const;

export type MessageKey = keyof typeof jaMessages;

export const enMessages: Record<MessageKey, string> = {
  'brand.name': 'Minikuro',
  'brand.h1': 'Minikuro — Generate timelines from Excel',

  'header.yearHeight': 'Pixels per year (height)',
  'header.yearWidth': 'Pixels per year (width)',
  'header.yearHeightAria': 'Pixels per year',
  'header.yearWidthAria': 'Pixels per year (width)',
  'header.resetDefault24': 'Reset to default (24px)',
  'header.swapToHorizontal': 'Swap axes (themes vertical, years horizontal)',
  'header.swapToVertical': 'Swap axes (years vertical, themes horizontal)',
  'header.swapAria': 'Swap axes',
  'header.labelsToHorizontal': 'Switch event labels to horizontal text',
  'header.labelsToVertical': 'Switch event labels to vertical text',
  'header.layoutBusy': 'Updating the layout. Please try again when it finishes.',
  'header.upload': 'Upload Excel file',
  'header.uploadAria': 'Upload Excel file',
  'header.pdf': 'Export PDF',
  'header.pdfBusy': 'Generating PDF…',
  'header.pdfBusyProgress': 'Generating PDF… {percent}%',
  'header.pdfAria': 'Export PDF',
  'header.darkMode': 'Switch to dark mode',
  'header.lightMode': 'Switch to light mode',
  'header.langToEn': 'Switch to English',
  'header.langToJa': '日本語に切替',
  'header.help': 'How to use',
  'header.expandOpen': 'Open display settings',
  'header.expandClose': 'Close display settings',
  'header.filterHint':
    'Load an Excel file to show search, year range, and lane settings.',
  'header.searchPlaceholder': 'Search visible events',
  'header.searchAria': 'Search visible events',
  'header.searchPrev': 'Previous match (Shift+Enter)',
  'header.searchPrevAria': 'Previous search result',
  'header.searchNext': 'Next match (Enter)',
  'header.searchNextAria': 'Next search result',
  'header.yearRange': 'Year range:',
  'header.startYear': 'Start year',
  'header.resetYearRange': 'Reset year range',
  'header.endYear': 'End year',
  'header.resetDefault': 'Reset to default',
  'header.layoutModeAria': 'How to show the year range',
  'header.layoutZoom': 'Zoom and re-layout',
  'header.layoutFilter': 'Keep positions',
  'header.layoutZoomHelp': 'Stretch the selected years to fill the view and re-layout',
  'header.layoutFilterHelp': 'Keep overall layout; hide events outside the range',
  'header.layoutHelpAria': 'About year-range display modes',
  'header.lanes': 'Lanes:',
  'header.resetLanes': 'Show all lanes',
  'header.laneSelectAria': 'Lane selection',
  'header.moveLaneLeft': 'Move {lane} earlier',
  'header.moveLaneRight': 'Move {lane} later',
  'event.details': 'Event details',
  'timeline.region': 'Timeline (use arrow keys or PageDown to scroll)',
  'parse.timedOut': 'Parsing exceeded 30 seconds and was cancelled. Split the file and try again.',
  'alert.details': 'Show details ({count})',

  'empty.title': 'Create a timeline',
  'empty.drop': 'Drop here',
  'empty.subtitle': 'Drop an Excel (.xlsx) file or upload from the header',
  'empty.subtitleDrop': 'Release to open the file',
  'empty.limits': 'Max 10MB · up to 5 sheets · start from the sample file',
  'empty.sample': 'Sample Excel',
  'empty.help': 'Help',
  'empty.filterNoResults':
    'No events match the current filters. Check the year range and lanes.',

  'axis.years': 'Year',
  'event.noImage': 'No image',
  'event.pointLabel': '{year}: {label}',
  'event.rangeLabel': '{start}–{end}: {label}',

  'alert.copied': 'Copied',
  'alert.copyPrompt': 'Copy agent prompt (paste into a chat with the Skill)',
  'alert.copyAria': 'Copy agent prompt',
  'alert.close': 'Close',

  'error.boundaryTitle': 'Something went wrong. Please reload the page.',
  'error.boundaryFallback': 'Something went wrong while rendering',
  'error.reload': 'Reload',
  'error.unexpected': 'An unexpected error occurred.',
  'error.fileProcess': 'An error occurred while processing the file',
  'error.noFile': 'No file selected',
  'error.loadFailed': 'Failed to load the Excel file.',
  'error.pdfFailed': 'Failed to export PDF.',

  'file.notXlsx': 'Please choose an Excel file (.xlsx)',
  'file.notXlsxPeriod': 'Please choose an Excel file (.xlsx).',
  'file.tooLarge': 'File is too large (10MB or less)',

  'pdf.elementMissing': 'Timeline element for PDF export was not found.',
  'pdf.canvasFailed': 'Failed to initialize the PDF canvas.',
  'pdf.tooManyPages': 'PDF exports support up to {limit} pages. Narrow the year range or select fewer lanes and try again.',
  'pdf.imagesOmitted': 'PDF saved. {count} unavailable images were replaced with a description.',
  'pdf.cancel': 'Cancel PDF export',
  'pdf.cancelling': 'Cancelling PDF export…',
  'pdf.exportFailed': 'Failed to export PDF: {detail}',
  'pdf.exportFailedGeneric': 'Failed to export PDF.',

  'parse.tooManyEvents': 'Use at most {max} events. Split the workbook into smaller timelines.',
  'parse.tooMuchText': 'Event labels support up to {max} characters in total. Shorten long descriptions or split the file.',
  'parse.moreWarnings': 'Showing the first {max} warnings; {count} more were omitted. Correct the affected columns and load again.',
  'parse.tooManyRows': 'Sheet “{sheet}” exceeds {max} used rows. Remove unused formatting or auxiliary rows.',
  'parse.labelTooLong': 'Sheet “{sheet}” row {row}: limit event labels to {max} characters.',
  'parse.noValidData':
    'No valid data found. Check the year and event columns.',
  'parse.yearSpanTooWide':
    'Year range is too wide ({min}–{max}). Please keep it within {maxSpan} years.',
  'parse.failed': 'Failed to parse the Excel file: {detail}',
  'parse.failedGeneric': 'Failed to parse the Excel file.',
  'parse.tooManyLanes':
    'Found {count} sheets. Loaded the first {max} ({skipped} skipped).',
  'parse.skippedSheet': 'Could not read sheet “{sheet}” (e.g. chart sheet).',
  'parse.emptySheet': 'Sheet “{sheet}” has no data rows.',
  'parse.emptySheetNoEvents': 'No valid events found in sheet “{sheet}”.',
  'parse.missingColumns':
    'Sheet “{sheet}” row {row}: skipped because columns are missing.',
  'parse.missingRequired':
    'Sheet “{sheet}” row {row}: skipped because start year or event is empty.',
  'parse.invalidStartYear':
    'Sheet “{sheet}” row {row}: invalid start year “{value}” ({min}–{max}).',
  'parse.invalidEndYear':
    'Sheet “{sheet}” row {row}: invalid end year “{value}”; treated as a point event.',
  'parse.yearOrder':
    'Sheet “{sheet}” row {row}: end year is before start year; treated as a point event.',
  'parse.invalidFontSize':
    'Sheet “{sheet}” row {row}: invalid font size “{value}” ({min}–{max}). Using default.',
  'parse.invalidColor':
    'Sheet “{sheet}” row {row}: invalid color “{value}” (e.g. #C45C26). Using black.',
  'parse.invalidStyle':
    'Sheet “{sheet}” row {row}: unsupported style “{value}”; using default (blank or label).',
  'parse.invalidImageUrl':
    'Sheet “{sheet}” row {row}: invalid image URL “{value}” (http/https only). Showing without image.',

  'warning.moreCount': 'and {count} more warning(s).',
};

export const catalogs: Record<Locale, Record<MessageKey, string>> = {
  ja: jaMessages,
  en: enMessages,
};
