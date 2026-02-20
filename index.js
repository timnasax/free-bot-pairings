const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    Browsers,
    makeCacheableSignalKeyStore,
    jidNormalizedUser
} = require("@whiskeysockets/baileys");
const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const pino = require('pino');
const QRCode = require('qrcode');
const { makeid } = require('./id');

const app = express();
const PORT = process.env.PORT || 8000;

// --- SERVER SETUP ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'fredipage.html')));
app.get('/pair', (req, res) => res.sendFile(path.join(__dirname, 'fredipair.html')));

// --- CONNECTION & COMMAND LOGIC ---
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: "silent" }),
        browser: Browsers.macOS("Desktop")
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const prefix = "."; // Prefix ya commands
        const cmd = text.startsWith(prefix) ? text.slice(prefix.length).split(" ")[0].toLowerCase() : null;

        // --- COMMANDS SECTION ---
        if (cmd === "ping") {
            await sock.sendMessage(from, { text: "Pong! 🏓 Bot is Active." });
        }

        if (cmd === "menu") {
            const menuText = `
*╭─── TIMNASA TMD1 MENU ───╮*
  *Dev:* TimnasaTech
  *Prefix:* [ ${prefix} ]
*╰───────────────────────╯*

*📡 SYSTEM COMMANDS*
  ◈ ${prefix}ping - Check speed
  ◈ ${prefix}owner - Get owner info
  ◈ ${prefix}runtime - Bot uptime

*🛠️ UTILS*
  ◈ ${prefix}quoted - Quote message
  ◈ ${prefix}alive - Is bot working?

*🚀 MORE COMMANDS COMING SOON...*`;
            await sock.sendMessage(from, { text: menuText });
        }

        if (cmd === "owner") {
            await sock.sendMessage(from, { text: "Contact Owner: wa.me/255784766591" });
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            console.log("Connection lost... reconnecting");
            startBot();
        } else if (connection === 'open') {
            console.log("TIMNASA TMD1 is ONLINE ✅");
        }
    });
}

// QR/Pairing Routes (Kama ulivyoomba awali)
app.get('/frediqr', async (req, res) => { /* Code ya QR uliyopata mwanzo hapa */ });
app.get('/code', async (req, res) => { /* Code ya Pair uliyopata mwanzo hapa */ });

app.listen(PORT, () => console.log(`Server on port ${PORT}`));
startBot();
