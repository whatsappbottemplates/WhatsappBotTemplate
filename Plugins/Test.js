const { generateMessageID, proto } = require('@whiskeysockets/baileys');

module.exports = {
  usage: ['te'],
  description: 'Test Before Commit to main',
  emoji: '💖',
  commandType: 'Admin',
  isWorkAll: true,
  async execute(sock, m) {
    try {
      // Generate a unique message ID
      const id = await generateMessageID();

      // Create the button message
      const message = {
        buttons: [
          { buttonId: 'id1', buttonText: { displayText: 'Button 1' } },
          { buttonId: 'id2', buttonText: { displayText: 'Button 2' } }
        ],
        text: 'This is a test button message',
        footer: 'Footer text'
      };

      let buttonsMessage = {};

      if ('buttons' in message && !!message.buttons) {
        buttonsMessage = {
          buttons: message.buttons.map(b => ({ 
            ...b, 
            type: proto.Message.ButtonsMessage.Button.Type.RESPONSE 
          }))
        };

        if ('text' in message) {
          buttonsMessage.contentText = message.text;
          buttonsMessage.headerType = 1; // Assuming 1 is equivalent to ButtonType.EMPTY
        }

        if ('footer' in message && !!message.footer) {
          buttonsMessage.footerText = message.footer;
        }
      }

      const buttonMessage = {
        message: {
          buttonsMessage: proto.Message.ButtonsMessage.fromObject(buttonsMessage)
        }
      };

      // Send the button message
      await sock.relayMessage(m.key.remoteJid, buttonMessage, { messageId: id });

      // Confirmation message
      await sock.sendMessage(m.key.remoteJid, { text: '✅ Test button message sent.' }, { quoted: m });
    } catch (error) {
      console.error('Error sending test message:', error);
      await sock.sendMessage(m.key.remoteJid, { text: '❌ Failed to send test message.' }, { quoted: m });
    }
  }
};