"use strict";   // 厳格モードとする

// モジュール
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const favicon = require('serve-favicon');
const fs = require('fs');

// オブジェクト
const app = express();
const server = http.Server(app);
// const server = require('https').createServer({
//   key: fs.readFileSync('server-key.pem'),
//   cert: fs.readFileSync('server-crt.pem'),
// }, app);
const io = socketIO(server);

// 定数
const PORT = process.env.PORT || 1337;

// 接続時の処理
// ・サーバーとクライアントの接続が確立すると、
// 　サーバー側で、"connection"イベント
// 　クライアント側で、"connect"イベントが発生する
io.on("connection", (socket) => {
    console.log("connection : ", socket.id);

    // 切断時の処理
    // ・クライアントが切断したら、サーバー側では"disconnect"イベントが発生する
    socket.on("disconnect", () => {
      console.log("disconnect : ", socket.id);
    });

    // signalingデータ受信時の処理
    // ・クライアント側のsignalingデータ送信「socket.emit( "signaling", objData );」に対する処理
    socket.on("signaling", (objData) => {
      console.log("signaling : ", socket.id);
      console.log("- type : ", objData.type);

      // 指定の相手に送信
      if ("to" in objData) {
        console.log("- to : ", objData.to);
        // 送信元SocketIDを送信データに付与し、指定の相手に送信
        objData.from = socket.id;
        socket.to(objData.to).emit("signaling", objData);
      } else {
        console.error("Unexpected : Unknown destination");
      }
    });

    // ビデオチャット参加時の処理
    socket.on("join", (objData) => {
      console.log("join : ", socket.id);

      // ルーム名
      let strRoomName = objData.roomname;
      if (!strRoomName) {
        strRoomName = "**********NoName**********"
      }
      console.log("- Room name = ", strRoomName);

      // ルームへの入室
      socket.join(strRoomName);
      // ルーム名をsocketオブジェクトのメンバーに追加
      socket.strRoomName = strRoomName;

      // 「join」を同じルームの送信元以外の全員に送信
      // 送信元SocketIDを送信データに付与し、同じルームの送信元以外の全員に送信
      socket.broadcast.to(strRoomName).emit("signaling", { from: socket.id, type: "join" });
    });

    // ビデオチャット離脱時の処理
    socket.on("leave", (objData) => {
      console.log("leave : ", socket.id);

      if ("strRoomName" in socket) {
        console.log("- Room name = ", socket.strRoomName);

        // ルームからの退室
        socket.leave(socket.strRoomName);
        // socketオブジェクトのルーム名のクリア
        socket.strRoomName = "";
      }
    });
    socket.on("rooms", () => {
      let is_rooms = [];
      console.log("rooms:>>>>>" + socket.id);
      console.log(io.sockets.adapter.rooms);
      let keys = io.sockets.adapter.rooms.keys();
      for (var key of keys) {
        console.log("val:" + key);
        let values = io.sockets.adapter.rooms.get(key);
        console.log("sss>" + values.size);
        // console.log("sss>"+values[0]);
        if (values.size == 1 && values.has(key/*socket.id*/)) {
          console.log("just id");
        } else {
          is_rooms.push([key, values.size]);
        }
      };
      console.log(is_rooms);
      socket.emit("rooms_res", JSON.stringify(is_rooms));
      // var rooms = io.sockets.adapter.rooms;
      // console.log(io.sockets.clients);
      // if (rooms) {
      //     console.log("AAA"+rooms);
      //     for (var room in rooms) {
      //         console.log("candi2>"+room);
      //         if (!rooms[room].hasOwnProperty(room)) {
      //             console.log("room2>>"+room);
      //         }
      //     }
      // }
      // Object.keys(io.sockets.adapter.rooms).forEach(room=>{
      //     console.log("candidate:"+room);
      //     var isRoom = true;
      //     Object.keys(io.sockets.adapter.sids).forEach(id=>{
      //         isRoom = (id === room)? false: isRoom;
      //     });
      //     if(isRoom){
      //         activeRooms.Push(room);
      //         console.log("room>>"+room);
      //     }
      // });
    });
  });

// 公開フォルダの指定
app.use(express.static(__dirname + "/public"));
app.use(favicon(__dirname + '/public/favicon.ico'));

// サーバーの起動
server.listen(PORT, () => {
  console.log("Server on port %d", PORT);
});
