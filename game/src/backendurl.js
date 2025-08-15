var host = document.location.hostname;
if (host == "localhost" || host == "192.168.1.110") {
  // BackendUrl = "http://" + document.location.hostname + ":13578/";
  BackendUrl = "https://bc-game-y4uo.onrender.com/";
} else {
  BackendUrl = "https://bc-game-y4uo.onrender.com/";
}
export var BackendUrl;
