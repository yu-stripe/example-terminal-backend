import React from 'react';

class TimeFormatter extends React.Component {
    render() {
        // UNIXタイムスタンプ（秒）を取得
        const timestamp = this.props.timestamp;

        // timestampをミリ秒に変換し、Dateオブジェクトを作成
        const date = new Date(timestamp * 1000);

        // 日本時間に変換

        // 日本時間での日付・時刻表示
        const formatted = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ` +
                          `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

        return (
            <span>{formatted}</span>
        );
    }
}

export default TimeFormatter;

