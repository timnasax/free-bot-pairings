const axios = require('axios');

const mainCommands = async (sock, msg, from, cmd, prefix, args) => {
    const pushname = msg.pushName || "User";
    const text = args.join(" ");

    // Kazi ya Speed: Inatafuta command na kujibu mara moja
    switch (cmd) {
        
        // --- SYSTEM COMMANDS ---
        case 'ping':
            const start = Date.now();
            await sock.sendMessage(from, { text: "Testing Speed... 🚀" });
            const end = Date.now();
            await sock.sendMessage(from, { text: `*TIMNASA TMD1 SPEED:* ${end - start}ms` });
            break;

        case 'alive':
            await sock.sendMessage(from, { 
                text: `Hellow ${pushname}, I am TIMNASA-TMD1. I am active! 🟢`,
                contextInfo: {
                    externalAdReply: {
                        title: "TIMNASA TMD1 STATUS",
                        body: "Developer: TimnasaTech",
                        thumbnailUrl: "https://timnasa.vercel.app/logo.png", // Weka link ya picha yako hapa
                        sourceUrl: "https://whatsapp.com/channel/0029VajweHxKQuJP6qnjLM31",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            });
            break;

        case 'menu':
        case 'help':
            const menuText = `
*╭─── TIMNASA TMD1 MENU ───╮*
  *User:* ${pushname}
  *Prefix:* [ ${prefix} ]
  *Mode:* Public
*╰───────────────────────╯*

*📡 SYSTEM*
◈ ${prefix}ping - Angalia spidi
◈ ${prefix}alive - Hali ya bot
◈ ${prefix}runtime - Muda wa bot hewani
◈ ${prefix}owner - Mawasiliano ya dev

*📥 DOWNLOADERS*
◈ ${prefix}song <jina> - Download muziki
◈ ${prefix}video <jina> - Download video
◈ ${prefix}tiktok <link> - Download TikTok
◈ ${prefix}fb <link> - Facebook video

*👥 GROUPS*
◈ ${prefix}hidetag <text> - Tag wote
◈ ${prefix}promote @user - Pandisha admin
◈ ${prefix}demote @user - Shusha admin
◈ ${prefix}kick @user - Ondoa mtu

*🛠️ UTILS*
◈ ${prefix}repo - Link ya script
◈ ${prefix}quoted - Rudia meseji
◈ ${prefix}sticker - Picha kuwa sticker

*🚀 TIMNASA TECHNOLOGY*`;
            await sock.sendMessage(from, { text: menuText });
            break;

        // --- DOWNLOADER COMMANDS (Sample Logic) ---
        case 'song':
            if (!text) return sock.sendMessage(from, { text: `Unasaka wimbo gani? Mfano: ${prefix}song Diamond-Shu` });
            await sock.sendMessage(from, { text: "Searching for audio... 🎧" });
            // Hapa utaweka API yako ya kudownload
            break;

        case 'video':
            if (!text) return sock.sendMessage(from, { text: `Nipe jina la video. Mfano: ${prefix}video comedy` });
            await sock.sendMessage(from, { text: "Searching for video... 🎥" });
            break;

        // --- GROUP CONTROLS ---
        case 'hidetag':
            // Command hii inafanya kazi kwenye group tu
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: "Hii ni kwa ajili ya magroup tu!" });
            const metadata = await sock.groupMetadata(from);
            const participants = metadata.participants.map(v => v.id);
            await sock.sendMessage(from, { text: text || "TIMNASA TMD1 Attention!", mentions: participants });
            break;

        case 'owner':
            const vcard = 'BEGIN:VCARD\n' + 'VERSION:3.0\n' + 'FN:TimnasaTech\n' + 'ORG:TIMNASA_TMD1;\n' + 'TEL;type=CELL;type=VOICE;waid=255784766591:+255 784 766 591\n' + 'END:VCARD';
            await sock.sendMessage(from, { contacts: { displayName: 'TimnasaTech', contacts: [{ vcard }] } });
            break;

        case 'repo':
            await sock.sendMessage(from, { text: "⭐ *TIMNASA TMD1 REPO:* https://github.com/Next5x/TIMNASA_TMD1\n\n_Usisahau kutoa Star ya repo!_" });
            break;
            
        default:
            // Kama command haipo, bot isijibu kitu ili kupunguza spam
            break;
    }
};

module.exports = { mainCommands };
