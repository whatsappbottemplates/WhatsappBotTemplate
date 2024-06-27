const EventEmitter = require('events');
const HacxK = new EventEmitter();
const fs = require('fs').promises;
const path = require('path');

const events = {};
const eventDir = path.join(__dirname, '../../Events/Anti');

// Load events on startup
async function ownEvent(sock) {
    await loadEvents(sock);
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const m of messages) {
            if (settings.autoReadMessages) {
                await sock.readMessages([m.key]);
            }
            HacxK.emit('hacxk.messages', m);
        }
    });
}

// Function to load events and register them dynamically
async function loadEvents(sock) {
    // Import chalk dynamically
    const { default: chalk } = await import('chalk');
    try {

        const files = await fs.readdir(eventDir);
        for (const file of files) {
            if (file.endsWith('.js')) {
                await registerEvent(sock, file, eventDir, chalk); // Pass chalk to registerEvent
            }
        }
    } catch (error) {
        console.error(chalk.red("Error loading events:"), error); // Use chalk here
    }
}

async function registerEvent(sock, file, eventDir, chalk) {
    const eventPath = path.join(eventDir, file);
    let eventModule = require(eventPath);

    // Determine event type from filename
    const eventType = file.slice(0, -3);

    if (eventModule.isEnabled !== undefined && typeof eventModule.execute === 'function') {
        sock.ev.on(eventType, async (...args) => {
            try {
                if (eventModule.isEnabled) {
                    await eventModule.execute(sock, ...args);
                }
            } catch (error) {
                console.error(chalk.red(`[${eventModule.commandFunction} EVENT ERROR]:`), error);
            }
        });

        events[eventType] = eventModule;
        console.log(chalk.green(`✅ Event loaded: ${eventType} (${eventModule.commandFunction})`));

        // Hot reloading logic
        fs.watch(eventPath, async (eventType) => {
            if (eventType === 'change') {
                try {
                    delete require.cache[require.resolve(eventPath)];
                    eventModule = require(eventPath);
                    if (eventModule.isEnabled !== undefined && typeof eventModule.execute === 'function') {
                        events[eventType] = eventModule;
                        console.log(chalk.yellow(`🔄 Event reloaded: ${eventType}`));
                    } else {
                        console.warn(chalk.yellow(`⚠️ Skipped reload: ${eventType} (Invalid event module format)`));
                    }
                } catch (error) {
                    console.error(chalk.red(`❌ Error reloading event: ${eventType}:`), error);
                }
            }
        });

    } else {
        console.warn(chalk.yellow(`⚠️ Skipped event: ${eventType} (Invalid event module format)`));
    }
}

module.exports = { ownEvent, HacxK };
