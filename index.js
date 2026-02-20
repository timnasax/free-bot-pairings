const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    Browsers,
    makeCacheableSignalKeyStore,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const pino = require('pino');
const QRCode = require('qrcode');
const { makeid } = require('./id');
const { mainCommands } = require('./commands/main');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- UTILS ---
function removeFile(FilePath) {
    if (fs.existsSync(FilePath)) {
        fs.rmSync(FilePath, { recursive: true, force: true });
    }
}

// --- WEB DASHBOARD ROUTES ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'fredipage.html')));
app.get('/pair', (req, res) => res.sendFile(path.join(__dirname, 'fredipair.html')));

// --- QR CODE ENDPOINT ---
app.get('/frediqr', async (req, res) => {
    const id = makeid();
    const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
    try {
        let sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: "silent" }),
            browser: Browsers.macOS("Desktop"),
        });

        sock.ev.on('creds.update', saveCreds);
        sock.ev.on("connection.update", async (s) => {
            const { connection, qr } = s;
            if (qr && !res.headersSent) {
                res.setHeader('Content-Type', 'image/png');
                return res.end(await QRCode.toBuffer(qr));
            }
            if (connection == "open") {
                let data = fs.readFileSync(`./temp/${id}/creds.json`);
                let b64data = Buffer.from(data).toString('base64');
                await sock.sendMessage(sock.user.id, { text: 'TIMNASA-MD;;;=>' + b64data });
                await sock.sendMessage(sock.user.id, { text: "*TIMNASA TMD1 CONNECTED SUCCESSFULLY* ✅" });
                await delay(5000);
                removeFile("./temp/" + id);
            }
        });
    } catch (err) {
        removeFile("./temp/" + id);
    }
});

// --- PAIRING CODE ENDPOINT ---
app.get('/code', async (req, res) => {
    const id = makeid();
    let num = req.query.number;
    if(!num) return res.status(400).json({error: "Number is required"});

    const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
    try {
        let sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' })),
            },
            logger: pino({ level: 'fatal' }),
            browser: Browsers.macOS('Safari'),
        });

        if (!sock.authState.creds.registered) {
            await delay(1500);
            num = num.replace(/[^0-9]/g, '');
            const code = await sock.requestPairingCode(num);
            if (!res.headersSent) res.send({ code });
        }

        sock.ev.on('creds.update', saveCreds);
        sock.ev.on('connection.update', async (s) => {
            if (s.connection === 'open') {
                let data = fs.readFileSync(`./temp/${id}/creds.json`);
                let b64data = Buffer.from(data).toString('base64');
                await sock.sendMessage(sock.user.id, { text: 'TIMNASA-MD;;;=>' + b64data });
                await delay(5000);
                removeFile('./temp/' + id);
            }
        });
    } catch (err) {
        removeFile('./temp/' + id);
    }
});

// --- BOT MAIN ENGINE ---
async function startTimnasaBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: true,
        browser: Browsers.macOS("Desktop")
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const prefix = "."; 
        
        if (text.startsWith(prefix)) {
            const args = text.slice(prefix.length).trim().split(/ +/);
            const cmd = args.shift().toLowerCase();

            // Huu ndio mstari unaounganisha na folder la commands/main.js
            try {
                await mainCommands(sock, msg, from, cmd, prefix, args);
            } catch (e) {
                console.log("Command Error: ", e);
            }
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startTimnasaBot();
        } else if (connection === 'open') {
            console.log('TIMNASA TMD1 BOT IS ONLINE ✅');
        }
    });
}

// Start Server & Bot
app.listen(PORT, () => console.log(`Dashboard running on port: ${PORT}`));
startTimnasaBot();
