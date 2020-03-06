var UserData = {};
Promise.All(getFriendCode, getPlayLog).then(()=>{
  //sendUserData();
});

////////// UserData にフレンドコードを追加
function getFriendCode(){
  return new Promise(resolve=>{
    // フレンドIDが載ったページにアクセスする
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://chunithm-net.com/mobile/friend/search/", true);
    xhr.responseType = "document";
    // ロード完了時にコールされる内容の設定
    xhr.onload = function(){
      // フレンドコードが乗った要素を取得、同時にテキストを整形して代入
      UserData.Code = xhr.response.getElementsByClassName("text_c mt_15")[0].innerText.replace(/[^0-9]/g, "");
      // データ取得に多少時間を要するはずなので、そのままresolve();せず時間を空けてresolve();する
      setTimeout(resolve, 1);
    };
    // リクエスト送信
    xhr.send();
  });
}

////////// UserData にプレイ履歴を追加
function getPlayLog(){
  // 非同期処理のため Promise を生成して返す
  return new Promise(resolve=>{
    // プレイ履歴ページにアクセスする
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://chunithm-net.com/mobile/record/playlog", true);
    xhr.responseType = "document";
    // ロード完了時にコールされる内容の設定
    xhr.onload = function(){
      // ログを保存する領域を作る
      UserData.log = {};
      // クラスに frame02 w400 を持つ要素（プレイ履歴の１曲分の BOX ）すべてに対して操作
      Array.from(xhr.response.getElementsByClassName("frame02 w400")).forEach(item=>{
        // プレイ時刻の乗った要素を取得
        var playtime = item.getElementsByClassName("play_datalist_date")[0];
        if(playtime !== undefined){ // プレイ時刻がなければBOXではないため除外
          // データ生成用の箱を用意、同時にプレイ時刻を登録
          var data = {time: playtime.innerText.trim()};
          // BOX のデータ部が乗った要素を取得
          var playdata = item.getElementsByClassName("play_data_side")[0];
          // 曲名を取得
          data.name = playdata.getElementsByClassName("play_musicdata_title")[0].innerText.trim();
          // スコア（得点）を取得
          data.score = parseInt(playdata.getElementsByClassName("play_musicdata_score clearfix")[0].innerText.replace(/[^0-9]/g, ""));
          // プレイトラックナンバーを取得
          data.track = parseInt(item.getElementsByClassName("play_track_text")[0].innerText.replace(/[^0-9]/g, ""));
          // 難易度を取得：画像のため画像の URL から抽出
          data.difficulty = item.getElementsByClassName("play_track_result")[0].getElementsByTagName("img")[0].src.split("icon_text_")[1].split(".png")[0];
          // クリアマーク等の一覧取得（画像の URL を保存）
          data.icons = [];
          Array.from(item.getElementsByClassName("play_musicdata_icon clearfix")).forEach(icon=>{
            data.icons.push(icon.src);
          });
          UserData.log.push(data);
        }
      });
      // データ取得に多少時間を要するはずなので、そのままresolve();せず時間を空けてresolve();する
      setTimeout(resolve, 1);
    };
    xhr.send();
  });
}

////////// データベースに取得したユーザデータを登録する php にデータを投げるやつ
function sendUserData(){
  return new Promise((resolve, reject)=>{
    var code = UserData.code;
    UserData.log.forEach(result=>{
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "https://exsample.com/registUserData2DB.php");
      // フォームデータ作成
      var fd = new FormData();
      fd.append("code", code);
      Object.keys(result).forEach(key=>{
        fd.append(key, result[key]);
      });
      // ロード完了時にコールされる内容の設定
      xhr.onload = function(){
        var res = JSON.parse(xhr.response);
        if(res.success){
          resolve();
        }else{
          reject();
        }
      };
    });
    // フォームデータ付きでリクエスト送信
    xhr.send(fd);
  });
}
