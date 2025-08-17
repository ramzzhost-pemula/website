
const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const express = require("express");
const qrcode = require("qrcode");
const fs = require("fs");
const cors = require("cors");

const { state, saveState } = useSingleFileAuthState("./auth.json");
let sock;

async function startSocket() {
  sock = makeWASocket({ auth: state });
  sock.ev.on("creds.update", saveState);
  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) qrCodeBase64 = qr;
    if (connection === "close") {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startSocket();
    }
  });
}

startSocket();

const app = express();
app.use(cors());
app.use(express.json());

let qrCodeBase64 = "";

app.get("/connect", async (req, res) => {
  if (!qrCodeBase64) return res.json({ message: "Sudah terkoneksi atau tunggu QR..." });
  const qrImg = await qrcode.toDataURL(qrCodeBase64);
  return res.json({ qr: qrImg });
});

app.post("/send-bug", async (req, res) => {
  const { target, bugType } = req.body;
  if (!sock || !sock.sendMessage) return res.json({ message: "WA belum terkoneksi!" });
  const jid = target + "@s.whatsapp.net";

  try {
    let content = "Testing Bug Message";
    if (bugType === "docfc") content = "📄 Bug Document FC";
    if (bugType === "nativecore") content = "💥 Bug Native Core";
    if (bugType === "crashcall") content = "📞 Crash Call";
    if (bugType === "carousel") content = "🎠 Carousel FC";

    await sock.sendMessage(jid, { text: content });
    return res.json({ message: "Bug berhasil dikirim!" });
  } catch (err) {
    console.error(err);
    return res.json({ message: "Gagal kirim bug!" });
  }
});

app.listen(3000, () => {
  console.log("🚀 Server aktif di http://localhost:3000");
});
