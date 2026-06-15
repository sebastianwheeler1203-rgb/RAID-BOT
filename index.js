import { Client, GatewayIntentBits, Partials } from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

// Create client
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel]
});

// Load commands dynamically
client.commands = new Map();
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  client.commands.set(command.default.data.name, command.default);
}

// Ready event
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Handle interactions
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "❌ Error executing command.", ephemeral: true });
    } else {
      await interaction.reply({ content: "❌ Error executing command.", ephemeral: true });
    }
  }
});

// Login
client.login(process.env.DISCORD_TOKEN);